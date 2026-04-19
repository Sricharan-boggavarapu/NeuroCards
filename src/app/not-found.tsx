import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">This page drifted away</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Like a forgotten flashcard — let&apos;s head somewhere more familiar.
      </p>
      <Button asChild className="mt-8 rounded-2xl">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
