-- Fix swings table schema for SwingVista
-- This will drop and recreate the table with the correct structure

-- Step 1: Drop the existing table (SAFE since it's empty)
DROP TABLE IF EXISTS public.swings CASCADE;

-- Step 2: Create the new table with correct schema
CREATE TABLE public.swings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  club TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('upload', 'camera')),
  video_url TEXT,
  
  -- Core metrics
  swing_plane_angle FLOAT,
  tempo_ratio FLOAT,
  hip_rotation FLOAT,
  shoulder_rotation FLOAT,
  impact_frame INTEGER,
  backswing_time FLOAT,
  downswing_time FLOAT,
  clubhead_speed FLOAT,
  swing_path FLOAT,
  
  -- AI feedback
  overall_score TEXT,
  key_improvements TEXT[],
  feedback TEXT[],
  
  -- Report card (stored as JSONB for flexibility)
  report_card JSONB,
  
  -- Technical data
  phases JSONB,
  trajectory_metrics JSONB,
  swing_path_analysis JSONB,
  
  -- Metadata
  processing_time INTEGER,
  frame_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for better performance
CREATE INDEX idx_swings_user_id ON public.swings(user_id);
CREATE INDEX idx_swings_club ON public.swings(club);
CREATE INDEX idx_swings_created_at ON public.swings(created_at);
CREATE INDEX idx_swings_source ON public.swings(source);

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE public.swings ENABLE ROW LEVEL SECURITY;

-- Step 5: Create a policy that allows all operations for development
CREATE POLICY "Allow all operations for development" ON public.swings
  FOR ALL USING (true);

-- Step 6: Insert sample data for testing
INSERT INTO public.swings (
  user_id,
  club,
  source,
  swing_plane_angle,
  tempo_ratio,
  hip_rotation,
  shoulder_rotation,
  impact_frame,
  backswing_time,
  downswing_time,
  overall_score,
  key_improvements,
  feedback,
  processing_time,
  frame_count
) VALUES (
  'demo-user',
  'driver',
  'camera',
  12.5,
  2.8,
  45.2,
  90.1,
  25,
  0.8,
  0.4,
  'B',
  ARRAY['Work on hip rotation', 'Improve tempo consistency'],
  ARRAY['Good swing plane', 'Tempo could be more consistent'],
  1500,
  30
), (
  'demo-user',
  'iron',
  'upload',
  8.3,
  3.1,
  38.7,
  85.4,
  22,
  0.9,
  0.3,
  'A',
  ARRAY['Excellent form', 'Great tempo'],
  ARRAY['Perfect swing plane', 'Excellent tempo ratio'],
  1200,
  28
);

-- Step 7: Verify the table was created successfully
SELECT 
  'Table created successfully' as status, 
  COUNT(*) as record_count 
FROM public.swings;
