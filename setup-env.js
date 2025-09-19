#!/usr/bin/env node

/**
 * Environment Setup Script for SwingVista
 * 
 * This script helps you set up the required environment variables
 * for the SwingVista golf analysis application.
 */

const fs = require('fs');
const path = require('path');

console.log('🏌️ SwingVista Environment Setup');
console.log('================================');

const envPath = path.join(__dirname, '.env.local');
const envExamplePath = path.join(__dirname, '.env.example');

// Check if .env.local already exists
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file already exists');
  console.log('📝 Current content:');
  console.log(fs.readFileSync(envPath, 'utf8'));
  console.log('');
  console.log('⚠️  If you need to update your OpenAI API key, edit .env.local manually');
  return;
}

// Create .env.example if it doesn't exist
if (!fs.existsSync(envExamplePath)) {
  const envExampleContent = `# OpenAI API Configuration
# Get your API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# Next.js Environment Variables
NEXT_PUBLIC_APP_NAME=SwingVista
NEXT_PUBLIC_APP_VERSION=1.0.0

# Development Settings
NODE_ENV=development`;

  fs.writeFileSync(envExamplePath, envExampleContent);
  console.log('✅ Created .env.example file');
}

// Create .env.local from template
const envContent = `# OpenAI API Configuration
# Get your API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# Next.js Environment Variables
NEXT_PUBLIC_APP_NAME=SwingVista
NEXT_PUBLIC_APP_VERSION=1.0.0

# Development Settings
NODE_ENV=development`;

fs.writeFileSync(envPath, envContent);
console.log('✅ Created .env.local file');
console.log('');
console.log('🔧 NEXT STEPS:');
console.log('1. Get your OpenAI API key from: https://platform.openai.com/api-keys');
console.log('2. Edit .env.local and replace "your_openai_api_key_here" with your actual API key');
console.log('3. Restart your development server: npm run dev');
console.log('');
console.log('⚠️  IMPORTANT: Never commit .env.local to version control!');
console.log('   It contains sensitive information like API keys.');
