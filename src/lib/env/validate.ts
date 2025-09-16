export interface EnvValidation {
  ok: boolean;
  missing: string[];
  warn: string[];
}

const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const RECOMMENDED = [
  'SUPABASE_SERVICE_ROLE',
  'OPENAI_API_KEY',
];

let loggedOnce = false;

export function validateEnv(): EnvValidation {
  const missing: string[] = [];
  const warn: string[] = [];

  for (const k of REQUIRED) if (!process.env[k]) missing.push(k);
  for (const k of RECOMMENDED) if (!process.env[k]) warn.push(k);

  const result = { ok: missing.length === 0, missing, warn };

  if (!loggedOnce) {
    loggedOnce = true;
    if (!result.ok) {
      console.warn('[ENV] Missing required environment variables:', missing);
    }
    if (warn.length) {
      console.warn('[ENV] Recommended (optional) variables missing:', warn);
    }
  }

  return result;
}
