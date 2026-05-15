import { createAdminClient } from "@/lib/supabase/admin";

export type RedeemResult =
  | { valid: true; discount_pct: number }
  | { valid: false; error: string };

export async function redeemRewardCode(
  code: string,
  propertyId: string
): Promise<RedeemResult> {
  const admin = createAdminClient();
  const normalized = code.trim().toUpperCase();

  const { data: row, error } = await admin
    .from("reward_codes")
    .select("id, discount_pct, status, expires_at, property_id")
    .eq("code", normalized)
    .maybeSingle();

  if (error || !row) {
    return { valid: false, error: "Invalid code" };
  }

  if (row.property_id !== propertyId) {
    return { valid: false, error: "This code does not apply to this property" };
  }

  if (row.status === "redeemed") {
    return { valid: false, error: "This code has already been redeemed" };
  }

  if (row.status === "expired") {
    return { valid: false, error: "This code has expired" };
  }

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    await admin.from("reward_codes").update({ status: "expired" }).eq("id", row.id);
    return { valid: false, error: "This code has expired" };
  }

  return { valid: true, discount_pct: Number(row.discount_pct) };
}
