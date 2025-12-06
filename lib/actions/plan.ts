"use server";

import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type RecurringRule = Database["public"]["Tables"]["recurring_rules"]["Row"];
type Bucket = Database["public"]["Tables"]["buckets"]["Row"];

export interface PlanData {
  bills: RecurringRule[];
  buckets: Bucket[];
  totalMonthlyCommitments: number;
}

export async function getPlanData(): Promise<PlanData> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Get user's household_id for buckets
  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  const householdId = profile?.household_id;

  // Fetch recurring bills for household (grouped by owner)
  let bills: RecurringRule[] = [];

  if (householdId) {
    // Get all household members
    const { data: householdMembers } = await supabase
      .from("profiles")
      .select("id")
      .eq("household_id", householdId);

    if (householdMembers && householdMembers.length > 0) {
      const memberIds = householdMembers.map((m) => m.id);
      const { data } = await supabase
        .from("recurring_rules")
        .select("*")
        .in("owner_id", memberIds)
        .order("due_day", { ascending: true });

      bills = data ?? [];
    }
  } else {
    // Just user's own bills
    const { data } = await supabase
      .from("recurring_rules")
      .select("*")
      .eq("owner_id", user.id)
      .order("due_day", { ascending: true });

    bills = data ?? [];
  }

  // Fetch sinking funds (buckets)
  const { data: buckets } = await supabase
    .from("buckets")
    .select("*")
    .eq("household_id", householdId ?? user.id)
    .order("name", { ascending: true });

  // Calculate total monthly fixed cost (only active bills)
  const totalMonthlyCommitments =
    bills
      ?.filter((bill) => bill.is_active)
      .reduce((sum, bill) => sum + bill.amount, 0) ?? 0;

  return {
    bills: bills ?? [],
    buckets: buckets ?? [],
    totalMonthlyCommitments,
  };
}

export interface CreateBillInput {
  name: string;
  amount: number;
  frequency: Database["public"]["Enums"]["frequency_type"];
  dueDay: number;
  categoryId?: string;
}

export async function createBill(input: CreateBillInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  // Calculate next due date based on due day
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();

  let nextDueDate = new Date(currentYear, currentMonth, input.dueDay);

  // If the due day has passed this month, set to next month
  if (input.dueDay < currentDay) {
    nextDueDate = new Date(currentYear, currentMonth + 1, input.dueDay);
  }

  const { error } = await supabase.from("recurring_rules").insert({
    name: input.name,
    amount: input.amount,
    frequency: input.frequency,
    due_day: input.dueDay,
    next_due_date: nextDueDate.toISOString(),
    owner_id: user.id,
    category_id: input.categoryId || null,
    is_active: true,
  });

  if (error) {
    return { error: "Failed to create bill" };
  }

  revalidatePath("/plan");
  revalidatePath("/");

  return { success: true };
}

export interface CreateBucketInput {
  name: string;
  targetAmount: number;
  targetDate?: string;
}

export async function createBucket(input: CreateBucketInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  // Get household_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  const { error } = await supabase.from("buckets").insert({
    name: input.name,
    target_amount: input.targetAmount,
    target_date: input.targetDate || null,
    household_id: profile?.household_id ?? user.id,
    current_amount: 0,
  });

  if (error) {
    return { error: "Failed to create bucket" };
  }

  revalidatePath("/plan");
  revalidatePath("/");

  return { success: true };
}
