# Clash IQ – optimization notes

## Fixed
- **Build blocker**: `routes/index.ts` imported `./ai-coach.ts`; `pnpm build` runs `tsc` first and rejects `.ts` extensions (TS5097). Now `./ai-coach`.
- **Corrupt icon**: `clash_iq_icon_exact.jpg` was not a valid image, so the old APK workflow's `convert` step would fail. Removed; icons are now pre-generated in `android-app/resources/res` from the logo.
- Removed stale `v40final/` copy and stray root `war-planner.tsx`; moved old changelogs to `docs/`.

## Optimized
- Logo/banner PNG 3.4 MB -> WebP 166 KB.
- Route-level code splitting (`React.lazy`) + vendor chunks (react, recharts, framer-motion).
- Express: immutable cache for hashed `/assets`, no-cache for `index.html`.
- `index.html`: real description, theme-color, `viewport-fit=cover`, no longer indexable.

## APK
- New `android-app/` Capacitor shell (independent of the pnpm workspace) -> CI is much faster.
- Offline/cold-start page (`www/error.html`) with auto-retry.
- Workflow: Actions -> "Build Clash IQ APK" -> Run workflow (or push tag `apk-v1.1.0`).
- Output artifact: `Clash-IQ-<version>-debug` (installable debug APK).

## Still recommended
- `/clashiq-hero-barbarian.png` is referenced in `war-planner.tsx` but missing from `public/`.
- Render Free sleeps: first open in the app can take ~30-60 s. Use a paid instance or an uptime ping on `/api/health`.
- `/api/ai/*` and war-planner write routes are unauthenticated and CORS is open: add a shared secret or rate limit before sharing the URL widely.
- For Play Store: signed release build + AAB.
