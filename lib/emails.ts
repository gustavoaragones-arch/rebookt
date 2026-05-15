import { defaultFrom, getResend } from "@/lib/resend";

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

export async function sendRebookingEmail(params: {
  to: string;
  firstName: string;
  propertyName: string;
  hostLabel: string;
  directBookingUrl: string;
}) {
  const resend = getResend();
  const name = params.firstName || "there";
  const body = `Hi ${name},

We loved having you. Your next stay doesn't need to go through Airbnb.

Book direct and save 10%:
→ ${params.directBookingUrl}

No platform fees. Same property. Better rate.

${params.hostLabel}`;

  await resend.emails.send({
    from: defaultFrom(),
    to: params.to,
    subject: `Your stay at ${params.propertyName} — come back and save`,
    text: body,
  });
}

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
  const resend = getResend();
  const fn = params.firstName || "there";
  const opening =
    params.tone === "formal" ? `Dear ${fn},` : `Hi ${fn},`;

  const body = `${opening}

Thank you for staying with us. Having you as a guest meant a lot.

If you have a moment, we would love to hear about your experience:
→ ${params.googleReviewUrl}

As a small token of our appreciation — whether you share a review or not —
here is a discount code for your next stay booked directly with us:

  Code: ${params.rewardCode}
  Discount: ${params.discountPct}% off your next stay
  Valid for 90 days

Book direct anytime at:
→ ${params.directBookingUrl}

With gratitude,
${params.hostName}`;

  await resend.emails.send({
    from: defaultFrom(),
    to: params.to,
    subject: `A thank-you from ${params.hostName} at ${params.propertyName}`,
    text: body,
  });
}
