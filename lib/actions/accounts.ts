"use server";

import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type Account = Database["public"]["Tables"]["accounts"]["Row"];

export interface AccountWithDebt extends Account {
  debts?: {
    interest_rate: number;
    min_payment_amount: number | null;
    due_day: number | null;
  } | null;
}

export interface AccountsData {
  assets: AccountWithDebt[];
  liabilities: AccountWithDebt[];
  netWorth: number;
}

export async function getAccountsData(): Promise<AccountsData> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Get user's household_id for shared accounts
  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  const householdId = profile?.household_id;

  // Fetch all accounts owned by user
  const { data: ownAccounts } = await supabase
    .from("accounts")
    .select(
      `
      *,
      debts(interest_rate, min_payment_amount, due_day)
    `
    )
    .eq("owner_id", user.id);

  // Fetch shared accounts from household members
  let sharedAccounts: AccountWithDebt[] = [];
  if (householdId) {
    const { data: householdMembers } = await supabase
      .from("profiles")
      .select("id")
      .eq("household_id", householdId)
      .neq("id", user.id);

    if (householdMembers && householdMembers.length > 0) {
      const memberIds = householdMembers.map((m) => m.id);
      const { data } = await supabase
        .from("accounts")
        .select(
          `
          *,
          debts(interest_rate, min_payment_amount, due_day)
        `
        )
        .in("owner_id", memberIds)
        .eq("is_shared", true);

      sharedAccounts = (data as AccountWithDebt[]) ?? [];
    }
  }

  const allAccounts: AccountWithDebt[] = [
    ...((ownAccounts as AccountWithDebt[]) ?? []),
    ...sharedAccounts,
  ];

  // Group into assets and liabilities
  const assets = allAccounts.filter((acc) =>
    ["bank", "cash", "ewallet", "investment"].includes(acc.type)
  );
  const liabilities = allAccounts.filter((acc) =>
    ["credit", "loan"].includes(acc.type)
  );

  // Calculate net worth
  const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
  const totalLiabilities = liabilities.reduce(
    (sum, acc) => sum + Math.abs(acc.balance),
    0
  );
  const netWorth = totalAssets - totalLiabilities;

  return {
    assets,
    liabilities,
    netWorth,
  };
}

export interface CreateAccountInput {
  name: string;
  type: Database["public"]["Enums"]["account_type"];
  balance: number;
  isLiquid: boolean;
  isShared: boolean;
  // For debts
  interestRate?: number;
  creditLimit?: number;
  dueDay?: number;
}

export async function createAccount(input: CreateAccountInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  // Create account
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .insert({
      name: input.name,
      type: input.type,
      balance: input.balance,
      is_liquid: input.isLiquid,
      is_shared: input.isShared,
      owner_id: user.id,
    })
    .select()
    .single();

  if (accountError || !account) {
    return { error: "Failed to create account" };
  }

  // If it's a debt account (loan or credit), create debt record
  if (["loan", "credit"].includes(input.type) && input.interestRate) {
    const { error: debtError } = await supabase.from("debts").insert({
      account_id: account.id,
      interest_rate: input.interestRate,
      interest_type: input.type === "loan" ? "flat_rate" : "reducing_balance",
      min_payment_amount: input.creditLimit || null,
      due_day: input.dueDay || null,
      start_date: new Date().toISOString().split("T")[0],
    });

    if (debtError) {
      // Rollback account creation if debt creation fails
      await supabase.from("accounts").delete().eq("id", account.id);
      return { error: "Failed to create debt record" };
    }
  }

  revalidatePath("/accounts");
  revalidatePath("/");

  return { success: true, account };
}
