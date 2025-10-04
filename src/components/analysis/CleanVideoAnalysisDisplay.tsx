"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Play, Pause, Eye, EyeOff } from 'lucide-react';

interface CleanVideoAnalysisDisplayProps {
  videoFile?: File | null;
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
  const clubPathCanvasRef = useRef<HTMLCanvasElement>(null);
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
      const newTime = videoRef.current.currentTime;
      setCurrentTime(newTime);
      
      // Debug video playback
      const frame = Math.floor(newTime * 30); // Assuming 30fps
      if (frame % 10 === 0) { // Log every 10 frames to avoid console spam
        console.log(`🎬 VIDEO TIME UPDATE: time=${newTime.toFixed(2)}s, frame=${frame}, playing=${!videoRef.current.paused}`);
      }
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
    
    // Debug: Count visible landmarks
    const visibleLandmarks = pose.landmarks.filter((lm: any) => (lm.visibility || 0) > 0.2);
    console.log('🎨 Drawing overlay with', pose.landmarks.length, 'landmarks,', visibleLandmarks.length, 'visible');
    
    // Debug: Log landmark visibility for diagonal angle troubleshooting
    if (frame % 30 === 0) { // Log every 30 frames
      console.log('🎨 LANDMARK VISIBILITY:', pose.landmarks.map((lm: any, i: number) => 
        `${i}:${(lm.visibility || 0).toFixed(2)}`
      ).join(' '));
    }

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

    // Draw connections - adaptive for different camera angles
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    
    connections.forEach(([start, end]) => {
      const startLandmark = pose.landmarks[start];
      const endLandmark = pose.landmarks[end];
      
      if (startLandmark && endLandmark && 
          (startLandmark.visibility || 0) > 0.2 && 
          (endLandmark.visibility || 0) > 0.2) {
        
        // Calculate distance between points to avoid drawing very long lines
        const dx = startLandmark.x - endLandmark.x;
        const dy = startLandmark.y - endLandmark.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only draw if distance is reasonable (not too long or too short)
        if (distance > 0.05 && distance < 0.8) {
          ctx.beginPath();
          ctx.moveTo(
            startLandmark.x * canvas.width,
            startLandmark.y * canvas.height
          );
          ctx.lineTo(
            endLandmark.x * canvas.width,
            endLandmark.y * canvas.height
          );
          ctx.stroke();
        }
      }
    });

