import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell, Field } from "@/components/auth-shell";
import { login as apiLogin, saveSession } from "@/lib/api";

const TITLE = "Sign in — Dacexy AI";
const DESCRIPTION = "Sign in to your Dacexy AI account to run autonomous missions, sync memory and manage your AI employee.";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const { access_token, refresh_token, user } = await apiLogin({
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      saveSession(access_token, user, refresh_token);
      toast.success("Welcome back", { description: `Signed in as ${user.email}` });
      navigate({ to: "/chat" });
    } catch (err) {
      toast.error("Sign in failed", { description: err instanceof Error ? err.message : "Try again" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      subtitle="Continue where your agent left off."
      footer={
        <>
          New to Dacexy?{" "}
          <Link to="/signup" className="text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <Field label="Work email" type="email" name="email" required placeholder="you@company.com" autoComplete="email" />
        <Field label="Password" type="password" name="password" required placeholder="••••••••" autoComplete="current-password" />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" className="h-3.5 w-3.5 rounded border-border" /> Remember me
          </label>
          <Link to="/contact" className="text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flow-gradient w-full rounded-xl px-6 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-float)] transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundImage: "var(--gradient-cinematic)" }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
