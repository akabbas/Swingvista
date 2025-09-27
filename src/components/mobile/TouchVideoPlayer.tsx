'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { TouchControlManager, type TouchControlConfig } from '@/lib/mobile-optimization';

export interface TouchVideoPlayerProps {
  videoSrc: string;
  onTimeUpdate?: (currentTime: number) => void;
  onVolumeChange?: (volume: number) => void;
  onFullscreenToggle?: (isFullscreen: boolean) => void;
  onPlayPause?: (isPlaying: boolean) => void;
  className?: string;
}

export default function TouchVideoPlayer({
  videoSrc,
  onTimeUpdate,
  onVolumeChange,
  onFullscreenToggle,
  onPlayPause,
  className = ''
}: TouchVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchManager, setTouchManager] = useState<TouchControlManager | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [touchConfig, setTouchConfig] = useState<TouchControlConfig>({
    enableSwipe: true,
    enablePinch: true,
    enableTap: true,
    enableDoubleTap: true,
    swipeThreshold: 50,
    pinchThreshold: 0.1,
    tapThreshold: 300
  });

  // Initialize touch controls
  useEffect(() => {
    if (videoRef.current) {
      const manager = new TouchControlManager(videoRef.current, touchConfig);
      setTouchManager(manager);
    }
  }, [touchConfig]);

  // Handle video events
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  }, [onTimeUpdate]);

  const handleDurationChange = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    onPlayPause?.(true);
  }, [onPlayPause]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    onPlayPause?.(false);
  }, [onPlayPause]);

  const handleVolumeChange = useCallback(() => {
    if (videoRef.current) {
      const newVolume = videoRef.current.volume;
      setVolume(newVolume);
      onVolumeChange?.(newVolume);
    }
  }, [onVolumeChange]);

  const handleFullscreenChange = useCallback(() => {
    const isFullscreen = !!document.fullscreenElement;
    setIsFullscreen(isFullscreen);
    onFullscreenToggle?.(isFullscreen);
  }, [onFullscreenToggle]);

  // Touch control handlers
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    setShowControls(true);
    // Hide controls after 3 seconds
    setTimeout(() => setShowControls(false), 3000);
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    // Prevent default touch behaviors
    event.preventDefault();
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    // Handle touch end
  }, []);

  // Control functions
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  const setVolumeLevel = useCallback((newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, newVolume));
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen();
    }
  }, [isFullscreen]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src={videoSrc}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onPlay={handlePlay}
        onPause={handlePause}
        onVolumeChange={handleVolumeChange}
        onFullscreenChange={handleFullscreenChange}
        playsInline
        preload="metadata"
      />
      
      {/* Touch Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>
      
      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent">
          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            <button
              onClick={toggleFullscreen}
              className="w-8 h-8 bg-gray-800 bg-opacity-80 text-white rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
            >
              {isFullscreen ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9v4.5M15 9h4.5M15 9l5.5-5.5" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Center Play/Pause Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlayPause}
              className="w-16 h-16 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all"
            >
              {isPlaying ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          </div>
          
          {/* Bottom Controls */}
          <div className="absolute bottom-4 left-4 right-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="relative h-1 bg-gray-600 rounded-full">
                <div
                  className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
                <div
                  className="absolute top-1/2 left-0 w-4 h-4 bg-blue-500 rounded-full transform -translate-y-1/2 cursor-pointer"
                  style={{ left: `${getProgressPercentage()}%` }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                    if (rect) {
                      const x = e.touches[0].clientX - rect.left;
                      const percentage = x / rect.width;
                      seekTo(percentage * duration);
                    }
                  }}
                />
              </div>
            </div>
            
            {/* Control Buttons */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                {/* Volume Control */}
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Play/Pause Button */}
                <button
                  onClick={togglePlayPause}
                  className="w-10 h-10 bg-gray-800 bg-opacity-80 text-white rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
                
                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="w-10 h-10 bg-gray-800 bg-opacity-80 text-white rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                >
                  {isFullscreen ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9v4.5M15 9h4.5M15 9l5.5-5.5" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Touch Instructions */}
      <div className="absolute bottom-20 left-4 right-4 text-center text-white text-sm opacity-70">
        <div className="flex justify-center space-x-4">
          <span>👆 Tap to play/pause</span>
          <span>👆👆 Double tap for fullscreen</span>
          <span>👈👉 Swipe to seek</span>
        </div>
      </div>
    </div>
  );
}
