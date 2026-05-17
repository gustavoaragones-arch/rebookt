import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendGAREmail } from "@/lib/emails";
import { env } from "@/lib/env";
import { generateRewardCode, markRewardCodeSent } from "@/lib/gar";

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        "id, name, slug, gar_discount_pct, gar_google_business_url, user_id, gar_enabled"
      )
      .eq("id", property_id)
      .maybeSingle();

    if (pErr || !property?.gar_google_business_url) {
      return NextResponse.json({ error: "Property not configured for GAR" }, { status: 400 });
    }

    const { data: hostUser } = await admin
      .from("users")
      .select("email, full_name")
      .eq("id", property.user_id as string)
      .maybeSingle();

    const hostName =
      (hostUser?.full_name as string | null)?.trim() ||
      (hostUser?.email as string)?.split("@")[0] ||
      "Host";

    const code = await generateRewardCode({
      propertyId: property_id,
      guestId: guest_id,
      discountPct: Number(property.gar_discount_pct ?? 5),
    });

    if (!code) {
      return NextResponse.json({ error: "Active reward code already exists" }, { status: 409 });
    }

    const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const guestFirstName = (guest.first_name as string) || (guest.email as string).split("@")[0];

    await sendGAREmail({
      guestFirstName,
      guestEmail: guest.email as string,
      propertyName: property.name as string,
      hostName,
      rewardCode: code,
      discountPct: Number(property.gar_discount_pct ?? 5),
      googleReviewUrl: property.gar_google_business_url as string,
      directBookingUrl: `${appUrl}/p/${property.slug as string}`,
    });

    await markRewardCodeSent(code);

    await admin.from("messages").insert({
      guest_id,
      type: "email",
      template: "gar_invite",
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, code });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "generate failed" }, { status: 500 });
  }
}
