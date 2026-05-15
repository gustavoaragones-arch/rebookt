const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRewardCode(): string {
  let part = "";
  for (let i = 0; i < 4; i++) {
    part += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `STAY-${part}`;
}
