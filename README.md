# NeuroCards

NeuroCards is a learning tool that converts PDFs into study decks, flashcards, and quick quizzes. It uses spaced repetition to help students retain school material more effectively.

## Features

- Upload a PDF and generate study decks automatically
- Create flashcards from notes, then review them with spaced repetition
- Track streaks, XP, mastery, and weak topics
- Supabase authentication with email signup/login
- Optional AI generation using Groq or Google AI Studio Gemini
- Profile display names and learning progress saved per user

## Tech Stack

- Next.js 14+
- TypeScript
- Supabase (Auth + PostgreSQL)
- Groq / Google AI Studio for AI generation
- Tailwind CSS / custom UI components

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment variables

Copy `.env.example` to `.env.local` and add your credentials.

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for server-side Supabase operations if used)
- `GROQ_API_KEY` or `GEMINI_API_KEY` if you want AI features
- `GROQ_MODEL` (optional)
- `GROQ_MAX_TOKENS` (optional)

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Supabase Setup

This project expects a Supabase project with these core tables:

- `profiles` with `display_name`, `streak`, `xp`, `last_study_date`
- `decks`
- `cards`
- `progress`

There is a user trigger that creates a profile row automatically for each new Supabase auth user.

### Migrations

To apply the schema and trigger updates, run:

```bash
supabase db push
```

Or run the SQL in `supabase/migrations/001_neurocards_schema.sql` from Supabase SQL Editor.

## AI Configuration

The app supports two AI providers:

- **Groq** via `GROQ_API_KEY`
- **Google AI Studio Gemini** via `GEMINI_API_KEY`

If both keys are present, Groq is used by default.

## Deploying

This app can be deployed to Vercel, Netlify, or any platform that supports Next.js.

### Recommended deployment steps

1. Push code to GitHub: `git push origin main`
2. Connect the repository in Vercel
3. Add environment variables in your deployment settings
4. Deploy the project

## Project Structure

- `src/app/` — Next.js app routes and pages
- `src/components/` — UI components and layout pieces
- `src/lib/` — shared utilities, Supabase and AI helpers
- `supabase/migrations/` — database schema and triggers

## License

Open source and ready to improve.

---

Repository: https://github.com/Sricharan-boggavarapu/NeuroCards
