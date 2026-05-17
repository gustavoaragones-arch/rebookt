import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidGoogleReviewUrl } from "@/lib/google-review-url";

const ALLOWED = [
  "name",
  "description",
  "location",
  "base_price",
  "cleaning_fee",
  "images",
  "gar_enabled",
  "gar_discount_pct",
  "gar_trigger_delay_days",
  "gar_google_business_url",
  "gar_message_tone",
] as const;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const updates = Object.fromEntries(
    Object.entries(body).filter(([key]) => (ALLOWED as readonly string[]).includes(key))
  );

  if (
    typeof updates.gar_google_business_url === "string" &&
    updates.gar_google_business_url.trim() &&
    !isValidGoogleReviewUrl(updates.gar_google_business_url)
  ) {
    return NextResponse.json(
      {
        error:
          "Google review URL must start with https://g.page/, https://www.google.com/maps/, or https://maps.google.com/",
      },
      { status: 400 }
    );
  }

  if (body.full_name !== undefined && typeof body.full_name === "string") {
    await supabase.from("users").update({ full_name: body.full_name.trim() || null }).eq("id", user.id);
  }

  if (Object.keys(updates).length === 0 && body.full_name === undefined) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from("properties")
      .update(updates)
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
