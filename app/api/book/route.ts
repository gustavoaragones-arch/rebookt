import { NextResponse } from "next/server";
import { computeGuestBookingPrice } from "@/lib/booking-pricing";
import { PROTOTYPE_MODE } from "@/lib/config";
import { sendGuestConfirmation, sendHostNotification } from "@/lib/emails";
import { createAdminClient } from "@/lib/supabase/admin";
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
    const body = await req.json();
    const property_id = body.property_id as string | undefined;
    const check_in = body.check_in as string | undefined;
    const check_out = body.check_out as string | undefined;
    const guest_email = body.guest_email as string | undefined;
    const guest_phone = (body.guest_phone as string | undefined) ?? undefined;
    const guest_name = body.guest_name as string | undefined;
    const reward_code = (body.reward_code as string | undefined) ?? undefined;

    if (!property_id || !check_in || !check_out || !guest_email || !guest_name?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const checkIn = parseLocalDate(check_in);
    const checkOut = parseLocalDate(check_out);
    if (!checkIn || !checkOut) {
      return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
    }

    if (checkOut <= checkIn) {
      return NextResponse.json({ error: "Check-out must be after check-in." }, { status: 400 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (checkIn < todayStart) {
      return NextResponse.json({ error: "Check-in cannot be in the past." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: property, error: pErr } = await admin
      .from("properties")
      .select("id, name, slug, base_price, cleaning_fee, user_id")
      .eq("id", property_id)
      .maybeSingle();

    if (pErr || !property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
    if (nights < 1) {
      return NextResponse.json({ error: "Check-out must be after check-in." }, { status: 400 });
    }

    const { data: blocked } = await admin
      .from("blocked_dates")
      .select("date")
      .eq("property_id", property_id);

    const blockedSet = new Set((blocked ?? []).map((b) => b.date as string));
    for (const d of eachNightInclusive(checkIn, checkOut)) {
      const ymd = formatYmd(d);
      if (blockedSet.has(ymd)) {
        return NextResponse.json(
          { error: "Those dates include nights that are unavailable." },
          { status: 400 }
        );
      }
    }

    let rewardPct = 0;
    let rewardCodeNormalized: string | undefined;
    if (reward_code?.trim()) {
      const redeem = await redeemRewardCode(reward_code, property_id);
      if (!redeem.valid) {
        return NextResponse.json(
          { error: "Reward code is invalid or expired." },
          { status: 400 }
        );
      }
      rewardPct = redeem.discount_pct;
      rewardCodeNormalized = reward_code.trim().toUpperCase();
    }

    const cleaning = Number(property.cleaning_fee ?? 0);
    const price = computeGuestBookingPrice(
      nights,
      Number(property.base_price),
      cleaning,
      rewardPct
    );
    if (!price) {
      return NextResponse.json({ error: "Unable to calculate total" }, { status: 400 });
    }

    const total = price.total;

    if (PROTOTYPE_MODE) {
      const { data: booking, error: bookingError } = await admin
        .from("bookings")
        .insert({
          property_id,
          guest_email,
          guest_phone: guest_phone ?? null,
          guest_name: guest_name.trim(),
          check_in,
          check_out,
          total_price: total,
          status: "requested",
          reward_code_used: rewardCodeNormalized ?? null,
        })
        .select()
        .single();

      if (bookingError || !booking) {
        return NextResponse.json(
          { error: "Could not save your booking request. Please try again." },
          { status: 500 }
        );
      }

      const nameParts = guest_name.trim().split(/\s+/);
      await admin.from("guests").upsert(
        {
          property_id,
          email: guest_email,
          phone: guest_phone ?? null,
          first_name: nameParts[0] ?? null,
          last_name: nameParts.length > 1 ? nameParts.slice(1).join(" ") : null,
          source: "direct",
        },
        { onConflict: "property_id,email" }
      );

      try {
        await sendHostNotification({
          property: { name: property.name, user_id: property.user_id },
          booking: { id: booking.id },
          guestName: guest_name.trim(),
          guestEmail: guest_email,
          guestPhone: guest_phone,
          checkIn: check_in,
          checkOut: check_out,
          totalPrice: total,
          nights,
        });
        await sendGuestConfirmation({
          guestName: guest_name.trim(),
          guestEmail: guest_email,
          propertyName: property.name,
          checkIn: check_in,
          checkOut: check_out,
          totalPrice: total,
        });
      } catch (emailErr) {
        console.error("Prototype booking emails failed:", emailErr);
      }

      return NextResponse.json({ success: true, booking_id: booking.id });
    }

    const { appUrl } = requireStripeCheckoutEnv();
    const totalInCents = Math.round(total * 100);
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
      total_price: total,
      status: "pending",
      stripe_session_id: session.id,
      reward_code_used: rewardCodeNormalized ?? null,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unable to start checkout" }, { status: 500 });
  }
}
