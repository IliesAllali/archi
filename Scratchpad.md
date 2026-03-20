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

## Sprint 5 — Back office + auth + MCP + compte ✅ IMPLÉMENTÉ (2026-03-20)

### Auth multi-utilisateurs
- `app/login/page.tsx` — email + password login
- `app/signup/page.tsx` — inscription, premier user auto-admin
- `app/api/auth/register/route.ts` — auto-verify premier user
- `middleware.ts` — auth tri-couche + CSRF bypass `/api/mcp`

### Settings projet (6 onglets)
- `app/[project]/settings/` — GeneralTab, AiConnectTab, MembersTab, ShareTab, TokensTab, DangerTab
- SettingsClient lit `?tab=` depuis l'URL

### MCP Server
- `app/api/mcp/route.ts` — Streamable HTTP stateless, 7 outils
- Auth Bearer token (ai_tokens, SHA-256)
- `@modelcontextprotocol/sdk` + `zod`

### Partage guest
- `app/share/[token]/page.tsx` — accès lien + password
- `app/api/share/resolve/route.ts` + `verify/route.ts`

### Onboarding nouveau projet
- `components/NewProjectModal.tsx` — "Demander à mon IA" ou "Projet vide", rendu via createPortal

### Menu utilisateur + compte
- `components/UserMenu.tsx` — avatar, dropdown, logout
- `app/account/` — profil + clés API (OpenAI, Anthropic, Mistral)
- `app/api/me/` — profil + CRUD clés API
- Table `user_api_keys`

### Fixes
- Unicode escapes → UTF-8 dans tous les fichiers settings/components
- Wireframe off par défaut (home inclus), uniquement quand zoningExpanded=true
- Modal z-index via createPortal
- Cookie CSRF ajouté sur auth legacy

### Prochain : Sprint 6 — API REST publique /api/v1/
