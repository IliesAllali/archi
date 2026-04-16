# Plan i18n Arbo (FR/EN)

*Date : 2026-04-15*

---

## Approche retenue

**Extension du pattern existant** (`landing-i18n.ts`) vers toute l'app.

Pas de next-intl, pas de routing locale (`/fr/`, `/en/`).

### Pourquoi

- Le segment `[project]` en premier niveau rend le routing locale trop couteux a migrer
- 95% de l'app est derriere auth, invisible pour Google
- Le pattern dictionnaire + `detectLocale()` est deja valide sur la landing
- Solo dev : pragmatisme > architecture enterprise

### Mecanisme

- Dictionnaires par domaine dans `lib/i18n/*.ts`
- Hook `useLocale()` + context React `LocaleContext`
- Detection : cookie `arbo_locale` > `navigator.language` > defaut `en`
- Persistence : cookie 1 an
- Switcher : toggle FR/EN dans le UserMenu + landing nav
- SEO landing : `<link rel="alternate" hreflang>` + query param `?hl=`

---

## Structure fichiers

```
lib/
  i18n.ts                      # Locale type, detectLocale(), setLocale(), LocaleContext
  i18n/
    common.ts                  # Boutons, erreurs, labels partages (~40 strings)
    landing.ts                 # Landing page (~100 strings, migre depuis landing-i18n.ts)
    auth.ts                    # Login, signup (~30 strings)
    dashboard.ts               # Home / liste projets (~10 strings)
    canvas.ts                  # Canvas, toolbar, AI bar (~25 strings)
    settings.ts                # 7 onglets settings (~50 strings)
    account.ts                 # Page compte (~60 strings)
    modals.ts                  # Pricing, NewProject, Share, Delete (~35 strings)
    panel.ts                   # DetailPanel, Annotations, EntryPoints, Zoning (~30 strings)
    comments.ts                # CommentsPanel, CommentOverlay, WireframeComments (~10 strings)
    wireframe.ts               # WireframeView, WireframeTab (~15 strings)
    shortcuts.ts               # ShortcutsOverlay (~12 strings)
    admin.ts                   # AdminClient (~20 strings)
    export.ts                  # ExportButton, PDF (~5 strings)

hooks/
  useLocale.ts                 # Hook : locale, setLocale, useT()

components/
  LocaleProvider.tsx           # Context provider (wraps app dans layout.tsx)
  LocaleSwitcher.tsx           # Toggle FR/EN
```

### Format des fichiers dictionnaire

```ts
import type { Locale } from "@/lib/i18n"

const strings = {
  en: {
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    // ...
  },
  fr: {
    cancel: "Annuler",
    save: "Enregistrer",
    delete: "Supprimer",
    // ...
  },
} as const

export type CommonStrings = typeof strings.en
export const get = (locale: Locale): CommonStrings => strings[locale]
```

### Usage dans un composant

```tsx
import { useT } from "@/hooks/useLocale"
import { get } from "@/lib/i18n/common"

function MyComponent() {
  const t = useT(get)
  return <button>{t.cancel}</button>
}
```

---

## Etapes de migration

### Etape 1 — Infra (5 fichiers)

| Action | Fichier | Type |
|--------|---------|------|
| Core i18n (type, detect, persist, context) | `lib/i18n.ts` | new |
| Hook useLocale + useT | `hooks/useLocale.ts` | new |
| Context provider | `components/LocaleProvider.tsx` | new |
| Language switcher | `components/LocaleSwitcher.tsx` | new |
| Wrap app dans le provider | `app/layout.tsx` | edit |

### Etape 2 — Landing (4 fichiers)

| Action | Fichier | Type |
|--------|---------|------|
| Migrer strings vers nouveau format | `lib/i18n/landing.ts` | new |
| Utiliser useLocale + useT | `app/landing/LandingClient.tsx` | edit |
| SEO hreflang + og:locale | `app/landing/page.tsx` | edit |
| Supprimer ancien fichier | `lib/landing-i18n.ts` | delete |

### Etape 3 — Auth (4 fichiers)

| Action | Fichier | Type |
|--------|---------|------|
| Strings auth | `lib/i18n/auth.ts` | new |
| Login | `app/login/page.tsx` | edit |
| Signup | `app/signup/page.tsx` | edit |
| Share access | `app/share/[token]/page.tsx` | edit |

### Etape 4 — Common + Dashboard (3 fichiers)

| Action | Fichier | Type |
|--------|---------|------|
| Strings partagees | `lib/i18n/common.ts` | new |
| Strings dashboard | `lib/i18n/dashboard.ts` | new |
| Dashboard | `app/page.tsx` | edit |

Note : `app/page.tsx` est un server component. Lire le cookie `arbo_locale` via `cookies()` de `next/headers`.

### Etape 5 — Canvas + toolbar (4 fichiers)

| Action | Fichier | Type |
|--------|---------|------|
| Strings canvas | `lib/i18n/canvas.ts` | new |
| Canvas page | `app/[project]/CanvasPage.tsx` | edit |
| AI bar | `components/AiBar.tsx` | edit |
| Save status | `components/SaveStatusBadge.tsx` | edit |

### Etape 6 — Modals (5 fichiers)

| Action | Fichier | Type |
|--------|---------|------|
| Strings modals | `lib/i18n/modals.ts` | new |
| New project | `components/NewProjectModal.tsx` | edit |
| Pricing | `components/PricingModal.tsx` | edit |
| Share | `components/ShareModal.tsx` | edit |
| Delete node | `components/DeleteNodeModal.tsx` | edit |

