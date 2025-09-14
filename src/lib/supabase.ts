import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SwingRecord {
  id: string;
  user_id: string;
  club: string;
  metrics: {
    swingPlaneAngle: number;
    tempoRatio: number;
    hipRotation: number;
    shoulderRotation: number;
    impactFrame: number;
    backswingTime: number;
    downswingTime: number;
  };
  feedback: string[];
  video_url?: string;
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

export async function saveSwing(swing: Omit<SwingRecord, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('swings')
    .insert([swing])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save swing: ${error.message}`);
  }

  return data;
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
