import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get("property_id");
  if (!propertyId) {
    return NextResponse.json({ error: "property_id required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blocked_dates")
    .select("date")
    .eq("property_id", propertyId)
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to load availability" }, { status: 500 });
  }

  return NextResponse.json({ blocked_dates: (data ?? []).map((r) => r.date) });
}
