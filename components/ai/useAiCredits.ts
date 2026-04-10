"use client"

import { useState, useEffect, useCallback } from "react"
import { getStoredApiKey, getStoredProvider } from "@/lib/ai-providers"

export interface AiCredits {
  creditsTotal: number
  creditsUsed: number
  creditsRemaining: number
}

/** Module-scoped cache for stale-while-revalidate pattern */
let cachedCredits: AiCredits | null = null
let lastFetchTime = 0
let listeners: Set<() => void> = new Set()

const STALE_MS = 15_000 // 15s stale window

function notifyListeners() {
  listeners.forEach((fn) => fn())
}

async function fetchCreditsFromApi(): Promise<AiCredits | null> {
  try {
    const res = await fetch("/api/me/ai-credits")
    if (!res.ok) return null
    const data = await res.json()
    cachedCredits = data
    lastFetchTime = Date.now()
    notifyListeners()
    return data
  } catch {
    return null
  }
}

/**
 * Centralized AI credits hook with stale-while-revalidate.
 * All AI components share the same cache — no redundant fetches.
 */
export function useAiCredits() {
  const [credits, setCredits] = useState<AiCredits | null>(cachedCredits)
  const [hasByok, setHasByok] = useState(false)
  const [ticking, setTicking] = useState(false)

  useEffect(() => {
    // Check BYOK
    const key = getStoredApiKey(getStoredProvider())
    setHasByok(!!key)

    // Subscribe to cache updates
    const listener = () => setCredits({ ...cachedCredits! })
    listeners.add(listener)

    // Fetch if stale or never fetched
    if (!cachedCredits || Date.now() - lastFetchTime > STALE_MS) {
      // Return stale data immediately
      if (cachedCredits) setCredits(cachedCredits)
      fetchCreditsFromApi()
    } else {
      setCredits(cachedCredits)
    }

    return () => { listeners.delete(listener) }
  }, [])

  /** Call after AI usage to refresh and trigger delight animation */
  const consumeCredits = useCallback(async () => {
    setTicking(true)
    await fetchCreditsFromApi()
    // Reset tick animation after it plays
    setTimeout(() => setTicking(false), 350)
  }, [])

  /** Force refresh */
  const refresh = useCallback(() => {
    fetchCreditsFromApi()
  }, [])

  return { credits, hasByok, ticking, consumeCredits, refresh }
}
