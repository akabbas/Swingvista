# Environment Variables Reference (Secrets Not Included)

This document lists all environment variables used by SwingVista, where they are referenced in code, and how to set them safely.

Note: Do NOT commit real secret values to the repository. Set secrets in your local `.env.local` and in Railway Project Variables.

## OpenAI
- Key: `OPENAI_API_KEY`
- Used in:
  - `src/app/api/analyze-swing/route.ts` via `process.env.OPENAI_API_KEY`
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
- Used in:
  - `src/lib/supabase.ts`
  - `src/app/api/feedback/route.ts`
  - utility scripts in project root (e.g., `check-table.js`, `create-table.js`, tests)
- Purpose: Connects app and API routes to Supabase.
- Local setup (`.env.local`):
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  ```
- Railway: Add both as Project Variables.

## Optional/Recommended
- `NODE_ENV` (managed by framework)
- `NODE_OPTIONS` (set in Railway for memory tuning if needed)

## Files that mention or validate environment variables
- `src/app/api/analyze-swing/route.ts` (OpenAI)
- `src/lib/supabase.ts` (Supabase)
- `src/app/api/feedback/route.ts` (Supabase)
- `src/lib/environment.ts` (reads Supabase vars)
- `scripts/check-environment.js` (validates presence of Supabase vars)
- `docs/DEPLOYMENT.md`, `docs/API.md`, `SUPABASE_SETUP.md` (docs references)

## Local Development
1. Create a file named `.env.local` in the project root:
   ```bash
   OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
2. Restart `npm run dev`.

## Railway Deployment
- Add the following Project Variables in the Railway dashboard:
  - `OPENAI_API_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Do not commit secrets to the repo.

## Troubleshooting
- Build fails with OpenAI key error:
  - Ensure `OPENAI_API_KEY` exists in Railway. The API route now falls back safely if missing; if it still blocks, redeploy.
- Supabase not connecting:
  - Verify both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly.
