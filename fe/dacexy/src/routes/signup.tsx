import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell, Field } from "@/components/auth-shell";
import { signup as apiSignup, saveSession } from "@/lib/api";

const TITLE = "Create your account — Dacexy AI";
const DESCRIPTION = "Create a Dacexy AI account and put an autonomous AI employee to work on research, documents, desktop and browser tasks.";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function SignupPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const first = String(form.get("first") || "").trim();
    const last = String(form.get("last") || "").trim();
    const email = String(form.get("email") || "").trim();
    const company = String(form.get("company") || "").trim();
    const password = String(form.get("password") || "");
    if (!first || !last || !email || !password) {
      toast.error("Please complete all required fields.");
      setLoading(false);
      return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      toast.error("Password must be 8+ characters and include uppercase, lowercase, number and special character.");
      setLoading(false);
      return;
    }
    try {
      const { access_token, refresh_token, user } = await apiSignup({
        first,
        last,
        email,
        company,
        password,
      });
      saveSession(access_token, user, refresh_token);
      toast.success("Account created", { description: "Your license key is ready on the download page." });
      navigate({ to: "/chat" });
    } catch (err) {
      toast.error("Sign up failed", { description: err instanceof Error ? err.message : "Try again" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Free to start"
      title="Create your account"
      subtitle="Start free. No credit card required."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" name="first" required placeholder="Alex" autoComplete="given-name" />
          <Field label="Last name" name="last" required placeholder="Mercer" autoComplete="family-name" />
        </div>
        <Field label="Work email" type="email" name="email" required placeholder="you@company.com" autoComplete="email" />
        <Field label="Company" name="company" placeholder="Dacexy Inc." autoComplete="organization" />
        <Field label="Password" type="password" name="password" required minLength={8} placeholder="At least 8 characters" autoComplete="new-password" />
        <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <input type="checkbox" required className="mt-1 h-3.5 w-3.5 rounded border-border" />
          <span>
            I agree to the terms of service and privacy policy.
          </span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="flow-gradient w-full rounded-xl px-6 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-float)] transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundImage: "var(--gradient-cinematic)" }}
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
