import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingConfirmationEmail } from "@/lib/emails";
import { money } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";
import { requireStripeWebhookSecret } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripeWebhookSecret = requireStripeWebhookSecret();
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const md = session.metadata ?? {};
  const property_id = md.property_id;
  const check_in = md.check_in;
  const check_out = md.check_out;
  const guest_email = md.guest_email;
  const guest_phone = md.guest_phone || null;
  const guest_name = md.guest_name || null;
  const reward_code = md.reward_code?.trim();

  if (!property_id || !check_in || !check_out || !guest_email) {
    return NextResponse.json({ error: "Bad metadata" }, { status: 400 });
  }

  const admin = createAdminClient();
  const amountTotal = (session.amount_total ?? 0) / 100;

  const { data: property } = await admin
    .from("properties")
    .select("name")
    .eq("id", property_id)
    .maybeSingle();

  const { error: bookingErr } = await admin
    .from("bookings")
    .update({
      status: "confirmed",
      total_price: amountTotal,
      reward_code_used: reward_code || null,
    })
    .eq("stripe_session_id", session.id);

  if (bookingErr) {
    console.error(bookingErr);
    return NextResponse.json({ error: "Booking update failed" }, { status: 500 });
  }

  const nameParts = (guest_name ?? "").trim().split(/\s+/);
  const first_name = nameParts[0] || null;
  const last_name = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

  const { error: guestErr } = await admin.from("guests").upsert(
    {
      property_id,
      email: guest_email,
      phone: guest_phone,
      first_name,
      last_name,
      last_stay_date: check_out,
      source: "direct",
    },
    { onConflict: "property_id,email" }
  );

  if (guestErr) {
    console.error(guestErr);
  }

  if (reward_code) {
    await admin
      .from("reward_codes")
      .update({
        status: "redeemed",
        redeemed_at: new Date().toISOString(),
      })
      .eq("code", reward_code)
      .eq("property_id", property_id);
  }

  if (property?.name) {
    try {
      await sendBookingConfirmationEmail({
        to: guest_email,
        propertyName: property.name,
        checkIn: check_in,
        checkOut: check_out,
        total: money(amountTotal),
      });
    } catch (e) {
      console.error(e);
    }
  }

  return NextResponse.json({ received: true });
}
