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
  
  // CRITICAL DEBUG: Verify poses data quality
  if (poses && poses.length > 0) {
    const firstPose = poses[0];
    const isMockData = firstPose?.landmarks?.every((lm: any) => lm.x === 0.5 && lm.y === 0.5);
    const hasVariedPositions = firstPose?.landmarks?.some((lm: any) => lm.x !== 0.5 || lm.y !== 0.5);
    
    console.log('🔍 POSE DATA VERIFICATION IN COMPONENT:');
    console.log('🔍 - Poses count:', poses.length);
    console.log('🔍 - First pose exists:', !!firstPose);
    console.log('🔍 - First pose landmarks count:', firstPose?.landmarks?.length || 0);
    console.log('🔍 - Is mock data:', isMockData);
    console.log('🔍 - Has varied positions:', hasVariedPositions);
    console.log('🔍 - Data quality:', isMockData ? 'MOCK/DUMMY' : 'REAL');
    
    if (firstPose?.landmarks && firstPose.landmarks.length > 0) {
      console.log('🔍 SAMPLE LANDMARK DATA (first 3):');
      firstPose.landmarks.slice(0, 3).forEach((lm: any, i: number) => {
        console.log(`🔍   Landmark ${i}: x=${lm.x.toFixed(3)}, y=${lm.y.toFixed(3)}, visibility=${(lm.visibility || 0).toFixed(3)}`);
      });
    }
  } else {
    console.log('❌ NO POSES DATA AVAILABLE');
  }
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

  const drawPoseOverlay = useCallback((
    ctx: CanvasRenderingContext2D,
    frame: number,
    renderedWidth: number,
    renderedHeight: number,
    offsetX: number,
    offsetY: number
  ) => {
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
    
    // CRITICAL DEBUG: Verify we have REAL pose data, not mock data
    const isMockData = pose.landmarks.every((lm: any) => lm.x === 0.5 && lm.y === 0.5);
    const hasVariedPositions = pose.landmarks.some((lm: any) => lm.x !== 0.5 || lm.y !== 0.5);
    
    console.log('🔍 POSE DATA VERIFICATION:');
    console.log('🔍 - Is mock data:', isMockData);
    console.log('🔍 - Has varied positions:', hasVariedPositions);
    console.log('🔍 - Data quality:', isMockData ? 'MOCK/DUMMY' : 'REAL');
    
    // Log first few landmark coordinates to verify real data
    if (frame < 3) {
      console.log('🔍 SAMPLE LANDMARK COORDINATES (first 5):');
      pose.landmarks.slice(0, 5).forEach((lm: any, i: number) => {
        console.log(`🔍   Landmark ${i}: x=${lm.x.toFixed(3)}, y=${lm.y.toFixed(3)}, visibility=${(lm.visibility || 0).toFixed(3)}`);
      });
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

    // Draw skeleton connections - MoveNet 17 keypoints
    // MoveNet keypoint indices:
    // 0: nose, 1: left_eye, 2: right_eye, 3: left_ear, 4: right_ear
    // 5: left_shoulder, 6: right_shoulder, 7: left_elbow, 8: right_elbow
    // 9: left_wrist, 10: right_wrist, 11: left_hip, 12: right_hip
    // 13: left_knee, 14: right_knee, 15: left_ankle, 16: right_ankle
    const connections = [
      // Face outline (nose to eyes to ears)
      [0, 1], [0, 2], [1, 3], [2, 4],
      // Torso (shoulders to hips)
      [5, 6], [5, 11], [6, 12], [11, 12],
      // Left arm (shoulder to elbow to wrist)
      [5, 7], [7, 9],
      // Right arm (shoulder to elbow to wrist)
      [6, 8], [8, 10],
      // Left leg (hip to knee to ankle)
      [11, 13], [13, 15],
      // Right leg (hip to knee to ankle)
      [12, 14], [14, 16]
    ];

    // Draw connections - adaptive for different camera angles
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    
    connections.forEach(([start, end]) => {
      const startLandmark = pose.landmarks[start];
      const endLandmark = pose.landmarks[end];
      
      if (startLandmark && endLandmark && 
          (startLandmark.visibility || 0) > 0.3 && 
          (endLandmark.visibility || 0) > 0.3) {
        
        // Calculate distance between points to avoid drawing very long lines
        const dx = startLandmark.x - endLandmark.x;
        const dy = startLandmark.y - endLandmark.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // More strict distance validation for better accuracy
        if (distance > 0.02 && distance < 0.6) {
          // Additional validation: check if landmarks are within reasonable bounds
          const startInBounds = startLandmark.x > 0 && startLandmark.x < 1 && startLandmark.y > 0 && startLandmark.y < 1;
          const endInBounds = endLandmark.x > 0 && endLandmark.x < 1 && endLandmark.y > 0 && endLandmark.y < 1;
          
          if (startInBounds && endInBounds) {
            // Map normalized (0..1) coordinates to the actual rendered video content
            const startX = offsetX + startLandmark.x * renderedWidth;
            const startY = offsetY + startLandmark.y * renderedHeight;
            const endX = offsetX + endLandmark.x * renderedWidth;
            const endY = offsetY + endLandmark.y * renderedHeight;
            
            // Debug: Log coordinates for first few frames
            if (frame < 3) {
              console.log(`🎨 Drawing line from (${startX.toFixed(1)}, ${startY.toFixed(1)}) to (${endX.toFixed(1)}, ${endY.toFixed(1)})`);
              console.log(`🎨 Normalized coords: start(${startLandmark.x.toFixed(3)}, ${startLandmark.y.toFixed(3)}) end(${endLandmark.x.toFixed(3)}, ${endLandmark.y.toFixed(3)})`);
              console.log(`🎨 Canvas size: ${canvas.width}x${canvas.height}, Rendered video: ${renderedWidth.toFixed(1)}x${renderedHeight.toFixed(1)}, Offset: ${offsetX.toFixed(1)},${offsetY.toFixed(1)}`);
            }
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          }
        }
      }
    });

    // Draw keypoints - adaptive for different camera angles with better validation
    pose.landmarks.forEach((landmark: any, index: number) => {
      if ((landmark.visibility || 0) > 0.3 && 
          landmark.x > 0 && landmark.x < 1 && 
          landmark.y > 0 && landmark.y < 1) { // Better validation for accuracy
        // Make keypoints slightly larger for better visibility
        const radius = 5;
        
        // Different colors for different body parts based on MoveNet 17 keypoints
        if (index >= 0 && index <= 4) {
          ctx.fillStyle = '#ff0000'; // Face (0-4: nose, eyes, ears) - red
        } else if (index >= 5 && index <= 10) {
          ctx.fillStyle = '#00ff00'; // Upper body (5-10: shoulders, elbows, wrists) - green
        } else if (index >= 11 && index <= 12) {
          ctx.fillStyle = '#ffff00'; // Hips (11-12) - yellow
        } else if (index >= 13 && index <= 16) {
          ctx.fillStyle = '#ff00ff'; // Legs (13-16: knees, ankles) - magenta
        } else {
          ctx.fillStyle = '#00ffff'; // Fallback - cyan
        }
        
        // Map normalized (0..1) coordinates to the actual rendered video content
        const keypointX = offsetX + landmark.x * renderedWidth;
        const keypointY = offsetY + landmark.y * renderedHeight;
        
        // Debug: Log keypoint coordinates for first few frames
        if (frame < 3 && index < 5) {
          console.log(`🎨 Keypoint ${index}: (${keypointX.toFixed(1)}, ${keypointY.toFixed(1)}) from normalized (${landmark.x.toFixed(3)}, ${landmark.y.toFixed(3)})`);
              console.log(`🎨 Canvas size: ${canvas.width}x${canvas.height}, Rendered video: ${renderedWidth.toFixed(1)}x${renderedHeight.toFixed(1)}, Offset: ${offsetX.toFixed(1)},${offsetY.toFixed(1)}`);
        }
        
        ctx.beginPath();
        ctx.arc(keypointX, keypointY, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add white outline for better visibility
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  }, [poses]);

  // Draw swing plane
  const drawSwingPlane = useCallback((
    ctx: CanvasRenderingContext2D,
    frame: number,
    renderedWidth: number,
    renderedHeight: number,
    offsetX: number,
    offsetY: number
  ) => {
    if (!poses || poses.length === 0) return;

    const pose = poses[frame];
    if (!pose || !pose.landmarks || pose.landmarks.length === 0) return;

    const canvas = poseCanvasRef.current;
    if (!canvas) return;

    // Find key points for swing plane (MoveNet indices)
    const leftShoulder = pose.landmarks[5];
    const rightShoulder = pose.landmarks[6];
    const leftHip = pose.landmarks[11];
    const rightHip = pose.landmarks[12];

    if (leftShoulder && rightShoulder && leftHip && rightHip &&
        (leftShoulder.visibility || 0) > 0.3 && (rightShoulder.visibility || 0) > 0.3 &&
        (leftHip.visibility || 0) > 0.3 && (rightHip.visibility || 0) > 0.3) {
      
      // Draw swing plane line (shoulder to hip)
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 4]);
      
      ctx.beginPath();
      ctx.moveTo(
        offsetX + ((leftShoulder.x + rightShoulder.x) / 2) * renderedWidth,
        offsetY + ((leftShoulder.y + rightShoulder.y) / 2) * renderedHeight
      );
      ctx.lineTo(
        offsetX + ((leftHip.x + rightHip.x) / 2) * renderedWidth,
        offsetY + ((leftHip.y + rightHip.y) / 2) * renderedHeight
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
  const drawPhaseMarkers = useCallback((
    ctx: CanvasRenderingContext2D,
    frame: number,
    renderedWidth: number,
    renderedHeight: number,
    offsetX: number,
    offsetY: number
  ) => {
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
    ctx.fillRect(offsetX + 10, offsetY + renderedHeight - 30, renderedWidth - 20, 15);
    ctx.fillStyle = phaseColor;
    ctx.fillRect(offsetX + 10, offsetY + renderedHeight - 30, (renderedWidth - 20) * progress, 15);
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
  const drawClubPath = useCallback((
    ctx: CanvasRenderingContext2D,
    frame: number,
    renderedWidth: number,
    renderedHeight: number,
    offsetX: number,
    offsetY: number
  ) => {
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
          ctx.moveTo(offsetX + pastClubHead.x * renderedWidth, offsetY + pastClubHead.y * renderedHeight);
        } else {
          ctx.lineTo(offsetX + pastClubHead.x * renderedWidth, offsetY + pastClubHead.y * renderedHeight);
        }
        pathPoints++;
      }
    }
    
    console.log('🎨 Club path points drawn:', pathPoints);
    ctx.stroke();

    // Draw current club head position (make it bigger and more visible)
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.arc(offsetX + clubHeadX * renderedWidth, offsetY + clubHeadY * renderedHeight, 12, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw white outline for better visibility
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(offsetX + clubHeadX * renderedWidth, offsetY + clubHeadY * renderedHeight, 12, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw confidence indicator (pulsing effect)
    const confidenceRadius = 20 + (10 * confidence);
    ctx.strokeStyle = `rgba(255, 0, 255, ${confidence * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(offsetX + clubHeadX * renderedWidth, offsetY + clubHeadY * renderedHeight, confidenceRadius, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw club path label with background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(offsetX + 10, offsetY + renderedHeight - 100, 200, 40);
    ctx.fillStyle = '#ff00ff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`CLUB PATH (${method})`, offsetX + 15, offsetY + renderedHeight - 75);
    ctx.fillText(`Points: ${pathPoints}`, offsetX + 15, offsetY + renderedHeight - 55);
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

    // Get video display rect and compute rendered content rect (letterbox-aware)
    const videoRect = video.getBoundingClientRect();
    const displayWidth = videoRect.width;
    const displayHeight = videoRect.height;

    const nativeWidth = video.videoWidth || 640;
    const nativeHeight = video.videoHeight || 480;
    const nativeAspect = nativeWidth / nativeHeight;
    const displayAspect = displayWidth / displayHeight;

    let renderedWidth = displayWidth;
    let renderedHeight = displayHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (displayAspect > nativeAspect) {
      // Canvas wider than content; pillarbox left/right
      renderedHeight = displayHeight;
      renderedWidth = renderedHeight * nativeAspect;
      offsetX = (displayWidth - renderedWidth) / 2;
    } else if (displayAspect < nativeAspect) {
      // Canvas taller than content; letterbox top/bottom
      renderedWidth = displayWidth;
      renderedHeight = renderedWidth / nativeAspect;
      offsetY = (displayHeight - renderedHeight) / 2;
    }

    // Set canvas dimensions to match the display size
    poseCanvas.width = displayWidth;
    poseCanvas.height = displayHeight;
    clubPathCanvas.width = displayWidth;
    clubPathCanvas.height = displayHeight;
    
    console.log('🎨 Canvas dimensions set to:', {
      videoNative: { width: nativeWidth, height: nativeHeight },
      videoDisplay: { width: displayWidth, height: displayHeight },
      renderedContent: { width: renderedWidth, height: renderedHeight, offsetX, offsetY },
      poseCanvas: { width: poseCanvas.width, height: poseCanvas.height },
      clubPathCanvas: { width: clubPathCanvas.width, height: clubPathCanvas.height }
    });
    
    // Set CSS size to match video display size exactly
    const containerRect = video.parentElement?.getBoundingClientRect();
    
    if (containerRect) {
      // Calculate the video's position within the container
      const videoOffsetX = videoRect.left - containerRect.left;
      const videoOffsetY = videoRect.top - containerRect.top;
      
      // Position both canvases to match the video's position and size
      const canvases = [poseCanvas, clubPathCanvas];
      canvases.forEach((canvas, index) => {
        canvas.style.position = 'absolute';
        canvas.style.top = videoOffsetY + 'px';
        canvas.style.left = videoOffsetX + 'px';
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        canvas.style.zIndex = `${10 + index}`; // Stack canvases with different z-indices
      });
      
      console.log('🎨 Canvas positioning:', {
        videoOffsetX,
        videoOffsetY,
        videoRect: { width: videoRect.width, height: videoRect.height },
        containerRect: { width: containerRect.width, height: containerRect.height }
      });
    }
    
    console.log('🎨 Pose canvas size set to:', poseCanvas.width, 'x', poseCanvas.height);
    console.log('🎨 Club path canvas size set to:', clubPathCanvas.width, 'x', clubPathCanvas.height);
    console.log('🎨 Video rect:', displayWidth, 'x', displayHeight);

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
      drawPoseOverlay(poseCtx, safeFrame, renderedWidth, renderedHeight, offsetX, offsetY);
    }
    if (overlaySettings.swingPlane) {
      console.log('🎨 Drawing swing plane...');
      const safeFrame = Math.min(frame, (poses?.length || 1) - 1);
      drawSwingPlane(poseCtx, safeFrame, renderedWidth, renderedHeight, offsetX, offsetY);
    }
    if (overlaySettings.phaseMarkers) {
      console.log('🎨 Drawing phase markers...');
      const safeFrame = Math.min(frame, (poses?.length || 1) - 1);
      drawPhaseMarkers(poseCtx, safeFrame, renderedWidth, renderedHeight, offsetX, offsetY);
    }
    if (overlaySettings.clubPath) {
      console.log('🎨 Drawing club path...');
      console.log('🎨 Club path settings:', overlaySettings.clubPath);
      const safeFrame = Math.min(frame, (poses?.length || 1) - 1);
      drawClubPath(clubPathCtx, safeFrame, renderedWidth, renderedHeight, offsetX, offsetY);
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
