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

export async function getSwingHistory(userId: string = 'demo-user', limit: number = 50): Promise<{ success: boolean; data?: any[]; error?: string }> {
  if (!supabase) {
    console.warn('Supabase not configured; returning empty history.');
    return { success: true, data: [] };
  }
  try {
    const { data, error } = await supabase
      .from('swings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  } catch {
    return { success: false, error: 'Failed to retrieve swing history' };
  }
}

export async function getSwingById(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!supabase) {
    console.warn('Supabase not configured; cannot retrieve swing.');
    return { success: false, error: 'Database not configured' };
  }
  try {
    const { data, error } = await supabase
      .from('swings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch {
    return { success: false, error: 'Failed to retrieve swing' };
  }
}

export async function deleteSwing(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    console.warn('Supabase not configured; cannot delete swing.');
    return { success: false, error: 'Database not configured' };
  }
  try {
    const { error } = await supabase
      .from('swings')
      .delete()
      .eq('id', id);
    
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete swing' };
  }
}

function convertToDbFormat(swingData: UnifiedSwingData): any {
  // Ensure source is one of the allowed values
  const safeSource = swingData.source === 'camera' ? 'camera' : 'upload';
  
  // Helper function to convert arrays to string arrays
  const toStringArray = (arr: unknown): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr.map(item => String(item));
  };

  // Helper function to ensure JSONB fields are plain objects
  const toJsonb = (obj: unknown): object => {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      return obj as object;
    }
    return {};
  };

  return {
    user_id: swingData.userId || 'demo-user',
    club: swingData.club || 'driver',
    source: safeSource,
    video_url: swingData.videoUrl || null,
    
    // Core metrics - ensure they're numbers
    swing_plane_angle: Number(swingData.metrics?.swingPlaneAngle ?? 0),
    tempo_ratio: Number(swingData.metrics?.tempoRatio ?? 1.0),
    hip_rotation: Number(swingData.metrics?.hipRotation ?? 0),
    shoulder_rotation: Number(swingData.metrics?.shoulderRotation ?? 0),
    impact_frame: Number(swingData.metrics?.impactFrame ?? 0),
    backswing_time: Number(swingData.metrics?.backswingTime ?? 0),
    downswing_time: Number(swingData.metrics?.downswingTime ?? 0),
    clubhead_speed: Number(swingData.metrics?.clubheadSpeed ?? 0),
    swing_path: Number(swingData.metrics?.swingPath ?? 0),
    
    // AI feedback
    overall_score: String(swingData.aiFeedback?.overallScore ?? 'C'),
    key_improvements: toStringArray(swingData.aiFeedback?.keyImprovements),
    feedback: toStringArray(swingData.aiFeedback?.feedback),
    
    // JSONB fields - ensure they're objects
    report_card: toJsonb(swingData.aiFeedback?.reportCard),
    phases: toJsonb(swingData.phases),
    trajectory_metrics: toJsonb(swingData.trajectoryMetrics),
    swing_path_analysis: toJsonb(swingData.swingPathAnalysis),
    
    // Metadata
    processing_time: Number(swingData.processingTime ?? 0),
    frame_count: Number(swingData.frameCount ?? 0),
    
    // Timestamps
    created_at: swingData.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}