    // Draw keypoints - adaptive for different camera angles
    pose.landmarks.forEach((landmark: any, index: number) => {
      if ((landmark.visibility || 0) > 0.2) { // Lower threshold for diagonal angles
        // Make keypoints slightly larger for better visibility
        const radius = 5;
        
        // Different colors for different body parts
        if (index >= 0 && index <= 10) {
          ctx.fillStyle = '#ff0000'; // Face - red
        } else if (index >= 11 && index <= 16) {
          ctx.fillStyle = '#00ff00'; // Arms - green
        } else if (index >= 17 && index <= 22) {
          ctx.fillStyle = '#0000ff'; // Hands - blue
        } else if (index >= 23 && index <= 24) {
          ctx.fillStyle = '#ffff00'; // Hips - yellow
        } else {
          ctx.fillStyle = '#ff00ff'; // Legs - magenta
        }
        
        ctx.beginPath();
        ctx.arc(
          landmark.x * canvas.width,
          landmark.y * canvas.height,
          radius, 0, 2 * Math.PI
        );
        ctx.fill();
        
        // Add white outline for better visibility
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
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

  // Enhanced club head detection specifically for golf clubs
  const detectClubHead = useCallback((frame: number): {x: number, y: number, confidence: number, method: string} => {
    console.log(`🏌️ DETECTING CLUB HEAD: Frame ${frame}`);
    
    if (!poses || poses.length === 0 || frame >= poses.length) {
      console.log('❌ Cannot detect club head - missing poses');
      return { x: 0.5, y: 0.5, confidence: 0, method: 'none' };
    }
    
    const pose = poses[frame];
    const leftWrist = pose?.landmarks?.[15];
    const rightWrist = pose?.landmarks?.[16];
    const leftShoulder = pose?.landmarks?.[11];
    const rightShoulder = pose?.landmarks?.[12];
    
    // Method 1: Use hand positions to estimate club head location
    if (leftWrist && rightWrist && 
        (leftWrist.visibility || 0) > 0.3 && (rightWrist.visibility || 0) > 0.3) {
      
      const wristCenterX = (leftWrist.x + rightWrist.x) / 2;
      const wristCenterY = (leftWrist.y + rightWrist.y) / 2;
      
      // Calculate swing direction based on hand movement
      let clubHeadX = wristCenterX;
      let clubHeadY = wristCenterY;
      let confidence = 0.8;
      let method = 'hand_position';
      
      // For golf swing, club head is typically below and to the side of hands
      // Adjust based on swing phase
      const totalFrames = poses.length;
      const swingProgress = frame / totalFrames;
      
      if (swingProgress < 0.2) {
        // Address and early backswing - club head is below hands
        clubHeadY = wristCenterY + 0.2;
        clubHeadX = wristCenterX + 0.08; // Slightly to the right for right-handed golfer
      } else if (swingProgress < 0.4) {
        // Mid backswing - club head moves up and behind
        clubHeadY = wristCenterY - 0.15;
        clubHeadX = wristCenterX - 0.12;
      } else if (swingProgress < 0.6) {
        // Top of backswing - club head is high and behind
        clubHeadY = wristCenterY - 0.25;
        clubHeadX = wristCenterX - 0.2;
      } else if (swingProgress < 0.8) {
        // Downswing - club head moves down and forward
        clubHeadY = wristCenterY + 0.25;
        clubHeadX = wristCenterX + 0.15;
      } else {
        // Follow-through - club head continues forward
        clubHeadY = wristCenterY + 0.1;
        clubHeadX = wristCenterX + 0.2;
      }
      
      console.log(`🏌️ Club head from hands: (${clubHeadX.toFixed(3)}, ${clubHeadY.toFixed(3)}) confidence: ${confidence.toFixed(2)}`);
      
      return { 
        x: Math.max(0, Math.min(1, clubHeadX)), 
        y: Math.max(0, Math.min(1, clubHeadY)), 
        confidence,
        method
      };
    }
    
    // Method 2: Use shoulder position as fallback
    if (leftShoulder && rightShoulder && 
        (leftShoulder.visibility || 0) > 0.3 && (rightShoulder.visibility || 0) > 0.3) {
      
      const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
      const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
      
      // Club head is typically below and to the side of shoulders
      const clubHeadX = shoulderCenterX + 0.12;
      const clubHeadY = shoulderCenterY + 0.35;
      const confidence = 0.5;
      const method = 'shoulder_fallback';
      
      console.log(`🏌️ Club head from shoulders: (${clubHeadX.toFixed(3)}, ${clubHeadY.toFixed(3)}) confidence: ${confidence.toFixed(2)}`);
      
      return { 
        x: Math.max(0, Math.min(1, clubHeadX)), 
        y: Math.max(0, Math.min(1, clubHeadY)), 
        confidence,
        method
      };
    }
    
    // Method 3: Default position based on swing phase
    const totalFrames = poses.length;
    const swingProgress = frame / totalFrames;
    
    let clubHeadX = 0.5;
    let clubHeadY = 0.7;
    let confidence = 0.3;
    let method = 'phase_based';
    
    if (swingProgress < 0.2) {
      // Address position
      clubHeadX = 0.6;
      clubHeadY = 0.8;
    } else if (swingProgress < 0.4) {
      // Backswing
      clubHeadX = 0.4;
      clubHeadY = 0.5;
    } else if (swingProgress < 0.6) {
      // Top of backswing
      clubHeadX = 0.3;
      clubHeadY = 0.3;
    } else if (swingProgress < 0.8) {
      // Downswing
      clubHeadX = 0.6;
      clubHeadY = 0.7;
    } else {
      // Follow-through
      clubHeadX = 0.7;
      clubHeadY = 0.6;
    }
    
    console.log(`🏌️ Club head from phase: (${clubHeadX.toFixed(3)}, ${clubHeadY.toFixed(3)}) confidence: ${confidence.toFixed(2)}`);
    
    return { 
      x: clubHeadX, 
      y: clubHeadY, 
      confidence,
      method
    };
  }, [videoRef, poses]);

  // Draw club path
  const drawClubPath = useCallback((ctx: CanvasRenderingContext2D, frame: number) => {
    console.log('🎨 DRAW CLUB PATH: Frame', frame, 'Poses available:', poses?.length);
    
    if (!poses || poses.length === 0) {
      console.log('❌ No poses for club path');
      return;
    }

    const canvas = clubPathCanvasRef.current;
    if (!canvas) {
      console.log('❌ No canvas for club path');
      return;
    }
    
    // Detect current club head position
    const { x: clubHeadX, y: clubHeadY, confidence, method } = detectClubHead(frame);
    
    console.log('🎨 Club head position:', { x: clubHeadX, y: clubHeadY, confidence, method });

    // We don't need to clear here anymore as the main drawOverlays function
    // handles clearing each canvas before drawing
    
    // Draw club path trail (show last 20 frames for better visibility)
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 8; // Make it thicker for better visibility
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    
    const startFrame = Math.max(0, frame - 20);
    let pathPoints = 0;
    let clubHeadPositions = [];
    
    // Get club head positions for past frames
    for (let i = startFrame; i <= frame; i++) {
      const pastClubHead = detectClubHead(i);
      clubHeadPositions.push(pastClubHead);
      
      if (pastClubHead.confidence > 0.2) { // Only use high confidence detections
        if (pathPoints === 0) {
          ctx.moveTo(pastClubHead.x * canvas.width, pastClubHead.y * canvas.height);
        } else {
          ctx.lineTo(pastClubHead.x * canvas.width, pastClubHead.y * canvas.height);
        }
        pathPoints++;
      }
    }
    
    console.log('🎨 Club path points drawn:', pathPoints);
    ctx.stroke();

    // Draw current club head position (make it bigger and more visible)
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.arc(clubHeadX * canvas.width, clubHeadY * canvas.height, 12, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw white outline for better visibility
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(clubHeadX * canvas.width, clubHeadY * canvas.height, 12, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw confidence indicator (pulsing effect)
    const confidenceRadius = 20 + (10 * confidence);
    ctx.strokeStyle = `rgba(255, 0, 255, ${confidence * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(clubHeadX * canvas.width, clubHeadY * canvas.height, confidenceRadius, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw club path label with background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, canvas.height - 100, 200, 40);
    ctx.fillStyle = '#ff00ff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`CLUB PATH (${method})`, 15, canvas.height - 75);
    ctx.fillText(`Points: ${pathPoints}`, 15, canvas.height - 55);
  }, [poses, detectClubHead]);

  // Main drawing function
  const drawOverlays = useCallback(() => {
    console.log('🎨 DRAW OVERLAYS CALLED:', {
      hasCanvas: !!poseCanvasRef.current,
      hasVideo: !!videoRef.current,
      showOverlays,
      posesCount: poses?.length || 0,
      overlaySettings
    });
    
    const poseCanvas = poseCanvasRef.current;
    const clubPathCanvas = clubPathCanvasRef.current;
    const video = videoRef.current;
    if (!poseCanvas || !clubPathCanvas || !video || !showOverlays || !poses || poses.length === 0) {
      console.log('❌ Draw overlays skipped:', { 
        poseCanvas: !!poseCanvas, 
        clubPathCanvas: !!clubPathCanvas,
        video: !!video, 
        showOverlays,
        poses: !!poses,
        posesLength: poses?.length
      });
      return;
    }

    const poseCtx = poseCanvas.getContext('2d');
    const clubPathCtx = clubPathCanvas.getContext('2d');
    if (!poseCtx || !clubPathCtx) {
      console.log('❌ No canvas context');
      return;
    }

    // Set canvas sizes to match video
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;
    poseCanvas.width = videoWidth;
    poseCanvas.height = videoHeight;
    clubPathCanvas.width = videoWidth;
    clubPathCanvas.height = videoHeight;
    
    // Set CSS size to match video display size exactly
    const videoRect = video.getBoundingClientRect();
    const containerRect = video.parentElement?.getBoundingClientRect();
    
    if (containerRect) {
      // Position both canvases relative to their container, not the video
      const canvases = [poseCanvas, clubPathCanvas];
      canvases.forEach((canvas, index) => {
        canvas.style.position = 'absolute';
        canvas.style.top = '0px';
        canvas.style.left = '0px';
        canvas.style.width = containerRect.width + 'px';
        canvas.style.height = containerRect.height + 'px';
        canvas.style.zIndex = `${10 + index}`; // Stack canvases with different z-indices
      });
    }
    
    console.log('🎨 Pose canvas size set to:', poseCanvas.width, 'x', poseCanvas.height);
    console.log('🎨 Club path canvas size set to:', clubPathCanvas.width, 'x', clubPathCanvas.height);
    console.log('🎨 Video rect:', videoRect.width, 'x', videoRect.height);

    const frame = Math.floor(video.currentTime * 30); // Assuming 30fps
    console.log('🎨 Current frame:', frame, 'Video time:', video.currentTime);
    console.log('🎨 Poses array length:', poses?.length);
    console.log('🎨 Frame within bounds:', frame < (poses?.length || 0));

    // Clear both canvases
    poseCtx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);
    clubPathCtx.clearRect(0, 0, clubPathCanvas.width, clubPathCanvas.height);

    // ALWAYS draw test indicators regardless of overlay settings
    console.log('🎨 Drawing test indicators...');
    drawTestIndicators(poseCtx, poseCanvas);

    if (overlaySettings.stickFigure) {
      console.log('🎨 Drawing stick figure...');
      // Ensure frame is within bounds
      const safeFrame = Math.min(frame, (poses?.length || 1) - 1);
      console.log('🎨 Safe frame for stick figure:', safeFrame);
      drawPoseOverlay(poseCtx, safeFrame);
    }
    if (overlaySettings.swingPlane) {
      console.log('🎨 Drawing swing plane...');
      const safeFrame = Math.min(frame, (poses?.length || 1) - 1);
      drawSwingPlane(poseCtx, safeFrame);
    }
    if (overlaySettings.phaseMarkers) {
      console.log('🎨 Drawing phase markers...');
      const safeFrame = Math.min(frame, (poses?.length || 1) - 1);
      drawPhaseMarkers(poseCtx, safeFrame);
    }
    if (overlaySettings.clubPath) {
      console.log('🎨 Drawing club path...');
      console.log('🎨 Club path settings:', overlaySettings.clubPath);
      const safeFrame = Math.min(frame, (poses?.length || 1) - 1);
      drawClubPath(clubPathCtx, safeFrame);
    } else {
      console.log('🎨 Club path disabled in settings');
    }
  }, [showOverlays, overlaySettings, drawPoseOverlay, drawSwingPlane, drawPhaseMarkers, drawClubPath, poses]);

  // Animation loop for smooth overlay rendering
  useEffect(() => {
    let animationFrameId: number;
    let lastDrawTime = 0;
    const FRAME_INTERVAL = 1000 / 60; // Target 60fps for smooth animation
    
    function animationLoop(timestamp: number) {
      // Only draw if enough time has passed since last draw
      if (timestamp - lastDrawTime >= FRAME_INTERVAL) {
        console.log('🎬 Animation loop drawing overlays at timestamp:', timestamp);
        drawOverlays();
        lastDrawTime = timestamp;
      }
      
      // Continue the animation loop
      animationFrameId = requestAnimationFrame(animationLoop);
    }
    
    // Start the animation loop
    console.log('🎬 Starting animation loop for overlays');
    animationFrameId = requestAnimationFrame(animationLoop);
    
    // Cleanup function
    return () => {
      console.log('🎬 Stopping animation loop');
      cancelAnimationFrame(animationFrameId);
    };
  }, [drawOverlays]);

  // Trigger initial overlay draw when video loads and auto-play
  useEffect(() => {
    if (videoRef.current && poses && poses.length > 0) {
      console.log('🎨 VIDEO LOADED - Triggering initial overlay draw');
      
      // Auto-play the video after a short delay
      setTimeout(() => {
        drawOverlays();
        
        // Auto-play video
        if (videoRef.current) {
          console.log('🎬 Auto-playing video');
          videoRef.current.play()
            .then(() => console.log('🎬 Video playback started'))
            .catch(err => console.error('🎬 Auto-play failed:', err));
        }
      }, 500); // Slightly longer delay to ensure video is ready
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
          {/* Pose Canvas - for stick figure, swing plane, phase markers */}
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
          {/* Club Path Canvas - for club path only */}
          <canvas
            ref={clubPathCanvasRef}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ 
              width: '100%', 
              height: '100%',
              maxHeight: '500px',
              zIndex: 11
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
