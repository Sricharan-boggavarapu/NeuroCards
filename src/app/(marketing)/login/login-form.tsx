"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseEnv, SUPABASE_SETUP_MESSAGE } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      toast.error(SUPABASE_SETUP_MESSAGE);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!username.trim()) {
          throw new Error("Choose a display name before signing up.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: username.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your Neurocards account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const hasSupabase = Boolean(getSupabaseEnv());

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-12 sm:max-w-2xl sm:px-8 sm:py-16 lg:max-w-2xl">
      {!hasSupabase && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/90 p-4 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Supabase is not configured</p>
            <p className="mt-1 leading-relaxed opacity-90">{SUPABASE_SETUP_MESSAGE}</p>
          </div>
        </div>
      )}
      <Card className="rounded-3xl border-border/70 shadow-lg sm:shadow-xl">
        <CardHeader className="space-y-2 px-6 pt-8 sm:px-10 sm:pt-10">
          <CardTitle className="text-2xl font-semibold sm:text-3xl">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </CardTitle>
          <CardDescription>
            Use your email to save decks and sync progress across devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8 sm:px-10 sm:pb-10">
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl text-base"
                placeholder="you@school.edu"
              />
            </div>
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="username">Preferred username</Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 rounded-xl text-base"
                  placeholder="How should we call you?"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl text-base"
                placeholder="••••••••"
              />
            </div>
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 rounded-xl text-base"
                  placeholder="••••••••"
                />
              </div>
            )}
            <Button
              type="submit"
              className="h-12 w-full rounded-2xl text-base"
              disabled={loading || !hasSupabase}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Sign up"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                New here?{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => setMode("signup")}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => setMode("signin")}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
          <p className="mt-6 text-center text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              ← Back home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
