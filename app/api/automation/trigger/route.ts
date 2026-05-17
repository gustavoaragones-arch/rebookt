import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendGAREmail, sendRebookingEmail } from "@/lib/emails";
import { env } from "@/lib/env";
import { generateRewardCode, markRewardCodeSent } from "@/lib/gar";

export const runtime = "nodejs";

function ymdDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function hostDisplayName(host: { full_name?: string | null; email?: string | null } | null): string {
  if (host?.full_name?.trim()) return host.full_name.trim();
  if (host?.email) return host.email.split("@")[0];
  return "Your host";
}

function nestedProperty(
  rel: unknown
): { name: string; slug: string } | null {
  if (!rel) return null;
  if (Array.isArray(rel)) {
    const p = rel[0] as { name?: string; slug?: string } | undefined;
    return p?.slug ? { name: p.name ?? "", slug: p.slug } : null;
  }
  const p = rel as { name?: string; slug?: string };
  return p?.slug ? { name: p.name ?? "", slug: p.slug } : null;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const results = { rebooking: 0, gar: 0, errors: [] as string[] };

  const rebookingDateStr = ymdDaysAgo(2);

  const { data: rebookingGuests, error: rbErr } = await supabase
    .from("guests")
    .select(
      `
      id, email, first_name, property_id,
      properties ( name, slug )
    `
    )
    .eq("last_stay_date", rebookingDateStr)
    .is("rebooking_sent_at", null);

  if (rbErr) {
    console.error(rbErr);
    return NextResponse.json({ error: "rebooking query failed" }, { status: 500 });
  }

  for (const guest of rebookingGuests ?? []) {
    try {
      const property = nestedProperty(guest.properties);
      if (!property?.slug) continue;

      const directBookingUrl = `${appUrl}/p/${property.slug}`;
      const guestFirstName = (guest.first_name as string) || (guest.email as string).split("@")[0];

      await sendRebookingEmail({
        guestFirstName,
        guestEmail: guest.email as string,
        propertyName: property.name,
        directBookingUrl,
      });

      await supabase
        .from("guests")
        .update({ rebooking_sent_at: new Date().toISOString() })
        .eq("id", guest.id);

      await supabase.from("messages").insert({
        guest_id: guest.id,
        type: "email",
        template: "rebooking",
        status: "sent",
        sent_at: new Date().toISOString(),
      });

      results.rebooking++;
    } catch (err) {
      results.errors.push(`Rebooking failed for guest ${guest.id}: ${String(err)}`);
    }
  }

  const { data: garProperties, error: gpErr } = await supabase
    .from("properties")
    .select(
      "id, name, slug, gar_discount_pct, gar_google_business_url, gar_trigger_delay_days, user_id"
    )
    .eq("gar_enabled", true)
    .not("gar_google_business_url", "is", null)
    .not("gar_discount_pct", "is", null);

  if (gpErr) {
    console.error(gpErr);
    return NextResponse.json({ error: "gar properties query failed" }, { status: 500 });
  }

  for (const property of garProperties ?? []) {
    const triggerDays = Number(property.gar_trigger_delay_days ?? 5);
    const garDateStr = ymdDaysAgo(triggerDays);

    const { data: garGuests } = await supabase
      .from("guests")
      .select("id, email, first_name, property_id")
      .eq("property_id", property.id)
      .eq("last_stay_date", garDateStr)
      .is("gar_sent_at", null);

    const { data: hostUser } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", property.user_id as string)
      .maybeSingle();

    const hostName = hostDisplayName(hostUser);

    for (const guest of garGuests ?? []) {
      try {
        const directBookingUrl = `${appUrl}/p/${property.slug as string}`;
        const code = await generateRewardCode({
          propertyId: property.id as string,
          guestId: guest.id as string,
          discountPct: Number(property.gar_discount_pct),
        });

        if (!code) {
          results.errors.push(`Skipped GAR for guest ${guest.id} — active code already exists`);
          continue;
        }

        const guestFirstName =
          (guest.first_name as string) || (guest.email as string).split("@")[0];

        await sendGAREmail({
          guestFirstName,
          guestEmail: guest.email as string,
          propertyName: property.name as string,
          hostName,
          rewardCode: code,
          discountPct: Number(property.gar_discount_pct),
          googleReviewUrl: property.gar_google_business_url as string,
          directBookingUrl,
        });

        await markRewardCodeSent(code);

        await supabase
          .from("guests")
          .update({ gar_sent_at: new Date().toISOString() })
          .eq("id", guest.id);

        await supabase.from("messages").insert({
          guest_id: guest.id,
          type: "email",
          template: "gar_invite",
          status: "sent",
          sent_at: new Date().toISOString(),
        });

        results.gar++;
      } catch (err) {
        results.errors.push(`GAR failed for guest ${guest.id}: ${String(err)}`);
      }
    }
  }

  const { error: expireErr } = await supabase.rpc("expire_reward_codes");
  if (expireErr) {
    results.errors.push(`expire_reward_codes: ${expireErr.message}`);
  }

  return NextResponse.json({ success: true, results });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
