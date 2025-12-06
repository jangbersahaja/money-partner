"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface AddTransactionInput {
  amount: number;
  category: string;
  accountId: string;
  description?: string;
  type: "income" | "expense" | "transfer";
  targetAccountId?: string; // Required for transfers
}

export async function addTransaction(input: AddTransactionInput) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "User not authenticated" };

  // Handle TRANSFER separately (double-entry)
  if (input.type === "transfer") {
    if (!input.targetAccountId) {
      return { error: "Target account required for transfers" };
    }

    // Fetch both accounts
    const { data: sourceAccount } = await supabase
      .from("accounts")
      .select("balance")
      .eq("id", input.accountId)
      .single();

    const { data: targetAccount } = await supabase
      .from("accounts")
      .select("balance")
      .eq("id", input.targetAccountId)
      .single();

    if (!sourceAccount || !targetAccount) {
      return { error: "Source or target account not found" };
    }

    // Transaction 1: Deduct from source (negative)
    const { error: sourceTxError } = await supabase
      .from("transactions")
      .insert({
        account_id: input.accountId,
        amount: -input.amount,
        category: input.category || "Transfer",
        description: input.description || "Transfer Out",
        type: "transfer",
        date: new Date().toISOString(),
      });

    if (sourceTxError) {
      return { error: "Failed to create source transaction" };
    }

    // Transaction 2: Add to target (positive)
    const { error: targetTxError } = await supabase
      .from("transactions")
      .insert({
        account_id: input.targetAccountId,
        amount: input.amount,
        category: input.category || "Transfer",
        description: input.description || "Transfer In",
        type: "transfer",
        date: new Date().toISOString(),
      });

    if (targetTxError) {
      return { error: "Failed to create target transaction" };
    }

    // Update source balance (decrease)
    const { error: sourceBalanceError } = await supabase
      .from("accounts")
      .update({ balance: sourceAccount.balance - input.amount })
      .eq("id", input.accountId);

    if (sourceBalanceError) {
      return { error: "Failed to update source balance" };
    }

    // Update target balance (increase)
    const { error: targetBalanceError } = await supabase
      .from("accounts")
      .update({ balance: targetAccount.balance + input.amount })
      .eq("id", input.targetAccountId);

    if (targetBalanceError) {
      return { error: "Failed to update target balance" };
    }

    revalidatePath("/");
    revalidatePath("/accounts");
    return { success: true };
  }

  // Handle INCOME and EXPENSE (original logic)
  // 1. Fetch Account
  const { data: account } = await supabase
    .from("accounts")
    .select("balance, owner_id, is_shared")
    .eq("id", input.accountId)
    .single();

  if (!account) {
    return { error: "Account not found or access denied" };
  }

  // 2. Calculate New Balance
  const amountChange = input.type === "expense" ? -input.amount : input.amount;
  const newBalance = account.balance + amountChange;

  // 3. Insert Transaction
  const { error: txError } = await supabase.from("transactions").insert({
    account_id: input.accountId,
    amount: amountChange,
    category: input.category,
    description: input.description || null,
    type: input.type,
    date: new Date().toISOString(),
  });

  if (txError) return { error: "Failed to create transaction" };

  // 4. Update Balance
  const { error: balanceError } = await supabase
    .from("accounts")
    .update({ balance: newBalance })
    .eq("id", input.accountId);

  if (balanceError) return { error: "Failed to update account balance" };

  revalidatePath("/");
  revalidatePath("/accounts");
  return { success: true };
}

export async function getLiquidAccounts() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, type, balance")
    .eq("owner_id", user.id)
    .eq("is_liquid", true)
    .order("name");

  return accounts ?? [];
}

export async function getExpenseCategories() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, icon, color")
    .eq("type", "expense")
    .eq("is_default", true)
    .order("name");

  return categories ?? [];
}

export async function getTransferAccounts() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Get user's household_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  const householdId = profile?.household_id;

  // Build query for own accounts + shared household accounts
  let ownerIds: string[] = [user.id];

  if (householdId) {
    // Get all household members
    const { data: householdMembers } = await supabase
      .from("profiles")
      .select("id")
      .eq("household_id", householdId);

    if (householdMembers && householdMembers.length > 0) {
      ownerIds = householdMembers.map((m) => m.id);
    }
  }

  // Fetch all accounts (own + shared)
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, type, balance, owner_id, is_shared")
    .in("owner_id", ownerIds)
    .order("name");

  return accounts ?? [];
}
