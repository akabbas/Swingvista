#!/usr/bin/env node

// Inspect existing Supabase table structure
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Inspecting existing swings table...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
  try {
    // Check if table exists and get basic info
    console.log('📊 Checking table existence...');
    
    const { data, error } = await supabase
      .from('swings')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accessing table:', error.message);
      return;
    }
    
    console.log('✅ Table exists and is accessible');
    
    // Try to get table structure by attempting different column queries
    console.log('\n🔍 Testing column structure...');
    
    const columnsToTest = [
      'id', 'user_id', 'club', 'source', 'video_url',
      'swing_plane_angle', 'tempo_ratio', 'hip_rotation', 
      'shoulder_rotation', 'impact_frame', 'backswing_time',
      'downswing_time', 'clubhead_speed', 'swing_path',
      'overall_score', 'key_improvements', 'feedback',
      'report_card', 'phases', 'trajectory_metrics',
      'swing_path_analysis', 'processing_time', 'frame_count',
      'created_at', 'updated_at'
    ];
    
    const existingColumns = [];
    const missingColumns = [];
    
    for (const column of columnsToTest) {
      try {
        const { error: colError } = await supabase
          .from('swings')
          .select(column)
          .limit(1);
        
        if (colError) {
          missingColumns.push(column);
        } else {
          existingColumns.push(column);
        }
      } catch (err) {
        missingColumns.push(column);
      }
    }
    
    console.log('\n📋 EXISTING COLUMNS:');
    existingColumns.forEach(col => console.log(`  ✅ ${col}`));
    
    console.log('\n❌ MISSING COLUMNS:');
    missingColumns.forEach(col => console.log(`  ❌ ${col}`));
    
    // Check if we have any data
    const { data: allData, error: countError } = await supabase
      .from('swings')
      .select('*');
    
    if (!countError) {
      console.log(`\n📊 Total records: ${allData.length}`);
      
      if (allData.length > 0) {
        console.log('\n📝 Sample record structure:');
        console.log(JSON.stringify(allData[0], null, 2));
      }
    }
    
    // Provide recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (missingColumns.length === 0) {
      console.log('✅ Table has all required columns! No changes needed.');
    } else if (missingColumns.length < 5) {
      console.log('⚠️  Table is missing a few columns. Consider using ALTER TABLE to add them.');
      console.log('📝 Missing columns:', missingColumns.join(', '));
    } else {
      console.log('❌ Table is missing many required columns. Consider recreating the table.');
      console.log('📝 Missing columns:', missingColumns.join(', '));
    }
    
    if (allData && allData.length > 0) {
      console.log('\n⚠️  WARNING: Table contains data. Any destructive changes will lose this data.');
      console.log('💾 Consider backing up data before making changes.');
    } else {
      console.log('\n✅ Table is empty. Safe to recreate without data loss.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

inspectTable();
