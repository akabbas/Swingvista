const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const recommended = [
  'OPENAI_API_KEY',
  'SUPABASE_SERVICE_ROLE',
];

export function validateEnv(): { ok: boolean; missing: string[]; warn: string[] } {
  const missing: string[] = [];
  const warn: string[] = [];

  for (const k of required) {
    if (!process.env[k]) missing.push(k);
  }
  for (const k of recommended) {
    if (!process.env[k]) warn.push(k);
  }

  return { ok: missing.length === 0, missing, warn };
}
