import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scheduleNextReview, xpForRating, type Rating } from "@/lib/spaced-repetition";

export const runtime = "nodejs";

/** Compute streak from last study date (YYYY-MM-DD) and today's date string. */
function computeStreak(lastStudyDate: string | null, todayStr: string, previousStreak: number) {
  if (lastStudyDate === todayStr) {
    return Math.max(previousStreak, 1);
  }
  if (!lastStudyDate) {
    return 1;
  }
  const last = new Date(`${lastStudyDate}T12:00:00Z`);
  const today = new Date(`${todayStr}T12:00:00Z`);
  const diffDays = Math.round((today.getTime() - last.getTime()) / 86400000);
  if (diffDays === 1) {
    return previousStreak + 1;
  }
  return 1;
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured on the server." }, { status: 503 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const cardId = typeof body.cardId === "string" ? body.cardId : "";
    const rating = body.rating as Rating;
    if (!cardId || !["easy", "medium", "hard"].includes(rating)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { data: card, error: cardError } = await supabase
      .from("cards")
      .select("id, deck_id, repetition_count, interval_days, mastery_score")
      .eq("id", cardId)
      .single();

    if (cardError || !card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const scheduled = scheduleNextReview(rating, card.repetition_count, card.interval_days);
    const newMastery = Math.min(
      100,
      Math.max(0, Number(card.mastery_score) + scheduled.masteryDelta),
    );

    const { error: updateError } = await supabase
      .from("cards")
      .update({
        difficulty_label: rating,
        next_review: scheduled.nextReview.toISOString(),
        repetition_count: scheduled.repetitionCount,
        interval_days: scheduled.intervalDays,
        mastery_score: newMastery,
      })
      .eq("id", cardId);

    if (updateError) {
      console.error(updateError);
      return NextResponse.json({ error: "Could not update card" }, { status: 500 });
    }

    const { error: progressError } = await supabase.from("progress").insert({
      user_id: user.id,
      card_id: cardId,
      deck_id: card.deck_id,
      rating,
    });

    if (progressError) {
      console.error(progressError);
    }

    const xpGain = xpForRating(rating);
    const { data: profile } = await supabase
      .from("profiles")
      .select("streak, xp, last_study_date")
      .eq("id", user.id)
      .single();

    const todayStr = new Date().toISOString().slice(0, 10);
    const prevStreak = profile?.streak ?? 0;
    const last = profile?.last_study_date ?? null;
    const newStreak = computeStreak(last, todayStr, prevStreak);

    await supabase
      .from("profiles")
      .update({
        xp: (profile?.xp ?? 0) + xpGain,
        streak: newStreak,
        last_study_date: todayStr,
      })
      .eq("id", user.id);

    return NextResponse.json({
      ok: true,
      nextReview: scheduled.nextReview.toISOString(),
      xpGained: xpGain,
      streak: newStreak,
      mastery: newMastery,
    });
  } catch (err) {
    console.error("api/progress", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
