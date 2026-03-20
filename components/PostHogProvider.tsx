"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPostHog, identifyUser, track } from "@/lib/posthog";

function PostHogPageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const identified = useRef(false);

  // Init PostHog once
  useEffect(() => {
    initPostHog();
  }, []);

  // Identify user from /api/me once PostHog is ready
  useEffect(() => {
    if (identified.current) return;
    if (["/login", "/signup", "/landing"].includes(pathname)) return;

    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => {
        if (user?.id) {
          identifyUser(user.id, {
            email: user.email,
            name: user.name,
            role: user.role,
            created_at: user.createdAt,
          });
          identified.current = true;
        }
      })
      .catch(() => {});
  }, [pathname]);

  // Track pageviews on route change (App Router)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    track("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageTracker />
      </Suspense>
      {children}
    </>
  );
}
