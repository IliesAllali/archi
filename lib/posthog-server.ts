import { PostHog } from "posthog-node"

let _client: PostHog | null = null

function getClient(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null
  if (!_client) {
    _client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return _client
}

export function serverTrack(userId: string, event: string, properties?: Record<string, unknown>) {
  const client = getClient()
  if (!client) return
  client.capture({ distinctId: userId, event, properties })
}
