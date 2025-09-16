/**
 * ProcessedVideoPlayer Component
 * Displays processed video with slow-motion effects and overlays
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PoseResult, SwingPhase } from '../../lib/mediapipe';
import { VideoProcessorManager, VideoProcessingError, formatFileSize, estimateProcessingTime } from '../../lib/video-processing-utils';

export interface ProcessedVideoPlayerProps {
  videoUrl: string;
  poses: PoseResult[];
  phases: SwingPhase[];
  timestamps: number[];
  slowMotionFactor?: number;
  showOverlays?: boolean;
  showGrades?: boolean;
  showAdvice?: boolean;
  showTimestamps?: boolean;
  className?: string;
  onProcessingComplete?: (processedVideoBlob: Blob) => void;
  onProcessingProgress?: (progress: number, message: string) => void;
}

export interface VideoProcessingOptions {
  slowMotionFactor: number;
  showOverlays: boolean;
  showGrades: boolean;
  showAdvice: boolean;
  showTimestamps: boolean;
  quality: 'low' | 'medium' | 'high';
}

export interface PhaseAdvice {
  grade: string;
  advice: string;
  color: string;
  score: number;
}

const phaseAdvice: Record<string, PhaseAdvice> = {
  address: {
    grade: 'B+',
    advice: 'Good posture but weight could be more balanced',
    color: '#4CAF50',
    score: 85
  },
  backswing: {
    grade: 'A-',
    advice: 'Excellent shoulder turn but early wrist hinge',
    color: '#8BC34A',
    score: 90
  },
  top: {
    grade: 'B',
    advice: 'Good position but could maintain more width',
    color: '#FFC107',
    score: 80
  },
  downswing: {
    grade: 'A',
    advice: 'Perfect sequence with great hip rotation',
    color: '#4CAF50',
    score: 95
  },
  impact: {
    grade: 'A+',
    advice: 'Excellent impact position and ball contact',
    color: '#2196F3',
    score: 98
  },
  'follow-through': {
    grade: 'A-',
    advice: 'Great finish with good balance',
    color: '#8BC34A',
    score: 90
  }
};

export const ProcessedVideoPlayer: React.FC<ProcessedVideoPlayerProps> = ({
  videoUrl,
  poses,
  phases,
  timestamps,
  slowMotionFactor = 2,
  showOverlays = true,
  showGrades = true,
  showAdvice = true,
  showTimestamps = true,
  className = '',
  onProcessingComplete,
  onProcessingProgress
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processorManagerRef = useRef<VideoProcessorManager | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<SwingPhase | null>(null);
  const [currentPose, setCurrentPose] = useState<PoseResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [processedFileSize, setProcessedFileSize] = useState<number | null>(null);

  // Initialize video processor manager
  useEffect(() => {
    processorManagerRef.current = VideoProcessorManager.getInstance();
    
    return () => {
      if (processorManagerRef.current) {
        processorManagerRef.current.destroy();
      }
    };
  }, []);

  // Calculate estimated processing time when video loads
  useEffect(() => {
    if (videoRef.current && duration > 0) {
      const estimated = estimateProcessingTime(duration, slowMotionFactor, 'medium');
      setEstimatedTime(estimated);
    }
  }, [duration, slowMotionFactor]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      
      // Find current phase
      const phase = phases.find(p => time >= p.startTime && time <= p.endTime);
      setCurrentPhase(phase || null);
      
      // Find current pose
      const poseIndex = timestamps.findIndex(t => Math.abs(t - time) < 0.1);
      setCurrentPose(poseIndex >= 0 ? poses[poseIndex] : null);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [phases, poses, timestamps]);

  // Draw overlays on canvas
  const drawOverlays = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showOverlays) return;

    // Draw pose overlay
    if (currentPose && currentPose.landmarks) {
      drawPoseOverlay(ctx, currentPose, canvas.width, canvas.height);
    }

    // Draw phase overlay
    if (currentPhase) {
      drawPhaseOverlay(ctx, currentPhase, canvas.width, canvas.height);
    }

    // Draw timestamp overlay
    if (showTimestamps) {
      drawTimestampOverlay(ctx, currentTime, canvas.width, canvas.height);
    }
  }, [currentPose, currentPhase, currentTime, showOverlays, showTimestamps]);

  // Redraw overlays when dependencies change
  useEffect(() => {
    drawOverlays();
  }, [drawOverlays]);

  // Start video processing
  const startProcessing = useCallback(async () => {
    if (!videoRef.current || !processorManagerRef.current) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingMessage('Starting video processing...');
    setError(null);

    try {
      const options = {
        slowMotionFactor,
        showOverlays,
        showGrades,
        showAdvice,
        showTimestamps,
        quality: 'medium' as const
      };

      const blob = await processorManagerRef.current.processVideo(
        videoRef.current,
        poses,
        phases,
        timestamps,
        options,
        (progress, message) => {
          setProcessingProgress(progress);
          setProcessingMessage(message);
          onProcessingProgress?.(progress, message);
        }
      );

      const url = URL.createObjectURL(blob);
      setProcessedVideoUrl(url);
      setProcessedFileSize(blob.size);
      setIsProcessing(false);
      onProcessingComplete?.(blob);
    } catch (error) {
      console.error('Error processing video:', error);
      setError(error instanceof VideoProcessingError ? error.message : 'Video processing failed');
      setIsProcessing(false);
    }
  }, [slowMotionFactor, showOverlays, showGrades, showAdvice, showTimestamps, poses, phases, timestamps, onProcessingComplete, onProcessingProgress]);

  // Download processed video
  const downloadProcessedVideo = useCallback(() => {
    if (!processedVideoUrl) return;

    const link = document.createElement('a');
    link.href = processedVideoUrl;
    link.download = `swing-analysis-${new Date().toISOString().split('T')[0]}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [processedVideoUrl]);

  // Format time display
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`processed-video-player ${className}`}>
      {/* Video Container */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={processedVideoUrl || videoUrl}
          className="w-full h-auto"
          controls
          playsInline
          muted
        />
        
        {/* Overlay Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          width={1280}
          height={720}
        />
      </div>

      {/* Controls */}
      <div className="mt-4 space-y-4">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Processing Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing Controls */}
        {!processedVideoUrl && (
          <div className="space-y-2">
            <button
              onClick={startProcessing}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Generate Slow-Motion Video'}
            </button>
            
            {/* Estimated Time */}
            {estimatedTime && !isProcessing && (
              <p className="text-sm text-gray-600 text-center">
                Estimated processing time: {Math.ceil(estimatedTime / 60)} minutes
              </p>
            )}
            
            {isProcessing && (
              <div className="space-y-2">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  {processingMessage} ({processingProgress}%)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Download Button */}
        {processedVideoUrl && (
          <div className="space-y-2">
            <button
              onClick={downloadProcessedVideo}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Download Processed Video
            </button>
            {processedFileSize && (
              <p className="text-sm text-gray-600 text-center">
                File size: {formatFileSize(processedFileSize)}
              </p>
            )}
          </div>
        )}

        {/* Video Info */}
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Duration: {formatTime(duration)}</span>
          <span>Speed: {slowMotionFactor}x slower</span>
        </div>
      </div>
    </div>
  );
};

// Helper functions for drawing overlays
function drawPoseOverlay(
  ctx: CanvasRenderingContext2D,
  pose: PoseResult,
  canvasWidth: number,
  canvasHeight: number
): void {
  if (!pose.landmarks) return;

  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#FF0000';

  // Draw pose connections
  const connections = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Arms
    [11, 23], [12, 24], [23, 24], // Torso
    [23, 25], [25, 27], [24, 26], [26, 28], // Legs
    [15, 17], [17, 19], [19, 21], [16, 18], [18, 20], [20, 22] // Hands
  ];

  connections.forEach(([start, end]) => {
    const startPoint = pose.landmarks![start];
    const endPoint = pose.landmarks![end];
    
    if (startPoint && endPoint && startPoint.visibility > 0.5 && endPoint.visibility > 0.5) {
      ctx.beginPath();
      ctx.moveTo(startPoint.x * canvasWidth, startPoint.y * canvasHeight);
      ctx.lineTo(endPoint.x * canvasWidth, endPoint.y * canvasHeight);
      ctx.stroke();
    }
  });

  // Draw landmarks
  pose.landmarks.forEach(landmark => {
    if (landmark.visibility > 0.5) {
      ctx.beginPath();
      ctx.arc(
        landmark.x * canvasWidth,
        landmark.y * canvasHeight,
        3,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  });
}

function drawPhaseOverlay(
  ctx: CanvasRenderingContext2D,
  phase: SwingPhase,
  canvasWidth: number,
  canvasHeight: number
): void {
  const advice = phaseAdvice[phase.name] || {
    grade: 'B',
    advice: 'Good swing phase',
    color: '#FFC107',
    score: 80
  };

  // Phase background
  ctx.fillStyle = `${advice.color}20`; // 20% opacity
  ctx.fillRect(0, 0, canvasWidth, 120);

  // Phase name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(
    phase.name.charAt(0).toUpperCase() + phase.name.slice(1),
    20,
    40
  );

  // Grade
  ctx.fillStyle = advice.color;
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(advice.grade, canvasWidth - 20, 40);

  // Advice
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(advice.advice, 20, 70);

  // Confidence score
  ctx.fillStyle = '#CCCCCC';
  ctx.font = '14px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(
    `Confidence: ${Math.round(phase.confidence * 100)}%`,
    canvasWidth - 20,
    70
  );

  // Progress bar
  const phaseProgress = (phase.endTime - phase.startTime) > 0 
    ? (Date.now() / 1000 - phase.startTime) / (phase.endTime - phase.startTime)
    : 0;
  ctx.fillStyle = advice.color;
  ctx.fillRect(20, 90, (canvasWidth - 40) * Math.max(0, Math.min(1, phaseProgress)), 8);
}

function drawTimestampOverlay(
  ctx: CanvasRenderingContext2D,
  currentTime: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  ctx.fillStyle = '#00000080';
  ctx.fillRect(canvasWidth - 200, canvasHeight - 60, 180, 50);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '14px Arial';
  ctx.textAlign = 'right';

  const minutes = Math.floor(currentTime / 60);
  const seconds = (currentTime % 60).toFixed(1);
  ctx.fillText(
    `Time: ${minutes}:${seconds.padStart(4, '0')}`,
    canvasWidth - 20,
    canvasHeight - 35
  );
}

export default ProcessedVideoPlayer;
