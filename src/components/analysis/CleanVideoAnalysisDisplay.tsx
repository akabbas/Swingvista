"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Play, Pause, Eye, EyeOff } from 'lucide-react';

interface CleanVideoAnalysisDisplayProps {
  videoFile: File;
  videoUrl?: string;
  analysis?: any;
  isAnalyzing: boolean;
  poses?: any[];
}

export default function CleanVideoAnalysisDisplay({ 
  videoFile, 
  videoUrl, 
  analysis, 
  isAnalyzing, 
  poses 
}: CleanVideoAnalysisDisplayProps) {
  console.log('🎬 CLEAN VIDEO DISPLAY: Props received:', {
    hasVideoFile: !!videoFile,
    hasVideoUrl: !!videoUrl,
    hasAnalysis: !!analysis,
    isAnalyzing,
    posesCount: poses?.length || 0,
    poses: poses ? 'exists' : 'null'
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const poseCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(0.5); // Default to 0.5x speed for golf analysis
  const [showOverlays, setShowOverlays] = useState(true);
  
  // Debug showOverlays state changes
  useEffect(() => {
    console.log('🎨 SHOW OVERLAYS STATE CHANGED:', showOverlays);
  }, [showOverlays]);
  
  // Force overlays to be enabled when component mounts
  useEffect(() => {
    if (!showOverlays) {
      console.log('🎨 FORCING OVERLAYS TO BE ENABLED');
      setShowOverlays(true);
    }
  }, []);
  const [overlaySettings, setOverlaySettings] = useState({
    stickFigure: true,
    swingPlane: true,
    phaseMarkers: true,
    clubPath: true
  });

  // Video event handlers
  const handlePlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const handlePause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  // Draw pose overlays
  // Draw test indicators to verify canvas is working (minimal version)
  const drawTestIndicators = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Just a small indicator in corner to show canvas is working
    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.beginPath();
    ctx.arc(canvas.width - 20, 20, 8, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  const drawPoseOverlay = useCallback((ctx: CanvasRenderingContext2D, frame: number) => {
    console.log('🎨 DRAW POSE OVERLAY: Frame', frame, 'Poses available:', poses?.length);
    
    if (!poses || poses.length === 0) {
      console.log('❌ No poses available for overlay');
      return;
    }

    const pose = poses[frame];
    console.log('🎨 Pose for frame', frame, ':', pose ? 'exists' : 'null');
    
    if (!pose || !pose.landmarks || pose.landmarks.length === 0) {
      console.log('❌ No landmarks for frame', frame);
      return;
    }
    
    console.log('🎨 Drawing overlay with', pose.landmarks.length, 'landmarks');

    // Get canvas reference
    const canvas = poseCanvasRef.current;
    if (!canvas) {
      console.log('❌ No canvas ref in drawPoseOverlay');
      return;
    }

    // Draw skeleton connections
    const connections = [
      // Face
      [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
      // Torso
      [11, 12], [11, 13], [12, 14], [11, 23], [12, 24], [23, 24],
      // Left arm
      [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19], [19, 21],
      // Right arm
      [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20], [20, 22],
      // Left leg
      [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
      // Right leg
      [24, 26], [26, 28], [28, 30], [28, 32], [30, 32]
    ];

    // Calculate body scale based on shoulder width for more accurate proportions
    const leftShoulder = pose.landmarks[11];
    const rightShoulder = pose.landmarks[12];
    let bodyScale = 1.0;
    
    if (leftShoulder && rightShoulder && 
        (leftShoulder.visibility || 0) > 0.3 && (rightShoulder.visibility || 0) > 0.3) {
      const shoulderDistance = Math.sqrt(
        Math.pow(rightShoulder.x - leftShoulder.x, 2) + 
        Math.pow(rightShoulder.y - leftShoulder.y, 2)
      );
      // Normalize shoulder width to get a reasonable scale factor
      bodyScale = Math.max(0.5, Math.min(2.0, shoulderDistance * 3));
      console.log('🎨 Body scale calculated:', bodyScale, 'shoulder distance:', shoulderDistance);
    } else {
      console.log('🎨 Using default body scale:', bodyScale);
    }

    // Draw connections with adjusted scaling
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = Math.max(2, 4 * bodyScale);
    
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

    // Draw keypoints with adjusted scaling
    pose.landmarks.forEach((landmark: any, index: number) => {
      if ((landmark.visibility || 0) > 0.3) {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        
        // Make key points proportional to body size
        let pointSize = 4;
        if (index === 11 || index === 12) { // Shoulders
          pointSize = 8 * bodyScale;
        } else if (index === 15 || index === 16) { // Wrists
          pointSize = 6 * bodyScale;
        } else if (index === 23 || index === 24) { // Hips
          pointSize = 7 * bodyScale;
        } else {
          pointSize = 5 * bodyScale;
        }
        
        ctx.arc(
          landmark.x * canvas.width,
          landmark.y * canvas.height,
          Math.max(2, pointSize), 0, 2 * Math.PI
        );
        ctx.fill();
      }
    });
  }, [poses]);

  // Draw swing plane
  const drawSwingPlane = useCallback((ctx: CanvasRenderingContext2D, frame: number) => {
    if (!poses || poses.length === 0) return;

    const pose = poses[frame];
    if (!pose || !pose.landmarks || pose.landmarks.length === 0) return;

    const canvas = poseCanvasRef.current;
    if (!canvas) return;

    // Find key points for swing plane
    const leftShoulder = pose.landmarks[11];
    const rightShoulder = pose.landmarks[12];
    const leftHip = pose.landmarks[23];
    const rightHip = pose.landmarks[24];

    if (leftShoulder && rightShoulder && leftHip && rightHip &&
        (leftShoulder.visibility || 0) > 0.3 && (rightShoulder.visibility || 0) > 0.3 &&
        (leftHip.visibility || 0) > 0.3 && (rightHip.visibility || 0) > 0.3) {
      
      // Draw swing plane line (shoulder to hip)
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 4]);
      
      ctx.beginPath();
      ctx.moveTo(
        (leftShoulder.x + rightShoulder.x) / 2 * canvas.width,
        (leftShoulder.y + rightShoulder.y) / 2 * canvas.height
      );
      ctx.lineTo(
        (leftHip.x + rightHip.x) / 2 * canvas.width,
        (leftHip.y + rightHip.y) / 2 * canvas.height
      );
      ctx.stroke();
      
      ctx.setLineDash([]);
      
      // Draw swing plane label
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('SWING PLANE', 10, canvas.height - 100);
    }
  }, [poses]);

  // Draw phase markers
  const drawPhaseMarkers = useCallback((ctx: CanvasRenderingContext2D, frame: number) => {
    if (!poses || poses.length === 0) return;

    const canvas = poseCanvasRef.current;
    if (!canvas) return;

    // Simple phase detection based on frame ranges
    const totalFrames = poses.length;
    const addressEnd = Math.floor(totalFrames * 0.1);
    const backswingEnd = Math.floor(totalFrames * 0.4);
    const downswingEnd = Math.floor(totalFrames * 0.7);
    const followThroughEnd = Math.floor(totalFrames * 0.9);

    let currentPhase = '';
    let phaseColor = '';

    if (frame <= addressEnd) {
      currentPhase = 'ADDRESS';
      phaseColor = '#00ff00';
    } else if (frame <= backswingEnd) {
      currentPhase = 'BACKSWING';
      phaseColor = '#ffff00';
    } else if (frame <= downswingEnd) {
      currentPhase = 'DOWNSWING';
      phaseColor = '#ff0000';
    } else if (frame <= followThroughEnd) {
      currentPhase = 'FOLLOW-THROUGH';
      phaseColor = '#ff8800';
    } else {
      currentPhase = 'FINISH';
      phaseColor = '#8800ff';
    }

    // Draw phase indicator box
    ctx.fillStyle = phaseColor;
    ctx.fillRect(10, 10, 200, 50);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(currentPhase, 20, 40);

    // Draw phase progress bar
    const progress = frame / totalFrames;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(10, canvas.height - 30, canvas.width - 20, 15);
    ctx.fillStyle = phaseColor;
    ctx.fillRect(10, canvas.height - 30, (canvas.width - 20) * progress, 15);
  }, [poses]);

  // Draw club path
  const drawClubPath = useCallback((ctx: CanvasRenderingContext2D, frame: number) => {
    console.log('🎨 DRAW CLUB PATH: Frame', frame, 'Poses available:', poses?.length);
    
    if (!poses || poses.length === 0) {
      console.log('❌ No poses for club path');
      return;
    }

    const canvas = poseCanvasRef.current;
    if (!canvas) {
      console.log('❌ No canvas for club path');
      return;
    }

    // Use multiple body points to estimate club path when club isn't visible
    const leftWrist = poses[frame]?.landmarks[15];
    const rightWrist = poses[frame]?.landmarks[16];
    const leftShoulder = poses[frame]?.landmarks[11];
    const rightShoulder = poses[frame]?.landmarks[12];

    console.log('🎨 Club path body points:', {
      leftWrist: leftWrist ? { x: leftWrist.x, y: leftWrist.y, visibility: leftWrist.visibility } : 'none',
      rightWrist: rightWrist ? { x: rightWrist.x, y: rightWrist.y, visibility: rightWrist.visibility } : 'none',
      leftShoulder: leftShoulder ? { x: leftShoulder.x, y: leftShoulder.y, visibility: leftShoulder.visibility } : 'none',
      rightShoulder: rightShoulder ? { x: rightShoulder.x, y: rightShoulder.y, visibility: rightShoulder.visibility } : 'none'
    });

    // Calculate club head position using multiple methods
    let clubHeadX = 0.5; // Default center
    let clubHeadY = 0.5; // Default center
    let method = 'default';

    // Method 1: Use wrists if both are visible - small extension for club head
    if (leftWrist && rightWrist && 
        (leftWrist.visibility || 0) > 0.1 && (rightWrist.visibility || 0) > 0.1) {
      const wristCenterX = (leftWrist.x + rightWrist.x) / 2;
      const wristCenterY = (leftWrist.y + rightWrist.y) / 2;
      
      // Small extension beyond wrists to approximate club head
      // Club head is typically just beyond the hands
      const extensionFactor = 0.05; // Much smaller extension
      clubHeadX = wristCenterX;
      clubHeadY = wristCenterY - extensionFactor; // Just slightly below wrists
      method = 'wrists+small';
    }
    // Method 2: Use shoulders if wrists not available
    else if (leftShoulder && rightShoulder && 
             (leftShoulder.visibility || 0) > 0.1 && (rightShoulder.visibility || 0) > 0.1) {
      const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
      const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
      
      // Small extension from shoulders
      clubHeadX = shoulderCenterX;
      clubHeadY = shoulderCenterY - 0.1; // Just slightly below shoulders
      method = 'shoulders+small';
    }
    // Method 3: Use single wrist if only one is visible
    else if (leftWrist && (leftWrist.visibility || 0) > 0.1) {
      // Small extension from left wrist
      clubHeadX = leftWrist.x;
      clubHeadY = leftWrist.y - 0.05; // Just slightly below
      method = 'leftWrist+small';
    }
    else if (rightWrist && (rightWrist.visibility || 0) > 0.1) {
      // Small extension from right wrist
      clubHeadX = rightWrist.x;
      clubHeadY = rightWrist.y - 0.05; // Just slightly below
      method = 'rightWrist+small';
    }

    console.log('🎨 Club head position:', { x: clubHeadX, y: clubHeadY, method });

    // Draw club path trail (show last 30 frames for better visibility)
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 6; // Make it even thicker
    ctx.beginPath();
    
    const startFrame = Math.max(0, frame - 30);
    let pathPoints = 0;
    
    for (let i = startFrame; i <= frame; i++) {
      const pastPose = poses[i];
      if (!pastPose?.landmarks) continue;
      
      const pastLeftWrist = pastPose.landmarks[15];
      const pastRightWrist = pastPose.landmarks[16];
      const pastLeftShoulder = pastPose.landmarks[11];
      const pastRightShoulder = pastPose.landmarks[12];
      
      let pastClubX = 0.5;
      let pastClubY = 0.5;
      let hasValidPoint = false;
      
      // Use same small extension logic for past frames
      if (pastLeftWrist && pastRightWrist && 
          (pastLeftWrist.visibility || 0) > 0.1 && (pastRightWrist.visibility || 0) > 0.1) {
        const pastWristCenterX = (pastLeftWrist.x + pastRightWrist.x) / 2;
        const pastWristCenterY = (pastLeftWrist.y + pastRightWrist.y) / 2;
        
        pastClubX = pastWristCenterX;
        pastClubY = pastWristCenterY - 0.05; // Small extension
        hasValidPoint = true;
      }
      else if (pastLeftShoulder && pastRightShoulder && 
               (pastLeftShoulder.visibility || 0) > 0.1 && (pastRightShoulder.visibility || 0) > 0.1) {
        const pastShoulderCenterX = (pastLeftShoulder.x + pastRightShoulder.x) / 2;
        const pastShoulderCenterY = (pastLeftShoulder.y + pastRightShoulder.y) / 2;
        
        pastClubX = pastShoulderCenterX;
        pastClubY = pastShoulderCenterY - 0.1; // Small extension
        hasValidPoint = true;
      }
      else if (pastLeftWrist && (pastLeftWrist.visibility || 0) > 0.1) {
        pastClubX = pastLeftWrist.x;
        pastClubY = pastLeftWrist.y - 0.05; // Small extension
        hasValidPoint = true;
      }
      else if (pastRightWrist && (pastRightWrist.visibility || 0) > 0.1) {
        pastClubX = pastRightWrist.x;
        pastClubY = pastRightWrist.y - 0.05; // Small extension
        hasValidPoint = true;
      }
      
      if (hasValidPoint) {
        if (pathPoints === 0) {
          ctx.moveTo(pastClubX * canvas.width, pastClubY * canvas.height);
        } else {
          ctx.lineTo(pastClubX * canvas.width, pastClubY * canvas.height);
        }
        pathPoints++;
      }
    }
    
    console.log('🎨 Club path points drawn:', pathPoints);
    ctx.stroke();

    // Draw current club head position (make it bigger)
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.arc(clubHeadX * canvas.width, clubHeadY * canvas.height, 15, 0, 2 * Math.PI);
    ctx.fill();

    // Draw club path label with background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, canvas.height - 100, 200, 40);
    ctx.fillStyle = '#ff00ff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`CLUB PATH (${method})`, 15, canvas.height - 75);
    ctx.fillText(`Points: ${pathPoints}`, 15, canvas.height - 55);
  }, [poses]);

  // Main drawing function
  const drawOverlays = useCallback(() => {
    console.log('🎨 DRAW OVERLAYS CALLED:', {
      hasCanvas: !!poseCanvasRef.current,
      hasVideo: !!videoRef.current,
      showOverlays,
      posesCount: poses?.length || 0,
      overlaySettings
    });
    
    const canvas = poseCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !showOverlays) {
      console.log('❌ Draw overlays skipped:', { canvas: !!canvas, video: !!video, showOverlays });
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('❌ No canvas context');
      return;
    }

    // Set canvas size to match video
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    // Set CSS size to match video display size exactly
    const videoRect = video.getBoundingClientRect();
    const containerRect = video.parentElement?.getBoundingClientRect();
    
    if (containerRect) {
      // Position canvas relative to its container, not the video
      canvas.style.position = 'absolute';
      canvas.style.top = '0px';
      canvas.style.left = '0px';
      canvas.style.width = containerRect.width + 'px';
      canvas.style.height = containerRect.height + 'px';
      canvas.style.zIndex = '10';
    }
    
    console.log('🎨 Canvas size set to:', canvas.width, 'x', canvas.height);
    console.log('🎨 Canvas CSS size:', canvas.style.width, 'x', canvas.style.height);
    console.log('🎨 Video rect:', videoRect.width, 'x', videoRect.height);

    const frame = Math.floor(video.currentTime * 30); // Assuming 30fps
    console.log('🎨 Current frame:', frame, 'Video time:', video.currentTime);
    console.log('🎨 Poses array length:', poses?.length);
    console.log('🎨 Frame within bounds:', frame < (poses?.length || 0));

    // ALWAYS draw test indicators regardless of overlay settings
    console.log('🎨 Drawing test indicators...');
    drawTestIndicators(ctx, canvas);

    if (overlaySettings.stickFigure) {
      console.log('🎨 Drawing stick figure...');
      // Ensure frame is within bounds
      const safeFrame = Math.min(frame, (poses?.length || 1) - 1);
      console.log('🎨 Safe frame for stick figure:', safeFrame);
      drawPoseOverlay(ctx, safeFrame);
    }
    if (overlaySettings.swingPlane) {
      console.log('🎨 Drawing swing plane...');
      const safeFrame = Math.min(frame, (poses?.length || 1) - 1);
      drawSwingPlane(ctx, safeFrame);
    }
    if (overlaySettings.phaseMarkers) {
      console.log('🎨 Drawing phase markers...');
      const safeFrame = Math.min(frame, (poses?.length || 1) - 1);
      drawPhaseMarkers(ctx, safeFrame);
    }
    if (overlaySettings.clubPath) {
      console.log('🎨 Drawing club path...');
      console.log('🎨 Club path settings:', overlaySettings.clubPath);
      const safeFrame = Math.min(frame, (poses?.length || 1) - 1);
      drawClubPath(ctx, safeFrame);
    } else {
      console.log('🎨 Club path disabled in settings');
    }
  }, [showOverlays, overlaySettings, drawPoseOverlay, drawSwingPlane, drawPhaseMarkers, drawClubPath, poses]);

  // Update overlays when video time changes
  useEffect(() => {
    drawOverlays();
  }, [currentTime, drawOverlays]);

  // Trigger overlays when video loads
  useEffect(() => {
    if (videoRef.current && poses && poses.length > 0) {
      console.log('🎨 VIDEO LOADED - Triggering initial overlay draw');
      setTimeout(() => {
        drawOverlays();
      }, 100); // Small delay to ensure video is ready
    }
  }, [poses, drawOverlays]);

  // Setup video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set default playback speed for golf analysis
    video.playbackRate = playbackSpeed;
    console.log('🎬 Setting video playback speed to:', playbackSpeed + 'x');

    const handleLoadedMetadata = () => {
      const canvas = poseCanvasRef.current;
      if (canvas) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }
      // Ensure playback speed is set after video loads
      video.playbackRate = playbackSpeed;
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', () => setIsPlaying(true));
    video.addEventListener('pause', () => setIsPlaying(false));

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', () => setIsPlaying(true));
      video.removeEventListener('pause', () => setIsPlaying(false));
    };
  }, [handleTimeUpdate, playbackSpeed]);

  return (
    <div className="space-y-4">
      {/* Video Player */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full h-auto"
            style={{ maxHeight: '500px' }}
          />
          <canvas
            ref={poseCanvasRef}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ 
              width: '100%', 
              height: '100%',
              maxHeight: '500px',
              zIndex: 10
            }}
          />
        </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              showOverlays 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            {showOverlays ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
            {showOverlays ? 'Hide Overlays' : 'Show Overlays'}
          </button>
          
          <button
            onClick={() => {
              console.log('🎨 MANUAL OVERLAY TRIGGER');
              drawOverlays();
            }}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh Overlays
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Speed:</span>
          <button
            onClick={() => {
              const newSpeed = 0.25;
              setPlaybackSpeed(newSpeed);
              if (videoRef.current) {
                videoRef.current.playbackRate = newSpeed;
                console.log('🎬 Speed set to:', newSpeed + 'x');
              }
            }}
            className={`px-3 py-1 text-sm rounded ${
              playbackSpeed === 0.25 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            0.25x
          </button>
          <button
            onClick={() => {
              const newSpeed = 0.5;
              setPlaybackSpeed(newSpeed);
              if (videoRef.current) {
                videoRef.current.playbackRate = newSpeed;
                console.log('🎬 Speed set to:', newSpeed + 'x');
              }
            }}
            className={`px-3 py-1 text-sm rounded ${
              playbackSpeed === 0.5 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            0.5x
          </button>
          <button
            onClick={() => {
              const newSpeed = 0.75;
              setPlaybackSpeed(newSpeed);
              if (videoRef.current) {
                videoRef.current.playbackRate = newSpeed;
                console.log('🎬 Speed set to:', newSpeed + 'x');
              }
            }}
            className={`px-3 py-1 text-sm rounded ${
              playbackSpeed === 0.75 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            0.75x
          </button>
          <button
            onClick={() => {
              const newSpeed = 1.0;
              setPlaybackSpeed(newSpeed);
              if (videoRef.current) {
                videoRef.current.playbackRate = newSpeed;
                console.log('🎬 Speed set to:', newSpeed + 'x');
              }
            }}
            className={`px-3 py-1 text-sm rounded ${
              playbackSpeed === 1.0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            1.0x
          </button>
        </div>

        <div className="text-sm text-gray-600">
          {poses ? `${poses.length} poses detected` : 'No pose data'}
        </div>
      </div>

      {/* Overlay Settings */}
      {showOverlays && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-3">Overlay Settings</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(overlaySettings).map(([key, value]) => (
              <label key={key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setOverlaySettings(prev => ({
                    ...prev,
                    [key]: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Summary */}
      {analysis && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Analysis Status</h4>
          <p className="text-blue-700 text-sm">
            {poses ? `Successfully analyzed ${poses.length} frames` : 'Analysis in progress...'}
          </p>
        </div>
      )}
    </div>
  );
}
