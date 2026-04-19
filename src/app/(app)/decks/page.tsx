import { SupabaseConfigRequired } from "@/components/setup/supabase-config-required";
import { createClient } from "@/lib/supabase/server";
import { DecksClient } from "./decks-client";

export default async function DecksPage() {
  const supabase = await createClient();
  if (!supabase) return <SupabaseConfigRequired />;

  const { data: decks } = await supabase
    .from("decks")
    .select("id, title, created_at, summary")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Your decks</h1>
        <p className="mt-2 text-muted-foreground">
          Search, filter, and jump back into practice whenever you have a few minutes.
        </p>
      </div>
      <DecksClient
        decks={
          (decks ?? []).map((d) => ({
            id: d.id,
            title: d.title,
            created_at: d.created_at,
            summary: d.summary,
          }))
        }
      />
    </div>
  );
}
