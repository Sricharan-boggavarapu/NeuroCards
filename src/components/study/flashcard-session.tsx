"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Loader2, Mic, RotateCcw, Sparkles, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Rating } from "@/lib/spaced-repetition";

export type StudyCard = {
  id: string;
  question: string;
  answer: string;
  card_type: string | null;
};

export function FlashcardSession({
  deckTitle,
  cards: initialCards,
}: {
  deckTitle: string;
  cards: StudyCard[];
}) {
  const [queue, setQueue] = useState<StudyCard[]>(() => shuffle(initialCards));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainText, setExplainText] = useState<string | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);

  const current = done ? null : queue[index];
  const progressValue =
    queue.length === 0 ? 100 : Math.min(100, ((index + (flipped ? 0.45 : 0)) / queue.length) * 100);

  const resetSession = useCallback(() => {
    setQueue(shuffle(initialCards));
    setIndex(0);
    setFlipped(false);
    setDone(false);
  }, [initialCards]);

  async function onExplain() {
    if (!current) return;
    setExplainOpen(true);
    setExplainLoading(true);
    setExplainText(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: current.question, answer: current.answer }),
      });
      const j = (await res.json()) as { explanation?: string; error?: string };
      if (!res.ok) throw new Error(j.error || "Failed");
      setExplainText(j.explanation ?? "");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not explain");
    } finally {
      setExplainLoading(false);
    }
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Speech is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }

  function startVoiceAnswer() {
    const w = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: (ev: { results: { [k: number]: { [k: number]: { transcript?: string } } } }) => void;
        onerror: () => void;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: (ev: { results: { [k: number]: { [k: number]: { transcript?: string } } } }) => void;
        onerror: () => void;
        start: () => void;
      };
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      toast.error("Voice input works best in Chrome or Edge.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev: { results: { [key: number]: { [key: number]: { transcript?: string } } } }) => {
      const said = ev.results[0]?.[0]?.transcript?.trim();
      if (said) {
        toast.message("We heard you", { description: said });
      }
    };
    rec.onerror = () => toast.error("Could not access the microphone.");
    rec.start();
  }

  async function submitRating(rating: Rating) {
    if (!current) return;
    setBusy(true);
    try {
      const res = await fetch("/api/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: current.id, rating }),
      });
      const j = (await res.json()) as { error?: string; xpGained?: number; streak?: number };
      if (!res.ok) throw new Error(j.error || "Could not save");

      toast.success(`Saved · +${j.xpGained ?? 0} XP · streak ${j.streak ?? "—"}`);

      setFlipped(false);

      if (index >= queue.length - 1) {
        setDone(true);
        toast.success("Nice — you finished this run.");
      } else {
        setIndex((i) => i + 1);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const typeLabel = useMemo(() => current?.card_type?.replace("_", " ") ?? "card", [current]);

  if (!initialCards.length) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-border/80 bg-card/60 p-10 text-center">
        <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">No cards yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">Upload a PDF to generate your first deck.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border/70 bg-card/80 p-10 shadow-sm">
          <Sparkles className="mx-auto h-10 w-10 text-violet-500" />
          <h2 className="mt-4 text-2xl font-semibold">Session complete</h2>
          <p className="mt-2 text-muted-foreground">
            Showing up is the hardest part — you did it. Come back when reviews are due.
          </p>
          <Button className="mt-8 rounded-2xl" type="button" onClick={resetSession}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Study again
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Studying</p>
          <h1 className="text-2xl font-semibold tracking-tight">{deckTitle}</h1>
        </div>
        <Button variant="outline" className="rounded-2xl" type="button" onClick={resetSession}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Shuffle
        </Button>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>
            Card {index + 1} / {queue.length}
          </span>
          <span className="capitalize">{typeLabel}</span>
        </div>
        <Progress value={progressValue} className="h-2 rounded-full" />
      </div>

      {current && (
        <motion.button
          type="button"
          layout
          onClick={() => setFlipped((f) => !f)}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          className="w-full text-left"
        >
          <div className="relative min-h-[260px] w-full overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-white to-sky-50/70 p-8 shadow-lg dark:from-card dark:to-slate-900/60">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={flipped ? "answer" : "question"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex min-h-[200px] flex-col justify-center"
              >
                <Badge variant="secondary" className="mb-4 w-fit rounded-xl capitalize">
                  {typeLabel}
                </Badge>
                {flipped ? (
                  <p className="text-lg leading-relaxed text-foreground/95">{current.answer}</p>
                ) : (
                  <p className="text-lg font-medium leading-relaxed">{current.question}</p>
                )}
                <p className="mt-8 text-sm text-muted-foreground">
                  {flipped ? "Tap to see the question" : "Tap to reveal the answer"}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.button>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          className="rounded-2xl"
          onClick={(e) => {
            e.stopPropagation();
            if (current) speak(flipped ? current.answer : current.question);
          }}
        >
          <Volume2 className="mr-2 h-4 w-4" />
          Read aloud
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl"
          onClick={(e) => {
            e.stopPropagation();
            startVoiceAnswer();
          }}
        >
          <Mic className="mr-2 h-4 w-4" />
          Answer with voice
        </Button>
        <Button
          type="button"
          className="rounded-2xl"
          onClick={(e) => {
            e.stopPropagation();
            void onExplain();
          }}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Explain like I&apos;m 10
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3">
        <Button
          type="button"
          className="h-12 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-600/90"
          disabled={!flipped || busy}
          onClick={() => submitRating("easy")}
        >
          Easy
        </Button>
        <Button
          type="button"
          className="h-12 rounded-2xl"
          disabled={!flipped || busy}
          variant="secondary"
          onClick={() => submitRating("medium")}
        >
          Medium
        </Button>
        <Button
          type="button"
          className="h-12 rounded-2xl bg-rose-600 text-white hover:bg-rose-600/90"
          disabled={!flipped || busy}
          onClick={() => submitRating("hard")}
        >
          Hard
        </Button>
      </div>
      {busy && (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving your progress…
        </p>
      )}

      <Dialog open={explainOpen} onOpenChange={setExplainOpen}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle>Gentle explanation</DialogTitle>
            <DialogDescription>Plain language, no jargon pile-ons.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
            {explainLoading && <p className="text-muted-foreground">Thinking…</p>}
            {!explainLoading && explainText}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
