import { createAdminClient } from "@/lib/supabase/admin";
import { defaultFrom, getResend } from "@/lib/resend";

export async function sendHostNotification({
  property,
  booking,
  guestName,
  guestEmail,
  guestPhone,
  checkIn,
  checkOut,
  totalPrice,
  nights,
}: {
  property: { name: string; user_id: string };
  booking: { id: string };
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  nights: number;
}) {
  const admin = createAdminClient();
  const { data: host } = await admin.from("users").select("email").eq("id", property.user_id).maybeSingle();
  if (!host?.email) return;

  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(totalPrice);

  const resend = getResend();
  await resend.emails.send({
    from: defaultFrom(),
    to: host.email,
    subject: `New booking request — ${property.name}`,
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1A1A18;">
        <div style="border-bottom: 1px solid #E8E7E2; padding-bottom: 24px; margin-bottom: 24px;">
          <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #A8A79F; margin: 0 0 8px;">Rebookt — New Request</p>
          <h1 style="font-size: 24px; font-weight: 600; margin: 0; color: #1C3A2F;">${property.name}</h1>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr><td style="padding: 10px 0; color: #6B6A65; font-size: 14px; border-bottom: 1px solid #E8E7E2;">Guest</td><td style="padding: 10px 0; font-size: 14px; text-align: right; border-bottom: 1px solid #E8E7E2;">${guestName}</td></tr>
          <tr><td style="padding: 10px 0; color: #6B6A65; font-size: 14px; border-bottom: 1px solid #E8E7E2;">Email</td><td style="padding: 10px 0; font-size: 14px; text-align: right; border-bottom: 1px solid #E8E7E2;"><a href="mailto:${guestEmail}" style="color: #1C3A2F;">${guestEmail}</a></td></tr>
          ${
            guestPhone
              ? `<tr><td style="padding: 10px 0; color: #6B6A65; font-size: 14px; border-bottom: 1px solid #E8E7E2;">Phone</td><td style="padding: 10px 0; font-size: 14px; text-align: right; border-bottom: 1px solid #E8E7E2;"><a href="tel:${guestPhone}" style="color: #1C3A2F;">${guestPhone}</a></td></tr>`
              : ""
          }
          <tr><td style="padding: 10px 0; color: #6B6A65; font-size: 14px; border-bottom: 1px solid #E8E7E2;">Check-in</td><td style="padding: 10px 0; font-size: 14px; text-align: right; border-bottom: 1px solid #E8E7E2;">${checkIn}</td></tr>
          <tr><td style="padding: 10px 0; color: #6B6A65; font-size: 14px; border-bottom: 1px solid #E8E7E2;">Check-out</td><td style="padding: 10px 0; font-size: 14px; text-align: right; border-bottom: 1px solid #E8E7E2;">${checkOut}</td></tr>
          <tr><td style="padding: 10px 0; color: #6B6A65; font-size: 14px; border-bottom: 1px solid #E8E7E2;">Nights</td><td style="padding: 10px 0; font-size: 14px; text-align: right; border-bottom: 1px solid #E8E7E2;">${nights}</td></tr>
          <tr><td style="padding: 14px 0 0; font-weight: 500; font-size: 15px;">Total (direct rate)</td><td style="padding: 14px 0 0; font-weight: 500; font-size: 15px; text-align: right; color: #1C3A2F;">${formattedTotal}</td></tr>
        </table>
        <div style="background: #F4F3EF; border-radius: 6px; padding: 20px; margin-bottom: 32px;">
          <p style="margin: 0; font-size: 14px; color: #6B6A65; line-height: 1.6;">This is a direct booking request — no platform fees apply. Reach out to the guest to confirm dates and arrange payment using your preferred method.</p>
        </div>
        <p style="font-size: 12px; color: #A8A79F; border-top: 1px solid #E8E7E2; padding-top: 20px; margin: 0;">Rebookt · Booking ID: ${booking.id}</p>
      </div>
    `,
  });
}

export async function sendGuestConfirmation({
  guestName,
  guestEmail,
  propertyName,
  checkIn,
  checkOut,
  totalPrice,
}: {
  guestName: string;
  guestEmail: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
}) {
  const firstName = guestName.split(" ")[0];
  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(totalPrice);

  const resend = getResend();
  await resend.emails.send({
    from: defaultFrom(),
    to: guestEmail,
    subject: `Your booking request — ${propertyName}`,
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1A1A18;">
        <div style="border-bottom: 1px solid #E8E7E2; padding-bottom: 24px; margin-bottom: 24px;">
          <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #A8A79F; margin: 0 0 8px;">Rebookt</p>
          <h1 style="font-size: 24px; font-weight: 600; margin: 0; color: #1C3A2F;">Request received</h1>
        </div>
        <p style="font-size: 15px; line-height: 1.7; color: #6B6A65; margin: 0 0 24px;">Hi ${firstName}, your booking request for <strong style="color: #1A1A18;">${propertyName}</strong> has been received. The host will confirm your dates and be in touch within 24 hours.</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
          <tr><td style="padding: 10px 0; color: #6B6A65; font-size: 14px; border-bottom: 1px solid #E8E7E2;">Property</td><td style="padding: 10px 0; font-size: 14px; text-align: right; border-bottom: 1px solid #E8E7E2;">${propertyName}</td></tr>
          <tr><td style="padding: 10px 0; color: #6B6A65; font-size: 14px; border-bottom: 1px solid #E8E7E2;">Check-in</td><td style="padding: 10px 0; font-size: 14px; text-align: right; border-bottom: 1px solid #E8E7E2;">${checkIn}</td></tr>
          <tr><td style="padding: 10px 0; color: #6B6A65; font-size: 14px; border-bottom: 1px solid #E8E7E2;">Check-out</td><td style="padding: 10px 0; font-size: 14px; text-align: right; border-bottom: 1px solid #E8E7E2;">${checkOut}</td></tr>
          <tr><td style="padding: 14px 0 0; font-weight: 500; font-size: 15px;">Direct rate</td><td style="padding: 14px 0 0; font-weight: 500; font-size: 15px; text-align: right; color: #4CAF82;">${formattedTotal}</td></tr>
        </table>
        <div style="background: #F4F3EF; border-radius: 6px; padding: 20px; margin-bottom: 32px;">
          <p style="margin: 0; font-size: 14px; color: #6B6A65; line-height: 1.6;">You booked direct — no platform fees were charged. Payment will be arranged directly with the host.</p>
        </div>
        <p style="font-size: 12px; color: #A8A79F; border-top: 1px solid #E8E7E2; padding-top: 20px; margin: 0;">Rebookt · You received this because you submitted a booking request.</p>
      </div>
    `,
  });
}

