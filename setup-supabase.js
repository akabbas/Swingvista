#!/usr/bin/env node

// Supabase Setup Helper Script
// This script will guide you through setting up Supabase for SwingVista

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🏌️  SwingVista Supabase Setup Helper\n');
  
  console.log('This script will help you configure Supabase for your SwingVista project.\n');
  
  console.log('📋 Prerequisites:');
  console.log('1. A Supabase account (create one at https://supabase.com)');
  console.log('2. A new Supabase project created\n');
  
  const hasProject = await question('Do you have a Supabase project ready? (y/n): ');
  
  if (hasProject.toLowerCase() !== 'y') {
    console.log('\n📝 Please follow these steps:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Click "New Project"');
    console.log('3. Enter project name: swingvista');
    console.log('4. Choose a strong database password');
    console.log('5. Select your preferred region');
    console.log('6. Click "Create new project"');
    console.log('7. Wait for the project to be created\n');
    
    const ready = await question('Press Enter when your project is ready...');
  }
  
  console.log('\n🔑 Now let\'s get your API credentials:');
  console.log('1. In your Supabase dashboard, go to Settings → API');
  console.log('2. Copy the Project URL and anon public key\n');
  
  const projectUrl = await question('Enter your Project URL (https://xxx.supabase.co): ');
  const anonKey = await question('Enter your anon public key: ');
  
  // Validate inputs
  if (!projectUrl.includes('supabase.co') || !anonKey.startsWith('eyJ')) {
    console.log('\n❌ Invalid credentials. Please check your inputs and try again.');
    process.exit(1);
  }
  
  // Create .env.local content
  const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${projectUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
`;
  
  // Write to .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Environment variables saved to .env.local');
  
  console.log('\n📊 Next, let\'s create the database table:');
  console.log('1. In your Supabase dashboard, go to SQL Editor');
  console.log('2. Click "New Query"');
  console.log('3. Copy and paste the contents of supabase-setup.sql');
  console.log('4. Click "Run" to execute the SQL');
  
  const tableCreated = await question('Have you created the table? (y/n): ');
  
  if (tableCreated.toLowerCase() !== 'y') {
    console.log('\n📄 Here\'s the SQL to run:');
    console.log('─'.repeat(50));
    const sqlContent = fs.readFileSync(path.join(process.cwd(), 'supabase-setup.sql'), 'utf8');
    console.log(sqlContent);
    console.log('─'.repeat(50));
    
    await question('Press Enter after running the SQL...');
  }
  
  console.log('\n🧪 Testing connection...');
  
  // Test the connection
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(projectUrl, anonKey);
    
    const { data, error } = await supabase
      .from('swings')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Connection test failed:', error.message);
      console.log('\n💡 Common issues:');
      console.log('- Make sure you ran the SQL script to create the table');
      console.log('- Check that your credentials are correct');
      console.log('- Ensure your project is active (not paused)');
    } else {
      console.log('✅ Connection successful!');
      console.log('📊 Found', data.length, 'records in the swings table');
    }
    
  } catch (err) {
    console.log('❌ Test failed:', err.message);
  }
  
  console.log('\n🎉 Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Visit: http://localhost:3000/api/test-supabase');
  console.log('3. Test the upload and camera pages');
  
  rl.close();
}

main().catch(console.error);
