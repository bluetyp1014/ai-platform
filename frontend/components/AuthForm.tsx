"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { appPath } from "@/lib/navigation";

import { useAuthStore, waitForAuthHydration } from "@/stores/authStore";

import { DemoClosedView } from "./DemoClosedView";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoClosed, setDemoClosed] = useState(false);
  const [demoStatusReady, setDemoStatusReady] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const isLogin = mode === "login";

  useEffect(() => {
    let cancelled = false;

    async function bootstrapAuth() {
      await waitForAuthHydration();
      await useAuthStore.getState().restoreSession();

      if (cancelled) return;
      if (useAuthStore.getState().accessToken) {
        window.location.replace(appPath("/"));
        return;
      }

      setAuthReady(true);
    }

    void bootstrapAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDemoStatus() {
      try {
        const res = await apiFetch(`/admin/demo-status`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to load demo status");
        }

        const data = (await res.json()) as { closed?: boolean };
        if (!cancelled) {
          setDemoClosed(Boolean(data.closed));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) {
          setDemoStatusReady(true);
        }
      }
    }

    void loadDemoStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!authReady || !demoStatusReady) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-400 flex items-center justify-center">
        Loading…
      </div>
    );
  }

  if (demoClosed && !showAdminLogin) {
    return (
      <div>
        <DemoClosedView />
        <div className="fixed inset-x-0 bottom-8 flex justify-center px-4">
          <button
            type="button"
            onClick={() => setShowAdminLogin(true)}
            className="rounded border border-slate-600 bg-slate-900/90 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Admin Sign In
          </button>
        </div>
      </div>
    );
  }

  if (accessToken) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-400 flex items-center justify-center">
        Redirecting…
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password);
      }
      window.location.replace(appPath("/"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900/80 p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-center">
          {isLogin ? "Sign in" : "Create account"}
        </h1>
        <p className="text-slate-400 text-sm text-center mt-2">
          AI Platform
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm text-slate-400 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              minLength={isLogin ? 1 : 3}
              maxLength={64}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded border border-slate-600 bg-slate-950 px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm text-slate-400 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              minLength={isLogin ? 1 : 6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-slate-600 bg-slate-950 px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {!isLogin && (
              <p className="text-xs text-slate-500 mt-1">
                At least 6 characters
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/50 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-2.5 font-medium"
          >
            {loading
              ? "Please wait…"
              : isLogin
                ? "Sign in"
                : "Register"}
          </button>

          {demoClosed && (
            <p className="text-sm text-amber-300 bg-amber-950/40 rounded px-3 py-2">
              Demo mode is closed. Only the configured admin account can sign in.
            </p>
          )}
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          {isLogin ? (
            <>
              No account?{" "}
              <Link href={appPath("/register")} className="text-indigo-400 hover:underline">
                Register
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href={appPath("/login")} className="text-indigo-400 hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