### Etape 7 — Settings (9 fichiers)

| Action | Fichier | Type |
|--------|---------|------|
| Strings settings | `lib/i18n/settings.ts` | new |
| Settings layout | `app/[project]/settings/SettingsClient.tsx` | edit |
| General | `app/[project]/settings/tabs/GeneralTab.tsx` | edit |
| Members | `app/[project]/settings/tabs/MembersTab.tsx` | edit |
| Share | `app/[project]/settings/tabs/ShareTab.tsx` | edit |
| Tokens | `app/[project]/settings/tabs/TokensTab.tsx` | edit |
| Danger | `app/[project]/settings/tabs/DangerTab.tsx` | edit |
| AI Connect | `app/[project]/settings/tabs/AiConnectTab.tsx` | edit |
| Wireframe | `app/[project]/settings/tabs/WireframeTab.tsx` | edit |

### Etape 8 — Panels (5 fichiers)

| Action | Fichier | Type |
|--------|---------|------|
| Strings panel | `lib/i18n/panel.ts` | new |
| Detail panel | `components/Panel/DetailPanel.tsx` | edit |
| Annotations | `components/Panel/AnnotationsPanel.tsx` | edit |
| Entry points | `components/Panel/EntryPointsBlock.tsx` | edit |
| Zoning editor | `components/Panel/ZoningEditor.tsx` | edit |

### Etape 9 — Comments + Wireframe (6 fichiers)

| Action | Fichier | Type |
|--------|---------|------|
| Strings comments | `lib/i18n/comments.ts` | new |
| Strings wireframe | `lib/i18n/wireframe.ts` | new |
| Comments panel | `components/CommentsPanel.tsx` | edit |
| Comment overlay | `components/CommentOverlay.tsx` | edit |
| Wireframe view | `components/Wireframe/WireframeView.tsx` | edit |
| Wireframe comments | `components/Wireframe/WireframeCommentsPanel.tsx` | edit |

### Etape 10 — Composants restants (7 fichiers)

| Action | Fichier | Type |
|--------|---------|------|
| UserMenu | `components/UserMenu.tsx` | edit |
| Shortcuts | `components/ShortcutsOverlay.tsx` | edit |
| Spotlight | `components/Spotlight.tsx` | edit |
| Export | `components/ExportButton.tsx` | edit |
| AI credits badge | `components/AiCreditsBadge.tsx` | edit |
| SiteNode tooltips | `components/Tree/SiteNode.tsx` | edit |
| Canvas | `components/Tree/Canvas.tsx` | edit |

### Etape 11 — Account (2 fichiers)

| Action | Fichier | Type |
|--------|---------|------|
| Strings account | `lib/i18n/account.ts` | new |
| Account page (50+ strings) | `app/account/AccountClient.tsx` | edit |

Note : le plus gros fichier a migrer (73KB). Faire par section (profil, plan, BYOK, MCP, equipe).

### Etape 12 — Admin + join (3 fichiers)

| Action | Fichier | Type |
|--------|---------|------|
| Strings admin | `lib/i18n/admin.ts` | new |
| Admin | `app/admin/AdminClient.tsx` | edit |
| Join | `app/join/page.tsx` | edit |

### Etape 13 — Erreurs API (6 fichiers)

Strategie : les routes API retournent des codes d'erreur, la traduction se fait cote client.

| Action | Fichier | Type |
|--------|---------|------|
| Map erreurs | `lib/i18n/api-errors.ts` | new |
| AI generate | `app/api/ai/generate/route.ts` | edit |
| AI edit | `app/api/ai/edit/route.ts` | edit |
| AI wireframe | `app/api/ai/wireframe/route.ts` | edit |
| AI copy | `app/api/ai/copy/route.ts` | edit |
| AI import | `app/api/ai/import/route.ts` | edit |

### Etape 14 — SEO + metadata (3 fichiers)

| Action | Fichier | Type |
|--------|---------|------|
| Metadata locale-aware | `app/layout.tsx` | edit |
| Landing hreflang + JSON-LD | `app/landing/page.tsx` | edit |
| Sitemap alternates | `app/sitemap.ts` | edit |

### Etape 15 — Dates et heures (3 fichiers)

Remplacer les `toLocaleDateString("fr-FR")` hardcodes par la locale dynamique.

| Action | Fichier | Type |
|--------|---------|------|
| AI bar timestamps | `components/AiBar.tsx` | edit |
| Account dates | `app/account/AccountClient.tsx` | edit |
| Activity panel | `components/ActivityPanel.tsx` | edit |

---

## Resume

| | Quantite |
|--|----------|
| Fichiers a creer | 17 |
| Fichiers a modifier | 52 |
| Total | 69 |
| Strings estimees | ~450 |
| Langues | FR (existant) + EN (a ecrire) |

## Points d'attention

1. **AccountClient.tsx** (73KB, 50+ strings) : le plus gros morceau, faire par section
2. **Server components** (`app/page.tsx`) : lire le cookie via `cookies()` de `next/headers`
3. **`<html lang>`** dans `layout.tsx` : lire le cookie server-side ou setter via `document.documentElement.lang` cote client
4. **Illustrations landing** : ont deja un prop `locale`, les brancher sur le systeme global
5. **Erreurs API** : retourner des codes, traduire cote client
6. **ZONING_SECTIONS** dans `SiteNode.tsx` : les labels sont en francais, a traduire aussi
