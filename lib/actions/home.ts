import { createClient } from "@/lib/supabase/server";
import { addMonths, differenceInDays, getDate, setDate, startOfDay } from "date-fns";

export interface SafeToSpendData {
  liquidCash: number;
  upcomingBills: number;
  sinkingFunds: number;
  safeToSpend: number;
  dailySafeToSpend: number;
  daysRemaining: number;
}

export interface RecentTransaction {
  id: string;
  amount: number;
  category: string | null;
  description: string | null;
  date: string;
  type: "income" | "expense" | "transfer";
  account_name: string;
}

export async function getHomeData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // 1. Get Household Info (ID and Member IDs)
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("household_id, pay_day")
    .eq("id", user.id)
    .single();

  const householdId = myProfile?.household_id ?? user.id;

  // Get all member IDs in this household
  const { data: members } = await supabase
    .from("profiles")
    .select("id")
    .eq("household_id", householdId);

  const memberIds = members?.map((m) => m.id) ?? [user.id];

  // 2. Calculate Liquid Cash (Personal View for now, or Joint if you prefer)
  // Let's stick to Personal Liquid Cash + Shared Accounts
  const { data: liquidAccounts } = await supabase
    .from("accounts")
    .select("balance")
    .in("owner_id", memberIds) // Fetch accounts from all household members
    .eq("is_liquid", true)
    // Optional: Filter by is_shared if you only want to see shared money?
    // For now, let's assume "Safe to Spend" includes all my money + shared money.
    .or(`owner_id.eq.${user.id},is_shared.eq.true`);

  const liquidCash =
    liquidAccounts?.reduce((sum, acc) => sum + acc.balance, 0) ?? 0;

  // 3. Calculate Upcoming Bills (Based on Pay Cycle)
  const today = startOfDay(new Date());
  const currentDay = getDate(today);
  const payDay = myProfile?.pay_day ?? 25; // Default from schema

  let nextPayDate = setDate(today, payDay);
  if (currentDay >= payDay) {
    nextPayDate = addMonths(nextPayDate, 1);
  }
  
  const daysRemaining = Math.max(1, differenceInDays(nextPayDate, today));

  // Bills due BEFORE next pay date
  const { data: upcomingRules } = await supabase
    .from("recurring_rules")
    .select("amount")
    .in("owner_id", memberIds)
    .eq("is_active", true)
    .lt("next_due_date", nextPayDate.toISOString()); // Strictly less than pay date

  const upcomingBills =
    upcomingRules?.reduce((sum, rule) => sum + rule.amount, 0) ?? 0;

  // 4. Calculate Sinking Funds (Household Wide)
  const { data: buckets } = await supabase
    .from("buckets")
    .select("current_amount")
    .eq("household_id", householdId);

  const sinkingFunds =
    buckets?.reduce((sum, bucket) => sum + bucket.current_amount, 0) ?? 0;

  // 5. Safe to Spend
  const safeToSpend = liquidCash - upcomingBills - sinkingFunds;
  const dailySafeToSpend = safeToSpend / daysRemaining;

  // 6. Fetch Recent Transactions (top 5)
  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      `
      id,
      amount,
      category,
      description,
      date,
      type,
      accounts!inner(name)
    `
    )
    .eq("accounts.owner_id", user.id)
    .order("date", { ascending: false })
    .limit(5);

  const recentTransactions: RecentTransaction[] =
    transactions?.map((t) => ({
      id: t.id,
      amount: t.amount,
      category: t.category,
      description: t.description,
      date: t.date,
      type: t.type as "income" | "expense" | "transfer",
      account_name: (t.accounts as { name: string }).name,
    })) ?? [];

  return {
    safeToSpendData: { 
      liquidCash, 
      upcomingBills, 
      sinkingFunds, 
      safeToSpend, 
      dailySafeToSpend, 
      daysRemaining 
    },
    recentTransactions,
  };
}
