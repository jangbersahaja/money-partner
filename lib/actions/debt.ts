"use server";

import { calculateCreditCardInterest, calculateRuleOf78 } from "@/lib/logic/debt";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { differenceInMonths, parseISO } from "date-fns";

type Account = Database["public"]["Tables"]["accounts"]["Row"];
type Debt = Database["public"]["Tables"]["debts"]["Row"];

export interface DebtAccount extends Account {
  debt: Debt;
  calculations?: {
    settlementAmount?: number;
    rebate?: number;
    monthsRemaining?: number;
    estimatedInterest?: number;
    minPayment?: number;
  };
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
      let calculations = {};

      // Logic: Car Loan / Hire Purchase (Flat Rate)
      if (account.type === "loan" && debt.interest_type === "flat_rate") {
        if (debt.original_amount && debt.tenure_months && debt.start_date) {
            const monthsPaid = differenceInMonths(new Date(), parseISO(debt.start_date));
            const r78 = calculateRuleOf78(
                debt.original_amount,
                debt.interest_rate,
                debt.tenure_months,
                monthsPaid
            );
            calculations = {
                settlementAmount: r78.settlementAmount,
                rebate: r78.rebate,
                monthsRemaining: r78.monthsRemaining
            };
        }
      }
      // Logic: Credit Card
      else if (account.type === "credit") {
          // Negative balance usually means debt in this app context? 
          // Wait, liability account balance is usually negative.
          // calculateCreditCardInterest expects positive balance magnitude
          const balanceMagnitude = Math.abs(account.balance);
          const cc = calculateCreditCardInterest(balanceMagnitude, debt.interest_rate || 15);
          calculations = {
              estimatedInterest: cc.estimatedInterest,
              minPayment: cc.minPayment
          };
      }

      debtAccounts.push({
        ...account,
        debt,
        calculations
      });
    }
  }

  return debtAccounts;
}
