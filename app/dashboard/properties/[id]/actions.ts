"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function assertOwnsProperty(propertyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) redirect("/dashboard/properties");
  return { supabase, user };
}

export async function updateGarSettingsAction(formData: FormData) {
  const propertyId = String(formData.get("property_id"));
  const { supabase } = await assertOwnsProperty(propertyId);

  const gar_enabled = formData.get("gar_enabled") === "on";
  const gar_discount_pct = Number(formData.get("gar_discount_pct") || 5);
  const gar_trigger_delay_days = Math.max(1, Number(formData.get("gar_trigger_delay_days") || 5));
  const gar_google_business_url = String(formData.get("gar_google_business_url") ?? "").trim() || null;
  const gar_message_tone = formData.get("gar_message_tone") === "formal" ? "formal" : "casual";

  await supabase
    .from("properties")
    .update({
      gar_enabled,
      gar_discount_pct,
      gar_trigger_delay_days,
      gar_google_business_url,
      gar_message_tone,
    })
    .eq("id", propertyId);

  revalidatePath(`/dashboard/properties/${propertyId}`);
}

export async function addBlockedDateAction(formData: FormData) {
  const propertyId = String(formData.get("property_id"));
  const date = String(formData.get("date") ?? "").trim();
  const { supabase } = await assertOwnsProperty(propertyId);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  await supabase.from("blocked_dates").insert({ property_id: propertyId, date, reason: "manual" });
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

export async function removeBlockedDateAction(formData: FormData) {
  const propertyId = String(formData.get("property_id"));
  const id = String(formData.get("blocked_id"));
  const { supabase } = await assertOwnsProperty(propertyId);
  await supabase.from("blocked_dates").delete().eq("id", id).eq("property_id", propertyId);
  revalidatePath(`/dashboard/properties/${propertyId}`);
}
