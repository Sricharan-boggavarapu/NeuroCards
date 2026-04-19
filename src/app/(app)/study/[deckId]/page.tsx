import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SupabaseConfigRequired } from "@/components/setup/supabase-config-required";
import { createClient } from "@/lib/supabase/server";
import { FlashcardSession } from "@/components/study/flashcard-session";
import { Button } from "@/components/ui/button";

export default async function StudyPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params;
  const supabase = await createClient();
  if (!supabase) return <SupabaseConfigRequired />;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, title, user_id")
    .eq("id", deckId)
    .maybeSingle();

  if (!deck || deck.user_id !== user?.id) {
    notFound();
  }

  const { data: cards } = await supabase
    .from("cards")
    .select("id, question, answer, card_type")
    .eq("deck_id", deckId)
    .order("next_review", { ascending: true });

  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6">
        <Button variant="ghost" asChild className="-ml-2 rounded-2xl">
          <Link href={`/deck/${deckId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Deck overview
          </Link>
        </Button>
      </div>
      <FlashcardSession key={deckId} deckTitle={deck.title} cards={cards ?? []} />
    </div>
  );
}
