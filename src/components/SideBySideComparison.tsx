'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TrajectoryPoint, SwingTrajectory } from '@/lib/mediapipe';
import { SwingPhase } from '@/lib/swing-phases';

interface ProSwing {
  id: string;
  name: string;
  club: string;
  trajectory: SwingTrajectory;
  phases: SwingPhase[];
  videoUrl: string;
  description: string;
}

interface SideBySideComparisonProps {
  userSwing: {
    trajectory: SwingTrajectory;
    phases: SwingPhase[];
    videoElement: HTMLVideoElement | null;
  };
  proSwing: ProSwing;
  currentFrame: number;
  onFrameChange: (frame: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  playbackSpeed: number;
  onPlaybackSpeedChange: (speed: number) => void;
  className?: string;
}

export default function SideBySideComparison({
  userSwing,
  proSwing,
  currentFrame,
  onFrameChange,
  isPlaying,
  onPlayPause,
  onStop,
  playbackSpeed,
  onPlaybackSpeedChange,
  className = ''
}: SideBySideComparisonProps) {
  const userCanvasRef = useRef<HTMLCanvasElement>(null);
  const proCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showTrajectory, setShowTrajectory] = useState(true);
  const [showPhases, setShowPhases] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [syncMode, setSyncMode] = useState<'frame' | 'phase' | 'time'>('frame');

