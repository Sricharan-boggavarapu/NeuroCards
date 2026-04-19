"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export type DeckRow = {
  id: string;
  title: string;
  created_at: string;
  summary: string | null;
};

export function DecksClient({ decks }: { decks: DeckRow[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return decks;
    return decks.filter((d) => d.title.toLowerCase().includes(s));
  }, [decks, q]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search decks…"
          className="rounded-2xl pl-10"
          aria-label="Search decks"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="rounded-3xl border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No decks match that search. Try another word — or upload something new.
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((d) => (
            <li key={d.id}>
              <Link
                href={`/deck/${d.id}`}
                className="flex items-center justify-between rounded-3xl border border-border/60 bg-card/70 px-5 py-4 transition hover:-translate-y-0.5 hover:border-violet-200/80 hover:shadow-md dark:hover:border-violet-500/30"
              >
                <div>
                  <p className="font-medium">{d.title}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                    {d.summary || "Open to see summary, quiz, and study mode."}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(d.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="flex items-center gap-2 text-sm font-medium text-primary">
                  Open
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
