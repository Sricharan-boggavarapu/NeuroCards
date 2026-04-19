import Link from "next/link";
import { Brain } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { MarketingThemeToggle } from "@/components/layout/marketing-theme-toggle";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50/90 via-background to-violet-100/50 dark:from-slate-950 dark:via-background dark:to-violet-950/40">
      <header className="border-b border-border/50 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 text-white shadow-sm">
              <Brain className="h-4 w-4" />
            </span>
            NeuroCards
          </Link>
          <div className="flex items-center gap-2">
            <MarketingThemeToggle />
            <Link
              href="/login"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>
      {children}
      <SiteFooter />
    </div>
  );
}
