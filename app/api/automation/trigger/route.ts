import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendGarEmail, sendRebookingEmail } from "@/lib/emails";
import { env } from "@/lib/env";
import { generateRewardCode } from "@/lib/reward-code";

function ymdShiftDays(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function ensureUniqueRewardCode(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = generateRewardCode();
    const { data } = await admin.from("reward_codes").select("id").eq("code", code).maybeSingle();
    if (!data) return code;
  }
  throw new Error("Could not allocate reward code");
}

async function runAutomation(req: Request) {
  const secret = env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const rebookingCheckout = ymdShiftDays(-2);

  const { data: rebookCandidates, error: rbErr } = await admin
    .from("bookings")
    .select("id, guest_email, guest_name, guest_phone, check_in, check_out, property_id, rebooking_sent_at")
    .eq("status", "confirmed")
    .is("rebooking_sent_at", null)
    .eq("check_out", rebookingCheckout);

  if (rbErr) {
    console.error(rbErr);
    return NextResponse.json({ error: "rebooking query failed" }, { status: 500 });
  }

  let rebookingSent = 0;
  for (const b of rebookCandidates ?? []) {
    const { data: props } = await admin
      .from("properties")
      .select("name, slug, user_id")
      .eq("id", b.property_id as string)
      .maybeSingle();

    if (!props?.slug) continue;

    const { data: hostUser } = await admin
      .from("users")
      .select("email")
      .eq("id", props.user_id as string)
      .maybeSingle();

    const first = (b.guest_name as string | null)?.split(/\s+/)[0] ?? "";
    const hostEmail = (hostUser?.email as string) ?? "Host";
    const directUrl = `${appUrl}/p/${props.slug}`;

    try {
      await sendRebookingEmail({
        to: b.guest_email as string,
        firstName: first,
        propertyName: props.name as string,
        hostLabel: hostEmail,
        directBookingUrl: directUrl,
      });
      await admin
        .from("bookings")
        .update({ rebooking_sent_at: new Date().toISOString() })
        .eq("id", b.id as string);

      const { data: guest } = await admin
        .from("guests")
        .select("id")
        .eq("property_id", b.property_id as string)
        .eq("email", b.guest_email as string)
        .maybeSingle();

      if (guest?.id) {
        await admin.from("messages").insert({
          guest_id: guest.id,
          type: "email",
          template: "rebooking",
          status: "sent",
          sent_at: new Date().toISOString(),
        });
      }
      rebookingSent++;
    } catch (e) {
      console.error(e);
    }
  }

  const { data: garProperties, error: gpErr } = await admin
    .from("properties")
    .select(
      "id, name, slug, gar_trigger_delay_days, gar_discount_pct, gar_google_business_url, gar_message_tone, user_id, gar_enabled"
    )
    .eq("gar_enabled", true)
    .not("gar_google_business_url", "is", null);

  if (gpErr) {
    console.error(gpErr);
    return NextResponse.json({ error: "gar properties query failed" }, { status: 500 });
  }

  let garSent = 0;
  for (const p of garProperties ?? []) {
    const delay = Number(p.gar_trigger_delay_days ?? 5);
    const targetCheckout = ymdShiftDays(-delay);

    const { data: garBookings } = await admin
      .from("bookings")
      .select("id, guest_email, guest_name, guest_phone, check_in, check_out")
      .eq("property_id", p.id as string)
      .eq("status", "confirmed")
      .is("gar_sent_at", null)
      .eq("check_out", targetCheckout);

    for (const b of garBookings ?? []) {
      try {
        const { data: guest } = await admin
          .from("guests")
          .select("id, first_name")
          .eq("property_id", p.id as string)
          .eq("email", b.guest_email as string)
          .maybeSingle();

        if (!guest?.id) continue;

        const code = await ensureUniqueRewardCode(admin);
        const sentAt = new Date();
        const expires = new Date(sentAt);
        expires.setUTCDate(expires.getUTCDate() + 90);

        const discountPct = Number(p.gar_discount_pct ?? 5);

        await admin.from("reward_codes").insert({
          property_id: p.id as string,
          guest_id: guest.id,
          code,
          discount_pct: discountPct,
          status: "pending",
          sent_at: sentAt.toISOString(),
          expires_at: expires.toISOString(),
        });

        const { data: hostUser } = await admin
          .from("users")
          .select("email")
          .eq("id", p.user_id as string)
          .maybeSingle();

        const users = hostUser as { email: string } | null;
        const hostName = users?.email?.split("@")[0] ?? "Host";
        const tone = (p.gar_message_tone as string) === "formal" ? "formal" : "casual";

        await sendGarEmail({
          to: b.guest_email as string,
          firstName: (guest.first_name as string) || (b.guest_name as string)?.split(/\s+/)[0] || "",
          hostName,
          propertyName: p.name as string,
          googleReviewUrl: p.gar_google_business_url as string,
          rewardCode: code,
          discountPct,
          directBookingUrl: `${appUrl}/p/${p.slug as string}`,
          tone,
        });

        await admin.from("bookings").update({ gar_sent_at: sentAt.toISOString() }).eq("id", b.id as string);

        await admin.from("messages").insert({
          guest_id: guest.id,
          type: "email",
          template: "gar_invite",
          status: "sent",
          sent_at: sentAt.toISOString(),
        });

        garSent++;
      } catch (e) {
        console.error(e);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    rebooking_checkout_date: rebookingCheckout,
    rebooking_sent: rebookingSent,
    gar_sent: garSent,
  });
}

export async function POST(req: Request) {
  return runAutomation(req);
}

export async function GET(req: Request) {
  return runAutomation(req);
}
