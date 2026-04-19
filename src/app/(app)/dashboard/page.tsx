import Link from "next/link";
import { ArrowRight, Flame, Sparkles, Target, TrendingUp } from "lucide-react";
import { SupabaseConfigRequired } from "@/components/setup/supabase-config-required";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default async function DashboardPage() {
  const supabase = await createClient();
  if (!supabase) return <SupabaseConfigRequired />;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("streak, xp, display_name")
    .eq("id", user!.id)
    .single();

  const { data: decks } = await supabase
    .from("decks")
    .select("id, title, created_at, summary")
    .order("created_at", { ascending: false })
    .limit(8);

  const deckIds = (decks ?? []).map((d) => d.id);
  let cards: {
    id: string;
    deck_id: string;
    mastery_score: number | null;
    next_review: string;
    card_type: string | null;
    repetition_count: number | null;
  }[] = [];

  if (deckIds.length) {
    const { data: c } = await supabase
      .from("cards")
      .select("id, deck_id, mastery_score, next_review, card_type, repetition_count")
      .in("deck_id", deckIds);
    cards = c ?? [];
  }

  const dueLimit = new Date();
  dueLimit.setHours(dueLimit.getHours() + 24);
  const dueSoon = cards.filter((c) => new Date(c.next_review) <= dueLimit);
  const learned = cards.filter((c) => (c.repetition_count ?? 0) > 0).length;
  const avgMastery =
    cards.length === 0
      ? 0
      : cards.reduce((a, c) => a + Number(c.mastery_score ?? 0), 0) / cards.length;

  const weakTypes = new Map<string, number>();
  for (const c of cards) {
    const t = c.card_type || "general";
    weakTypes.set(t, (weakTypes.get(t) ?? 0) + (100 - Number(c.mastery_score ?? 0)));
  }
  const weakTopics = [...weakTypes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type);

  const continueDeck = decks?.[0];

  const xp = profile?.xp ?? 0;
  const levelCap = 500;
  const levelProgress = Math.min(100, (xp % levelCap) / 5);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Hi{profile?.display_name ? `, ${profile.display_name}` : ""} — ready to learn?
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Small sessions beat long cramming. Pick up where you left off, or chip away at reviews.
          </p>
        </div>
        <Button asChild className="rounded-2xl">
          <Link href="/upload">
            New upload
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Card className="rounded-3xl border-border/70 bg-card/80 shadow-sm backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cards practiced</CardTitle>
            <Sparkles className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{learned}</p>
            <p className="mt-1 text-xs text-muted-foreground">At least once in NeuroCards</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-border/70 bg-card/80 shadow-sm backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mastery</CardTitle>
            <Target className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{Math.round(avgMastery)}%</p>
            <Progress className="mt-3 h-2 rounded-full" value={avgMastery} />
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-border/70 bg-card/80 shadow-sm backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{profile?.streak ?? 0} days</p>
            <p className="mt-1 text-xs text-muted-foreground">Study any day to keep it glowing</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border-border/70 bg-gradient-to-br from-white/80 to-sky-50/50 shadow-sm dark:from-card/80 dark:to-slate-900/40 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              XP & level
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-semibold">{xp} XP</span>
              <span className="text-sm text-muted-foreground">Next reward soon</span>
            </div>
            <Progress value={levelProgress} className="h-2 rounded-full" />
            <p className="text-sm text-muted-foreground">
              You earn XP every time you rate a card. Consistency beats perfection.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">Upcoming reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{dueSoon.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Due in the next 24 hours</p>
            <Button asChild variant="secondary" className="mt-4 w-full rounded-2xl">
              <Link href="/decks">Open decks</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">Continue learning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {continueDeck ? (
              <>
                <p className="font-medium">{continueDeck.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {continueDeck.summary || "Jump back into practice — your cards are waiting."}
                </p>
                <Button asChild className="rounded-2xl">
                  <Link href={`/study/${continueDeck.id}`}>Resume session</Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No decks yet. Upload a PDF to create your first set.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">Weak topics</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {weakTopics.length ? (
              weakTopics.map((t) => (
                <Badge key={t} variant="secondary" className="rounded-xl px-3 py-1 capitalize">
                  {t.replace("_", " ")}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                As you study, we will highlight areas that need a little extra love.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {decks && decks.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold">Recent decks</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {decks.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/deck/${d.id}`}
                  className="flex items-center justify-between rounded-3xl border border-border/60 bg-card/70 px-4 py-4 transition hover:border-violet-200/80 hover:shadow-sm dark:hover:border-violet-500/30"
                >
                  <div>
                    <p className="font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Added{" "}
                      {new Date(d.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
