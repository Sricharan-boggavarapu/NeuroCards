import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Play, Sparkles } from "lucide-react";
import { SupabaseConfigRequired } from "@/components/setup/supabase-config-required";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { GeneratedQuizItem } from "@/lib/types";

export default async function DeckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) return <SupabaseConfigRequired />;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, user_id, title, summary, quiz, source_filename, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!deck || deck.user_id !== user?.id) {
    notFound();
  }

  const { count } = await supabase
    .from("cards")
    .select("*", { count: "exact", head: true })
    .eq("deck_id", id);

  const quiz = (deck.quiz ?? []) as GeneratedQuizItem[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{deck.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Source: {deck.source_filename ?? "uploaded PDF"} ·{" "}
            {new Date(deck.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-xl">
              {count ?? 0} cards
            </Badge>
            <Badge variant="outline" className="rounded-xl">
              Spaced repetition ready
            </Badge>
          </div>
        </div>
        <Button asChild size="lg" className="h-12 rounded-2xl px-8 shadow-md">
          <Link href={`/study/${deck.id}`}>
            <Play className="mr-2 h-4 w-4" />
            Start session
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="summary" className="mt-10">
        <TabsList className="rounded-2xl bg-muted/60">
          <TabsTrigger value="summary" className="rounded-xl">
            Summary
          </TabsTrigger>
          <TabsTrigger value="quiz" className="rounded-xl">
            Quiz
          </TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="mt-6">
          <Card className="rounded-3xl border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-violet-500" />
                Study summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {deck.summary || "No summary was stored for this deck."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="quiz" className="mt-6 space-y-4">
          {quiz.length === 0 ? (
            <Card className="rounded-3xl border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No quiz items for this deck.
              </CardContent>
            </Card>
          ) : (
            quiz.map((q, i) => (
              <Card key={i} className="rounded-3xl border-border/70">
                <CardHeader>
                  <CardTitle className="text-base font-medium">
                    {i + 1}. {q.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {q.options.map((opt, j) => (
                    <div
                      key={j}
                      className={`rounded-2xl border px-3 py-2 text-sm ${
                        j === q.correctIndex
                          ? "border-emerald-300/80 bg-emerald-50/80 dark:border-emerald-500/40 dark:bg-emerald-950/30"
                          : "border-border/60 bg-muted/20"
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Correct answer highlighted in soft green — try covering it first.
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Card className="mt-10 rounded-3xl border-border/70 bg-gradient-to-br from-sky-50/50 to-violet-50/40 dark:from-slate-900/40 dark:to-violet-950/30">
        <CardContent className="flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-800">
              <BookOpen className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="font-semibold">Practice beats perfection</p>
              <p className="text-sm text-muted-foreground">
                Short sessions with honest ratings help the schedule adapt to you.
              </p>
            </div>
          </div>
          <Button asChild variant="secondary" className="rounded-2xl">
            <Link href={`/study/${deck.id}`}>Begin</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
