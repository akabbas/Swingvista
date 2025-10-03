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
  const [showOverlays, setShowOverlays] = useState(true);
  const [overlaySettings, setOverlaySettings] = useState({
    stickFigure: true,
    swingPlane: true,
    phaseMarkers: true,
    clubPath: false
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

    const canvas = poseCanvasRef.current;
    if (!canvas) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a test indicator to verify canvas positioning
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 100, 30);
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('OVERLAY TEST', 15, 30);

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
      
      // Draw swing plane line
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
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
    }
  }, [poses]);

  // Draw phase markers
  const drawPhaseMarkers = useCallback((ctx: CanvasRenderingContext2D, frame: number) => {
    if (!analysis?.phases || analysis.phases.length === 0) return;

    const canvas = poseCanvasRef.current;
    if (!canvas) return;

    const currentTime = frame / 30; // Assuming 30fps
    
    analysis.phases.forEach((phase: any) => {
      if (currentTime >= phase.startTime && currentTime <= phase.endTime) {
        // Draw phase indicator
        ctx.fillStyle = phase.color || '#ff6600';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(phase.name.toUpperCase(), 20, 40);
      }
    });
  }, [analysis]);

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
    
    // Also set CSS size to match video display size
    const videoRect = video.getBoundingClientRect();
    canvas.style.width = videoRect.width + 'px';
    canvas.style.height = videoRect.height + 'px';
    
    console.log('🎨 Canvas size set to:', canvas.width, 'x', canvas.height);
    console.log('🎨 Canvas CSS size:', canvas.style.width, 'x', canvas.style.height);
    console.log('🎨 Video rect:', videoRect.width, 'x', videoRect.height);

    const frame = Math.floor(video.currentTime * 30); // Assuming 30fps
    console.log('🎨 Current frame:', frame, 'Video time:', video.currentTime);

    if (overlaySettings.stickFigure) {
      console.log('🎨 Drawing stick figure...');
      drawPoseOverlay(ctx, frame);
    }
    if (overlaySettings.swingPlane) {
      console.log('🎨 Drawing swing plane...');
      drawSwingPlane(ctx, frame);
    }
    if (overlaySettings.phaseMarkers) {
      console.log('🎨 Drawing phase markers...');
      drawPhaseMarkers(ctx, frame);
    }
  }, [showOverlays, overlaySettings, drawPoseOverlay, drawSwingPlane, drawPhaseMarkers, poses]);

  // Update overlays when video time changes
  useEffect(() => {
    drawOverlays();
  }, [currentTime, drawOverlays]);

  // Setup video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      const canvas = poseCanvasRef.current;
      if (canvas) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }
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
  }, [handleTimeUpdate]);

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
              maxHeight: '500px'
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
