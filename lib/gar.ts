import { createAdminClient } from "@/lib/supabase/admin";

function generateCodeSegment(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function generateCode(): string {
  return `RBK-${generateCodeSegment()}`;
}

export async function generateRewardCode({
  propertyId,
  guestId,
  discountPct,
}: {
  propertyId: string;
  guestId: string;
  discountPct: number;
}): Promise<string | null> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("reward_codes")
    .select("id, status")
    .eq("guest_id", guestId)
    .eq("property_id", propertyId)
    .in("status", ["pending", "sent"])
    .maybeSingle();

  if (existing) return null;

  let code = generateCode();
  let attempts = 0;
  while (attempts < 5) {
    const { data: collision } = await supabase
      .from("reward_codes")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!collision) break;
    code = generateCode();
    attempts++;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  const { data, error } = await supabase
    .from("reward_codes")
    .insert({
      property_id: propertyId,
      guest_id: guestId,
      code,
      discount_pct: discountPct,
      status: "pending",
      expires_at: expiresAt.toISOString(),
    })
    .select("code")
    .single();

  if (error || !data) return null;
  return data.code as string;
}

export async function markRewardCodeSent(code: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("reward_codes")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("code", code);
}
