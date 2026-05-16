/** Guest booking price model (nightly subtotal → 10% direct discount → reward % of post-discount → + cleaning). */

export type GuestBookingPrice = {
  nights: number;
  subtotal: number;
  directDiscount: number;
  afterDirectDiscount: number;
  rewardDiscountPct: number;
  rewardDiscountAmount: number;
  cleaningFee: number;
  total: number;
  airbnbPrice: number;
  totalSavings: number;
};

export function computeGuestBookingPrice(
  nights: number,
  basePricePerNight: number,
  cleaningFee: number,
  rewardDiscountPct: number
): GuestBookingPrice | null {
  if (nights < 1 || basePricePerNight < 0 || cleaningFee < 0) return null;
  const subtotal = nights * basePricePerNight;
  const directDiscount = subtotal * 0.1;
  const afterDirectDiscount = subtotal - directDiscount;
  const rewardDiscountAmount =
    rewardDiscountPct > 0 ? afterDirectDiscount * (rewardDiscountPct / 100) : 0;
  const total = afterDirectDiscount - rewardDiscountAmount + cleaningFee;
  if (total < 0) return null;
  const airbnbPrice = total / 0.88;
  const totalSavings = airbnbPrice - total;
  return {
    nights,
    subtotal,
    directDiscount,
    afterDirectDiscount,
    rewardDiscountPct,
    rewardDiscountAmount,
    cleaningFee,
    total,
    airbnbPrice,
    totalSavings,
  };
}
