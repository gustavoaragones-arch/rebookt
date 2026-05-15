import { createClient } from "@supabase/supabase-js";
import { requireSupabaseService } from "@/lib/env";

export function createAdminClient() {
  const { supabaseUrl, supabaseServiceKey } = requireSupabaseService();
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
