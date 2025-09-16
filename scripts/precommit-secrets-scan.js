#!/usr/bin/env node
/*
  Simple secrets scanner for staged files.
  Blocks commit if patterns resembling API keys are detected.
*/

const { execSync } = require('child_process');

const patterns = [
  /sk-[a-zA-Z0-9_\-]{20,}/g,                // common OpenAI style keys
  /(eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/g, // JWT-like
  /sb_secret_[A-Za-z0-9_\-]{10,}/g,         // supabase secret
  /service_role/gi,
  /SUPABASE_SERVICE_ROLE=.+/g,
];

function getStagedDiff() {
  try {
    return execSync('git diff --cached -U0', { encoding: 'utf8' });
  } catch {
    return '';
  }
}

function scan(diff) {
  const hits = [];
  for (const rx of patterns) {
    const match = diff.match(rx);
    if (match) hits.push({ pattern: rx.toString(), samples: match.slice(0, 3) });
  }
  return hits;
}

const diff = getStagedDiff();
const hits = scan(diff);

if (hits.length > 0) {
  console.error('\n❌ Potential secrets detected in staged changes:');
  for (const h of hits) {
    console.error(`- Pattern ${h.pattern}:`, h.samples);
  }
  console.error('\nAbort commit. Remove secrets or move them to environment variables.');
  process.exit(1);
}

process.exit(0);
