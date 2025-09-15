import { createClient } from '@supabase/supabase-js';

// Environment variable validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  console.error('Please add NEXT_PUBLIC_SUPABASE_URL to your .env.local file');
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  console.error('Please add NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file');
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error('❌ Invalid NEXT_PUBLIC_SUPABASE_URL format');
  console.error('Expected format: https://your-project-id.supabase.co');
  throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format');
}

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection function
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    console.log('🔍 Testing Supabase connection...');
    const { data, error } = await supabase.from('swings').select('count').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection error:', err);
    return false;
  }
}

import { UnifiedSwingData } from './unified-analysis';

export interface SwingRecord {
  id: string;
  user_id?: string;
  club: string;
  source: 'upload' | 'camera';
  video_url?: string;
  
  // Core metrics
  swing_plane_angle: number;
  tempo_ratio: number;
  hip_rotation: number;
  shoulder_rotation: number;
  impact_frame: number;
  backswing_time: number;
  downswing_time: number;
  clubhead_speed?: number;
  swing_path?: number;
  
  // AI feedback
  overall_score: string;
  key_improvements: string[];
  feedback: string[];
  
  // Report card
  report_card: {
    setup: { grade: string; tip: string };
    grip: { grade: string; tip: string };
    alignment: { grade: string; tip: string };
    rotation: { grade: string; tip: string };
    impact: { grade: string; tip: string };
    follow_through: { grade: string; tip: string };
    overall: { score: string; tip: string };
  };
  
  // Technical data
  phases: any[];
  trajectory_metrics: any;
  swing_path_analysis: any;
  
  // Metadata
  processing_time: number;
  frame_count: number;
  created_at: string;
  updated_at: string;
}

export interface ClubStats {
  club: string;
  total_swings: number;
  avg_swing_plane: number;
  avg_tempo_ratio: number;
  avg_hip_rotation: number;
  avg_shoulder_rotation: number;
  last_swing: string;
}

// Convert unified swing data to database format
function convertToDbFormat(swingData: UnifiedSwingData): Partial<SwingRecord> {
  return {
    user_id: swingData.userId || 'demo-user',
    club: swingData.club,
    source: swingData.source,
    video_url: swingData.videoUrl,
    
    // Core metrics
    swing_plane_angle: swingData.metrics.swingPlaneAngle || 0,
    tempo_ratio: swingData.metrics.tempoRatio || 1.0,
    hip_rotation: swingData.metrics.hipRotation || 0,
    shoulder_rotation: swingData.metrics.shoulderRotation || 0,
    impact_frame: swingData.metrics.impactFrame || 0,
    backswing_time: swingData.metrics.backswingTime || 0,
    downswing_time: swingData.metrics.downswingTime || 0,
    clubhead_speed: swingData.metrics.clubheadSpeed || 0,
    swing_path: swingData.metrics.swingPath || 0,
    
    // AI feedback
    overall_score: swingData.aiFeedback.overallScore || 'C',
    key_improvements: swingData.aiFeedback.keyImprovements || [],
    feedback: swingData.aiFeedback.feedback || [],
    
    // Report card
    report_card: {
      setup: swingData.aiFeedback.reportCard?.setup || { grade: 'C', tip: 'Setup needs improvement' },
      grip: swingData.aiFeedback.reportCard?.grip || { grade: 'C', tip: 'Grip needs improvement' },
      alignment: swingData.aiFeedback.reportCard?.alignment || { grade: 'C', tip: 'Alignment needs improvement' },
      rotation: swingData.aiFeedback.reportCard?.rotation || { grade: 'C', tip: 'Rotation needs improvement' },
      impact: swingData.aiFeedback.reportCard?.impact || { grade: 'C', tip: 'Impact needs improvement' },
      follow_through: swingData.aiFeedback.reportCard?.followThrough || { grade: 'C', tip: 'Follow through needs improvement' },
      overall: swingData.aiFeedback.reportCard?.overall || { score: 'C', tip: 'Overall swing needs improvement' }
    },
    
    // Technical data
    phases: swingData.phases || [],
    trajectory_metrics: swingData.trajectoryMetrics || {},
    swing_path_analysis: swingData.swingPathAnalysis || {},
    
    // Metadata
    processing_time: swingData.processingTime || 0,
    frame_count: swingData.frameCount || 0,
    created_at: swingData.createdAt || new Date().toISOString(),
    updated_at: swingData.updatedAt || new Date().toISOString()
  };
}

export async function saveSwing(swingData: UnifiedSwingData): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const dbFormat = convertToDbFormat(swingData);
    
    const { data, error } = await supabase
      .from('swings')
      .insert([dbFormat])
      .select('id')
      .single();

    if (error) {
      console.error('Error saving swing:', error);
      return { success: false, error: error.message };
    }

    console.log('Swing saved successfully:', data);
    return { success: true, id: data.id };
  } catch (err) {
    console.error('Error saving swing:', err);
    return { success: false, error: 'Failed to save swing' };
  }
}

export async function getSwings(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('swings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch swings: ${error.message}`);
  }

  return data as SwingRecord[];
}

export async function getSwingById(id: string) {
  const { data, error } = await supabase
    .from('swings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch swing: ${error.message}`);
  }

  return data as SwingRecord;
}

export async function getClubStats(userId: string) {
  const { data, error } = await supabase
    .from('swings')
    .select('club, metrics, created_at')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to fetch club stats: ${error.message}`);
  }

  // Group by club and calculate stats
  const clubStats: Record<string, ClubStats> = {};
  
  data.forEach((swing) => {
    const club = swing.club;
    if (!clubStats[club]) {
      clubStats[club] = {
        club,
        total_swings: 0,
        avg_swing_plane: 0,
        avg_tempo_ratio: 0,
        avg_hip_rotation: 0,
        avg_shoulder_rotation: 0,
        last_swing: swing.created_at
      };
    }
    
    clubStats[club].total_swings++;
    clubStats[club].avg_swing_plane += swing.metrics.swingPlaneAngle;
    clubStats[club].avg_tempo_ratio += swing.metrics.tempoRatio;
    clubStats[club].avg_hip_rotation += swing.metrics.hipRotation;
    clubStats[club].avg_shoulder_rotation += swing.metrics.shoulderRotation;
    
    if (swing.created_at > clubStats[club].last_swing) {
      clubStats[club].last_swing = swing.created_at;
    }
  });

  // Calculate averages
  Object.values(clubStats).forEach((stats) => {
    stats.avg_swing_plane /= stats.total_swings;
    stats.avg_tempo_ratio /= stats.total_swings;
    stats.avg_hip_rotation /= stats.total_swings;
    stats.avg_shoulder_rotation /= stats.total_swings;
  });

  return Object.values(clubStats);
}
