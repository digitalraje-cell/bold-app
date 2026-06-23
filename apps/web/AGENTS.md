<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Bold web app — cross-surface rules

- **PWA / browser parity:** See [`docs/PWA_ARCHITECTURE.md`](../../docs/PWA_ARCHITECTURE.md).
- **Meeting features:** Implement once in `components/meeting/*` and shared hooks. Test in **browser, desktop PWA, and mobile PWA** unless explicitly documented otherwise.
- **Platform detection:** Use `@boldmeet/shared` (`pwa/runtime.ts`) — do not duplicate UA or `display-mode` checks.
