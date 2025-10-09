## Quick context (what this service is)

Small Express + Firebase middleware that sends FCM pushes and stores device tokens in MySQL via Prisma. Key responsibilities:
- Receive/record FCM tokens (/dbUpdate)
- Send incoming-call notifications (/firebaseDataPush)

Primary files to inspect: `src/server.ts`, `src/routes/dbUpdate.routes.ts`, `src/routes/firebaseDataPush.routes.ts`, `src/services/db.service.ts`, `prisma/schema.prisma`, and the `dockerfile`.

## Big-picture architecture

- HTTP API (Express) exposes two mounted routers: `/dbUpdate` and `/firebaseDataPush` (see `src/server.ts`).
- Persistence: Prisma (MySQL) model `FcmToken` mapped to table `fcm_tokens` (see `prisma/schema.prisma`).
- Notification delivery: `firebase-admin` is initialized from a JSON service account provided via the environment variable `FIREBASE_ADMIN_CREDENTIALS`.
- Generated Prisma client is configured to output into `src/generated/prisma` (generator block in `schema.prisma`).

Why things are structured this way (observed): single-purpose small service that acts as a hub — it keeps device tokens (one per usuarioID) and forwards minimal push payloads to Firebase.

## Contracts / shapes (use these exactly)

- POST /dbUpdate
  - Body: { usuarioID: string, token: string, type: 'Android'|'IOS' }
  - Success: 200 { success: true, message }
  - Errors: 400 for missing fields, 500 for DB failures

- POST /firebaseDataPush
  - Body: { usuarioID_destino: string, usuarioID_origem: string, caller_name?: string }
  - Behavior: looks up recipient token via `getTokenFromDB`, builds an `admin.messaging.Message` and calls `admin.messaging().send(...)`.

## Important environment variables

- FIREBASE_ADMIN_CREDENTIALS - required. Must be the JSON string of a Firebase service account (the code calls JSON.parse on the env value). Example for local dev:

```bash
export FIREBASE_ADMIN_CREDENTIALS="$(cat serviceAccountKey.json)"
```

- DATABASE_URL - required by Prisma (mysql connection string).

Note: `src/server.ts` will throw immediately if `FIREBASE_ADMIN_CREDENTIALS` is not set.

## Dev / build / run notes (concrete)

- Development (hot/simple):

```bash
npm run dev
```

- Production start (expects compiled JS in `dist`):

```bash
# build (project currently has no "build" script in package.json) -> use tsc
npx tsc
npm start
```

- Dockerfile (multi-stage) expects `npm run build` and runs `npx prisma generate` during the image build. There is a mismatch: package.json currently contains no `build` script but Dockerfile calls `npm run build`. CI/PR workflows or local Docker builds should ensure compilation (`tsc`) happens or add a `build` script that runs `tsc`.

## Prisma and DB notes

- Model: `model FcmToken` with primary key `usuarioID` (mapped to `fcm_tokens`). Code uses `prisma.fcmToken.upsert` and `findUnique`.
- Generated client output is `src/generated/prisma`—make sure `npx prisma generate` runs after installing dependencies and before running compiled code that imports Prisma.

## Firebase usage patterns & gotchas

- `admin.messaging().send(message)` is used; message token comes from DB. The code only sets `android` options for Android tokens; iOS (APNs) stanza is present but commented out.
- Error handling: Firebase error codes are logged; there are commented lines suggesting removing invalid tokens on specific firebase error codes (e.g., `messaging/unregistered`) — expect to implement token cleanup by calling `deleteTokenFromDB` on those error codes if desired.

## Logging and conventions

- Logs use prefixed tags to ease grepping: e.g., `[PRISMA SUCESSO]`, `[PRISMA ERRO]`, `[PUSH SUCESSO]`, `[ERRO FCM]`, `[ERRO DB]`.
- Follow those tags when writing new logs to keep consistency.

## Where automated changes are likely needed

- Add a `build` script to `package.json` (e.g., `"build": "tsc"`) so Dockerfile and CI do not silently fail.
- Ensure `npx prisma generate` runs in build pipelines (Dockerfile already does this in the builder stage).

## Quick examples (curl)

- Register/update token:

```bash
curl -X POST http://localhost:3000/dbUpdate -H 'Content-Type: application/json' \
  -d '{"usuarioID":"user123","token":"abc...","type":"Android"}'
```

- Send incoming call notification:

```bash
curl -X POST http://localhost:3000/firebaseDataPush -H 'Content-Type: application/json' \
  -d '{"usuarioID_destino":"user456","usuarioID_origem":"user123","caller_name":"Joao"}'
```

## Files to open first when changing behavior

- `src/services/db.service.ts` - Prisma usage, CRUD for tokens
- `src/routes/firebaseDataPush.routes.ts` - FCM payload construction and send flow
- `src/routes/dbUpdate.routes.ts` - is the thin validation/entrypoint for token registration

If anything here is unclear or you'd like me to add examples for CI, a suggested `package.json` change, or a PR that adds the missing `build` script and a minimal GitHub Action, tell me which and I'll iterate.
