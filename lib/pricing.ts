export type PriceBreakdown = {
  nights: number;
  baseNightlyTotal: number;
  cleaningFee: number;
  baseTotal: number;
  directDiscountPct: number;
  directDiscountAmount: number;
  afterDirect: number;
  rewardDiscountPct: number;
  rewardDiscountAmount: number;
  finalTotal: number;
  airbnbComparable: number;
  savingsVsAirbnb: number;
};

const DIRECT_BOOKING_DISCOUNT = 0.1;

export function computePriceBreakdown(
  nights: number,
  basePricePerNight: number,
  cleaningFee: number,
  rewardDiscountPct = 0
): PriceBreakdown {
  const baseNightlyTotal = nights * basePricePerNight;
  const baseTotal = baseNightlyTotal + cleaningFee;
  const directDiscountAmount = baseTotal * DIRECT_BOOKING_DISCOUNT;
  const afterDirect = baseTotal - directDiscountAmount;
  const rewardDiscountAmount =
    rewardDiscountPct > 0 ? afterDirect * (rewardDiscountPct / 100) : 0;
  const finalTotal = Math.max(0, afterDirect - rewardDiscountAmount);
  const airbnbComparable = finalTotal / 0.88;
  const savingsVsAirbnb = airbnbComparable - finalTotal;

  return {
    nights,
    baseNightlyTotal,
    cleaningFee,
    baseTotal,
    directDiscountPct: DIRECT_BOOKING_DISCOUNT * 100,
    directDiscountAmount,
    afterDirect,
    rewardDiscountPct,
    rewardDiscountAmount,
    finalTotal,
    airbnbComparable,
    savingsVsAirbnb,
  };
}

export function money(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
