import { NextResponse } from "next/server";
import { redeemRewardCode } from "@/lib/rewards";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = body.code as string | undefined;
    const property_id = body.property_id as string | undefined;
    if (!code || !property_id) {
      return NextResponse.json(
        { valid: false, error: "code and property_id required" },
        { status: 400 }
      );
    }

    const result = await redeemRewardCode(code, property_id);
    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error });
    }
    return NextResponse.json({ valid: true, discount_pct: result.discount_pct });
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid request" }, { status: 400 });
  }
}