export async function sendBookingConfirmationEmail(params: {
  to: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  total: string;
}) {
  const resend = getResend();
  await resend.emails.send({
    from: defaultFrom(),
    to: params.to,
    subject: `Booking confirmed — ${params.propertyName}`,
    text: `Your stay at ${params.propertyName} is confirmed.\n\nCheck-in: ${params.checkIn}\nCheck-out: ${params.checkOut}\nTotal: ${params.total}\n\nThank you for booking direct.`,
  });
}

export async function sendRebookingEmail({
  guestFirstName,
  guestEmail,
  propertyName,
  directBookingUrl,
}: {
  guestFirstName: string;
  guestEmail: string;
  propertyName: string;
  directBookingUrl: string;
}) {
  const resend = getResend();
  await resend.emails.send({
    from: defaultFrom(),
    to: guestEmail,
    subject: `Your stay at ${propertyName} — come back and save`,
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1A1A18;">
        <div style="border-bottom: 1px solid #E8E7E2; padding-bottom: 24px; margin-bottom: 24px;">
          <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #A8A79F; margin: 0 0 8px;">Rebookt</p>
          <h1 style="font-size: 24px; font-weight: 600; margin: 0; color: #1C3A2F;">Come back and save 10%</h1>
        </div>
        <p style="font-size: 15px; line-height: 1.8; color: #6B6A65; margin: 0 0 24px;">
          Hi ${guestFirstName}, we loved having you at <strong style="color: #1A1A18;">${propertyName}</strong>.
        </p>
        <p style="font-size: 15px; line-height: 1.8; color: #6B6A65; margin: 0 0 32px;">
          Your next stay does not need to go through Airbnb. Book direct and save 10% — same property, better rate, no platform fees.
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${directBookingUrl}" style="display: inline-block; background: #1C3A2F; color: white; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-size: 15px; font-weight: 500;">Book direct and save 10%</a>
        </div>
        <div style="background: #F4F3EF; border-radius: 6px; padding: 20px; margin-bottom: 32px;">
          <p style="margin: 0; font-size: 14px; color: #6B6A65; line-height: 1.6;">No platform fees. Same property you already know and trust. Payment arranged directly with the host.</p>
        </div>
        <p style="font-size: 12px; color: #A8A79F; border-top: 1px solid #E8E7E2; padding-top: 20px; margin: 0;">Rebookt · You received this because you previously stayed at ${propertyName}.</p>
      </div>
    `,
  });
}

export async function sendGAREmail({
  guestFirstName,
  guestEmail,
  propertyName,
  hostName,
  rewardCode,
  discountPct,
  googleReviewUrl,
  directBookingUrl,
}: {
  guestFirstName: string;
  guestEmail: string;
  propertyName: string;
  hostName: string;
  rewardCode: string;
  discountPct: number;
  googleReviewUrl: string;
  directBookingUrl: string;
}) {
  const resend = getResend();
  await resend.emails.send({
    from: defaultFrom(),
    to: guestEmail,
    subject: `A thank-you from ${hostName} at ${propertyName}`,
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1A1A18;">
        <div style="border-bottom: 1px solid #E8E7E2; padding-bottom: 24px; margin-bottom: 24px;">
          <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #A8A79F; margin: 0 0 8px;">Rebookt</p>
          <h1 style="font-size: 24px; font-weight: 600; margin: 0; color: #1C3A2F;">Thank you, ${guestFirstName}.</h1>
        </div>
        <p style="font-size: 15px; line-height: 1.8; color: #6B6A65; margin: 0 0 24px;">
          Having you stay at <strong style="color: #1A1A18;">${propertyName}</strong> meant a lot. We hope the stay was everything you expected.
        </p>
        <p style="font-size: 15px; line-height: 1.8; color: #6B6A65; margin: 0 0 32px;">
          If you have a moment, we would love to hear about your experience. Reviews help other guests find us — and mean the world to a small independent property.
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${googleReviewUrl}" style="display: inline-block; background: #1C3A2F; color: white; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-size: 15px; font-weight: 500;">Share your experience on Google</a>
        </div>
        <div style="border: 1px solid #E8E7E2; border-radius: 6px; padding: 28px; margin-bottom: 32px;">
          <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #A8A79F; margin: 0 0 12px;">A gift from ${hostName}</p>
          <p style="font-size: 15px; color: #6B6A65; line-height: 1.7; margin: 0 0 20px;">
            As a small thank-you — whether or not you leave a review — here is a discount on your next stay booked directly with us.
          </p>
          <div style="background: #F4F3EF; border-radius: 4px; padding: 16px 20px; margin-bottom: 16px;">
            <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #A8A79F;">Your reward code</p>
            <p style="margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 0.06em; color: #1C3A2F; font-family: 'Courier New', monospace;">${rewardCode}</p>
          </div>
          <p style="margin: 0; font-size: 13px; color: #A8A79F;">${discountPct}% off your next direct booking · Valid for 90 days</p>
        </div>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${directBookingUrl}" style="display: inline-block; border: 1px solid #C8C7C0; color: #1A1A18; text-decoration: none; padding: 12px 28px; border-radius: 4px; font-size: 14px;">Book direct at ${propertyName}</a>
        </div>
        <p style="font-size: 15px; line-height: 1.8; color: #6B6A65; margin: 0 0 32px;">With gratitude,<br><strong style="color: #1A1A18;">${hostName}</strong></p>
        <p style="font-size: 12px; color: #A8A79F; border-top: 1px solid #E8E7E2; padding-top: 20px; margin: 0;">Rebookt · You received this because you stayed at ${propertyName}. Reward code: ${rewardCode}</p>
      </div>
    `,
  });
}

/** @deprecated Use sendGAREmail */
export async function sendGarEmail(params: {
  to: string;
  firstName: string;
  hostName: string;
  propertyName: string;
  googleReviewUrl: string;
  rewardCode: string;
  discountPct: number;
  directBookingUrl: string;
  tone: "formal" | "casual";
}) {
  return sendGAREmail({
    guestFirstName: params.firstName || "there",
    guestEmail: params.to,
    propertyName: params.propertyName,
    hostName: params.hostName,
    rewardCode: params.rewardCode,
    discountPct: params.discountPct,
    googleReviewUrl: params.googleReviewUrl,
    directBookingUrl: params.directBookingUrl,
  });
}
