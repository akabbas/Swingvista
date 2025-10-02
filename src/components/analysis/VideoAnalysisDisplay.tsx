/**
 * Video Analysis Display - Comprehensive Golf Swing Video Analysis
 * 
 * This component displays the video with real-time overlays including
 * stick figure, swing plane, phase markers, and club path tracking.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RealGolfAnalysis, SwingVisualization } from '@/lib/real-golf-analysis';
import type { PoseResult } from '@/lib/mediapipe';
import { loadVideoWithFallbacks, diagnoseVideoLoading } from '@/lib/video-loading-fixes';

interface VideoAnalysisDisplayProps {
  videoFile: File;
  videoUrl?: string;
  analysis: RealGolfAnalysis | null;
  isAnalyzing: boolean;
  isSampleVideo?: boolean;
  poses?: PoseResult[];
}

export default function VideoAnalysisDisplay({ videoFile, videoUrl, analysis, isAnalyzing, isSampleVideo = false, poses }: VideoAnalysisDisplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const poseCanvasRef = useRef<HTMLCanvasElement>(null);
  const planeCanvasRef = useRef<HTMLCanvasElement>(null);
  const phaseCanvasRef = useRef<HTMLCanvasElement>(null);
  const pathCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Video state management
  const [videoState, setVideoState] = useState({
    currentFrame: 0,
    isPlaying: false,
    playbackSpeed: 1.0,
    isLoaded: false,
    isBuffering: false,
    isSeeking: false,
    error: null as string | null,
    loadingStatus: 'Ready to load',
    lastUpdateTime: 0,
    totalFrames: 0
  });

  // Update video state atomically
  const updateVideoState = useCallback((updates: Partial<typeof videoState>) => {
    setVideoState(prev => ({ ...prev, ...updates }));
  }, []);
  const [showOverlays, setShowOverlays] = useState({
    stickFigure: true,
    swingPlane: true,
    phases: true,
    clubPath: true,
    alignment: true
  });

  // Debug logging
  useEffect(() => {
    console.log('🎨 VideoAnalysisDisplay mounted with props:', {
      hasVideoFile: !!videoFile, 
      hasVideoUrl: !!videoUrl,
      hasAnalysis: !!analysis, 
      hasVisualizations: !!analysis?.visualizations, 
      hasStickFigure: !!analysis?.visualizations?.stickFigure,
      stickFigureLength: analysis?.visualizations?.stickFigure?.length || 0,
      hasPoses: !!poses,
      posesLength: poses?.length || 0,
      videoFileName: videoFile?.name
    });
    
    // Detailed analysis structure logging
    if (analysis) {
      console.log('📊 Analysis structure:', {
        analysisKeys: Object.keys(analysis),
        visualizations: analysis.visualizations ? Object.keys(analysis.visualizations) : 'none',
        phases: analysis.phases ? `Array with ${analysis.phases.length} phases` : 'none',
        poses: poses ? `Array with ${poses.length} poses` : 'none'
      });
    } else {
      console.log('❌ No analysis data provided to VideoAnalysisDisplay');
    }
    
  // Debug pose data specifically
  if (poses && poses.length > 0) {
    console.log('🔍 POSE DATA DEBUG: First few poses:', poses.slice(0, 3).map((pose, i) => ({
      frame: i,
      hasLandmarks: !!pose.landmarks,
      landmarksCount: pose.landmarks?.length || 0,
      firstLandmark: pose.landmarks?.[0] || 'none',
      confidence: pose.confidence
    })));
    console.log('🔍 POSE DATA DEBUG: Total poses available:', poses.length);
    console.log('🔍 POSE DATA DEBUG: Sample pose structure:', poses[0]);
  } else {
    console.log('❌ No poses data available for overlays');
  }
  
  // Debug analysis structure
  if (analysis) {
    console.log('🔍 ANALYSIS DEBUG: Analysis structure:', {
      hasVisualizations: !!analysis.visualizations,
      visualizationKeys: analysis.visualizations ? Object.keys(analysis.visualizations) : 'none',
      hasPhases: !!analysis.phases,
      phasesCount: analysis.phases?.length || 0,
      hasMetrics: !!analysis.metrics,
      metricsKeys: analysis.metrics ? Object.keys(analysis.metrics) : 'none'
    });
  }
  }, [videoFile, videoUrl, analysis, poses]);

  // Simple video loading - no complex state management
  const hasLoadedRef = useRef(false);
  const [reloadKey, setReloadKey] = useState(0);
  
  useEffect(() => {
    if (!videoRef.current) return;
    
    // Reset hasLoadedRef when videoFile or videoUrl changes
    hasLoadedRef.current = false;

    let blobUrl = '';
    let videoSrc = '';

    console.log('🎥 Video loading effect triggered:', {
      videoFile: videoFile?.name,
      videoUrl,
      isSampleVideo,
      hasVideoRef: !!videoRef.current
    });

    // Determine video source - try multiple approaches
    if (isSampleVideo && videoUrl) {
      videoSrc = videoUrl;
      console.log('🎥 Using sample video URL:', videoSrc);
    } else if (videoFile) {
      try {
        blobUrl = URL.createObjectURL(videoFile);
        videoSrc = blobUrl;
        console.log('🎥 Created blob URL for video file:', videoSrc);
      } catch (error) {
        console.error('❌ Error creating blob URL:', error);
        // Fallback to videoUrl if available
        if (videoUrl) {
          videoSrc = videoUrl;
          console.log('🎥 Fallback to videoUrl:', videoSrc);
        } else {
          updateVideoState({
            error: 'Failed to process video file. Please try a different format.',
            isLoaded: false
          });
          return;
        }
      }
    } else if (videoUrl) {
      videoSrc = videoUrl;
      console.log('🎥 Using provided video URL:', videoSrc);
    }

    if (videoSrc) {
      hasLoadedRef.current = true;
      videoRef.current.src = videoSrc;
      videoRef.current.load();
      console.log('🎥 Video source set and load() called');
    } else {
      console.warn('⚠️ No video source available');
      updateVideoState({
        error: 'No video source available',
        isLoaded: false
      });
    }

    // Cleanup blob URL when component unmounts
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [videoFile, videoUrl, isSampleVideo]);

  // Retry video loading
  const retryVideoLoading = useCallback(() => {
    console.log('🔄 Retrying video loading...');
    hasLoadedRef.current = false;
    setReloadKey(prev => prev + 1);
    updateVideoState({
      error: null,
      isLoaded: false
    });
  }, []);

  // Calculate current frame from video time
  const calculateFrame = useCallback((video: HTMLVideoElement) => {
    if (!video.duration) return 0;
    const fps = 30; // Assume 30fps
    const frame = Math.floor(video.currentTime * fps);
    console.log('🎬 Frame calculation:', {
      currentTime: video.currentTime.toFixed(3),
      duration: video.duration.toFixed(3),
      fps,
      calculatedFrame: frame
    });
    return frame;
  }, []);

  // Draw stick figure overlay
  const drawStickFigure = useCallback((canvas: HTMLCanvasElement, frame: number) => {
    console.log('🖌️ drawStickFigure called for frame:', frame, 'canvas size:', canvas.width, 'x', canvas.height);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('❌ No canvas context available');
      return;
    }

    // Clear canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw a simple test overlay to verify canvas is working
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 100, 50);
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('TEST OVERLAY', 15, 35);

    console.log('🖌️ Drawing stick figure on canvas:', canvas.width, 'x', canvas.height);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(50, 50, 100, 50);
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Frame ${frame}`, 60, 75);
    
    // Try to get pose data from visualizations first, then from poses
    let poseData = null;
    let landmarks = null;
    
    console.log('🔍 POSE DEBUG: Frame:', frame, 'Poses available:', poses?.length, 'Analysis visualizations:', !!analysis?.visualizations?.stickFigure);
    
    if (analysis?.visualizations?.stickFigure && analysis.visualizations.stickFigure[frame]) {
      poseData = analysis.visualizations.stickFigure[frame];
      landmarks = poseData.landmarks;
      console.log('🖌️ Using stick figure data from visualizations');
    } else if (poses && poses[frame]) {
      poseData = poses[frame];
      landmarks = poseData?.landmarks;
      console.log('🖌️ Using pose data from extracted poses:', {
        frame,
        poseData: poseData ? 'exists' : 'null',
        landmarksCount: landmarks?.length || 0,
        firstLandmark: landmarks?.[0]
      });
    } else {
      console.log('❌ No pose data available for frame:', frame, 'Total poses:', poses?.length);
    }
    
    if (!landmarks || landmarks.length === 0) {
      console.log('❌ No landmarks data for frame:', frame, 'Using fallback');
      drawFallbackStickFigure(ctx, canvas.width, canvas.height, frame);
      return;
    }

    console.log('🖌️ Drawing with', landmarks.length, 'landmarks');
    
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

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    
    connections.forEach(([start, end]) => {
      if (landmarks[start] && landmarks[end] && 
          (landmarks[start].visibility ?? 1) > 0.1 && (landmarks[end].visibility ?? 1) > 0.1) {
        ctx.beginPath();
        ctx.moveTo(landmarks[start].x * canvas.width, landmarks[start].y * canvas.height);
        ctx.lineTo(landmarks[end].x * canvas.width, landmarks[end].y * canvas.height);
        ctx.stroke();
      }
    });

    // Draw keypoints
    landmarks.forEach((landmark: any, i: number) => {
      if ((landmark.visibility ?? 1) > 0.1) {
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
    
    // If no landmarks drawn, draw a simple fallback stick figure
    if (landmarks.filter((l: any) => (l.visibility ?? 1) > 0.1).length === 0) {
      console.log('🖌️ Drawing fallback stick figure');
      drawFallbackStickFigure(ctx, canvas.width, canvas.height, frame);
    }
  }, [analysis, poses]);

  // Simple stick figure initialization
  const ensureStickFigureWorks = useCallback((videoElement: HTMLVideoElement, poses: any[], canvasElement: HTMLCanvasElement) => {
    console.log("🖌️ Simple stick figure initialization");
    return true; // Just return true, let the animation loop handle drawing
  }, []);

  // Draw skeleton connections
  const drawSkeleton = useCallback((ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number) => {
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

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    
    connections.forEach(([start, end]) => {
      if (landmarks[start] && landmarks[end] && 
          landmarks[start].visibility > 0.5 && landmarks[end].visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(landmarks[start].x * width, landmarks[start].y * height);
        ctx.lineTo(landmarks[end].x * width, landmarks[end].y * height);
        ctx.stroke();
      }
    });
  }, []);

  // Draw keypoints
  const drawKeypoints = useCallback((ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number) => {
    landmarks.forEach((landmark: any, i: number) => {
      if (landmark.visibility > 0.5) {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(
          landmark.x * width, 
          landmark.y * height, 
          4, 0, 2 * Math.PI
        );
        ctx.fill();
      }
    });
  }, []);

  // Fallback stick figure drawing
  const drawFallbackStickFigure = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) / 400;
    
    // Draw a simple stick figure
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    
    // Head
    ctx.beginPath();
    ctx.arc(centerX, centerY - 50 * scale, 15 * scale, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Body
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 35 * scale);
    ctx.lineTo(centerX, centerY + 50 * scale);
    ctx.stroke();
    
    // Arms
    const armAngle = Math.sin(frame * 0.1) * 0.5;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 20 * scale);
    ctx.lineTo(centerX + Math.cos(armAngle) * 40 * scale, centerY - 20 * scale + Math.sin(armAngle) * 40 * scale);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 20 * scale);
    ctx.lineTo(centerX - Math.cos(armAngle) * 40 * scale, centerY - 20 * scale + Math.sin(armAngle) * 40 * scale);
    ctx.stroke();
    
    // Legs
    const legAngle = Math.sin(frame * 0.1 + Math.PI) * 0.3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 50 * scale);
    ctx.lineTo(centerX + legAngle * 30 * scale, centerY + 80 * scale);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 50 * scale);
    ctx.lineTo(centerX - legAngle * 30 * scale, centerY + 80 * scale);
    ctx.stroke();
  }, []);

  // Draw swing plane overlay
  const drawSwingPlane = useCallback((canvas: HTMLCanvasElement, frame: number) => {
    if (!analysis?.visualizations?.swingPlane) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const planeData = analysis.visualizations.swingPlane[frame];
    if (!planeData) return;

    // Draw swing plane line
    ctx.strokeStyle = '#0066ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    const centerY = canvas.height * 0.6;
    const planeAngle = planeData.plane || 45;
    
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY - (canvas.width * Math.tan(planeAngle * Math.PI / 180)));
    ctx.stroke();
    
    ctx.setLineDash([]);
  }, [analysis]);

  // Draw phase markers
  const drawPhaseMarkers = useCallback((canvas: HTMLCanvasElement, frame: number) => {
    if (!analysis?.phases) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const currentPhase = analysis.phases.find(phase => 
      frame >= phase.startFrame && frame <= phase.endFrame
    );
    
    if (currentPhase) {
      // Draw phase indicator
      ctx.fillStyle = '#ffaa00';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        currentPhase.name.toUpperCase(), 
        canvas.width / 2, 
        30
      );
      
      // Draw phase progress bar
      const progress = (frame - currentPhase.startFrame) / (currentPhase.endFrame - currentPhase.startFrame);
      const barWidth = canvas.width * 0.8;
      const barHeight = 8;
      const barX = (canvas.width - barWidth) / 2;
      const barY = 50;
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    }

    // Impact frame indicator (highlight border and label when near impact)
    if (analysis?.impactFrame !== undefined && Math.abs(frame - analysis.impactFrame) <= 1) {
      ctx.strokeStyle = '#FF4136';
      ctx.lineWidth = 3;
      ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
      ctx.fillStyle = '#FF4136';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Impact', 16, 36);
    }
  }, [analysis]);

  // Draw club path overlay
  const drawClubPath = useCallback((canvas: HTMLCanvasElement, frame: number) => {
    if (!analysis?.visualizations?.clubPath) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw club path trail
    const pathData = analysis.visualizations.clubPath.slice(0, frame + 1);
    
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 3;
    
    if (pathData.length > 1) {
      ctx.beginPath();
      pathData.forEach((point, index) => {
        const x = (index / pathData.length) * canvas.width;
        const y = canvas.height * 0.7 - (point.path - 45) * 2;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }
  }, [analysis]);

  // Update overlays when frame changes
  useEffect(() => {
    if (!analysis) {
      console.log('🎨 No analysis data for overlays');
      return;
    }

    console.log('🎨 Drawing overlays for frame:', videoState.currentFrame, 'with analysis:', !!analysis.visualizations);
    console.log('🎨 Overlay settings:', showOverlays);
    console.log('🎨 Canvas refs:', {
      poseCanvas: !!poseCanvasRef.current,
      planeCanvas: !!planeCanvasRef.current,
      phaseCanvas: !!phaseCanvasRef.current,
      pathCanvas: !!pathCanvasRef.current
    });

    // Draw stick figure overlay
    if (showOverlays.stickFigure && poseCanvasRef.current) {
      console.log('🖌️ Drawing stick figure overlay');
      drawStickFigure(poseCanvasRef.current, videoState.currentFrame);
    }

    // Draw swing plane overlay
    if (showOverlays.swingPlane && planeCanvasRef.current) {
      console.log('✈️ Drawing swing plane overlay');
      drawSwingPlane(planeCanvasRef.current, videoState.currentFrame);
    }

    // Draw phase markers
    if (showOverlays.phases && phaseCanvasRef.current) {
      console.log('📊 Drawing phase markers');
      drawPhaseMarkers(phaseCanvasRef.current, videoState.currentFrame);
    }

    // Draw club path
    if (showOverlays.clubPath && pathCanvasRef.current) {
      console.log('🏌️ Drawing club path');
      drawClubPath(pathCanvasRef.current, videoState.currentFrame);
    }
  }, [videoState.currentFrame, analysis, showOverlays, drawStickFigure, drawSwingPlane, drawPhaseMarkers, drawClubPath]);

  // --- Stable Overlay Animation Loop ---
  useEffect(() => {
    let animationFrameId: number;
    let lastDrawTime = 0;
    const FRAME_INTERVAL = 1000 / 60; // Target 60fps for smooth drawing

    function drawAllOverlays(timestamp: number) {
      const video = videoRef.current;
      
      // Only draw if video is playing and ready
      if (!video || !analysis || !videoState.isPlaying || videoState.isSeeking) {
        // Continue animation loop only if video is playing
        if (videoState.isPlaying) {
          animationFrameId = requestAnimationFrame(drawAllOverlays);
        }
        return;
      }

      // Throttle drawing to maintain consistent frame rate
      if (timestamp - lastDrawTime < FRAME_INTERVAL) {
        animationFrameId = requestAnimationFrame(drawAllOverlays);
        return;
      }

      // Calculate frame directly from video current time for smooth animation
      const frame = calculateFrame(video);
      lastDrawTime = timestamp;

      // Debug animation loop
      if (frame % 30 === 0) { // Log every 30 frames (1 second at 30fps)
        console.log('🎬 ANIMATION LOOP DEBUG:', {
          frame,
          videoTime: video.currentTime,
          isPlaying: videoState.isPlaying,
          hasAnalysis: !!analysis,
          hasPoses: !!poses,
          posesCount: poses?.length || 0,
          showOverlays
        });
      }

      // Clear all canvases first
      [poseCanvasRef, planeCanvasRef, phaseCanvasRef, pathCanvasRef].forEach(canvasRef => {
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }
      });

      // Draw all enabled overlays
      try {
        if (showOverlays.stickFigure && poseCanvasRef.current) {
          console.log('🎨 Drawing stick figure for frame:', frame);
          drawStickFigure(poseCanvasRef.current, frame);
        }
        if (showOverlays.swingPlane && planeCanvasRef.current) {
          drawSwingPlane(planeCanvasRef.current, frame);
        }
        if (showOverlays.phases && phaseCanvasRef.current) {
          drawPhaseMarkers(phaseCanvasRef.current, frame);
        }
        if (showOverlays.clubPath && pathCanvasRef.current) {
          drawClubPath(pathCanvasRef.current, frame);
        }

        // Draw frame counter for debugging
        if (poseCanvasRef.current) {
          const ctx = poseCanvasRef.current.getContext('2d');
          if (ctx) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(10, 10, 150, 30);
            ctx.fillStyle = 'white';
            ctx.font = '12px monospace';
            ctx.fillText(`Frame: ${frame}/${videoState.totalFrames}`, 20, 30);
          }
        }
      } catch (error) {
        console.error('❌ Error drawing overlays:', error);
      }

      // Continue animation loop if video is still playing
      if (videoState.isPlaying && !video.ended) {
        animationFrameId = requestAnimationFrame(drawAllOverlays);
      }
    }

    // Start animation loop only when video starts playing
    if (videoState.isPlaying && analysis) {
      animationFrameId = requestAnimationFrame(drawAllOverlays);
    }
    
    // Also trigger a single draw if poses are available but video isn't playing
    if (poses && poses.length > 0 && !videoState.isPlaying) {
      console.log('🎨 Triggering single overlay draw for static poses');
      drawAllOverlays(performance.now());
    }

    // Clean up
    return () => {
      if (animationFrameId) {
        console.log('⏸️ Stopping animation loop');
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [
    videoState.isPlaying,
    videoState.isSeeking,
    videoState.currentFrame,
    analysis,
    showOverlays,
    drawStickFigure,
    drawSwingPlane,
    drawPhaseMarkers,
    drawClubPath,
    poses // Added poses to dependencies
  ]);

  // Simplified time update handler - minimal state updates
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || videoState.isSeeking) return;
    
    const video = videoRef.current;
    const now = performance.now();
    
    // Throttle updates to prevent conflicts
    if (now - videoState.lastUpdateTime < 100) return; // 10fps max for time updates
    
    const frame = Math.round(video.currentTime * 30);
    
    // Only update frame, let animation loop handle the rest
    updateVideoState({
      currentFrame: frame,
      lastUpdateTime: now
    });
  }, [videoState.lastUpdateTime, videoState.isSeeking, updateVideoState]);

  // Stable play/pause handlers
  const handlePlay = useCallback(() => {
    updateVideoState({ isPlaying: true });
  }, [updateVideoState]);

  const handlePause = useCallback(() => {
    updateVideoState({ isPlaying: false });
  }, [updateVideoState]);

  // Stable seeking handlers
  const handleSeeking = useCallback(() => {
    updateVideoState({ isSeeking: true });
  }, [updateVideoState]);

  const handleSeeked = useCallback(() => {
    if (!videoRef.current) return;
    const frame = Math.round(videoRef.current.currentTime * 30);
    updateVideoState({ 
      isSeeking: false,
      currentFrame: frame,
      lastUpdateTime: performance.now()
    });
  }, [updateVideoState]);

  // Handle playback speed change with state update
  const handleSpeedChange = useCallback((speed: number) => {
    if (!videoRef.current) return;
      videoRef.current.playbackRate = speed;
    updateVideoState({ playbackSpeed: speed });
  }, [updateVideoState]);

  // Seek to specific frame
  const seekToFrame = useCallback((frame: number) => {
    if (videoRef.current && videoRef.current.duration) {
      const fps = 30;
      videoRef.current.currentTime = frame / fps;
    }
  }, []);

  // Seek to impact frame
  const seekToImpact = useCallback(() => {
    if (analysis?.impactFrame) {
      seekToFrame(analysis.impactFrame);
    }
  }, [analysis, seekToFrame]);

  // Simple initialization
  const initializeStickFigure = useCallback(() => {
    console.log('🖌️ Simple initialization triggered');
        return true;
  }, []);

  // Force video reload
  const reloadVideo = useCallback(() => {
    if (videoRef.current) {
      console.log('🔄 Reloading video...');
      videoRef.current.load();
      updateVideoState({
        isLoaded: false,
        error: null,
        loadingStatus: 'Reloading video...'
      });
      console.log('✅ Video reload initiated');
    }
  }, []);

  // Simple canvas initialization - let CSS handle sizing
  useEffect(() => {
    if (!analysis) return;
    
    // Just set basic canvas dimensions and let CSS handle the rest
    [poseCanvasRef, planeCanvasRef, phaseCanvasRef, pathCanvasRef].forEach((canvasRef) => {
        if (canvasRef.current) {
        canvasRef.current.width = 640;
        canvasRef.current.height = 480;
      }
    });
  }, [analysis]);

  return (
    <div className="video-analysis-container bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Video Analysis</h2>
      
      {/* Video Player with Overlays */}
      <div className="relative mb-4">
        <video
          key={reloadKey}
          ref={videoRef}
          controls
          crossOrigin="anonymous"
          loop={false}
          autoPlay={false}
          preload="metadata"
          playsInline
          className="w-full max-w-4xl mx-auto rounded-lg shadow-lg"
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeeking={handleSeeking}
          onSeeked={handleSeeked}
          onWaiting={() => {}}
          onCanPlay={() => {}}
          onLoadedData={() => {
            updateVideoState({
              isLoaded: true,
              error: null,
              totalFrames: Math.floor((videoRef.current?.duration || 0) * 30)
            });
          }}
          onError={(e) => {
            const video = e.target as HTMLVideoElement;
            const error = video.error;
            console.error('❌ Video load error:', {
              error,
              errorCode: error?.code,
              errorMessage: error?.message,
              videoSrc: video.src,
              videoNetworkState: video.networkState,
              videoReadyState: video.readyState
            });
            
            let errorMessage = 'Failed to load video. Please try a different format.';
            if (error) {
              switch (error.code) {
                case 1:
                  errorMessage = 'Video loading was aborted.';
                  break;
                case 2:
                  errorMessage = 'Network error occurred while loading video.';
                  break;
                case 3:
                  errorMessage = 'Video decoding error. File may be corrupted.';
                  break;
                case 4:
                  errorMessage = 'Video format not supported.';
                  break;
              }
            }
            
            updateVideoState({
              error: errorMessage,
              isLoaded: false
            });
          }}
          onLoadStart={() => {
            // Video loading started
          }}
          onEnded={() => {
            updateVideoState({ isPlaying: false });
          }}
        />
        
        {/* Video Loading Status */}
        {!videoState.isLoaded && !videoState.error && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <p className="text-blue-700">{videoState.loadingStatus}</p>
            </div>
          </div>
        )}

        {/* Video Error Display */}
        {videoState.error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">❌</span>
                <p className="text-red-700">{videoState.error}</p>
              </div>
              <button
                onClick={retryVideoLoading}
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
            <div className="mt-2 text-sm text-red-600">
              <p>If this is a sample video, try:</p>
              <ul className="list-disc list-inside ml-4">
                <li>Clicking the Retry button above</li>
                <li>Refreshing the page</li>
                <li>Checking your internet connection</li>
                <li>Using a different browser</li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Overlay Canvases - Positioned absolutely over video */}
        {analysis && !videoState.error && (
          <>
            <canvas
              ref={poseCanvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1
              }}
            />
            <canvas
              ref={planeCanvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 2
              }}
            />
            <canvas
              ref={phaseCanvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 3
              }}
            />
            <canvas
              ref={pathCanvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 4
              }}
            />
            
            {/* Debug Overlay - Always visible to test positioning */}
            <div 
              className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold pointer-events-none"
              style={{ zIndex: 10 }}
            >
              OVERLAYS ACTIVE
            </div>
          </>
        )}
      </div>

      {/* Video Controls */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        <button
          onClick={() => seekToFrame(Math.max(0, videoState.currentFrame - 10))}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          ⏪ -10
        </button>
        <button
          onClick={() => seekToFrame(Math.min(videoState.totalFrames, videoState.currentFrame + 10))}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          +10 ⏩
        </button>
        <button
          onClick={seekToImpact}
          className="px-3 py-1 bg-red-200 text-red-700 rounded hover:bg-red-300"
        >
          🎯 Impact
        </button>
        <button
          onClick={() => handleSpeedChange(videoState.playbackSpeed === 0.5 ? 1.0 : 0.5)}
          className="px-3 py-1 bg-blue-200 text-blue-700 rounded hover:bg-blue-300"
        >
          {videoState.playbackSpeed === 0.5 ? '1x Speed' : '0.5x Speed'}
        </button>
        <button
          onClick={reloadVideo}
          className="px-3 py-1 bg-blue-200 text-blue-700 rounded hover:bg-blue-300"
        >
          🔄 Reload Video
        </button>
      </div>

      {/* Overlay Controls */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={showOverlays.stickFigure}
            onChange={(e) => setShowOverlays(prev => ({ ...prev, stickFigure: e.target.checked }))}
            className="rounded"
          />
          <span className="text-sm">Stick Figure</span>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={showOverlays.swingPlane}
            onChange={(e) => setShowOverlays(prev => ({ ...prev, swingPlane: e.target.checked }))}
            className="rounded"
          />
          <span className="text-sm">Swing Plane</span>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={showOverlays.phases}
            onChange={(e) => setShowOverlays(prev => ({ ...prev, phases: e.target.checked }))}
            className="rounded"
          />
          <span className="text-sm">Phases</span>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={showOverlays.clubPath}
            onChange={(e) => setShowOverlays(prev => ({ ...prev, clubPath: e.target.checked }))}
            className="rounded"
          />
          <span className="text-sm">Club Path</span>
        </label>
      </div>

      {/* Frame Info */}
      <div className="text-center text-sm text-gray-600">
        Frame: {videoState.currentFrame} / {videoState.totalFrames}
        {analysis?.impactFrame && (
          <span className="ml-4">
            Impact: {analysis.impactFrame}
          </span>
        )}
      </div>

      {/* Analysis Status */}
      {isAnalyzing && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800"></div>
            Analyzing swing...
          </div>
        </div>
      )}
    </div>
  );
}
