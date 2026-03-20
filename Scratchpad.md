# Arbo — Scratchpad

## Sprint 2 — Édition Canvas ✅ IMPLÉMENTÉ (2026-03-16)

### Fichiers créés
- `store/canvas-store.ts` — Zustand + Immer store complet (nodes, undo/redo, auto-save 800ms, CRUD)
- `app/api/projects/[id]/nodes/sync/route.ts` — PUT endpoint full sync (auto-save target)
- `components/DeleteNodeModal.tsx` — modale suppression cascade/remonter
- `components/SaveStatusBadge.tsx` — indicateur sauvegarde dans la toolbar

### Fichiers modifiés
- `components/Tree/Canvas.tsx` — intégré le store Zustand, keyboard shortcuts (Tab/Enter/Delete/F2/Ctrl+Z/Y), double-click inline edit, drag reparent, Alt+drag duplicate, delete modal
- `components/Tree/SiteNode.tsx` — inline label editor, boutons "+" hover-reveal (enfant bas, sibling droite), gestion editing state
- `components/Panel/DetailPanel.tsx` — transformé en formulaire complet : label éditable, select type/priority/zoning, textarea description/rationale/notes, tag lists CTAs/tags avec ajout/suppression
- `app/[project]/CanvasPage.tsx` — intégré store init, auto-save setup, undo/redo buttons dans toolbar, SaveStatusBadge, live project data
- `app/api/projects/[id]/nodes/route.ts` — rewriten pour SQLite direct avec nanoid et sanitize
- `app/api/projects/[id]/nodes/[nodeId]/route.ts` — rewriten pour SQLite + soft delete

### Features implémentées
1. ✅ Double-clic inline label editing (Enter=valider, Escape=annuler)
2. ✅ Panel latéral éditable (type, priority, zoning selectors + textareas + tag lists)
3. ✅ Boutons "+" hover-reveal (bas=enfant, droite=sibling)
4. ✅ Keyboard shortcuts (Tab=enfant, Enter=sibling, Delete, F2=edit, Ctrl+Z/Y)
5. ✅ Modale suppression (cascade vs remonter enfants)
6. ✅ Drag reparent + Alt+drag duplication
7. ✅ Auto-save debounced 800ms via PUT /nodes/sync
8. ✅ Undo/redo stack (50 states max, Ctrl+Z/Ctrl+Y)
9. ✅ Error states (SaveStatusBadge: saved/saving/unsaved/error + retry)
10. ✅ Build vert

### Prochain : Sprint 3 — Version History

## Sprint 5 — Back office + onboarding ✅ IMPLÉMENTÉ (2026-03-20)

### Fichiers créés
- `app/[project]/settings/page.tsx` — Server component settings
- `app/[project]/settings/SettingsClient.tsx` — Client shell avec 5 tabs
- `app/[project]/settings/use-csrf.ts` — Helper CSRF partagé
- `app/[project]/settings/tabs/GeneralTab.tsx` — Nom, client, version, accent
- `app/[project]/settings/tabs/MembersTab.tsx` — Membres + invitations
- `app/[project]/settings/tabs/ShareTab.tsx` — Liens de partage (mdp, permissions, expiration)
- `app/[project]/settings/tabs/TokensTab.tsx` — Tokens IA (CRUD, reveal once)
- `app/[project]/settings/tabs/DangerTab.tsx` — Archive + transfert ownership
- `app/api/projects/[id]/members/route.ts` — GET/POST membres
- `app/api/projects/[id]/members/[userId]/route.ts` — PATCH/DELETE membre
- `app/api/projects/[id]/invitations/route.ts` — GET/POST/DELETE invitations
- `app/api/projects/[id]/share/route.ts` — GET/POST share links
- `app/api/projects/[id]/share/[linkId]/route.ts` — DELETE share link
- `app/api/projects/[id]/tokens/route.ts` — GET/POST AI tokens
- `app/api/projects/[id]/tokens/[tokenId]/route.ts` — DELETE (revoke) token
- `components/NewProjectButton.tsx` — Bouton "+" création projet

### Fichiers modifiés
- `app/page.tsx` — NewProjectButton + empty state amélioré
- `app/[project]/CanvasPage.tsx` — Icône settings dans header + bandeau mobile lecture seule
- `app/api/projects/route.ts` — POST avec session auth + noeud racine par défaut
- `app/api/projects/[id]/route.ts` — PUT/DELETE avec session auth

### Prochain : Sprint 6 — API IA
