// "Post-Fajr" window — slots that start between 5am and 7:59am local time
// are considered the blessed golden hours and carry a premium surcharge.
export const POST_FAJR_START_HOUR = 5;
export const POST_FAJR_END_HOUR_EXCLUSIVE = 8;
export const POST_FAJR_PREMIUM = 0.5;

export function isPostFajrSlot(startsAt) {
  const h = new Date(startsAt).getHours();
  return h >= POST_FAJR_START_HOUR && h < POST_FAJR_END_HOUR_EXCLUSIVE;
}

export function getSlotPricing(scholar, startsAt) {
  const basePrice = scholar.pricePerSession;
  const postFajr = isPostFajrSlot(startsAt);
  const premium = postFajr ? POST_FAJR_PREMIUM : 0;
  const price = Math.round(basePrice * (1 + premium));
  return { basePrice, price, postFajr, premiumPercent: Math.round(premium * 100) };
}
