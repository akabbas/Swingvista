// Test Supabase Connection
// Run with: node test-supabase.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key present:', !!supabaseAnonKey);
console.log('Key length:', supabaseAnonKey?.length || 0);

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!');
  console.error('Please check your .env.local file and ensure both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
  process.exit(1);
}

if (supabaseUrl.includes('your-project-id') || supabaseAnonKey.includes('your-anon-key')) {
  console.error('❌ Environment variables contain placeholder values!');
  console.error('Please replace the placeholder values with your actual Supabase credentials.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('\n📡 Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('swings')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      
      if (error.message.includes('relation "swings" does not exist')) {
        console.error('\n💡 The "swings" table does not exist.');
        console.error('Please run the SQL script in supabase-setup.sql in your Supabase SQL Editor.');
      } else if (error.message.includes('JWT')) {
        console.error('\n💡 Authentication error. Please check your anon key.');
      } else if (error.message.includes('Invalid API key')) {
        console.error('\n💡 Invalid API key. Please check your NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      }
      
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('📊 Sample data:', data);
    console.log('📈 Records found:', data.length);
    
    // Test insert operation
    console.log('\n📝 Testing insert operation...');
    const testSwing = {
      user_id: 'test-user',
      club: 'driver',
      source: 'camera',
      swing_plane_angle: 10.5,
      tempo_ratio: 2.5,
      hip_rotation: 40.0,
      shoulder_rotation: 85.0,
      impact_frame: 20,
      backswing_time: 0.8,
      downswing_time: 0.4,
      overall_score: 'B',
      key_improvements: ['Test improvement'],
      feedback: ['Test feedback'],
      processing_time: 1000,
      frame_count: 25
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('swings')
      .insert([testSwing])
      .select();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError.message);
      return false;
    }
    
    console.log('✅ Insert operation successful!');
    console.log('🆔 Created record ID:', insertData[0].id);
    
    // Clean up test record
    const { error: deleteError } = await supabase
      .from('swings')
      .delete()
      .eq('id', insertData[0].id);
    
    if (deleteError) {
      console.warn('⚠️  Could not clean up test record:', deleteError.message);
    } else {
      console.log('🧹 Test record cleaned up successfully');
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  if (success) {
    console.log('\n🎉 All tests passed! Supabase is properly configured.');
    process.exit(0);
  } else {
    console.log('\n💥 Tests failed. Please fix the issues above.');
    process.exit(1);
  }
});

