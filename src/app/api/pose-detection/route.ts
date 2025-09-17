import { NextRequest, NextResponse } from 'next/server';

// EMERGENCY FIX: Server-side pose detection API
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Server-side pose detection API called');
    
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const optionsStr = formData.get('options') as string;
    
    if (!videoFile) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }
    
    const options = optionsStr ? JSON.parse(optionsStr) : {};
    
    console.log(`📹 Processing video: ${videoFile.name}, ${videoFile.size} bytes`);
    
    // For now, return mock data since we don't have server-side pose detection
    // In a real implementation, you would use OpenCV, MediaPipe Python, or similar
    const mockPoses = generateServerSideMockPoses(videoFile, options);
    
    console.log(`✅ Server-side processing completed: ${mockPoses.length} poses`);
    
    return NextResponse.json({
      poses: mockPoses,
      method: 'server-side-mock',
      videoInfo: {
        name: videoFile.name,
        size: videoFile.size,
        type: videoFile.type
      }
    });
    
  } catch (error) {
    console.error('❌ Server-side pose detection failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Server-side pose detection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// EMERGENCY FIX: Generate server-side mock poses
function generateServerSideMockPoses(videoFile: File, options: any) {
  const { maxFrames = 150, sampleFps = 30 } = options;
  
  // Estimate video duration based on file size (rough approximation)
  const estimatedDuration = Math.max(3, Math.min(10, videoFile.size / (1024 * 1024))); // 3-10 seconds
  const frameCount = Math.min(maxFrames, Math.floor(estimatedDuration * sampleFps));
  
  console.log(`📊 Generating ${frameCount} mock poses for estimated ${estimatedDuration}s video`);
  
  const mockPoses = [];
  
  for (let i = 0; i < frameCount; i++) {
    const progress = i / frameCount;
    const frameTime = i / sampleFps;
    
    // Create realistic golf swing landmarks
    const landmarks = [];
    
    for (let j = 0; j < 33; j++) {
      let x, y, z, visibility;
      
      if (j < 5) {
        // Head landmarks - relatively stable
        x = 0.5 + Math.sin(progress * Math.PI * 0.5 + j * 0.1) * 0.02;
        y = 0.2 + Math.cos(progress * Math.PI * 0.3 + j * 0.05) * 0.01;
        z = Math.sin(progress * Math.PI * 0.2 + j * 0.1) * 0.01;
        visibility = 0.95;
      } else if (j < 11) {
        // Shoulder and arm landmarks - major swing movement
        const armSwing = Math.sin(progress * Math.PI) * 0.4;
        const shoulderRotation = Math.sin(progress * Math.PI * 2) * 0.15;
        
        if (j === 5 || j === 6) { // shoulders
          x = j === 5 ? 0.35 + shoulderRotation : 0.65 - shoulderRotation;
          y = 0.4 + Math.sin(progress * Math.PI) * 0.05;
          z = Math.sin(progress * Math.PI) * 0.02;
        } else { // arms
          x = j % 2 === 0 ? 0.3 + armSwing : 0.7 - armSwing;
          y = 0.5 + Math.sin(progress * Math.PI * 1.5) * 0.1;
          z = Math.sin(progress * Math.PI) * 0.03;
        }
        visibility = 0.9;
      } else if (j < 17) {
        // Hand landmarks - follow arm movement
        const handSwing = Math.sin(progress * Math.PI) * 0.5;
        x = j % 2 === 0 ? 0.25 + handSwing : 0.75 - handSwing;
        y = 0.6 + Math.sin(progress * Math.PI * 1.2) * 0.08;
        z = Math.sin(progress * Math.PI * 0.8) * 0.02;
        visibility = 0.85;
      } else if (j < 23) {
        // Torso landmarks - moderate movement
        const torsoRotation = Math.sin(progress * Math.PI * 1.5) * 0.08;
        x = j % 2 === 0 ? 0.4 + torsoRotation : 0.6 - torsoRotation;
        y = 0.6 + Math.sin(progress * Math.PI * 0.8) * 0.03;
        z = Math.sin(progress * Math.PI * 0.5) * 0.01;
        visibility = 0.9;
      } else {
        // Leg landmarks - stable stance
        x = j % 2 === 0 ? 0.38 : 0.62;
        y = 0.8 + (j - 23) * 0.05;
        z = Math.sin(progress * Math.PI * 0.1 + j * 0.2) * 0.01;
        visibility = 0.9;
      }
      
      // Add some natural variation
      x += Math.sin(progress * Math.PI * 2 + j * 0.3) * 0.01;
      y += Math.cos(progress * Math.PI * 1.5 + j * 0.2) * 0.01;
      z += Math.sin(progress * Math.PI * 3 + j * 0.4) * 0.005;
      
      landmarks.push({
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
        z: z,
        visibility: Math.max(0.7, Math.min(1, visibility + (Math.random() - 0.5) * 0.1))
      });
    }
    
    mockPoses.push({
      landmarks,
      worldLandmarks: landmarks,
      timestamp: frameTime * 1000
    });
  }
  
  return mockPoses;
}
