"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/stores/authStore";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const sessionReady = useAuthStore((s) => s._sessionReady);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    if (hasHydrated && !sessionReady) {
      void restoreSession();
    }
  }, [hasHydrated, sessionReady, restoreSession]);

  useEffect(() => {
    if (sessionReady && !accessToken) {
      router.replace("/login");
    }
  }, [sessionReady, accessToken, router]);

  if (!hasHydrated || !sessionReady) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-400 flex items-center justify-center">
        Loading…
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  return <>{children}</>;
}
