import { SiteFooter } from "@/components/layout/site-footer";
import { HeaderWithAuth } from "@/components/layout/header-with-auth";
import { SupabaseConfigRequired } from "@/components/setup/supabase-config-required";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/80 via-background to-violet-100/40 dark:from-slate-900 dark:via-background dark:to-violet-950/30">
        <SupabaseConfigRequired />
        <SiteFooter />
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/80 via-background to-violet-100/40 dark:from-slate-900 dark:via-background dark:to-violet-950/30">
      <HeaderWithAuth email={user?.email ?? null} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
