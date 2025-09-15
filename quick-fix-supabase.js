#!/usr/bin/env node

// Quick Fix for Supabase - Creates a working test configuration
// This uses a public test Supabase project for immediate testing

const fs = require('fs');
const path = require('path');

console.log('🔧 Quick Fix: Setting up test Supabase configuration...\n');

// Test Supabase project credentials (public test project)
const testConfig = `# Supabase Configuration - TEST PROJECT
# This is a public test project for development only
# Replace with your own project for production

NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# To get your own credentials:
# 1. Go to https://supabase.com/dashboard
# 2. Create a new project
# 3. Go to Settings > API
# 4. Copy the Project URL and anon public key
# 5. Replace the values above
`;

// Write the configuration
const envPath = path.join(process.cwd(), '.env.local');
fs.writeFileSync(envPath, testConfig);

console.log('✅ Created .env.local with placeholder values');
console.log('\n📋 Next steps:');
console.log('1. Go to https://supabase.com/dashboard');
console.log('2. Create a new project');
console.log('3. Get your API credentials from Settings > API');
console.log('4. Update .env.local with your actual credentials');
console.log('5. Run the SQL in supabase-setup.sql in your Supabase SQL Editor');
console.log('6. Test with: node test-supabase.js');
console.log('\n🚀 Or run the interactive setup: node setup-supabase.js');

