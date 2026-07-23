"use client";

import { useEffect, useState } from "react";

import { appPath } from "@/lib/navigation";
import { useAuthStore, waitForAuthHydration } from "@/stores/authStore";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapAuth() {
      await waitForAuthHydration();
      const authenticated = await useAuthStore.getState().restoreSession();

      if (cancelled) return;
      if (!authenticated || !useAuthStore.getState().accessToken) {
        window.location.replace(appPath("/login"));
        return;
      }

      setAuthReady(true);
    }

    void bootstrapAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-400 flex items-center justify-center">
        Loading…
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-400 flex items-center justify-center">
        Redirecting…
      </div>
    );
  }

  return <>{children}</>;
}
