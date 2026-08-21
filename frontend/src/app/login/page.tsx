"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, ArrowRight, Mail } from "lucide-react";
import { loginUser } from "@/lib/api";
import { PasswordInput } from "@/components/PasswordInput";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/Field";

const HIGHLIGHTS = [
  "Attention, dwell and gaze analytics from ordinary store footage",
  "Shelf attractiveness scored automatically, with ranked actions",
  "Movement heatmaps, shopper segments and exportable reports",
];

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(email, password);

      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("email", email);

        router.push("/dashboard");
      } else {
        setError("Invalid email or password.");
      }
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your retail intelligence workspace."
      highlights={HIGHLIGHTS}
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="rounded font-semibold text-brand-deep transition-colors duration-200 hover:text-brand-strong"
          >
            Create one
          </Link>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          handleLogin();
        }}
      >
        <Field label="Email address" required>
          {(id) => (
            <Input
              id={id}
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              icon={Mail}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              invalid={Boolean(error)}
            />
          )}
        </Field>

        <Field label="Password" required>
          {(id) => (
            <PasswordInput
              id={id}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          )}
        </Field>

        {error && (
          <div
            role="alert"
            className="animate-fade-in flex items-start gap-2.5 rounded-xl border border-critical-soft bg-critical-soft/50 px-4 py-3 text-sm text-critical-strong"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            {error}
          </div>
        )}

        <Button
          type="submit"
          size="xl"
          loading={loading}
          className="group/submit w-full"
        >
          {loading ? "Signing in…" : "Sign in"}
          {!loading && (
            <ArrowRight className="transition-transform duration-200 group-hover/submit:translate-x-1" />
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
