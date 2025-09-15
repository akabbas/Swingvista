import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UnifiedSwingData } from './unified-analysis';

let supabase: SupabaseClient | null = null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

try {
  if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://')) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    console.warn('Supabase env missing or invalid. Database features disabled in this environment.');
  }
} catch (e) {
  console.warn('Failed to initialize Supabase client; running without DB.', e);
}

export async function saveSwing(swingData: UnifiedSwingData): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!supabase) {
    console.warn('Supabase not configured; skipping saveSwing.');
    return { success: true };
  }
  try {
    const dbFormat = convertToDbFormat(swingData);
    const { data, error } = await supabase
      .from('swings')
      .insert([dbFormat])
      .select('id')
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, id: (data as any).id };
  } catch {
    return { success: false, error: 'Failed to save swing' };
  }
}

function convertToDbFormat(swingData: UnifiedSwingData): any {
  return {
    user_id: swingData.userId || 'demo-user',
    club: swingData.club,
    source: swingData.source,
    video_url: swingData.videoUrl,
    swing_plane_angle: swingData.metrics.swingPlaneAngle || 0,
    tempo_ratio: swingData.metrics.tempoRatio || 1.0,
    hip_rotation: swingData.metrics.hipRotation || 0,
    shoulder_rotation: swingData.metrics.shoulderRotation || 0,
    impact_frame: swingData.metrics.impactFrame || 0,
    backswing_time: swingData.metrics.backswingTime || 0,
    downswing_time: swingData.metrics.downswingTime || 0,
    clubhead_speed: swingData.metrics.clubheadSpeed || 0,
    swing_path: swingData.metrics.swingPath || 0,
    overall_score: swingData.aiFeedback.overallScore || 'C',
    key_improvements: swingData.aiFeedback.keyImprovements || [],
    feedback: swingData.aiFeedback.feedback || [],
    report_card: swingData.aiFeedback.reportCard,
    phases: swingData.phases || [],
    trajectory_metrics: swingData.trajectoryMetrics || {},
    swing_path_analysis: swingData.swingPathAnalysis || {},
    processing_time: swingData.processingTime || 0,
    frame_count: swingData.frameCount || 0,
    created_at: swingData.createdAt || new Date().toISOString(),
    updated_at: swingData.updatedAt || new Date().toISOString()
  };
}


