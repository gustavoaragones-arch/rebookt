function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",

  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  RESEND_API_KEY: process.env.RESEND_API_KEY,

  CRON_SECRET: process.env.CRON_SECRET,

  RESEND_FROM: process.env.RESEND_FROM ?? "Rebookt <onboarding@resend.dev>",
};

export function requireSupabasePublic() {
  return {
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function requireSupabaseService() {
  return {
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseServiceKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function requireStripeCheckoutEnv() {
  return {
    stripeSecret: required("STRIPE_SECRET_KEY"),
    appUrl: required("NEXT_PUBLIC_APP_URL"),
  };
}

export function requireStripeWebhookSecret() {
  return required("STRIPE_WEBHOOK_SECRET");
}

export function requireResendEnv() {
  return {
    resendApiKey: required("RESEND_API_KEY"),
  };
}
