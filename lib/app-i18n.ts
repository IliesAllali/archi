/**
 * app-i18n.ts — Système i18n custom pour l'app Arbo (hors landing)
 *
 * Architecture :
 * - Traductions EN/FR regroupées par domaine
 * - Hook `useT()` pour les client components ("use client" déclaré dans les
 *   composants qui l'importent — ce fichier est isomorphe)
 * - Détection de locale : navigator.language > localStorage > "en"
 * - Slot `userLocale` préparé pour un setting utilisateur futur
 *
 * Ne pas confondre avec `landing-i18n.ts` qui gère uniquement la landing page.
 */

import { useState, useEffect, useCallback } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppLocale = "en" | "fr"

const STORAGE_KEY = "arbo_locale"

// ─── Détection de locale ──────────────────────────────────────────────────────

/**
 * Détecte la locale dans cet ordre de priorité :
 * 1. Setting utilisateur stocké dans localStorage (slot pour préférence compte)
 * 2. navigator.language du navigateur
 * 3. Fallback "en"
 *
 * Pour brancher la préférence compte : stocker la locale via `setUserLocale(locale)`
 * depuis le composant AccountSettings quand l'API renvoie la préférence.
 */
export function detectAppLocale(): AppLocale {
  if (typeof window === "undefined") return "en"

  // 1. Préférence utilisateur explicite (localStorage ou future API compte)
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "en" || stored === "fr") return stored

  // 2. Langue du navigateur
  const lang = navigator.language?.toLowerCase() || ""
  return lang.startsWith("fr") ? "fr" : "en"
}

/** Persiste la préférence de locale (appelé depuis les settings compte). */
export function setUserLocale(locale: AppLocale): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, locale)
  }
}

// ─── Hook principal ───────────────────────────────────────────────────────────

/**
 * Hook `useT()` — à utiliser dans tous les client components.
 *
 * @example
 * const t = useT()
 * <button>{t("aiBar.send")}</button>
 */
export function useT() {
  const [locale, setLocale] = useState<AppLocale>("en")

  useEffect(() => {
    setLocale(detectAppLocale())
  }, [])

  const t = useCallback(
    (key: TranslationKey): string => {
      const keys = key.split(".") as string[]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let val: any = translations[locale]
      for (const k of keys) {
        if (val == null) break
        val = val[k]
      }
      if (typeof val === "string") return val

      // Fallback EN si clé manquante en FR
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let fallback: any = translations["en"]
      for (const k of keys) {
        if (fallback == null) break
        fallback = fallback[k]
      }
      return typeof fallback === "string" ? fallback : key
    },
    [locale]
  )

  return t
}

// ─── Dictionnaire de traductions ──────────────────────────────────────────────

