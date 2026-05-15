import { Resend } from "resend";
import { env } from "@/lib/env";

let resend: Resend | null = null;

export function getResend(): Resend {
  if (!resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("Missing RESEND_API_KEY");
    resend = new Resend(key);
  }
  return resend;
}

export function defaultFrom(): string {
  return env.RESEND_FROM;
}
