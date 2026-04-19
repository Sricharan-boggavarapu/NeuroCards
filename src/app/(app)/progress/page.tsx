import { SupabaseConfigRequired } from "@/components/setup/supabase-config-required";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressChart, type ReviewPoint } from "./progress-chart";

function lastNDates(n: number) {
  const out: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export default async function ProgressPage() {
  const supabase = await createClient();
  if (!supabase) return <SupabaseConfigRequired />;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const since = new Date();
  since.setDate(since.getDate() - 13);

  const { data: progressRows } = await supabase
    .from("progress")
    .select("reviewed_at, rating")
    .eq("user_id", user!.id)
    .gte("reviewed_at", since.toISOString());

  const byDay = new Map<string, number>();
  const ratingCounts = { easy: 0, medium: 0, hard: 0 };

  for (const row of progressRows ?? []) {
    const day = new Date(row.reviewed_at).toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
    const r = row.rating;
    if (r === "easy") ratingCounts.easy += 1;
    else if (r === "medium") ratingCounts.medium += 1;
    else if (r === "hard") ratingCounts.hard += 1;
  }

  const days = lastNDates(7);
  const chartData: ReviewPoint[] = days.map((d) => ({
    day: new Date(d + "T12:00:00Z").toLocaleDateString(undefined, { weekday: "short" }),
    reviews: byDay.get(d) ?? 0,
  }));

  const { data: cards } = await supabase.from("cards").select("card_type, mastery_score");

  const typeTo = new Map<string, { total: number; n: number }>();
  for (const c of cards ?? []) {
    const t = c.card_type || "general";
    const cur = typeTo.get(t) ?? { total: 0, n: 0 };
    cur.total += Number(c.mastery_score ?? 0);
    cur.n += 1;
    typeTo.set(t, cur);
  }

  const weakAreas = [...typeTo.entries()]
    .map(([type, v]) => ({
      type,
      avg: v.n ? v.total / v.n : 0,
    }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 4);

  const totalReviews = (progressRows ?? []).length;
  const insight =
    ratingCounts.hard > ratingCounts.easy
      ? "You are being honest with “Hard” — that is how the schedule learns. Keep it up."
      : "Nice balance — steady reps build durable memory.";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Progress</h1>
        <p className="mt-2 text-muted-foreground">
          A calm snapshot of reviews, not a report card. Trends matter more than single days.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border-border/70 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Reviews last 7 days</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart data={chartData} />
            <p className="mt-4 text-sm text-muted-foreground">
              {totalReviews} reviews logged in the last two weeks.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">Rating mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Easy</span>
              <span className="font-medium">{ratingCounts.easy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Medium</span>
              <span className="font-medium">{ratingCounts.medium}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hard</span>
              <span className="font-medium">{ratingCounts.hard}</span>
            </div>
            <p className="pt-2 text-xs leading-relaxed text-muted-foreground">{insight}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 rounded-3xl border-border/70">
        <CardHeader>
          <CardTitle className="text-lg">Focus areas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {weakAreas.length ? (
            weakAreas.map((w) => (
              <Badge key={w.type} variant="secondary" className="rounded-xl px-3 py-1 capitalize">
                {w.type.replace("_", " ")} · avg {Math.round(w.avg)}%
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              As your library grows, we will surface types that want more practice.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
