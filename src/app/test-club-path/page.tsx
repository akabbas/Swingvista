'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function TestClubPathPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [poses, setPoses] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [trajectory, setTrajectory] = useState<any[]>([]);

  // Mock pose data generation
  const generateMockPoses = useCallback(() => {
    const mockPoses = [];
    const frameCount = 90; // 3 seconds at 30fps
    
    for (let i = 0; i < frameCount; i++) {
      const t = i / 30; // Time in seconds
      
      // Generate realistic golf swing motion
      const swingProgress = i / frameCount;
      const backswingEnd = 0.4;
      const downswingStart = 0.6;
      const impact = 0.8;
      
      let rightWristX, rightWristY, leftWristX, leftWristY;
      
      if (swingProgress < backswingEnd) {
        // Backswing: move back and up
        const backswingProgress = swingProgress / backswingEnd;
        rightWristX = 0.5 - backswingProgress * 0.2;
        rightWristY = 0.7 - backswingProgress * 0.3;
        leftWristX = 0.5 + backswingProgress * 0.1;
        leftWristY = 0.7 - backswingProgress * 0.2;
      } else if (swingProgress < downswingStart) {
        // Top of swing: slight pause
        rightWristX = 0.3;
        rightWristY = 0.4;
        leftWristX = 0.6;
        leftWristY = 0.5;
      } else if (swingProgress < impact) {
        // Downswing: accelerate down and through
        const downswingProgress = (swingProgress - downswingStart) / (impact - downswingStart);
        rightWristX = 0.3 + downswingProgress * 0.4;
        rightWristY = 0.4 + downswingProgress * 0.3;
        leftWristX = 0.6 - downswingProgress * 0.2;
        leftWristY = 0.5 + downswingProgress * 0.2;
      } else {
        // Follow-through: continue through
        const followProgress = (swingProgress - impact) / (1 - impact);
        rightWristX = 0.7 + followProgress * 0.2;
        rightWristY = 0.7 + followProgress * 0.1;
        leftWristX = 0.4 - followProgress * 0.1;
        leftWristY = 0.7 + followProgress * 0.1;
      }
      
      mockPoses.push({
        landmarks: [
          // Head (0)
          { x: 0.5, y: 0.2, z: 0, visibility: 0.9 },
          // Left eye (1), right eye (2), etc. - simplified
          ...Array(10).fill(null),
          // Left shoulder (11), right shoulder (12)
          { x: 0.6, y: 0.3, z: 0, visibility: 0.9 },
          { x: 0.4, y: 0.3, z: 0, visibility: 0.9 },
          // Left elbow (13), right elbow (14)
          { x: 0.7, y: 0.5, z: 0, visibility: 0.8 },
          { x: 0.3, y: 0.5, z: 0, visibility: 0.8 },
          // Left wrist (15), right wrist (16)
          { x: leftWristX, y: leftWristY, z: 0, visibility: 0.9 },
          { x: rightWristX, y: rightWristY, z: 0, visibility: 0.9 },
          // Rest of landmarks - simplified
          ...Array(16).fill({ x: 0.5, y: 0.5, z: 0, visibility: 0.5 })
        ],
        timestamp: t * 1000
      });
    }
    
    return mockPoses;
  }, []);

  // Precise club head detection
  const detectExactClubHeadPosition = useCallback((landmarks: any[], frameIndex: number) => {
    if (!landmarks) return null;
    
    const rightWrist = landmarks[16];
    const leftWrist = landmarks[15];
    const rightElbow = landmarks[14];
    const leftElbow = landmarks[13];
    
    if (!rightWrist || !leftWrist || !rightElbow || !leftElbow) return null;
    
    // Determine if right-handed or left-handed swing
    const isRightHanded = rightWrist.x < leftWrist.x;
    
    // Calculate arm angle for the dominant hand
    const dominantWrist = isRightHanded ? rightWrist : leftWrist;
    const dominantElbow = isRightHanded ? rightElbow : leftElbow;
    
    // Calculate arm angle (angle from elbow to wrist)
    const armAngle = Math.atan2(
      dominantWrist.y - dominantElbow.y,
      dominantWrist.x - dominantElbow.x
    );
    
    // Calculate club length based on arm span
    const armLength = Math.sqrt(
      Math.pow(dominantWrist.x - dominantElbow.x, 2) + 
      Math.pow(dominantWrist.y - dominantElbow.y, 2)
    );
    
    // Club length is typically 2.2-2.5x arm length for driver
    const clubLength = armLength * 2.3;
    
    // Calculate club head position based on swing mechanics
    const clubHeadAngle = armAngle + (isRightHanded ? Math.PI/2 : -Math.PI/2);
    
    // Adjust for swing plane - club head is typically below the grip
    const swingPlaneOffset = 0.15;
    
    const clubHead = {
      x: dominantWrist.x + Math.cos(clubHeadAngle) * clubLength,
      y: dominantWrist.y + Math.sin(clubHeadAngle) * clubLength + swingPlaneOffset,
      z: dominantWrist.z || 0
    };
    
    // Apply confidence based on landmark visibility
    const confidence = Math.min(
      (dominantWrist.visibility || 1) * 0.9,
      (dominantElbow.visibility || 1) * 0.8
    );
    
    return {
      x: Math.max(0, Math.min(1, clubHead.x)),
      y: Math.max(0, Math.min(1, clubHead.y)),
      z: clubHead.z,
      confidence: confidence,
      frame: frameIndex,
      handedness: isRightHanded ? 'right' : 'left',

        worldLandmarks: landmarks.map(lm => ({ ...lm, z: 0,

        worldLandmarks: landmarks.map(lm => ({ ...lm, z: 0 })) }))
    };
  }, []);

  // Calculate smooth club trajectory
  const calculateSmoothClubTrajectory = useCallback((poses: any[]) => {
    console.log('🎯 Building precise club trajectory from', poses.length, 'poses...');
    
    const rawTrajectory = [];
    
    // Build raw trajectory with precise detection
    for (let i = 0; i < poses.length; i++) {
      const pose = poses[i];
      const clubHead = detectExactClubHeadPosition(pose.landmarks, i);
      
      if (clubHead && clubHead.confidence && clubHead.confidence > 0.3) {
        rawTrajectory.push({
          x: clubHead.x,
          y: clubHead.y,
          frame: i,
          t: pose.timestamp,
          confidence: clubHead.confidence,
          handedness: clubHead.handedness
        });
      }
    }
    
    console.log('🎯 Raw trajectory points:', rawTrajectory.length);
    return rawTrajectory;
  }, [detectExactClubHeadPosition]);

  // Draw club path
  const drawClubPath = useCallback((ctx: CanvasRenderingContext2D, trajectory: any[], currentTime: number) => {
    if (!trajectory || trajectory.length === 0) return;
    
    const videoWidth = ctx.canvas.width;
    const videoHeight = ctx.canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, videoWidth, videoHeight);
    
    // Draw complete trajectory
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    for (let i = 0; i < trajectory.length; i++) {
      const pt = trajectory[i];
      const x = pt.x * videoWidth;
      const y = pt.y * videoHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    // Draw current position
    const currentFrame = Math.floor((currentTime / 1000) * 30);
    const currentIndex = Math.min(currentFrame, trajectory.length - 1);
    
    if (currentIndex >= 0 && currentIndex < trajectory.length) {
      const currentPt = trajectory[currentIndex];
      const x = currentPt.x * videoWidth;
      const y = currentPt.y * videoHeight;
      
      // Draw current club head marker
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw frame info
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`Frame: ${currentIndex}`, x + 15, y - 15);
      ctx.fillText(`Time: ${(currentTime / 1000).toFixed(2)}s`, x + 15, y);
    }
  }, []);

  // Initialize mock data
  useEffect(() => {
    const mockPoses = generateMockPoses();
    setPoses(mockPoses);
    
    // Generate mock phases
    const mockPhases = [
      { name: 'address', startFrame: 0, endFrame: 5, color: '#00FF00' },
      { name: 'backswing', startFrame: 6, endFrame: 36, color: '#FFFF00' },
      { name: 'downswing', startFrame: 37, endFrame: 54, color: '#FF0000' },
      { name: 'impact', startFrame: 55, endFrame: 72, color: '#FF00FF' },
      { name: 'follow-through', startFrame: 73, endFrame: 89, color: '#0000FF' }
    ];
    setPhases(mockPhases);
    
    // Calculate trajectory
    const trajectory = calculateSmoothClubTrajectory(mockPoses);
    setTrajectory(trajectory);
  }, [generateMockPoses, calculateSmoothClubTrajectory]);

  // Update canvas when time changes
  useEffect(() => {
    if (canvasRef.current && trajectory.length > 0) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        drawClubPath(ctx, trajectory, currentTime);
      }
    }
  }, [currentTime, trajectory, drawClubPath]);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime * 1000);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🎯 Precise Club Path Visualization Test
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Player */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Video Player</h2>
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-black rounded-lg"
                onTimeUpdate={handleTimeUpdate}
                onPlay={handlePlay}
                onPause={handlePause}
                controls
              >
                <source src="/fixtures/swings/tiger-woods-swing.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Overlay Canvas */}
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-64 pointer-events-none"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={togglePlay}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm">Time: {(currentTime / 1000).toFixed(2)}s</span>
                <span className="text-sm">Frame: {Math.floor((currentTime / 1000) * 30)}</span>
              </div>
            </div>
          </div>
          
          {/* Debug Info */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Debug Information</h2>
            
            <div className="bg-gray-800 p-4 rounded-lg space-y-2">
              <div><strong>Poses:</strong> {poses.length}</div>
              <div><strong>Trajectory Points:</strong> {trajectory.length}</div>
              <div><strong>Phases:</strong> {phases.length}</div>
              <div><strong>Current Time:</strong> {(currentTime / 1000).toFixed(2)}s</div>
              <div><strong>Handedness:</strong> {trajectory[0]?.handedness || 'unknown'}</div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Phase Information</h3>
              <div className="space-y-1 text-sm">
                {phases.map((phase, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: phase.color }}
                    />
                    <span>{phase.name}: frames {phase.startFrame}-{phase.endFrame}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Console Logs</h3>
              <p className="text-sm text-gray-300">
                Open browser console (F12) to see detailed debugging information including:
              </p>
              <ul className="text-sm text-gray-300 mt-2 space-y-1">
                <li>• Trajectory building process</li>
                <li>• Club head detection results</li>
                <li>• Phase validation</li>
                <li>• Quality checks</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">What to Look For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-green-400 mb-2">✅ Should See:</h3>
              <ul className="space-y-1">
                <li>• Smooth white trajectory line</li>
                <li>• Red dot showing current club head position</li>
                <li>• Frame and time information</li>
                <li>• Realistic golf swing arc</li>
                <li>• No squiggly or erratic movements</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-red-400 mb-2">❌ Should NOT See:</h3>
              <ul className="space-y-1">
                <li>• Squiggly or zigzag lines</li>
                <li>• Erratic jumping movements</li>
                <li>• Path that doesn't follow swing motion</li>
                <li>• Missing or incorrect frame data</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

