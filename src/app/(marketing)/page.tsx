import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Clock, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    title: "From PDF to cards",
    body: "Upload study material and get thoughtful flashcards — not robotic fill-in-the-blanks.",
    icon: Upload,
  },
  {
    title: "Spaced repetition",
    body: "Reviews land when your brain is ready to strengthen memory, not when a calendar says so.",
    icon: Clock,
  },
  {
    title: "Explain like I’m 10",
    body: "Stuck? Ask for a gentle explanation that meets you where you are.",
    icon: Sparkles,
  },
];

export default function LandingPage() {
  return (
    <div className="flex-1">
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
            <Brain className="h-3.5 w-3.5 text-violet-500" />
            Calm, clever learning for real students
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Upload a PDF.{" "}
            <span className="bg-gradient-to-r from-sky-600 to-violet-600 bg-clip-text text-transparent dark:from-sky-400 dark:to-violet-400">
              Learn smarter,
            </span>{" "}
            remember longer.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg text-muted-foreground">
            NeuroCards turns your notes into flashcards, a summary, and quick quizzes — then helps you
            revise with spaced repetition and encouraging progress.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-2xl px-8 text-base shadow-md">
              <Link href="/upload">
                Upload PDF
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-2xl px-8 text-base">
              <Link href="/login">Sign in to save decks</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <Card
              key={f.title}
              className="rounded-3xl border-border/60 bg-card/70 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardContent className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/15 to-violet-500/15">
                  <f.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <h2 className="text-lg font-semibold">{f.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mx-auto mt-12 max-w-3xl rounded-3xl border-dashed border-violet-200/80 bg-gradient-to-br from-sky-50/80 to-violet-50/80 dark:border-violet-500/20 dark:from-slate-900/50 dark:to-violet-950/40">
          <CardContent className="flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-sm dark:bg-slate-800/80">
                <BookOpen className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Ready when you are</h3>
                <p className="text-sm text-muted-foreground">
                  Start with any school PDF — science, history, language — we keep the tone supportive.
                </p>
              </div>
            </div>
            <Button asChild className="rounded-2xl">
              <Link href="/upload">Try an upload</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
