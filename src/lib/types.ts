export type CardType = "definition" | "conceptual" | "why" | "application";

export interface GeneratedFlashcard {
  question: string;
  answer: string;
  type: CardType;
}

export interface GeneratedQuizItem {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface GeneratePayload {
  flashcards: GeneratedFlashcard[];
  summary: string;
  quiz: GeneratedQuizItem[];
}
