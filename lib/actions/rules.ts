"use server";

import { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { addMonths, addWeeks, addYears, parseISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { addTransaction } from "./transaction";

export interface PayBillInput {
  ruleId: string;
  amount: number; // Actual amount paid
  accountId: string; // Account paid from
  date: Date;
}

export type RecurringRule = Database["public"]["Tables"]["recurring_rules"]["Row"];

export interface AddRuleInput {
  name: string;
  amount: number;
  category: string;
  frequency: "monthly" | "yearly" | "weekly";
  nextDue: Date;
}

export async function getRecurringRules() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user.id).single();
  const householdId = profile?.household_id;

  // Get members
  let ownerIds = [user.id];
  if (householdId) {
    const { data: members } = await supabase.from("profiles").select("id").eq("household_id", householdId);
    if (members) ownerIds = members.map(m => m.id);
  }

  const { data: rules } = await supabase
    .from("recurring_rules")
    .select("*")
    .in("owner_id", ownerIds)
    .order("next_due_date");

  return rules ?? [];
}

export async function addRecurringRule(input: AddRuleInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("recurring_rules").insert({
    owner_id: user.id,
    name: input.name,
    amount: input.amount,
    category: input.category,
    frequency: input.frequency,
    next_due_date: input.nextDue.toISOString()
  });

  if (error) return { error: "Failed to create rule" };

  revalidatePath("/");
  revalidatePath("/plan");
  return { success: true };
}

export async function updateRecurringRule(id: string, updates: Partial<RecurringRule>) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("recurring_rules")
    .update(updates)
    .eq("id", id);

  if (error) return { error: "Failed to update rule" };

  revalidatePath("/");
  revalidatePath("/plan");
  return { success: true };
}

export async function deleteRecurringRule(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_rules").delete().eq("id", id);
  if (error) return { error: "Failed to delete rule" };

  revalidatePath("/");
  revalidatePath("/plan");
  return { success: true };
}

export async function payBill(input: PayBillInput) {
  const supabase = await createClient();

  // 1. Fetch Rule
  const { data: rule } = await supabase
    .from("recurring_rules")
    .select("*")
    .eq("id", input.ruleId)
    .single();


  if (!rule) return { error: "Bill rule not found" };

  // 2. Create Transaction
  const txResult = await addTransaction({
    amount: input.amount,
    category: rule.category || "Bills",
    accountId: input.accountId,
    description: `Paid Bill: ${rule.name}`,
    type: "expense",
    date: input.date.toISOString() // Pass the date from input
  });

  if (txResult.error) {
    return { error: `Failed to record payment: ${txResult.error}` };
  }

  // 3. Calculate Next Due Date
  const currentDue = parseISO(rule.next_due_date);
  let nextDue = currentDue;

  if (rule.frequency === "monthly") {
    nextDue = addMonths(currentDue, 1);
  } else if (rule.frequency === "weekly") {
    nextDue = addWeeks(currentDue, 1);
  } else if (rule.frequency === "yearly") {
    nextDue = addYears(currentDue, 1);
  }

  // 4. Update Rule
  const { error: updateError } = await supabase
    .from("recurring_rules")
    .update({ next_due_date: nextDue.toISOString() })
    .eq("id", input.ruleId);

  if (updateError) {
    return { error: "Payment recorded but failed to update next due date" };
  }

  revalidatePath("/");
  revalidatePath("/plan");
  return { success: true };
}
