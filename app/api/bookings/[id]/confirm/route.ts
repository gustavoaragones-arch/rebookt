import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, property_id, guest_email, guest_name, check_out, reward_code_used, properties(user_id)")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const prop = booking.properties as unknown;
  const ownerId = Array.isArray(prop)
    ? (prop[0] as { user_id?: string } | undefined)?.user_id
    : (prop as { user_id?: string } | null)?.user_id;

  if (ownerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error: updateErr } = await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", params.id);

  if (updateErr) {
    return NextResponse.json({ error: "Could not update booking" }, { status: 500 });
  }

  const admin = createAdminClient();
  const checkOut = booking.check_out as string;
  const guestEmail = booking.guest_email as string;
  const propertyId = booking.property_id as string;

  const nameParts = (booking.guest_name as string | null)?.trim().split(/\s+/) ?? [];
  await admin.from("guests").upsert(
    {
      property_id: propertyId,
      email: guestEmail,
      first_name: nameParts[0] ?? null,
      last_name: nameParts.length > 1 ? nameParts.slice(1).join(" ") : null,
      last_stay_date: checkOut,
      source: "direct",
    },
    { onConflict: "property_id,email" }
  );

  const rewardCode = (booking.reward_code_used as string | null)?.trim();
  if (rewardCode) {
    await admin
      .from("reward_codes")
      .update({ status: "redeemed", redeemed_at: new Date().toISOString() })
      .eq("code", rewardCode)
      .eq("property_id", propertyId);
  }

  return NextResponse.json({ success: true });
}
