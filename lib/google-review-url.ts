const ALLOWED_PREFIXES = [
  "https://g.page/",
  "https://www.google.com/maps/",
  "https://maps.google.com/",
];

export function isValidGoogleReviewUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  return ALLOWED_PREFIXES.some((p) => trimmed.startsWith(p));
}
