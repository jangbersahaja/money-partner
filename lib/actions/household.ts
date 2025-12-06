"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getHouseholdInfo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Get my profile and household_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, id")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  // Get all members in this household
  if (!profile.household_id) return null;
  const { data: members } = await supabase
    .from("profiles")
    .select("username, avatar_url, id")
    .eq("household_id", profile.household_id);

  return {
    currentUser: profile,
    householdId: profile.household_id, // This is the "Invite Code"
    members: members ?? [],
  };
}

export async function joinHousehold(targetHouseholdId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Update my profile to link to the new household
  const { error } = await supabase
    .from("profiles")
    .update({ household_id: targetHouseholdId })
    .eq("id", user.id);

  if (error) return { error: "Failed to join household. Check the ID." };

  revalidatePath("/");
  revalidatePath("/profile");
  return { success: true };
}
