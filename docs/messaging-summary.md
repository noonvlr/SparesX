# Messaging System Summary

- Messaging API and sockets are wired through `apps/api/src/server.ts`, including Mongo, Redis (optional), and JWT auth requirements.
- Reviewed messaging components: Mongoose models (`Chat`, `Message`), service layer (`chat-service.ts`), socket auth helpers, and Express routes (`chat`, stubbed `upload`).
- Messaging test suites pass via `pnpm --filter @sparesx/api test:messaging`, covering socket authentication and chat REST endpoints.
- Known gaps: upload route currently returns placeholder URLs until S3 integration is added, and delivered/seen message states are not yet implemented; ensure `JWT_SECRET`, `MONGO_URI`, and optional `REDIS_URL` are configured in production.
- Local development tip: set `SKIP_REDIS=true` if you don't have Redis running—queues are disabled but WebSocket chat remains available.

