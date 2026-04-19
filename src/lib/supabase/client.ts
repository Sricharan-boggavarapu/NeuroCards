import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/config";

/** Returns `null` if URL/key are not set (avoids cryptic runtime errors in the browser). */
export function createClient() {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.anon);
}
