'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TrajectoryPoint, SwingTrajectory } from '@/lib/mediapipe';
import { SwingPhase } from '@/lib/swing-phases';

interface SlowMotionPlayerProps {
  videoElement: HTMLVideoElement | null;
  trajectory: SwingTrajectory;
  phases: SwingPhase[];
  currentFrame: number;
  onFrameChange: (frame: number) => void;
  playbackSpeed: number;
  onPlaybackSpeedChange: (speed: number) => void;
  showTrajectory?: boolean;
  showPhases?: boolean;
  showLandmarks?: boolean;
  className?: string;
}

export default function SlowMotionPlayer({
  videoElement,
  trajectory,
  phases,
  currentFrame,
  onFrameChange,
  playbackSpeed,
  onPlaybackSpeedChange,
  showTrajectory = true,
  showPhases = true,
  showLandmarks = true,
  className = ''
}: SlowMotionPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const animationRef = useRef<number>();

  // Video playback controls
  const play = useCallback(() => {
    if (videoElement && videoElement.paused) {
      videoElement.playbackRate = playbackSpeed;
      videoElement.play();
      setIsPlaying(true);
    }
  }, [videoElement, playbackSpeed]);

  const pause = useCallback(() => {
    if (videoElement && !videoElement.paused) {
      videoElement.pause();
      setIsPlaying(false);
    }
  }, [videoElement]);

  const stop = useCallback(() => {
    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = 0;
      setIsPlaying(false);
      onFrameChange(0);
    }
  }, [videoElement, onFrameChange]);

  // Frame scrubbing
  const handleScrubberChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const frame = parseInt(event.target.value);
    onFrameChange(frame);
    
    if (videoElement) {
      const timePerFrame = videoElement.duration / (trajectory.rightWrist.length - 1);
      videoElement.currentTime = frame * timePerFrame;
    }
  }, [videoElement, trajectory.rightWrist.length, onFrameChange]);

  const handleScrubberMouseDown = useCallback(() => {
    setIsDragging(true);
    pause();
  }, [pause]);

  const handleScrubberMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Draw trajectory and landmarks on canvas
  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !videoElement || !videoLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw trajectory
    if (showTrajectory && trajectory.rightWrist.length > 0) {
      drawTrajectory(ctx, trajectory, currentFrame);
    }

    // Draw phases
    if (showPhases) {
      drawPhases(ctx, phases, currentFrame, canvas.width, canvas.height);
    }

    // Draw landmarks
    if (showLandmarks && trajectory.rightWrist.length > currentFrame) {
      drawLandmarks(ctx, trajectory, currentFrame);
    }
  }, [videoElement, videoLoaded, trajectory, phases, currentFrame, showTrajectory, showPhases, showLandmarks]);

  // Draw trajectory path
  const drawTrajectory = (ctx: CanvasRenderingContext2D, trajectory: SwingTrajectory, currentFrame: number) => {
    const rightWrist = trajectory.rightWrist;
    if (rightWrist.length < 2) return;

    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(rightWrist[0].x * ctx.canvas.width, rightWrist[0].y * ctx.canvas.height);

    for (let i = 1; i <= Math.min(currentFrame, rightWrist.length - 1); i++) {
      const point = rightWrist[i];
      ctx.lineTo(point.x * ctx.canvas.width, point.y * ctx.canvas.height);
    }

    ctx.stroke();

    // Draw current position
    if (rightWrist[currentFrame]) {
      const currentPoint = rightWrist[currentFrame];
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(
        currentPoint.x * ctx.canvas.width,
        currentPoint.y * ctx.canvas.height,
        8,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  };

  // Draw phase indicators
  const drawPhases = (ctx: CanvasRenderingContext2D, phases: SwingPhase[], currentFrame: number, width: number, height: number) => {
    const phase = phases.find(p => currentFrame >= p.startFrame && currentFrame <= p.endFrame);
    
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
  const drawLandmarks = (ctx: CanvasRenderingContext2D, trajectory: SwingTrajectory, currentFrame: number) => {
    if (currentFrame >= trajectory.rightWrist.length) return;

    const rightWrist = trajectory.rightWrist[currentFrame];
    const leftWrist = trajectory.leftWrist[currentFrame];
    const rightShoulder = trajectory.rightShoulder[currentFrame];
    const leftShoulder = trajectory.leftShoulder[currentFrame];

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
      drawOverlay();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawOverlay]);

  // Video event handlers
  useEffect(() => {
    if (!videoElement) return;

    const handleLoadedData = () => setVideoLoaded(true);
    const handleTimeUpdate = () => {
      if (!isDragging && videoElement) {
        const timePerFrame = videoElement.duration / (trajectory.rightWrist.length - 1);
        const frame = Math.floor(videoElement.currentTime / timePerFrame);
        onFrameChange(Math.min(frame, trajectory.rightWrist.length - 1));
      }
    };
    const handleEnded = () => setIsPlaying(false);

    videoElement.addEventListener('loadeddata', handleLoadedData);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('ended', handleEnded);

    return () => {
      videoElement.removeEventListener('loadeddata', handleLoadedData);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, [videoElement, trajectory.rightWrist.length, onFrameChange, isDragging]);

  // Update video playback speed
  useEffect(() => {
    if (videoElement && !videoElement.paused) {
      videoElement.playbackRate = playbackSpeed;
    }
  }, [videoElement, playbackSpeed]);

  const maxFrame = Math.max(0, trajectory.rightWrist.length - 1);

  return (
    <div className={`relative ${className}`}>
      {/* Video Container */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={(el) => {
            if (el && videoElement) {
              el.src = videoElement.src;
              el.currentTime = videoElement.currentTime;
            }
          }}
          className="w-full h-auto"
          muted
        />
        
        {/* Overlay Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
      </div>

      {/* Controls */}
      <div className="mt-4 space-y-4">
        {/* Playback Controls */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={stop}
            className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button
            onClick={isPlaying ? pause : play}
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

        {/* Phase Information */}
        {phases.length > 0 && (
          <div className="text-center">
            {phases.map((phase) => (
              <div
                key={phase.name}
                className={`inline-block px-3 py-1 mx-1 text-sm rounded ${
                  currentFrame >= phase.startFrame && currentFrame <= phase.endFrame
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
                style={{ backgroundColor: phase.color }}
              >
                {phase.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
