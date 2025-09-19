/**
 * Video Analysis Display - Comprehensive Golf Swing Video Analysis
 * 
 * This component displays the video with real-time overlays including
 * stick figure, swing plane, phase markers, and club path tracking.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RealGolfAnalysis, SwingVisualization } from '@/lib/real-golf-analysis';

interface VideoAnalysisDisplayProps {
  videoFile: File;
  videoUrl?: string;
  analysis: RealGolfAnalysis | null;
  isAnalyzing: boolean;
  isSampleVideo?: boolean;
}

export default function VideoAnalysisDisplay({ videoFile, videoUrl, analysis, isAnalyzing, isSampleVideo = false }: VideoAnalysisDisplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const poseCanvasRef = useRef<HTMLCanvasElement>(null);
  const planeCanvasRef = useRef<HTMLCanvasElement>(null);
  const phaseCanvasRef = useRef<HTMLCanvasElement>(null);
  const pathCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
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
      hasPoses: !!analysis?.poses,
      posesLength: analysis?.poses?.length || 0,
      videoFileName: videoFile?.name
    });
  }, [videoFile, videoUrl, analysis]);

  // Cleanup video URL when component unmounts
  useEffect(() => {
    return () => {
      // Don't revoke the video URL immediately to prevent playback issues
      // The browser will clean up blob URLs when the page is unloaded
    };
  }, []);

  // Calculate current frame from video time
  const calculateFrame = useCallback((video: HTMLVideoElement) => {
    if (!video.duration) return 0;
    const fps = 30; // Assume 30fps
    return Math.floor(video.currentTime * fps);
  }, []);

  // Draw stick figure overlay
  const drawStickFigure = useCallback((canvas: HTMLCanvasElement, frame: number) => {
    console.log('🖌️ drawStickFigure called for frame:', frame);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('❌ No canvas context available');
      return;
    }

    console.log('🖌️ Drawing stick figure on canvas:', canvas.width, 'x', canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw a simple test overlay first
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(50, 50, 100, 50);
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Frame ${frame}`, 60, 75);
    
    // Try to get pose data from visualizations first, then from poses
    let poseData = null;
    let landmarks = null;
    
    if (analysis?.visualizations?.stickFigure && analysis.visualizations.stickFigure[frame]) {
      poseData = analysis.visualizations.stickFigure[frame];
      landmarks = poseData.landmarks;
      console.log('🖌️ Using stick figure data from visualizations');
    } else if (analysis?.poses && analysis.poses[frame]) {
      poseData = analysis.poses[frame];
      landmarks = poseData.landmarks;
      console.log('🖌️ Using pose data directly');
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
          landmarks[start].visibility > 0.5 && landmarks[end].visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(landmarks[start].x * canvas.width, landmarks[start].y * canvas.height);
        ctx.lineTo(landmarks[end].x * canvas.width, landmarks[end].y * canvas.height);
        ctx.stroke();
      }
    });

    // Draw keypoints
    landmarks.forEach((landmark: any, i: number) => {
      if (landmark.visibility > 0.5) {
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
    if (landmarks.filter((l: any) => l.visibility > 0.5).length === 0) {
      console.log('🖌️ Drawing fallback stick figure');
      drawFallbackStickFigure(ctx, canvas.width, canvas.height, frame);
    }
  }, [analysis]);

  // GUARANTEE VISUALIZATION WORKS - Comprehensive stick figure system
  const ensureStickFigureWorks = useCallback((videoElement: HTMLVideoElement, poses: any[], canvasElement: HTMLCanvasElement) => {
    console.log("🖌️ Initializing stick figure visualization...");
    
    // Validate inputs
    if (!videoElement || !poses || poses.length === 0 || !canvasElement) {
      console.error("❌ Cannot draw stick figure: Missing required elements");
      return false;
    }
    
    // Set canvas dimensions to match video
    canvasElement.width = videoElement.videoWidth || 640;
    canvasElement.height = videoElement.videoHeight || 480;
    
    const ctx = canvasElement.getContext('2d');
    if (!ctx) {
      console.error("❌ Cannot get canvas context");
      return false;
    }
    
    console.log("🖌️ Canvas dimensions set:", canvasElement.width, "x", canvasElement.height);
    console.log("🖌️ Processing", poses.length, "poses");
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Draw stick figure for each pose
    poses.forEach((pose, index) => {
      if (pose && pose.landmarks) {
        drawSkeleton(ctx, pose.landmarks, canvasElement.width, canvasElement.height);
        drawKeypoints(ctx, pose.landmarks, canvasElement.width, canvasElement.height);
      }
    });
    
    console.log("✅ Stick figure visualization complete");
    return true;
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

    console.log('🎨 Drawing overlays for frame:', currentFrame, 'with analysis:', !!analysis.visualizations);
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
      drawStickFigure(poseCanvasRef.current, currentFrame);
    }

    // Draw swing plane overlay
    if (showOverlays.swingPlane && planeCanvasRef.current) {
      console.log('✈️ Drawing swing plane overlay');
      drawSwingPlane(planeCanvasRef.current, currentFrame);
    }

    // Draw phase markers
    if (showOverlays.phases && phaseCanvasRef.current) {
      console.log('📊 Drawing phase markers');
      drawPhaseMarkers(phaseCanvasRef.current, currentFrame);
    }

    // Draw club path
    if (showOverlays.clubPath && pathCanvasRef.current) {
      console.log('🏌️ Drawing club path');
      drawClubPath(pathCanvasRef.current, currentFrame);
    }
  }, [currentFrame, analysis, showOverlays, drawStickFigure, drawSwingPlane, drawPhaseMarkers, drawClubPath]);

  // Handle video time update
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const frame = calculateFrame(videoRef.current);
      setCurrentFrame(frame);
    }
  }, [calculateFrame]);

  // Handle video play/pause
  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);

  // Handle playback speed change
  const handleSpeedChange = useCallback((speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  }, []);

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

  // Manual stick figure initialization
  const initializeStickFigure = useCallback(() => {
    if (videoRef.current && analysis?.visualizations?.stickFigure && poseCanvasRef.current) {
      console.log('🖌️ Manual stick figure initialization triggered');
      const success = ensureStickFigureWorks(
        videoRef.current, 
        analysis.visualizations.stickFigure, 
        poseCanvasRef.current
      );
      
      if (success) {
        console.log('✅ Manual stick figure initialization successful');
        return true;
      } else {
        console.log('❌ Manual stick figure initialization failed');
        return false;
      }
    }
    return false;
  }, [analysis, ensureStickFigureWorks]);

  // Force video reload
  const reloadVideo = useCallback(() => {
    if (videoRef.current && !isSampleVideo) {
      console.log('🔄 Reloading video...');
      // Create a new video URL to prevent blob URL issues
      const newUrl = URL.createObjectURL(videoFile);
      videoRef.current.src = newUrl;
      videoRef.current.load();
      setVideoLoaded(false);
      setVideoError(null);
      console.log('✅ Video reloaded with new URL:', newUrl);
    }
  }, [videoFile, isSampleVideo]);

  // Auto-initialize overlays when analysis changes
  useEffect(() => {
    if (analysis && videoRef.current) {
      console.log('🖌️ Auto-initializing overlays on analysis change');
      console.log('🖌️ Analysis data:', {
        hasVisualizations: !!analysis.visualizations,
        hasStickFigure: !!analysis.visualizations?.stickFigure,
        stickFigureLength: analysis.visualizations?.stickFigure?.length || 0,
        hasPoses: !!analysis.poses,
        posesLength: analysis.poses?.length || 0
      });
      
      // Initialize canvas sizes
      const video = videoRef.current;
      const canvasWidth = video.videoWidth || 640;
      const canvasHeight = video.videoHeight || 480;
      
      [poseCanvasRef, planeCanvasRef, phaseCanvasRef, pathCanvasRef].forEach(canvasRef => {
        if (canvasRef.current) {
          canvasRef.current.width = canvasWidth;
          canvasRef.current.height = canvasHeight;
          console.log('📐 Canvas initialized:', canvasWidth, 'x', canvasHeight);
        }
      });
      
      setTimeout(() => {
        // Force draw all overlays
        if (poseCanvasRef.current) {
          console.log('🖌️ Drawing stick figure on canvas:', poseCanvasRef.current.width, 'x', poseCanvasRef.current.height);
          drawStickFigure(poseCanvasRef.current, 0);
        }
        if (planeCanvasRef.current) {
          console.log('✈️ Drawing swing plane on canvas:', planeCanvasRef.current.width, 'x', planeCanvasRef.current.height);
          drawSwingPlane(planeCanvasRef.current, 0);
        }
        if (phaseCanvasRef.current) {
          console.log('📊 Drawing phase markers on canvas:', phaseCanvasRef.current.width, 'x', phaseCanvasRef.current.height);
          drawPhaseMarkers(phaseCanvasRef.current, 0);
        }
        if (pathCanvasRef.current) {
          console.log('🏌️ Drawing club path on canvas:', pathCanvasRef.current.width, 'x', pathCanvasRef.current.height);
          drawClubPath(pathCanvasRef.current, 0);
        }
      }, 200); // Small delay to ensure video is ready
    }
  }, [analysis, drawStickFigure, drawSwingPlane, drawPhaseMarkers, drawClubPath]);

  return (
    <div className="video-analysis-container bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Video Analysis</h2>
      
      {/* Video Player with Overlays */}
      <div className="relative mb-4">
        <video
          ref={videoRef}
          src={isSampleVideo ? videoUrl : (videoUrl || (videoFile ? URL.createObjectURL(videoFile) : ''))}
          controls
          className="w-full max-w-4xl mx-auto rounded-lg shadow-lg"
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onLoadedData={() => {
            console.log('🎥 Video loaded successfully');
            console.log('🎥 Video source:', isSampleVideo ? videoUrl : (videoUrl || (videoFile ? URL.createObjectURL(videoFile) : '')));
            setVideoLoaded(true);
            setVideoError(null);
            
            if (videoRef.current) {
              // Set canvas sizes to match video
              const video = videoRef.current;
              console.log('📐 Video dimensions:', video.videoWidth, 'x', video.videoHeight);
              
              // Set canvas dimensions to match video exactly
              const canvasWidth = video.videoWidth || 640;
              const canvasHeight = video.videoHeight || 480;
              
              [poseCanvasRef, planeCanvasRef, phaseCanvasRef, pathCanvasRef].forEach((canvasRef, index) => {
                if (canvasRef.current) {
                  canvasRef.current.width = canvasWidth;
                  canvasRef.current.height = canvasHeight;
                  console.log(`📐 Canvas ${index + 1} set to:`, canvasWidth, 'x', canvasHeight);
                }
              });
              
              // Initialize stick figure visualization when video loads
              if (analysis?.visualizations?.stickFigure && poseCanvasRef.current) {
                console.log('🖌️ Initializing stick figure on video load...');
                const success = ensureStickFigureWorks(video, analysis.visualizations.stickFigure, poseCanvasRef.current);
                if (success) {
                  console.log('✅ Stick figure initialization successful');
                } else {
                  console.log('⚠️ Stick figure initialization failed, will use fallback');
                }
              }
              
              // Force draw overlays after video loads
              setTimeout(() => {
                if (poseCanvasRef.current) drawStickFigure(poseCanvasRef.current, 0);
                if (planeCanvasRef.current) drawSwingPlane(planeCanvasRef.current, 0);
                if (phaseCanvasRef.current) drawPhaseMarkers(phaseCanvasRef.current, 0);
                if (pathCanvasRef.current) drawClubPath(pathCanvasRef.current, 0);
              }, 100);
            }
          }}
          onError={(e) => {
            console.error('❌ Video load error:', e);
            console.error('❌ Video source:', isSampleVideo ? videoUrl : (videoUrl || (videoFile ? URL.createObjectURL(videoFile) : '')));
            console.error('❌ Video file:', videoFile);
            setVideoError('Failed to load video. Please try a different format.');
            setVideoLoaded(false);
          }}
          onLoadStart={() => {
            console.log('🎥 Video loading started');
          }}
        />
        
        {/* Video Error Display */}
        {videoError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">❌</span>
              <p className="text-red-700">{videoError}</p>
            </div>
          </div>
        )}
        
        {/* Overlay Canvases - Positioned absolutely over video */}
        {analysis && !videoError && (
          <>
            <canvas
              ref={poseCanvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ 
                zIndex: 1,
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
            <canvas
              ref={planeCanvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ 
                zIndex: 2,
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
            <canvas
              ref={phaseCanvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ 
                zIndex: 3,
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
            <canvas
              ref={pathCanvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ 
                zIndex: 4,
                width: '100%',
                height: '100%',
                objectFit: 'contain'
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
          onClick={() => seekToFrame(Math.max(0, currentFrame - 10))}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          ⏪ -10
        </button>
        <button
          onClick={() => seekToFrame(Math.min(analysis?.visualizations?.stickFigure?.length || 0, currentFrame + 10))}
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
          onClick={() => handleSpeedChange(playbackSpeed === 0.5 ? 1.0 : 0.5)}
          className="px-3 py-1 bg-blue-200 text-blue-700 rounded hover:bg-blue-300"
        >
          {playbackSpeed === 0.5 ? '1x Speed' : '0.5x Speed'}
        </button>
        <button
          onClick={initializeStickFigure}
          className="px-3 py-1 bg-green-200 text-green-700 rounded hover:bg-green-300"
        >
          🖌️ Init Stick Figure
        </button>
        <button
          onClick={reloadVideo}
          className="px-3 py-1 bg-blue-200 text-blue-700 rounded hover:bg-blue-300"
        >
          🔄 Reload Video
        </button>
        <button
          onClick={() => {
            console.log('🎨 Manual overlay trigger');
            if (poseCanvasRef.current) drawStickFigure(poseCanvasRef.current, currentFrame);
            if (planeCanvasRef.current) drawSwingPlane(planeCanvasRef.current, currentFrame);
            if (phaseCanvasRef.current) drawPhaseMarkers(phaseCanvasRef.current, currentFrame);
            if (pathCanvasRef.current) drawClubPath(pathCanvasRef.current, currentFrame);
          }}
          className="px-3 py-1 bg-purple-200 text-purple-700 rounded hover:bg-purple-300"
        >
          🎨 Draw Overlays
        </button>
        <button
          onClick={() => {
            console.log('🧪 Test overlay visibility');
            [poseCanvasRef, planeCanvasRef, phaseCanvasRef, pathCanvasRef].forEach((canvasRef, index) => {
              if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                  // Clear canvas first
                  ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                  
                  // Draw colored rectangle
                  ctx.fillStyle = index === 0 ? 'red' : index === 1 ? 'blue' : index === 2 ? 'green' : 'orange';
                  ctx.fillRect(10, 10, 100, 60);
                  
                  // Draw text
                  ctx.fillStyle = 'white';
                  ctx.font = 'bold 20px Arial';
                  ctx.fillText(`Canvas ${index + 1}`, 20, 40);
                  
                  // Draw border
                  ctx.strokeStyle = 'black';
                  ctx.lineWidth = 3;
                  ctx.strokeRect(10, 10, 100, 60);
                  
                  console.log(`✅ Canvas ${index + 1} is visible and drawing`);
                }
              }
            });
          }}
          className="px-3 py-1 bg-yellow-200 text-yellow-700 rounded hover:bg-yellow-300"
        >
          🧪 Test Canvas
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
        Frame: {currentFrame} / {analysis?.visualizations?.stickFigure?.length || 0}
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
