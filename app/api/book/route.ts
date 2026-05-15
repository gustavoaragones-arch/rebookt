import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computePriceBreakdown } from "@/lib/pricing";
import { redeemRewardCode } from "@/lib/rewards";
import { getStripe } from "@/lib/stripe";
import { requireStripeCheckoutEnv } from "@/lib/env";

export const runtime = "nodejs";

function parseLocalDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

function eachNightInclusive(checkIn: Date, checkOut: Date): Date[] {
  const nights: Date[] = [];
  const cur = new Date(checkIn);
  while (cur < checkOut) {
    nights.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return nights;
}

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function POST(req: Request) {
  try {
    const { appUrl } = requireStripeCheckoutEnv();
    const body = await req.json();
    const property_id = body.property_id as string | undefined;
    const check_in = body.check_in as string | undefined;
    const check_out = body.check_out as string | undefined;
    const guest_email = body.guest_email as string | undefined;
    const guest_phone = (body.guest_phone as string | undefined) ?? undefined;
    const guest_name = (body.guest_name as string | undefined) ?? undefined;
    const reward_code = (body.reward_code as string | undefined) ?? undefined;

    if (!property_id || !check_in || !check_out || !guest_email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const checkIn = parseLocalDate(check_in);
    const checkOut = parseLocalDate(check_out);
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: property, error: pErr } = await admin
      .from("properties")
      .select("id, name, slug, base_price, cleaning_fee")
      .eq("id", property_id)
      .maybeSingle();

    if (pErr || !property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
    if (nights < 1) {
      return NextResponse.json({ error: "Minimum one night" }, { status: 400 });
    }

    const { data: blocked } = await admin
      .from("blocked_dates")
      .select("date")
      .eq("property_id", property_id);

    const blockedSet = new Set((blocked ?? []).map((b) => b.date as string));
    for (const d of eachNightInclusive(checkIn, checkOut)) {
      const ymd = formatYmd(d);
      if (blockedSet.has(ymd)) {
        return NextResponse.json({ error: "Selected dates include unavailable nights" }, { status: 400 });
      }
    }

    let rewardPct = 0;
    let rewardCodeNormalized: string | undefined;
    if (reward_code?.trim()) {
      const redeem = await redeemRewardCode(reward_code, property_id);
      if (!redeem.valid) {
        return NextResponse.json({ error: redeem.error }, { status: 400 });
      }
      rewardPct = redeem.discount_pct;
      rewardCodeNormalized = reward_code.trim().toUpperCase();
    }

    const breakdown = computePriceBreakdown(
      nights,
      Number(property.base_price),
      Number(property.cleaning_fee ?? 0),
      rewardPct
    );

    const totalInCents = Math.round(breakdown.finalTotal * 100);
    if (totalInCents < 50) {
      return NextResponse.json({ error: "Total is too low for checkout" }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${property.name} — ${check_in} to ${check_out}`,
            },
            unit_amount: totalInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        property_id,
        check_in,
        check_out,
        guest_email,
        guest_phone: guest_phone ?? "",
        guest_name: guest_name ?? "",
        reward_code: rewardCodeNormalized ?? "",
      },
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/p/${property.slug}`,
    });

    await admin.from("bookings").insert({
      property_id,
      guest_email,
      guest_phone: guest_phone ?? null,
      guest_name: guest_name ?? null,
      check_in,
      check_out,
      total_price: breakdown.finalTotal,
      status: "pending",
      stripe_session_id: session.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unable to start checkout" }, { status: 500 });
  }
}
