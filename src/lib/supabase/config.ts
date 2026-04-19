/** Shared check — NEXT_PUBLIC_* are available on server and inlined in the browser bundle. */
export function getSupabaseEnv(): { url: string; anon: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return null;
  return { url, anon };
}

export const SUPABASE_SETUP_MESSAGE =
  "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local (see .env.example), then restart the dev server.";
