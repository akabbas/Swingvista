"use client";

import React, { useRef, useEffect, useState } from 'react';

export default function TestOverlaysPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const poseCanvasRef = useRef<HTMLCanvasElement>(null);
  const [poses, setPoses] = useState<any[]>([]);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const log = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setDebugLog(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  const clearDebug = () => {
    setDebugLog([]);
  };

  const loadVideo = () => {
    log('🎥 Loading video...');
    if (videoRef.current) {
      videoRef.current.addEventListener('loadeddata', () => {
        log(`✅ Video loaded: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}, duration: ${videoRef.current?.duration}s`);
        createMockPoses();
      });
      videoRef.current.load();
    }
  };

  const createMockPoses = () => {
    log('🎭 Creating mock pose data...');
    const video = videoRef.current;
    if (!video) return;

    const newPoses = [];
    const frameCount = Math.floor(video.duration * 30); // 30fps
    
    for (let i = 0; i < frameCount; i++) {
      const time = i / 30;
      const progress = i / frameCount;
      
      // Create a moving pose that follows a golf swing motion
      const swingPhase = progress * Math.PI; // 0 to π
      const centerX = 0.5 + Math.sin(swingPhase) * 0.1;
      const centerY = 0.5 + Math.cos(swingPhase) * 0.05;
      
      const pose = {
        landmarks: Array.from({ length: 33 }, (_, j) => {
          // Create a realistic pose structure
          const angle = (j / 33) * Math.PI * 2;
          const radius = 0.1 + Math.sin(swingPhase + angle) * 0.05;
          
          return {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            z: 0,
            visibility: 0.9
          };
        }),
        timestamp: time * 1000,
        confidence: 0.9
      };
      
      newPoses.push(pose);
    }
    
    setPoses(newPoses);
    log(`✅ Created ${newPoses.length} mock poses`);
    log(`📊 First pose sample: ${JSON.stringify(newPoses[0], null, 2)}`);
  };

  const testOverlayRendering = () => {
    if (poses.length === 0) {
      log('❌ No poses available. Load video first.');
      return;
    }
    
    log('🎨 Testing overlay rendering...');
    
    const canvas = poseCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) {
      log('❌ Canvas or video not available');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      log('❌ Canvas context not available');
      return;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get current frame
    const currentTime = video.currentTime;
    const frame = Math.floor(currentTime * 30);
    const pose = poses[frame];
    
    log(`🎯 Rendering frame ${frame} (time: ${currentTime.toFixed(2)}s)`);
    
    if (pose && pose.landmarks && pose.landmarks.length > 0) {
      // Draw skeleton connections
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
        [11, 12], [11, 13], [12, 14], [11, 23], [12, 24], [23, 24],
        [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19], [19, 21],
        [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20], [20, 22],
        [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
        [24, 26], [26, 28], [28, 30], [28, 32], [30, 32]
      ];
      
      // Draw connections
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      
      connections.forEach(([start, end]) => {
        if (pose.landmarks[start] && pose.landmarks[end] && 
            (pose.landmarks[start].visibility || 0) > 0.3 && 
            (pose.landmarks[end].visibility || 0) > 0.3) {
          ctx.beginPath();
          ctx.moveTo(
            pose.landmarks[start].x * canvas.width,
            pose.landmarks[start].y * canvas.height
          );
          ctx.lineTo(
            pose.landmarks[end].x * canvas.width,
            pose.landmarks[end].y * canvas.height
          );
          ctx.stroke();
        }
      });
      
      // Draw keypoints
      pose.landmarks.forEach((landmark: any) => {
        if ((landmark.visibility || 0) > 0.3) {
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(
            landmark.x * canvas.width,
            landmark.y * canvas.height,
            4, 0, 2 * Math.PI
          );
          ctx.fill();
        }
      });
      
      log(`✅ Overlay rendered with ${pose.landmarks.length} landmarks`);
      
    } else {
      log(`❌ No pose data for frame ${frame}`);
    }
  };

  // Auto-update overlays when video time changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (poses.length > 0) {
        testOverlayRendering();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [poses]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🎯 Overlay Rendering Test</h1>
          <p className="text-lg text-gray-600">Test overlay rendering with mock pose data</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="relative inline-block">
            <video
              ref={videoRef}
              controls
              className="w-full max-w-2xl"
              style={{ maxHeight: '500px' }}
            >
              <source src="/fixtures/swings/tiger-woods-swing.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <canvas
              ref={poseCanvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ maxHeight: '500px' }}
              width={640}
              height={480}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex space-x-4 mb-4">
            <button
              onClick={loadVideo}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Load Video
            </button>
            <button
              onClick={testOverlayRendering}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Test Overlay Rendering
            </button>
            <button
              onClick={clearDebug}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Debug
            </button>
          </div>
          
          <div className="text-sm text-gray-600 mb-4">
            Poses: {poses.length} | Video: {videoRef.current ? 'Loaded' : 'Not loaded'}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Debug Log</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {debugLog.length === 0 ? (
              <div className="text-gray-500">Debug information will appear here...</div>
            ) : (
              debugLog.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
