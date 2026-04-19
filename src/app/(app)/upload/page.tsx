"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { SUPABASE_SETUP_MESSAGE } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import type { GeneratePayload } from "@/lib/types";

type Phase = "idle" | "reading" | "generating" | "saving";

export default function UploadPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [deckTitle, setDeckTitle] = useState("");
  const [progress, setProgress] = useState(12);
  const [drag, setDrag] = useState(false);

  async function onFile(file: File) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please choose a PDF file.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      toast.error(SUPABASE_SETUP_MESSAGE);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Sign in to upload.");
      router.push("/login");
      return;
    }

    setPhase("reading");
    setProgress(25);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const upJson = await up.json();
      if (!up.ok) throw new Error(upJson.error || "Upload failed");

      setPhase("generating");
      setProgress(55);

      const title =
        deckTitle.trim() ||
        file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ") ||
        "New deck";

      const gen = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: upJson.text, deckTitle: title }),
      });
      const genJson = (await gen.json()) as GeneratePayload & { error?: string };
      if (!gen.ok) throw new Error(genJson.error || "Generation failed");

      setProgress(85);
      setPhase("saving");

      const { data: deck, error: deckErr } = await supabase
        .from("decks")
        .insert({
          user_id: user.id,
          title,
          source_filename: upJson.filename ?? file.name,
          summary: genJson.summary,
          quiz: genJson.quiz ?? [],
        })
        .select("id")
        .single();

      if (deckErr || !deck) throw deckErr ?? new Error("Could not save deck");

      const rows = genJson.flashcards.map((c) => ({
        deck_id: deck.id,
        question: c.question,
        answer: c.answer,
        card_type: c.type,
        next_review: new Date().toISOString(),
        repetition_count: 0,
        interval_days: 1,
        mastery_score: 0,
      }));

      const { error: cardsErr } = await supabase.from("cards").insert(rows);
      if (cardsErr) throw cardsErr;

      setProgress(100);
      toast.success("Deck created — nice work!");
      router.push(`/deck/${deck.id}`);
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
      setPhase("idle");
      setProgress(12);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void onFile(f);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Upload study material</h1>
        <p className="mt-2 text-muted-foreground">
          Drop a PDF — we will extract the text, generate cards, a summary, and a short quiz.
        </p>
      </div>

      <Card className="rounded-3xl border-border/70 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-violet-500" />
            PDF upload
          </CardTitle>
          <CardDescription>Works best with text-based PDFs (most textbooks export fine).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Deck name (optional)</Label>
            <Input
              id="title"
              value={deckTitle}
              onChange={(e) => setDeckTitle(e.target.value)}
              placeholder="e.g. Biology — Cell structure"
              className="rounded-xl"
              disabled={phase !== "idle"}
            />
          </div>

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-violet-200/80 bg-gradient-to-br from-sky-50/50 to-violet-50/50 px-6 py-14 text-center transition hover:border-violet-300 dark:border-violet-500/30 dark:from-slate-900/40 dark:to-violet-950/30 ${
              drag ? "border-violet-400 bg-violet-50/40 dark:bg-violet-950/20" : ""
            } ${phase !== "idle" ? "pointer-events-none opacity-70" : ""}`}
          >
            <FileUp className="mb-3 h-10 w-10 text-violet-500" />
            <p className="font-medium">Drag & drop your PDF here</p>
            <p className="mt-1 text-sm text-muted-foreground">or click to browse — up to ~12MB on Vercel</p>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              disabled={phase !== "idle"}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
            />
          </label>

          {phase !== "idle" && (
            <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                {phase === "reading" && "Reading your PDF…"}
                {phase === "generating" && "Crafting flashcards with AI…"}
                {phase === "saving" && "Saving your deck…"}
              </div>
              <Progress value={progress} className="h-2 rounded-full" />
              <p className="text-xs text-muted-foreground">
                This usually takes a few seconds. Grab water — hydration helps memory too.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild className="rounded-2xl">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
