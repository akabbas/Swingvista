#!/usr/bin/env node

// Fix Supabase table schema
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Fixing Supabase table schema...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTableSchema() {
  try {
    console.log('📋 The swings table exists but has the wrong schema.');
    console.log('We need to either:');
    console.log('1. Drop and recreate the table with the correct schema');
    console.log('2. Alter the existing table to add missing columns');
    console.log('3. Create a new table with a different name\n');
    
    console.log('🚨 IMPORTANT: This will affect any existing data!');
    console.log('Since this appears to be a new project, we recommend recreating the table.\n');
    
    console.log('📝 Please follow these steps in your Supabase dashboard:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Table Editor');
    console.log('4. Find the "swings" table');
    console.log('5. Click the dropdown menu and select "Delete table"');
    console.log('6. Confirm the deletion');
    console.log('7. Go to SQL Editor');
    console.log('8. Run the SQL from supabase-setup.sql\n');
    
    console.log('📄 SQL to run after deleting the table:');
    console.log('─'.repeat(60));
    
    const fs = require('fs');
    const sqlContent = fs.readFileSync('./supabase-setup.sql', 'utf8');
    console.log(sqlContent);
    console.log('─'.repeat(60));
    
    console.log('\n🔄 After running the SQL, test with: node test-supabase.js');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixTableSchema();
