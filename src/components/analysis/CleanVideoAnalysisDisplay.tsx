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

    // Draw connections - simple and accurate
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

    // Draw keypoints - simple and accurate
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

  // Detect actual club head position using direct video analysis
  const detectClubHead = useCallback((frame: number): {x: number, y: number, confidence: number, method: string} => {
    console.log(`🏌️ DETECTING CLUB HEAD: Frame ${frame}`);
    
    if (!videoRef.current || !poses || poses.length === 0 || frame >= poses.length) {
      console.log('❌ Cannot detect club head - missing video or poses');
      return { x: 0.5, y: 0.5, confidence: 0, method: 'none' };
    }
    
    const video = videoRef.current;
    
    // Create a temporary canvas to analyze the current video frame
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth || 640;
    tempCanvas.height = video.videoHeight || 480;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    
    if (!tempCtx) {
      console.error('❌ Failed to get temporary canvas context');
      return { x: 0.5, y: 0.5, confidence: 0, method: 'failed_context' };
    }
    
    // Draw the current video frame to the temporary canvas
    try {
      tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      console.log(`✅ Drew video frame to temp canvas (${tempCanvas.width}x${tempCanvas.height})`);
    } catch (error) {
      console.error('❌ Error drawing video to canvas:', error);
      return { x: 0.5, y: 0.5, confidence: 0, method: 'draw_error' };
    }
    
    // Get pose data to help locate search area
    const pose = poses[frame];
    const leftWrist = pose?.landmarks?.[15];
    const rightWrist = pose?.landmarks?.[16];
    
    // Default search area (full frame)
    let searchX = 0;
    let searchY = 0;
    let searchWidth = tempCanvas.width;
    let searchHeight = tempCanvas.height;
    let method = 'full_frame_search';
    
    // If wrists are detected, focus search area around and below wrists
    if (leftWrist && rightWrist && 
        (leftWrist.visibility || 0) > 0.1 && (rightWrist.visibility || 0) > 0.1) {
      
      const wristCenterX = (leftWrist.x + rightWrist.x) / 2 * tempCanvas.width;
      const wristCenterY = (leftWrist.y + rightWrist.y) / 2 * tempCanvas.height;
      
      // Search area extends in all directions from wrists to capture full swing arc
      // Make search area much larger to ensure we find the club head at all positions
      searchX = Math.max(0, wristCenterX - tempCanvas.width * 0.5);
      searchY = Math.max(0, wristCenterY - tempCanvas.height * 0.5); // Look above wrists too for backswing
      searchWidth = Math.min(tempCanvas.width - searchX, tempCanvas.width * 0.9);
      searchHeight = Math.min(tempCanvas.height - searchY, tempCanvas.height * 0.9);
      method = 'wrist_guided_search';
      
      console.log(`🔍 Searching for club head in area: (${searchX.toFixed(0)},${searchY.toFixed(0)}) - ${searchWidth.toFixed(0)}x${searchHeight.toFixed(0)}`);
    }
    
    // Direct club head detection attempt
    try {
      // Get image data from the search area
      const imageData = tempCtx.getImageData(searchX, searchY, searchWidth, searchHeight);
      const data = imageData.data;
      
      // Variables to track potential club head
      let clubHeadX = 0;
      let clubHeadY = 0;
      let maxEdgeStrength = 0;
      let confidence = 0;
      
      // Only draw search area for current frame, not past frames
      // This prevents accumulating yellow boxes
      if (frame === Math.floor(videoRef.current.currentTime * 30)) {
        const mainCtx = poseCanvasRef.current?.getContext('2d');
        if (mainCtx) {
          // Draw search area for debugging
          mainCtx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
          mainCtx.lineWidth = 2;
          mainCtx.strokeRect(searchX, searchY, searchWidth, searchHeight);
          
          // Add label to search area
          mainCtx.fillStyle = 'rgba(255, 255, 0, 0.7)';
          mainCtx.font = '14px Arial';
          mainCtx.fillText('Club Search Area', searchX + 5, searchY + 20);
        }
      }
      
      // Analyze pixels to find club head (looking for high contrast, motion, etc.)
      // This is a simplified approach - a real implementation would use more sophisticated algorithms
      for (let y = 10; y < searchHeight - 10; y += 5) {
        for (let x = 10; x < searchWidth - 10; x += 5) {
          const idx = (y * searchWidth + x) * 4;
          
          // Skip if pixel is transparent
          if (data[idx + 3] < 128) continue;
          
          // Calculate local contrast (edge detection)
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          
          // Check surrounding pixels for edge detection
          const idxRight = (y * searchWidth + (x + 5)) * 4;
          const idxDown = ((y + 5) * searchWidth + x) * 4;
          
          const rDiff = Math.abs(r - data[idxRight]) + Math.abs(r - data[idxDown]);
          const gDiff = Math.abs(g - data[idxRight + 1]) + Math.abs(g - data[idxDown + 1]);
          const bDiff = Math.abs(b - data[idxRight + 2]) + Math.abs(b - data[idxDown + 2]);
          
          const edgeStrength = (rDiff + gDiff + bDiff) / 3;
          
          // Club head often has high contrast edges
          if (edgeStrength > maxEdgeStrength) {
            maxEdgeStrength = edgeStrength;
            clubHeadX = (searchX + x) / tempCanvas.width;
            clubHeadY = (searchY + y) / tempCanvas.height;
            confidence = Math.min(1.0, edgeStrength / 100); // Normalize confidence
            method = 'edge_detection';
          }
        }
      }
      
      // If we couldn't detect anything with confidence, use a fallback
      if (confidence < 0.2) {
        console.log(`⚠️ Low confidence detection (${confidence.toFixed(2)}), using fallback`);
        
        // Fallback: Use wrist position with extension if available
        if (leftWrist && rightWrist && 
            (leftWrist.visibility || 0) > 0.1 && (rightWrist.visibility || 0) > 0.1) {
          
          const wristCenterX = (leftWrist.x + rightWrist.x) / 2;
          const wristCenterY = (leftWrist.y + rightWrist.y) / 2;
          
          // Calculate the swing direction based on the golfer's body orientation
          if (pose.landmarks[11] && pose.landmarks[12] && // shoulders
              (pose.landmarks[11].visibility || 0) > 0.1 && (pose.landmarks[12].visibility || 0) > 0.1) {
            
            const shoulderCenterX = (pose.landmarks[11].x + pose.landmarks[12].x) / 2;
            const shoulderCenterY = (pose.landmarks[11].y + pose.landmarks[12].y) / 2;
            
            // Calculate direction vector from shoulders to wrists
            const dirX = wristCenterX - shoulderCenterX;
            const dirY = wristCenterY - shoulderCenterY;
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            
            if (length > 0) {
              // Use a longer club length for better visibility
              const clubLength = 0.4;
              
              // Normalize and extend to club head
              clubHeadX = wristCenterX + (dirX / length) * clubLength;
              clubHeadY = wristCenterY + (dirY / length) * clubLength;
              confidence = 0.5; // Medium confidence since it's based on body position
              method = 'body_position_fallback';
            } else {
              // Extend downward from wrists
              clubHeadX = wristCenterX;
              clubHeadY = wristCenterY + 0.4;
              confidence = 0.3;
              method = 'downward_extension_fallback';
            }
          } else {
            // Extend downward from wrists
            clubHeadX = wristCenterX;
            clubHeadY = wristCenterY + 0.4;
            confidence = 0.3;
            method = 'downward_extension_fallback';
          }
        } else {
          // Last resort: use center of frame
          clubHeadX = 0.5;
          clubHeadY = 0.7; // Lower part of frame where club head likely is
          confidence = 0.1;
          method = 'center_fallback';
        }
      }
      
      console.log(`🏌️ Club head detection for frame ${frame}: (${clubHeadX.toFixed(3)}, ${clubHeadY.toFixed(3)}) confidence: ${confidence.toFixed(2)} method: ${method}`);
      
      // Clean up
      tempCanvas.remove();
      
      return { 
        x: clubHeadX || 0.5, 
        y: clubHeadY || 0.5, 
        confidence: confidence || 0,
        method
      };
    } catch (error) {
      console.error('❌ Error in club head detection:', error);
      tempCanvas.remove();
      return { x: 0.5, y: 0.7, confidence: 0.1, method: 'error_fallback' };
    }
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
    
    // Draw club path trail (show last 30 frames for better visibility)
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 6; // Make it thick for visibility
    ctx.beginPath();
    
    const startFrame = Math.max(0, frame - 30);
    let pathPoints = 0;
    let clubHeadPositions = [];
    
    // Get club head positions for past frames
    for (let i = startFrame; i <= frame; i++) {
      const pastClubHead = detectClubHead(i);
      clubHeadPositions.push(pastClubHead);
      
      if (pastClubHead.confidence > 0) {
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

    // Draw current club head position (make it bigger)
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.arc(clubHeadX * canvas.width, clubHeadY * canvas.height, 15, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw confidence indicator
    const confidenceRadius = 25 * confidence;
    ctx.strokeStyle = `rgba(255, 0, 255, ${confidence})`;
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
    if (!poseCanvas || !clubPathCanvas || !video || !showOverlays) {
      console.log('❌ Draw overlays skipped:', { 
        poseCanvas: !!poseCanvas, 
        clubPathCanvas: !!clubPathCanvas,
        video: !!video, 
        showOverlays 
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
