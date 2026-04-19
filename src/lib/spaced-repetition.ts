export type Rating = "easy" | "medium" | "hard";

/** Simple adaptive scheduling: easy pushes reviews out, hard brings them back soon. */
export function scheduleNextReview(
  rating: Rating,
  repetitionCount: number,
  currentIntervalDays: number,
): {
  nextReview: Date;
  repetitionCount: number;
  intervalDays: number;
  masteryDelta: number;
} {
  let interval = Math.max(1, currentIntervalDays);
  let repetition = repetitionCount;
  let masteryDelta = 0;

  switch (rating) {
    case "hard":
      interval = 1;
      repetition = Math.max(0, repetition - 1);
      masteryDelta = -5;
      break;
    case "medium":
      interval = Math.max(1, Math.round(interval * 1.6));
      repetition += 1;
      masteryDelta = 8;
      break;
    case "easy":
      interval = Math.max(1, Math.round(interval * 2.4));
      repetition += 1;
      masteryDelta = 12;
      break;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  nextReview.setHours(9, 0, 0, 0);

  return {
    nextReview,
    repetitionCount: repetition,
    intervalDays: interval,
    masteryDelta,
  };
}

export function xpForRating(rating: Rating): number {
  switch (rating) {
    case "easy":
      return 12;
    case "medium":
      return 8;
    case "hard":
      return 4;
    default:
      return 6;
  }
}
