import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SUPABASE_SETUP_MESSAGE } from "@/lib/supabase/config";

/** Shown when server Supabase client cannot be created (missing env). */
export function SupabaseConfigRequired() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-4 py-16 sm:px-6">
      <Card className="rounded-3xl border-amber-200/80 bg-amber-50/50 shadow-md dark:border-amber-500/30 dark:bg-amber-950/20">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <CardTitle className="text-xl">Connect Supabase first</CardTitle>
              <CardDescription className="mt-2 text-base leading-relaxed">
                NeuroCards needs your Supabase project URL and anon key. Without them, sign-in and saving decks
                cannot work.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>{SUPABASE_SETUP_MESSAGE}</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Open your Supabase project → Settings → API.</li>
            <li>Copy the Project URL and the anon public key into <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">.env.local</code> in the project root.</li>
            <li>Run the SQL in <code className="rounded bg-muted px-1.5 py-0.5">supabase/migrations/001_neurocards_schema.sql</code>.</li>
            <li>Stop and run <code className="rounded bg-muted px-1.5 py-0.5">npm run dev</code> again.</li>
          </ol>
          <p>
            <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">
              ← Back to home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
