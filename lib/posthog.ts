'use client'

import posthog from 'posthog-js'

let initialized = false

export function initPostHog() {
  if (initialized) return
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
    capture_pageview: false, // handled manually for App Router
    disable_session_recording: process.env.NODE_ENV !== 'production',
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') ph.opt_out_capturing()
    },
  })

  initialized = true
}

export function identifyUser(userId: string, props: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  posthog.identify(userId, props)
}

export function resetUser() {
  if (typeof window === 'undefined') return
  posthog.reset()
}

export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  posthog.capture(event, props)
}

export { posthog }

// ─── Typed event helpers ──────────────────────────────────────────────────────

export const Events = {
  userSignedUp:       (source?: string) => track('user_signed_up', { source }),
  projectCreated:     (hasClient: boolean) => track('project_created', { has_client_name: hasClient }),
  nodeCreated:        (type: string, via: 'ui' | 'ai') => track('node_created', { type, via }),
  nodeDeleted:        (hadChildren: boolean, via: 'ui' | 'ai') => track('node_deleted', { had_children: hadChildren, via }),
  shareLinkCreated:   (hasPassword: boolean, hasExpiry: boolean) => track('share_link_created', { has_password: hasPassword, has_expiry: hasExpiry }),
  inviteSent:         (role: string) => track('invite_sent', { role }),
  inviteAccepted:     (role: string) => track('invite_accepted', { role }),
  aiTokenCreated:     (scope: string) => track('ai_token_created', { scope }),
  aiActionPerformed:  (action: string, tokenName: string) => track('ai_action_performed', { action, token_name: tokenName }),
  pdfExported:        (nodeCount: number) => track('pdf_exported', { node_count: nodeCount }),
  versionRestored:    (triggeredByType: string) => track('version_restored', { triggered_by_type: triggeredByType }),
  premiumWallHit:     (feature: string, context?: string) => track('premium_wall_hit', { feature, context }),
  upgradeCTAClicked:  (tier: string, source: string) => track('upgrade_cta_clicked', { tier, source }),
  checkoutStarted:    (product: string, source: string) => track('checkout_started', { product, source }),
  lifetimePurchased:  (tier: string) => track('lifetime_purchased', { tier }),
  creditsPurchased:   (pack: string, credits: number) => track('credits_purchased', { pack, credits }),
  byokActivated:      (provider: string) => track('byok_activated', { provider }),
  memberInvited:      (role: string, method: 'email' | 'existing') => track('member_invited', { role, method }),
  memberJoined:       () => track('member_joined'),
  canvasOpened:       (nodeCount: number, memberCount: number) => track('canvas_opened', { node_count: nodeCount, member_count: memberCount }),
  aiGenerated:        (nodeCount: number, mode: 'builtin' | 'mcp') => track('ai_generated', { node_count: nodeCount, mode }),
  aiEdited:           (actionCount: number, mode: 'builtin' | 'copypaste') => track('ai_edited', { action_count: actionCount, mode }),
}