const translations = {
  en: {
    // ── AiBar ──────────────────────────────────────────────────────────────────
    aiBar: {
      toggleLabel: "AI Assistant",
      headerTitle: "AI Assistant",
      speedFast: "Fast",
      speedQuality: "Quality",
      speedFastTooltip: "Fast mode (1 credit)",
      speedQualityTooltip: "Quality mode (3 credits)",
      chatButton: "Chat",
      openChatTooltip: "Open chat",
      inputPlaceholderSitemap: "Edit the sitemap or ask a question...",
      inputPlaceholderWireframe: "Describe changes to the wireframe...",
      inputPlaceholderHeader: "Edit the global Header...",
      inputPlaceholderFooter: "Edit the global Footer...",
      sendHint: "Enter to send, Shift+Enter for new line",
      closeHint: "Esc to close",
      targetLabel: "Target:",
      targetPage: "Page",
      targetHeader: "Header",
      targetFooter: "Footer",
      responseLabel: "Response",
      creditsEmptyTitle: "Credits depleted",
      creditsEmptyDesc: "Top up or add your API key.",
      creditsEmptyDescFree: "Top up your credits to continue.",
      rechargeButton: "Top up 4€",
      apiKeyButton: "API Key",
      errorNetwork: "Network error",
      errorConnection: "Connection error",
      wireframeUpdated: "Wireframe updated",
      wireframeGenerated: "Wireframe generated",
      globalHeaderUpdated: "Global Header updated",
      globalFooterUpdated: "Global Footer updated",
      generating: "Generating wireframe...",
      modifCount_one: "{{count}} change",
      modifCount_other: "{{count}} changes",
      appliedFallback_one: "{{count}} change applied",
      appliedFallback_other: "{{count}} changes applied",
    },

    // ── Login ──────────────────────────────────────────────────────────────────
    login: {
      emailPlaceholder: "Email",
      passwordPlaceholder: "Password",
      submitButton: "Sign in",
      noAccount: "No account yet?",
      createAccount: "Create an account",
      resendVerification: "Resend confirmation email",
      resending: "Sending...",
      emailResent: "Email sent! Check your inbox.",
      emailConfirmed: "Email confirmed! You can now sign in.",
      errorInvalidCredentials: "Invalid credentials",
      errorConnection: "Connection error",
    },

    // ── Signup ─────────────────────────────────────────────────────────────────
    signup: {
      pageTitle: "Create an account",
      namePlaceholder: "Name",
      emailPlaceholder: "Email",
      passwordPlaceholder: "Password (8 characters min.)",
      submitButton: "Create my account",
      alreadyAccount: "Already have an account?",
      signIn: "Sign in",
      backToLogin: "Back to login",
      errorConnection: "Connection error",
      successDefault: "Account created. Check your email.",
    },

    // ── Dashboard (app/page.tsx) ───────────────────────────────────────────────
    dashboard: {
      projectCounter_one: "{{count}}/{{max}} project",
      projectCounter_other: "{{count}}/{{max}} projects",
      projectCounterUnlimited_one: "{{count}} project",
      projectCounterUnlimited_other: "{{count}} projects",
      welcomeTitle: "Welcome to arbo",
      welcomeSubtitle: "Create your first site structure to get started.",
      recentProjects: "Recent projects",
      exampleLabel: "Example",
    },

    // ── Settings — SettingsClient ──────────────────────────────────────────────
    settings: {
      pageTitle: "Settings",
      backButton: "Back",
      tabs: {
        general: "General",
        wireframe: "Wireframes",
        ai: "Connect an AI",
        members: "Members",
        share: "Share links",
        tokens: "AI Tokens",
        danger: "Danger zone",
      },
    },

    // ── Settings — GeneralTab ──────────────────────────────────────────────────
    settingsGeneral: {
      sectionTitle: "General information",
      sectionSubtitle: "Basic project settings.",
      labelName: "Project name",
      labelClient: "Client",
      labelVersion: "Version",
      labelAccent: "Accent color",
      labelCustomColor: "Custom color",
      clientPlaceholder: "Client name",
      versionPlaceholder: "v1",
      saveButton: "Save",
      saving: "Saving...",
      saved: "Saved",
    },

    // ── Settings — DangerTab ───────────────────────────────────────────────────
    settingsDanger: {
      sectionTitle: "Danger zone",
      sectionSubtitle: "Irreversible actions. Proceed with caution.",
      transferTitle: "Transfer ownership",
      transferSubtitle: "Transfer this project to another user. You will become an editor.",
      transferPlaceholder: "New owner's email",
      transferButton: "Transfer",
      transferring: "Transferring...",
      transferDone: "Transfer request sent.",
      archiveTitle: "Archive project",
      archiveSubtitle: "The project will no longer be visible in the dashboard. This can be undone by an admin.",
      archiveConfirmLabel: "Type",
      archiveConfirmSuffix: "to confirm",
      archiveButton: "Archive",
    },

    // ── Panel — DetailPanel ────────────────────────────────────────────────────
    detailPanel: {
      namePlaceholder: "Page name",
      colorTooltip: "Color",
      defaultColor: "Default",
      sectionDescription: "Description",
      sectionEntryPoints: "Entry points",
      sectionZoning: "Zoning",
      sectionRationale: "Rationale",
      sectionNotes: "Notes",
      sectionCtas: "CTAs",
      sectionTags: "Tags",
      sectionSecondaryParents: "Secondary parents",
      sectionLinks: "Links",
      descriptionPlaceholder: "Page description...",
      rationalePlaceholder: "Why this page exists...",
      notesPlaceholder: "Internal notes, UX insights...",
      ctaPlaceholder: "Add a CTA...",
      tagPlaceholder: "Add a tag...",
      noDescription: "No description",
      noRationale: "Not filled in",
      noTags: "None",
      deleteButton: "Delete this page",
      deleteConfirm_withChildren_one: "Delete \"{{label}}\" and its {{count}} sub-page?",
      deleteConfirm_withChildren_other: "Delete \"{{label}}\" and its {{count}} sub-pages?",
      deleteConfirm_noChildren: "Delete \"{{label}}\"?",
      deleteAll: "Delete all",
      reparentChildren: "Move children up",
      unlinkTooltip: "Remove this link",
    },

    // ── PricingModal ───────────────────────────────────────────────────────────
    pricing: {
      label: "Pricing",
      title: "Buy once, own forever.",
      subtitle: "No subscription. The competition charges $15/month for less.",
      tabPlans: "Plans",
      tabCredits: "AI Credits",
      badgePopular: "Popular",
      currentPlan: "Current plan",
      buyButton: "Buy",
      priceOnce: "EUR, one-time",
      freeNote: "Free: 3 projects, 20 credits, watermark. No BYOK or MCP.",
      creditsUnit: "credits",
      fastCredit: "Fast = 1 credit",
      qualityCredit: "Quality = 3 credits",
      byokNote: "Paid plans include BYOK: plug your own API key and use AI without credits.",
    },
  },

  fr: {
    // ── AiBar ──────────────────────────────────────────────────────────────────
    aiBar: {
      toggleLabel: "Assistant IA",
      headerTitle: "Assistant IA",
      speedFast: "Rapide",
      speedQuality: "Qualité",
      speedFastTooltip: "Mode rapide (1 crédit)",
      speedQualityTooltip: "Mode qualité (3 crédits)",
      chatButton: "Chat",
      openChatTooltip: "Ouvrir le chat",
      inputPlaceholderSitemap: "Modifie l'arbo ou pose une question...",
      inputPlaceholderWireframe: "Décris les modifications du wireframe...",
      inputPlaceholderHeader: "Modifie le Header global...",
      inputPlaceholderFooter: "Modifie le Footer global...",
      sendHint: "Enter pour envoyer, Shift+Enter pour retour ligne",
      closeHint: "Esc pour fermer",
      targetLabel: "Cible :",
      targetPage: "Page",
      targetHeader: "Header",
      targetFooter: "Footer",
      responseLabel: "Réponse",
      creditsEmptyTitle: "Crédits épuisés",
      creditsEmptyDesc: "Recharge ou ajoute ta clé API.",
      creditsEmptyDescFree: "Recharge tes crédits pour continuer.",
      rechargeButton: "Recharger 4€",
      apiKeyButton: "Clé API",
      errorNetwork: "Erreur réseau",
      errorConnection: "Erreur de connexion",
      wireframeUpdated: "Wireframe mis à jour",
      wireframeGenerated: "Wireframe généré",
      globalHeaderUpdated: "Header global mis à jour",
      globalFooterUpdated: "Footer global mis à jour",
      generating: "Génération du wireframe...",
      modifCount_one: "{{count}} modif",
      modifCount_other: "{{count}} modifs",
      appliedFallback_one: "{{count}} modification appliquée",
      appliedFallback_other: "{{count}} modifications appliquées",
    },

    // ── Login ──────────────────────────────────────────────────────────────────
    login: {
      emailPlaceholder: "Email",
      passwordPlaceholder: "Mot de passe",
      submitButton: "Se connecter",
      noAccount: "Pas encore de compte ?",
      createAccount: "Créer un compte",
      resendVerification: "Renvoyer l'email de confirmation",
      resending: "Envoi en cours...",
      emailResent: "Email renvoyé ! Vérifiez votre boîte mail.",
      emailConfirmed: "Email confirmé ! Vous pouvez maintenant vous connecter.",
      errorInvalidCredentials: "Identifiants incorrects",
      errorConnection: "Erreur de connexion",
    },

    // ── Signup ─────────────────────────────────────────────────────────────────
    signup: {
      pageTitle: "Créer un compte",
      namePlaceholder: "Nom",
      emailPlaceholder: "Email",
      passwordPlaceholder: "Mot de passe (8 caractères min.)",
      submitButton: "Créer mon compte",
      alreadyAccount: "Déjà un compte ?",
      signIn: "Se connecter",
      backToLogin: "Retour au login",
      errorConnection: "Erreur de connexion",
      successDefault: "Compte créé. Vérifiez votre email.",
    },

    // ── Dashboard (app/page.tsx) ───────────────────────────────────────────────
    dashboard: {
      projectCounter_one: "{{count}}/{{max}} projet",
      projectCounter_other: "{{count}}/{{max}} projets",
      projectCounterUnlimited_one: "{{count}} projet",
      projectCounterUnlimited_other: "{{count}} projets",
      welcomeTitle: "Bienvenue sur arbo",
      welcomeSubtitle: "Créez votre première arborescence de site pour commencer.",
      recentProjects: "Projets récents",
      exampleLabel: "Exemple",
    },

    // ── Settings — SettingsClient ──────────────────────────────────────────────
    settings: {
      pageTitle: "Paramètres",
      backButton: "Retour",
      tabs: {
        general: "Général",
        wireframe: "Wireframes",
        ai: "Connecter une IA",
        members: "Membres",
        share: "Liens de partage",
        tokens: "Tokens IA",
        danger: "Zone danger",
      },
    },

    // ── Settings — GeneralTab ──────────────────────────────────────────────────
    settingsGeneral: {
      sectionTitle: "Informations générales",
      sectionSubtitle: "Paramètres de base du projet.",
      labelName: "Nom du projet",
      labelClient: "Client",
      labelVersion: "Version",
      labelAccent: "Couleur d'accent",
      labelCustomColor: "Couleur personnalisée",
      clientPlaceholder: "Nom du client",
      versionPlaceholder: "v1",
      saveButton: "Enregistrer",
      saving: "Enregistrement...",
      saved: "Enregistré",
    },

    // ── Settings — DangerTab ───────────────────────────────────────────────────
    settingsDanger: {
      sectionTitle: "Zone danger",
      sectionSubtitle: "Actions irréversibles. Procédez avec prudence.",
      transferTitle: "Transférer la propriété",
      transferSubtitle: "Transférez ce projet à un autre utilisateur. Vous deviendrez éditeur.",
      transferPlaceholder: "Email du nouveau propriétaire",
      transferButton: "Transférer",
      transferring: "Transfert en cours...",
      transferDone: "Demande de transfert envoyée.",
      archiveTitle: "Archiver le projet",
      archiveSubtitle: "Le projet ne sera plus visible dans le dashboard. Cette action peut être annulée par un administrateur.",
      archiveConfirmLabel: "Tapez",
      archiveConfirmSuffix: "pour confirmer",
      archiveButton: "Archiver",
    },

    // ── Panel — DetailPanel ────────────────────────────────────────────────────
    detailPanel: {
      namePlaceholder: "Nom de la page",
      colorTooltip: "Couleur",
      defaultColor: "Défaut",
      sectionDescription: "Description",
      sectionEntryPoints: "Points d'entrée",
      sectionZoning: "Zoning",
      sectionRationale: "Rationale",
      sectionNotes: "Notes",
      sectionCtas: "CTAs",
      sectionTags: "Tags",
      sectionSecondaryParents: "Parents secondaires",
      sectionLinks: "Liens",
      descriptionPlaceholder: "Description de la page...",
      rationalePlaceholder: "Pourquoi cette page existe...",
      notesPlaceholder: "Notes internes, insights UX...",
      ctaPlaceholder: "Ajouter un CTA...",
      tagPlaceholder: "Ajouter un tag...",
      noDescription: "Aucune description",
      noRationale: "Non renseigné",
      noTags: "Aucun",
      deleteButton: "Supprimer cette page",
      deleteConfirm_withChildren_one: "Supprimer « {{label}} » et sa {{count}} sous-page ?",
      deleteConfirm_withChildren_other: "Supprimer « {{label}} » et ses {{count}} sous-pages ?",
      deleteConfirm_noChildren: "Supprimer « {{label}} » ?",
      deleteAll: "Supprimer tout",
      reparentChildren: "Remonter les enfants",
      unlinkTooltip: "Supprimer ce lien",
    },

    // ── PricingModal ───────────────────────────────────────────────────────────
    pricing: {
      label: "Tarifs",
      title: "Achète une fois, garde pour toujours.",
      subtitle: "Pas d'abonnement. La concurrence facture 15$/mois pour moins.",
      tabPlans: "Plans",
      tabCredits: "Crédits IA",
      badgePopular: "Populaire",
      currentPlan: "Plan actuel",
      buyButton: "Acheter",
      priceOnce: "EUR, une fois",
      freeNote: "Free : 3 projets, 20 crédits, watermark. Pas de BYOK ni MCP.",
      creditsUnit: "crédits",
      fastCredit: "Rapide = 1 crédit",
      qualityCredit: "Qualité = 3 crédits",
      byokNote: "Les plans payants incluent le BYOK : branche ta propre clé API et utilise l'IA sans crédits.",
    },
  },
} as const

// ─── Type helpers ─────────────────────────────────────────────────────────────

type Translations = typeof translations.en

/**
 * Génère les clés en dot-notation pour 2 niveaux de profondeur.
 * Limité à 2 niveaux pour éviter "Type instantiation is excessively deep".
 * Les clés de settings.tabs sont incluses manuellement via le template literal.
 */
type LeafKeys<T extends Record<string, unknown>, Prefix extends string> = {
  [K in keyof T]: T[K] extends string ? `${Prefix}.${K & string}` : never
}[keyof T]

export type TranslationKey =
  | LeafKeys<Translations["aiBar"], "aiBar">
  | LeafKeys<Translations["login"], "login">
  | LeafKeys<Translations["signup"], "signup">
  | LeafKeys<Translations["dashboard"], "dashboard">
  | LeafKeys<Translations["settings"], "settings">
  | LeafKeys<Translations["settings"]["tabs"], "settings.tabs">
  | LeafKeys<Translations["settingsGeneral"], "settingsGeneral">
  | LeafKeys<Translations["settingsDanger"], "settingsDanger">
  | LeafKeys<Translations["detailPanel"], "detailPanel">
  | LeafKeys<Translations["pricing"], "pricing">
