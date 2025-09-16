# Environment Variables Reference (Secrets Not Included)

This document lists all environment variables used by SwingVista, where they are referenced in code, and how to set them safely.

Note: Do NOT commit real secret values to the repository. Set secrets in your local `.env.local` and in Railway Project Variables.

## OpenAI
- Key: `OPENAI_API_KEY`
- Used in:
  - `src/app/api/analyze-swing/route.ts` via `process.env.OPENAI_API_KEY`
  - `src/lib/openai/index.ts` lazy client
- Purpose: Enables AI feedback generation (`gpt-4o-mini`).
- Local setup (`.env.local`):
  ```bash
  OPENAI_API_KEY=your_openai_api_key
  ```
- Railway: Add a Project Variable named `OPENAI_API_KEY`.
- Behavior if missing: API will return a heuristic fallback response (build-safe).

## Supabase
- Keys:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE` (server-only, optional but recommended)
- Used in:
  - `src/lib/supabase/client.ts` (anon/publishable only)
  - `src/lib/supabase/server.ts` (service role preferred)
  - `src/app/api/feedback/route.ts`
- Purpose: Connects app and API routes to Supabase.
- Local setup (`.env.local`):
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
  SUPABASE_SERVICE_ROLE=your-service-role-key
  ```
- Railway: Add all three as Project Variables.

## Optional/Recommended
- `NODE_ENV` (managed by framework)
- `NODE_OPTIONS` (set in Railway for memory tuning if needed)

## Files that mention or validate environment variables
- `src/app/api/analyze/route.ts`
- `src/app/api/analyze-swing/route.ts`
- `src/app/api/feedback/route.ts`
- `src/lib/openai/index.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `scripts/check-env.ts`

## Local Development
1. Create a file named `.env.local` in the project root:
   ```bash
   OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE=your-service-role-key
   ```
2. Restart `npm run dev`.

## Railway Deployment
- Add the following Project Variables in the Railway dashboard:
  - `OPENAI_API_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE`
- Do not commit secrets to the repo.

## Pre-commit secrets scan
- `scripts/precommit-secrets-scan.js` blocks commits if likely secrets are staged.

## Environment validation
- `scripts/check-env.ts` can be used at startup to validate configuration.
