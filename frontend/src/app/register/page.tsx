"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, ArrowRight, Mail } from "lucide-react";
import { registerUser } from "@/lib/api";
import { PasswordInput } from "@/components/PasswordInput";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/Field";

const HIGHLIGHTS = [
  "One workspace for stores, shelves, cameras and analytics",
  "Role-based access — Administrator, Manager, Analyst and Marketing",
  "Every score traced back to the session data it came from",
];

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const mismatch =
    confirmPassword.length > 0 && confirmPassword !== password;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await registerUser(email, password);

      if (data.user_id) {
        router.push("/login");
      } else {
        setError(typeof data === "string" ? data : "Registration failed.");
      }
    } catch (error) {
      console.error(error);
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Register to access the retail intelligence workspace."
      highlights={HIGHLIGHTS}
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="rounded font-semibold text-brand-deep transition-colors duration-200 hover:text-brand-strong"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleRegister} className="space-y-5">
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
            />
          )}
        </Field>

        <Field label="Password" required description="At least 6 characters.">
          {(id) => (
            <PasswordInput
              id={id}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={6}
              strength
            />
          )}
        </Field>

        <Field
          label="Confirm password"
          required
          error={mismatch ? "Passwords do not match." : undefined}
        >
          {(id) => (
            <PasswordInput
              id={id}
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={6}
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
          disabled={mismatch}
          className="group/submit w-full"
        >
          {loading ? "Creating account…" : "Create account"}
          {!loading && (
            <ArrowRight className="transition-transform duration-200 group-hover/submit:translate-x-1" />
          )}
        </Button>

        <p className="text-center text-xs leading-relaxed text-ink-subtle">
          Your access tier is assigned by an administrator after registration.
        </p>
      </form>
    </AuthLayout>
  );
}
