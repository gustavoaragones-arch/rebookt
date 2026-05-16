import { NextResponse } from "next/server";
import { redeemRewardCode } from "@/lib/rewards";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = body.code as string | undefined;
    const property_id = body.property_id as string | undefined;
    if (!code || !property_id) {
      return NextResponse.json({ error: "code and property_id required" }, { status: 400 });
    }

    const result = await redeemRewardCode(code, property_id);
    if (!result.valid) {
      const status = result.notFound ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ valid: true, discount_pct: result.discount_pct });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
