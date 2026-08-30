"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, CardContent, Input } from "@/components/ui";

type AuthMode = "signin" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const togglePasswordVisibility = () => setShowPassword((visible) => !visible);
  const isSignUp = mode === "signup";
  const title = isSignUp ? "Create your account" : "Welcome back";
  const actionLabel = isSignUp ? "Sign up" : "Sign in";
  const alternateHref = isSignUp ? "/signin" : "/signup";
  const alternateLabel = isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up";

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-8 text-center">
            <Link href="/landing" className="text-4xl font-semibold tracking-tight hover:text-accent">
              planora<span className="text-accent">.</span>
            </Link>
            <h1 className="mt-6 text-xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-secondary">{isSignUp ? "Start organizing your work with Planora." : "Sign in to continue to your workspace."}</p>
          </div>

          <form className="space-y-5" onSubmit={async (event) => {
            event.preventDefault();
            if (isSubmitting) return;
            setErrorMessage("");
            setSuccessMessage("");
            const form = event.currentTarget;
            const values = new FormData(form);
            const password = String(values.get("password") ?? "");
            const confirmation = String(values.get("passwordConfirmation") ?? "");
            if (isSignUp && password !== confirmation) {
              setPasswordMismatch(true);
              return;
            }
            setPasswordMismatch(false);
            setIsSubmitting(true);
            const email = String(values.get("email") ?? "");
            const result = isSignUp
              ? await supabase.auth.signUp({
                  email,
                  password,
                  options: {
                    data: {
                      full_name: values.get("fullName"),
                    },
                  },
                })
              : await supabase.auth.signInWithPassword({ email, password });
            setIsSubmitting(false);
            if (result.error) {
              setErrorMessage(result.error.message);
              return;
            }
            if (isSignUp && !result.data.session) {
              setSuccessMessage("Account created. Check your email to confirm your address.");
              return;
            }
            router.push("/");
            router.refresh();
          }}>
            {isSignUp && <Input id="full-name" name="fullName" label="Full name" placeholder="Alex Morgan" autoComplete="name" required />}
            <Input id="email" name="email" type="email" label="Email" placeholder="you@example.com" autoComplete="email" required />
            <div className="relative">
              <Input id="password" name="password" type={showPassword ? "text" : "password"} label="Password" placeholder="Enter your password" autoComplete={isSignUp ? "new-password" : "current-password"} className="pr-20" required />
              <button type="button" onClick={togglePasswordVisibility} className="absolute right-2 top-[29px] z-10 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-secondary hover:bg-muted hover:text-primary" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {isSignUp && <div className="relative">
              <Input id="password-confirmation" name="passwordConfirmation" type={showPassword ? "text" : "password"} label="Confirm password" placeholder="Re-enter your password" autoComplete="new-password" className={passwordMismatch ? "border-danger pr-20" : "pr-20"} required />
              <button type="button" onClick={togglePasswordVisibility} className="absolute right-2 top-[29px] z-10 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-secondary hover:bg-muted hover:text-primary" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
              {passwordMismatch && <p className="mt-1.5 text-xs text-danger" role="alert">Passwords do not match.</p>}
            </div>}
            {errorMessage && <p className="text-sm text-danger" role="alert">{errorMessage}</p>}
            {successMessage && <p className="text-sm text-accent" role="status">{successMessage}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Please wait…" : actionLabel}</Button>
          </form>

          <p className="mt-6 text-center text-sm text-secondary">
            <Link href={alternateHref} className="font-medium text-accent hover:text-accent-hover">{alternateLabel}</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

function EyeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="cursor-pointer h-5 w-5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.5" /></svg>;
}

function EyeOffIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="cursor-pointer h-5 w-5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a18.2 18.2 0 0 1-3.1 3.8M6.2 6.3C3.4 8.2 2 12 2 12s3.5 7 10 7c1 0 2-.2 2.9-.5" /></svg>;
}
