import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendGarEmail } from "@/lib/emails";
import { env } from "@/lib/env";
import { generateRewardCode } from "@/lib/reward-code";

async function ensureUniqueRewardCode(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = generateRewardCode();
    const { data } = await admin.from("reward_codes").select("id").eq("code", code).maybeSingle();
    if (!data) return code;
  }
  throw new Error("Could not allocate reward code");
}

export async function POST(req: Request) {
  try {
    const secret = env.CRON_SECRET;
    if (secret) {
      const auth = req.headers.get("authorization");
      if (auth !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();
    const guest_id = body.guest_id as string | undefined;
    const property_id = body.property_id as string | undefined;
    if (!guest_id || !property_id) {
      return NextResponse.json({ error: "guest_id and property_id required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: guest, error: gErr } = await admin
      .from("guests")
      .select("id, email, first_name, property_id")
      .eq("id", guest_id)
      .maybeSingle();

    if (gErr || !guest || guest.property_id !== property_id) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    const { data: property, error: pErr } = await admin
      .from("properties")
      .select(
        "id, name, slug, gar_discount_pct, gar_google_business_url, gar_message_tone, user_id, gar_enabled"
      )
      .eq("id", property_id)
      .maybeSingle();

    if (pErr || !property?.gar_google_business_url) {
      return NextResponse.json({ error: "Property not configured for GAR" }, { status: 400 });
    }

    const { data: hostUser } = await admin
      .from("users")
      .select("email")
      .eq("id", property.user_id as string)
      .maybeSingle();

    const code = await ensureUniqueRewardCode(admin);
    const sentAt = new Date();
    const expires = new Date(sentAt);
    expires.setUTCDate(expires.getUTCDate() + 90);
    const discountPct = Number(property.gar_discount_pct ?? 5);

    await admin.from("reward_codes").insert({
      property_id,
      guest_id,
      code,
      discount_pct: discountPct,
      status: "pending",
      sent_at: sentAt.toISOString(),
      expires_at: expires.toISOString(),
    });

    const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const hostName = (hostUser?.email as string)?.split("@")[0] ?? "Host";
    const tone = (property.gar_message_tone as string) === "formal" ? "formal" : "casual";

    await sendGarEmail({
      to: guest.email as string,
      firstName: (guest.first_name as string) || "",
      hostName,
      propertyName: property.name as string,
      googleReviewUrl: property.gar_google_business_url as string,
      rewardCode: code,
      discountPct,
      directBookingUrl: `${appUrl}/p/${property.slug as string}`,
      tone,
    });

    await admin.from("messages").insert({
      guest_id,
      type: "email",
      template: "gar_invite",
      status: "sent",
      sent_at: sentAt.toISOString(),
    });

    return NextResponse.json({ ok: true, code });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "generate failed" }, { status: 500 });
  }
}
