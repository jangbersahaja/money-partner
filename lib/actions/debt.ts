"use server";

import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Account = Database["public"]["Tables"]["accounts"]["Row"];
type Debt = Database["public"]["Tables"]["debts"]["Row"];

export interface DebtAccount extends Account {
  debt: Debt;
}

export async function getDebtAccounts(): Promise<DebtAccount[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Get user's household_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  const householdId = profile?.household_id;

  // Determine which owner_ids to query
  let ownerIds: string[] = [user.id];

  if (householdId) {
    const { data: householdMembers } = await supabase
      .from("profiles")
      .select("id")
      .eq("household_id", householdId);

    if (householdMembers && householdMembers.length > 0) {
      ownerIds = householdMembers.map((m) => m.id);
    }
  }

  // SIMPLIFIED QUERY: Fetch all accounts for these owners, filter types in JS
  const { data: accounts, error: accountsError } = await supabase
    .from("accounts")
    .select("*")
    .in("owner_id", ownerIds)
    .order("balance", { ascending: false });

  if (accountsError) {
    console.error(
      "Accounts fetch error:",
      JSON.stringify(accountsError, null, 2)
    );
    return [];
  }

  if (!accounts || accounts.length === 0) {
    return [];
  }

  // FILTER IN JS: Only keep Debts
  const debtAccountsList = accounts.filter(
    (acc) => acc.type === "loan" || acc.type === "credit"
  );

  if (debtAccountsList.length === 0) {
    return [];
  }

  // Fetch debt details
  const accountIds = debtAccountsList.map((a) => a.id);
  const { data: debts, error: debtsError } = await supabase
    .from("debts")
    .select("*")
    .in("account_id", accountIds);

  if (debtsError) {
    console.error("Debts fetch error:", JSON.stringify(debtsError, null, 2));
    return [];
  }

  // Combine
  const debtAccounts: DebtAccount[] = [];

  for (const account of debtAccountsList) {
    const debt = debts?.find((d) => d.account_id === account.id);
    // Only add if we actually found the debt details (robustness)
    if (debt) {
      debtAccounts.push({
        ...account,
        debt,
      });
    }
  }

  return debtAccounts;
}
