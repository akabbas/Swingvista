#!/usr/bin/env node

/**
 * Environment Check Script
 * Validates environment configuration for both development and production
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env files
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.production' });
require('dotenv').config();

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, required = true) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✓' : (required ? '✗' : '○');
  const color = exists ? 'green' : (required ? 'red' : 'yellow');
  log(`${status} ${filePath}`, color);
  return exists;
}

function checkEnvironmentVariables() {
  log('\n🔍 Checking Environment Variables:', 'bright');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const optionalVars = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_APP_VERSION',
    'NODE_ENV'
  ];
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✓' : '✗';
    const color = value ? 'green' : 'red';
    const displayValue = value ? `${value.substring(0, 20)}...` : 'Not set';
    log(`${status} ${varName}: ${displayValue}`, color);
    if (!value) allPresent = false;
  });
  
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✓' : '○';
    const color = value ? 'green' : 'yellow';
    const displayValue = value || 'Not set';
    log(`${status} ${varName}: ${displayValue}`, color);
  });
  
  return allPresent;
}

function checkEnvironmentFiles() {
  log('\n📁 Checking Environment Files:', 'bright');
  
  const envFiles = [
    '.env.local',
    '.env.production',
    '.env.example'
  ];
  
  envFiles.forEach(file => {
    const isRequired = file === '.env.local';
    checkFile(file, isRequired);
  });
}

function checkSupabaseConnection() {
  log('\n🔗 Testing Supabase Connection:', 'bright');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    log('✗ Missing Supabase credentials', 'red');
    return false;
  }
  
  // Test connection by making a simple request
  return fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  })
  .then(response => {
    if (response.ok) {
      log('✓ Supabase connection successful', 'green');
      return true;
    } else {
      log(`✗ Supabase connection failed: ${response.status} ${response.statusText}`, 'red');
      return false;
    }
  })
  .catch(error => {
    log(`✗ Supabase connection error: ${error.message}`, 'red');
    return false;
  });
}

function checkBuildConfiguration() {
  log('\n🏗️ Checking Build Configuration:', 'bright');
  
  const configFiles = [
    'next.config.js',
    'config/tailwind.config.js',
    'tsconfig.json',
    'package.json'
  ];
  
  configFiles.forEach(file => {
    checkFile(file, true);
  });
  
  // Check if build directory exists
  checkFile('.next', false);
}

function checkDependencies() {
  log('\n📦 Checking Dependencies:', 'bright');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const nodeModulesExists = fs.existsSync('node_modules');
    
    log(`${nodeModulesExists ? '✓' : '✗'} node_modules directory`, nodeModulesExists ? 'green' : 'red');
    
    // Check for critical dependencies
    const criticalDeps = [
      'next',
      'react',
      'typescript',
      '@supabase/supabase-js'
    ];
    
    criticalDeps.forEach(dep => {
      const exists = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
      const status = exists ? '✓' : '✗';
      const color = exists ? 'green' : 'red';
      log(`${status} ${dep}: ${exists || 'Not found'}`, color);
    });
    
  } catch (error) {
    log(`✗ Error reading package.json: ${error.message}`, 'red');
  }
}

function generateEnvironmentReport() {
  log('\n📊 Environment Report:', 'bright');
  
  const environment = process.env.NODE_ENV || 'development';
  const isProduction = environment === 'production';
  
  log(`Environment: ${environment}`, isProduction ? 'green' : 'yellow');
  log(`Platform: ${process.platform}`, 'blue');
  log(`Node Version: ${process.version}`, 'blue');
  log(`Working Directory: ${process.cwd()}`, 'blue');
  
  return {
    environment,
    isProduction,
    platform: process.platform,
    nodeVersion: process.version,
    workingDirectory: process.cwd()
  };
}

async function main() {
  log('🚀 SwingVista Environment Check', 'bright');
  log('================================', 'bright');
  
  const report = generateEnvironmentReport();
  
  checkEnvironmentFiles();
  const envVarsOk = checkEnvironmentVariables();
  checkBuildConfiguration();
  checkDependencies();
  
  if (envVarsOk) {
    await checkSupabaseConnection();
  }
  
  log('\n📋 Summary:', 'bright');
  log('===========', 'bright');
  
  if (envVarsOk) {
    log('✓ Environment configuration looks good!', 'green');
    log('✓ Ready for development/production', 'green');
  } else {
    log('✗ Environment configuration issues found', 'red');
    log('✗ Please fix the issues above before proceeding', 'red');
    process.exit(1);
  }
  
  log('\n🎯 Next Steps:', 'bright');
  log('1. Run "npm run dev" for development', 'cyan');
  log('2. Run "npm run build" for production build', 'cyan');
  log('3. Run "npm test" to verify functionality', 'cyan');
}

// Run the check
main().catch(error => {
  log(`\n💥 Error during environment check: ${error.message}`, 'red');
  process.exit(1);
});
