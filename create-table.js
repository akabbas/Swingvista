#!/usr/bin/env node

// Create Supabase table using REST API
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🏗️  Creating Supabase table...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  try {
    console.log('📋 Creating swings table...');
    
    // First, let's check if the table exists
    const { data: existingData, error: checkError } = await supabase
      .from('swings')
      .select('*')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Table already exists!');
      return true;
    }
    
    console.log('❌ Table does not exist. Please create it manually in Supabase dashboard.');
    console.log('\n📝 Follow these steps:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Click "New Query"');
    console.log('5. Copy and paste the SQL from supabase-setup.sql');
    console.log('6. Click "Run"');
    
    console.log('\n📄 SQL to run:');
    console.log('─'.repeat(60));
    
    const fs = require('fs');
    const sqlContent = fs.readFileSync('./supabase-setup.sql', 'utf8');
    console.log(sqlContent);
    console.log('─'.repeat(60));
    
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

createTable().then(success => {
  if (success) {
    console.log('\n🎉 Table setup complete!');
    console.log('Run: node test-supabase.js');
  } else {
    console.log('\n💡 After creating the table, run: node test-supabase.js');
  }
});