  // Draw overlay on canvas
  const drawOverlay = useCallback((
    canvas: HTMLCanvasElement,
    trajectory: SwingTrajectory,
    phases: SwingPhase[],
    videoElement: HTMLVideoElement | null
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    if (videoElement) {
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
    } else {
      canvas.width = 640;
      canvas.height = 480;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw trajectory
    if (showTrajectory && trajectory.rightWrist.length > 0) {
      drawTrajectory(ctx, trajectory, currentFrame, canvas.width, canvas.height);
    }

    // Draw phases
    if (showPhases) {
      drawPhases(ctx, phases, currentFrame, canvas.width, canvas.height);
    }

    // Draw landmarks
    if (showLandmarks && trajectory.rightWrist.length > currentFrame) {
      drawLandmarks(ctx, trajectory, currentFrame);
    }
  }, [currentFrame, showTrajectory, showPhases, showLandmarks]);

  // Draw trajectory path
  const drawTrajectory = (
    ctx: CanvasRenderingContext2D,
    trajectory: SwingTrajectory,
    frame: number,
    width: number,
    height: number
  ) => {
    const rightWrist = trajectory.rightWrist;
    if (rightWrist.length < 2) return;

    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(rightWrist[0].x * width, rightWrist[0].y * height);

    for (let i = 1; i <= Math.min(frame, rightWrist.length - 1); i++) {
      const point = rightWrist[i];
      ctx.lineTo(point.x * width, point.y * height);
    }

    ctx.stroke();

    // Draw current position
    if (rightWrist[frame]) {
      const currentPoint = rightWrist[frame];
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(
        currentPoint.x * width,
        currentPoint.y * height,
        8,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  };

  // Draw phase indicators
  const drawPhases = (
    ctx: CanvasRenderingContext2D,
    phases: SwingPhase[],
    frame: number,
    width: number,
    height: number
  ) => {
    const phase = phases.find(p => frame >= p.startFrame && frame <= p.endFrame);
    
    if (phase) {
      // Draw phase background
      ctx.fillStyle = phase.color + '20';
      ctx.fillRect(0, 0, width, height);

      // Draw phase name
      ctx.fillStyle = phase.color;
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(phase.name, width / 2, 50);
    }
  };

  // Draw landmarks
  const drawLandmarks = (
    ctx: CanvasRenderingContext2D,
    trajectory: SwingTrajectory,
    frame: number
  ) => {
    if (frame >= trajectory.rightWrist.length) return;

    const rightWrist = trajectory.rightWrist[frame];
    const leftWrist = trajectory.leftWrist[frame];
    const rightShoulder = trajectory.rightShoulder[frame];
    const leftShoulder = trajectory.leftShoulder[frame];

    // Draw right wrist (club head)
    if (rightWrist) {
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(
        rightWrist.x * ctx.canvas.width,
        rightWrist.y * ctx.canvas.height,
        6,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }

    // Draw left wrist
    if (leftWrist) {
      ctx.fillStyle = '#3B82F6';
      ctx.beginPath();
      ctx.arc(
        leftWrist.x * ctx.canvas.width,
        leftWrist.y * ctx.canvas.height,
        4,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }

    // Draw shoulders
    if (rightShoulder) {
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(
        rightShoulder.x * ctx.canvas.width,
        rightShoulder.y * ctx.canvas.height,
        4,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }

    if (leftShoulder) {
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(
        leftShoulder.x * ctx.canvas.width,
        leftShoulder.y * ctx.canvas.height,
        4,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  };

  // Animation loop
  useEffect(() => {
    const animate = () => {
      if (userCanvasRef.current) {
        drawOverlay(
          userCanvasRef.current,
          userSwing.trajectory,
          userSwing.phases,
          userSwing.videoElement
        );
      }
      
      if (proCanvasRef.current) {
        drawOverlay(
          proCanvasRef.current,
          proSwing.trajectory,
          proSwing.phases,
          null
        );
      }
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [drawOverlay, userSwing, proSwing]);

  // Frame scrubbing
  const handleScrubberChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const frame = parseInt(event.target.value);
    onFrameChange(frame);
  }, [onFrameChange]);

  const handleScrubberMouseDown = useCallback(() => {
    setIsDragging(true);
    onPlayPause(); // Pause when scrubbing
  }, [onPlayPause]);

  const handleScrubberMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Calculate max frame based on sync mode
  const getMaxFrame = () => {
    const userMax = userSwing.trajectory.rightWrist.length - 1;
    const proMax = proSwing.trajectory.rightWrist.length - 1;
    
    switch (syncMode) {
      case 'frame':
        return Math.min(userMax, proMax);
      case 'phase':
        return Math.min(userMax, proMax);
      case 'time':
        return Math.min(userMax, proMax);
      default:
        return userMax;
    }
  };

  const maxFrame = getMaxFrame();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Swing Comparison</h2>
        <p className="text-gray-600">Compare your swing with {proSwing.name}</p>
      </div>

      {/* Video Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Swing */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue-600">Your Swing</h3>
            <p className="text-sm text-gray-500">Driver</p>
          </div>
          
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={(el) => {
                if (el && userSwing.videoElement) {
                  el.src = userSwing.videoElement.src;
                  el.currentTime = userSwing.videoElement.currentTime;
                }
              }}
              className="w-full h-auto"
              muted
            />
            
            <canvas
              ref={userCanvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
          </div>
        </div>

        {/* Pro Swing */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-green-600">{proSwing.name}</h3>
            <p className="text-sm text-gray-500">{proSwing.club}</p>
          </div>
          
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              src={proSwing.videoUrl}
              className="w-full h-auto"
              muted
            />
            
            <canvas
              ref={proCanvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Playback Controls */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={onStop}
            className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button
            onClick={onPlayPause}
            className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1V9a1 1 0 00-1-1H7z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>

        {/* Frame Scrubber */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Frame {currentFrame}</span>
            <span>{maxFrame} frames</span>
          </div>
          
          <input
            type="range"
            min="0"
            max={maxFrame}
            value={currentFrame}
            onChange={handleScrubberChange}
            onMouseDown={handleScrubberMouseDown}
            onMouseUp={handleScrubberMouseUp}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Playback Speed Controls */}
        <div className="flex items-center justify-center space-x-2">
          <span className="text-sm text-gray-600">Speed:</span>
          {[0.25, 0.5, 1, 2, 4].map((speed) => (
            <button
              key={speed}
              onClick={() => onPlaybackSpeedChange(speed)}
              className={`px-3 py-1 text-sm rounded ${
                playbackSpeed === speed
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Sync Mode */}
        <div className="flex items-center justify-center space-x-2">
          <span className="text-sm text-gray-600">Sync:</span>
          {[
            { value: 'frame', label: 'Frame' },
            { value: 'phase', label: 'Phase' },
            { value: 'time', label: 'Time' }
          ].map((mode) => (
            <button
              key={mode.value}
              onClick={() => setSyncMode(mode.value as any)}
              className={`px-3 py-1 text-sm rounded ${
                syncMode === mode.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Display Options */}
        <div className="flex items-center justify-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showTrajectory}
              onChange={(e) => setShowTrajectory(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Trajectory</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showPhases}
              onChange={(e) => setShowPhases(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Phases</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showLandmarks}
              onChange={(e) => setShowLandmarks(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Landmarks</span>
          </label>
        </div>
      </div>

      {/* Comparison Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Your Swing</h4>
          <div className="space-y-1 text-sm">
            <div>Total Frames: {userSwing.trajectory.rightWrist.length}</div>
            <div>Phases: {userSwing.phases.length}</div>
            <div>Duration: {userSwing.phases.reduce((sum, p) => sum + p.duration, 0).toFixed(2)}s</div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">{proSwing.name}</h4>
          <div className="space-y-1 text-sm">
            <div>Total Frames: {proSwing.trajectory.rightWrist.length}</div>
            <div>Phases: {proSwing.phases.length}</div>
            <div>Duration: {proSwing.phases.reduce((sum, p) => sum + p.duration, 0).toFixed(2)}s</div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Comparison</h4>
          <div className="space-y-1 text-sm">
            <div>Sync Mode: {syncMode}</div>
            <div>Current Frame: {currentFrame}</div>
            <div>Playback Speed: {playbackSpeed}x</div>
          </div>
        </div>
      </div>
    </div>
  );
}
