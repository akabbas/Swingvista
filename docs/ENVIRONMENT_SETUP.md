# SwingVista Environment Setup

Follow these steps to configure keys securely for local and Railway.

## 1) Create `.env.local`
Copy values from your providers and paste locally:

```bash
OPENAI_API_KEY=your-openai-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable
SUPABASE_SERVICE_ROLE=your-service-role
```

Ensure `.env.local` is not committed.

## 2) Add Project Variables on Railway
- OPENAI_API_KEY
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE

## 3) What each key is used for
- OPENAI_API_KEY: Server-only; used in `src/lib/openai/index.ts` and API routes for AI analysis.
- NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY: Client-safe; used by browser Supabase client.
- SUPABASE_SERVICE_ROLE: Server-only; used by server Supabase client for privileged ops.

## 4) Security best practices
- Never commit keys. Use env vars only.
- Client-side uses anon/publishable key only.
- Server routes use service role.
- Rotate keys if accidentally exposed.

## 5) Troubleshooting
- Build fails with OpenAI key missing: AI route falls back, but set key in Railway for full features.
- Supabase access denied: Confirm RLS policies and that correct keys are set.
- Key exposure on commit: pre-commit hook blocks with details; remove and re-commit.
