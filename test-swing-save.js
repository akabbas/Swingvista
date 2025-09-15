#!/usr/bin/env node

// Test saving swing data to Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🏌️ Testing swing data save functionality...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSwingSave() {
  try {
    // Create a test swing record with all required fields
    const testSwing = {
      user_id: 'test-user-123',
      club: 'driver',
      source: 'camera',
      video_url: 'https://example.com/test-video.mp4',
      
      // Core metrics
      swing_plane_angle: 12.5,
      tempo_ratio: 2.8,
      hip_rotation: 45.2,
      shoulder_rotation: 90.1,
      impact_frame: 25,
      backswing_time: 0.8,
      downswing_time: 0.4,
      clubhead_speed: 95.5,
      swing_path: 5.2,
      
      // AI feedback
      overall_score: 'B',
      key_improvements: ['Work on hip rotation', 'Improve tempo consistency'],
      feedback: ['Good swing plane', 'Tempo could be more consistent'],
      
      // Report card
      report_card: {
        setup: { grade: 'B', tip: 'Good setup fundamentals' },
        grip: { grade: 'A', tip: 'Excellent grip position' },
        alignment: { grade: 'C', tip: 'Work on shoulder alignment' },
        rotation: { grade: 'B', tip: 'Good hip turn, improve shoulder turn' },
        impact: { grade: 'B', tip: 'Solid impact position' },
        followThrough: { grade: 'A', tip: 'Great finish position' },
        overall: { score: 'B', tip: 'Good swing overall, focus on alignment' }
      },
      
      // Technical data
      phases: [
        { name: 'setup', startFrame: 0, endFrame: 5, duration: 0.17 },
        { name: 'backswing', startFrame: 5, endFrame: 20, duration: 0.5 },
        { name: 'downswing', startFrame: 20, endFrame: 25, duration: 0.17 },
        { name: 'impact', startFrame: 25, endFrame: 26, duration: 0.03 },
        { name: 'followThrough', startFrame: 26, endFrame: 30, duration: 0.13 }
      ],
      
      trajectory_metrics: {
        totalDistance: 2.5,
        maxVelocity: 15.2,
        avgVelocity: 8.1,
        maxAcceleration: 45.3,
        avgAcceleration: 12.7,
        peakFrame: 24,
        smoothness: 0.85
      },
      
      swing_path_analysis: {
        clubheadPath: [],
        swingPlane: 12.5,
        pathConsistency: 0.78,
        insideOut: false,
        outsideIn: false,
        onPlane: true
      },
      
      // Metadata
      processing_time: 1500,
      frame_count: 30
    };
    
    console.log('📝 Saving test swing data...');
    
    const { data, error } = await supabase
      .from('swings')
      .insert([testSwing])
      .select();
    
    if (error) {
      console.error('❌ Save failed:', error.message);
      return false;
    }
    
    console.log('✅ Swing data saved successfully!');
    console.log('🆔 Record ID:', data[0].id);
    console.log('📊 Club:', data[0].club);
    console.log('📈 Overall Score:', data[0].overall_score);
    console.log('⏱️ Processing Time:', data[0].processing_time + 'ms');
    
    // Test retrieving the data
    console.log('\n📖 Testing data retrieval...');
    
    const { data: retrievedData, error: retrieveError } = await supabase
      .from('swings')
      .select('*')
      .eq('id', data[0].id)
      .single();
    
    if (retrieveError) {
      console.error('❌ Retrieve failed:', retrieveError.message);
      return false;
    }
    
    console.log('✅ Data retrieved successfully!');
    console.log('📊 Retrieved club:', retrievedData.club);
    console.log('📈 Retrieved score:', retrievedData.overall_score);
    console.log('🎯 Key improvements:', retrievedData.key_improvements);
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    
    const { error: deleteError } = await supabase
      .from('swings')
      .delete()
      .eq('id', data[0].id);
    
    if (deleteError) {
      console.warn('⚠️  Could not clean up test data:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

testSwingSave().then(success => {
  if (success) {
    console.log('\n🎉 All swing save tests passed!');
    console.log('✅ Supabase integration is fully functional!');
    console.log('\n🚀 You can now:');
    console.log('  • Upload videos and save swing data');
    console.log('  • Record camera sessions and store results');
    console.log('  • View saved swings in the comparison page');
    console.log('  • Access swing details and analysis');
  } else {
    console.log('\n💥 Tests failed. Please check the error messages above.');
  }
});
