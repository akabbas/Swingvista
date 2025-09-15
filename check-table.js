#!/usr/bin/env node

// Check Supabase table structure
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Checking Supabase table structure...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  try {
    // Try to get table info by attempting a simple select
    console.log('📊 Checking table structure...');
    
    const { data, error } = await supabase
      .from('swings')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accessing table:', error.message);
      
      if (error.message.includes('relation "swings" does not exist')) {
        console.log('\n💡 The swings table does not exist.');
        console.log('Please create it using the SQL in supabase-setup.sql');
      } else if (error.message.includes('column')) {
        console.log('\n💡 Table exists but has different columns.');
        console.log('The table may have been created with a different schema.');
      }
      
      return;
    }
    
    console.log('✅ Table exists and is accessible');
    console.log('📋 Sample record structure:');
    
    if (data.length > 0) {
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('📝 Table is empty (no records)');
      
      // Try to insert a minimal record to test the schema
      console.log('\n🧪 Testing insert with minimal data...');
      
      const testRecord = {
        club: 'driver',
        source: 'camera'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('swings')
        .insert([testRecord])
        .select();
      
      if (insertError) {
        console.log('❌ Insert failed:', insertError.message);
        console.log('\n💡 This suggests the table schema is different than expected.');
        console.log('Please check the table structure in your Supabase dashboard.');
      } else {
        console.log('✅ Insert successful!');
        console.log('📊 Created record:', insertData[0]);
        
        // Clean up
        await supabase
          .from('swings')
          .delete()
          .eq('id', insertData[0].id);
        
        console.log('🧹 Test record cleaned up');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkTable();
