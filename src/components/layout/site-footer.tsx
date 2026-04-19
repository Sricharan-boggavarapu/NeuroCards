import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/40 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="max-w-md text-sm text-muted-foreground">
          NeuroCards helps you remember what matters — gently, on your schedule. Stack is free-tier only
          (Groq or Google AI Studio + Supabase); bring your own free keys.
        </p>
        <p className="text-sm text-muted-foreground">
          Built by{" "}
          <span className="font-medium text-foreground">Sricharan Boggavarapu</span>
        </p>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/decks" className="hover:text-foreground">
            Decks
          </Link>
          <Link href="/progress" className="hover:text-foreground">
            Progress
          </Link>
        </div>
      </div>
    </footer>
  );
}
