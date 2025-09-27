'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import useRenderCounter from '@/hooks/useRenderCounter';
import { useVideoProcessing } from '@/hooks/useVideoProcessing';
import PerformanceMonitor from './PerformanceMonitor';

interface VideoDebuggerProps {
  videoUrl: string;
  videoName: string;
  isSampleVideo?: boolean;
}

export default function VideoDebugger({ videoUrl, videoName, isSampleVideo = false }: VideoDebuggerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [events, setEvents] = useState<string[]>([]);
  const [isLoopDetected, setIsLoopDetected] = useState(false);
  const lastEventTimeRef = useRef<number>(0);
  const eventCountRef = useRef<number>(0);
  
  // Professional-grade loop prevention - TEMPORARILY DISABLED
  // const { renderCount, isEmergencyMode, reset: resetRenderCounter } = useRenderCounter('VideoDebugger', {
  //   emergencyThreshold: 20,
  //   onEmergency: () => {
  //     console.error('🚨 EMERGENCY: VideoDebugger render loop detected - enabling loop detection');
  //     setIsLoopDetected(true);
  //     },
  //   enableLogging: true
  // });

  // Optimized video processing
  const { processFrame, stopProcessing } = useVideoProcessing();

  // Enhanced loop detection to prevent infinite re-rendering
  const mountCount = useRef(0);
  const lastUrl = useRef<string | null>(null);
  const [videoUrlState, setVideoUrlState] = useState<string | null>(videoUrl);
  
  // Emergency loop breaker
  const [emergencyError, setEmergencyError] = useState<string | null>(null);
  
  // Generate a stable component ID that doesn't change on re-renders
  const componentId = useMemo(() => Math.random().toString(36).substr(2, 9), []);

  // Simplified addEvent function - no debouncing to prevent loops
  const addEvent = useCallback((event: string) => {
    // Skip if already in loop detection mode
    if (isLoopDetected) {
      return;
    }
    
    const now = Date.now();
    const timeSinceLastEvent = now - lastEventTimeRef.current;
    
    // More aggressive loop detection
    if (timeSinceLastEvent < 50) { // Less than 50ms between events
      eventCountRef.current++;
      if (eventCountRef.current > 3) { // Reduced threshold
        setIsLoopDetected(true);
        console.error('🔄 INFINITE LOOP DETECTED in VideoDebugger! Stopping event logging.');
        return; // Stop adding events to prevent infinite loop
      }
    } else {
      eventCountRef.current = 0; // Reset counter if enough time has passed
    }
    
    lastEventTimeRef.current = now;
    
    // Limit events array size to prevent memory issues
    setEvents(prev => {
      const newEvents = [...prev, `[${new Date().toLocaleTimeString()}] ${event}`];
      return newEvents.slice(-50); // Keep only last 50 events
    });
    
    console.log(`🎥 Video Debug: ${event}`);
  }, [isLoopDetected]); // Only depend on isLoopDetected

  // Proper state change detection - NO INFINITE LOOPS
  const previousVideoUrl = useRef<string | null>(null);
  const previousVideoName = useRef<string | null>(null);
  
  useEffect(() => {
    // Only log when actual changes occur
    if (videoUrl !== previousVideoUrl.current || videoName !== previousVideoName.current) {
      console.log('🔄 VideoDebugger state changed:', {
        videoName,
        videoUrl: videoUrl?.substring(0, 50) + '...',
        isSample: isSampleVideo
      });
      
      previousVideoUrl.current = videoUrl;
      previousVideoName.current = videoName;
    }
  }, [videoUrl, videoName, isSampleVideo]);

  // Optimized state management - NO INFINITE LOOPS
  useEffect(() => {
    // Skip if emergency error is active
    if (emergencyError) {
      console.log('🚨 Emergency mode active, skipping normal processing');
      return;
    }
    
    // Only update if URL actually changed
    if (videoUrl === lastUrl.current) {
      return; // No change, skip processing
    }
    
    mountCount.current += 1;
    
    // Track what's causing re-renders
    if (videoUrl && !lastUrl.current) {
      console.log('🆕 New video URL detected:', videoUrl);
    } else if (!videoUrl && lastUrl.current) {
      console.log('🗑️ Video URL cleared');
    }
    
    // Detect infinite loop
    if (mountCount.current > 5) {
      console.error('❌ INFINITE LOOP DETECTED in VideoDebugger! Stopping re-renders.');
      setIsLoopDetected(true);
      
      // Force stop by clearing URL and resetting
      if (videoUrl && videoUrl.startsWith('blob:')) {
        console.log('🧹 Force revoking blob URL to break loop:', videoUrl);
        URL.revokeObjectURL(videoUrl);
        setVideoUrlState(null);
      }
      mountCount.current = 0;
      return;
    }
    
    lastUrl.current = videoUrl;
    setVideoUrlState(videoUrl);
  }, [videoUrl, emergencyError]); // Minimal dependencies

  useEffect(() => {
    // Only run when videoUrlState or isSampleVideo actually changes
    if (!videoUrlState) return;
    
    // Reset loop detection when URL changes
    setIsLoopDetected(false);
    eventCountRef.current = 0;
    lastEventTimeRef.current = 0;
    
    addEvent(`[${componentId}] Component mounted with URL: ${videoUrlState}`);
    addEvent(`[${componentId}] Is Sample Video: ${isSampleVideo}`);
    addEvent(`[${componentId}] URL type: ${videoUrlState.startsWith('blob:') ? 'BLOB' : 'FILE'}`);
    
    // Only test URL accessibility for non-blob URLs
    if (!videoUrlState.startsWith('blob:')) {
      // Test if URL is accessible
      fetch(videoUrlState, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            addEvent(`[${componentId}] ✅ URL is accessible (${response.status})`);
            addEvent(`[${componentId}] Content-Type: ${response.headers.get('content-type')}`);
            addEvent(`[${componentId}] Content-Length: ${response.headers.get('content-length')}`);
          } else {
            addEvent(`[${componentId}] ❌ URL not accessible (${response.status})`);
          }
        })
        .catch(error => {
          addEvent(`[${componentId}] ❌ URL fetch error: ${error.message}`);
        });
    } else {
      addEvent(`[${componentId}] ⚠️ Skipping URL accessibility test for blob URL`);
    }
  }, [videoUrlState, isSampleVideo]); // Remove problematic dependencies

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup any pending operations
      console.log(`🧹 VideoDebugger cleanup for ${componentId}`);
    };
  }, [componentId]);

  const handleLoadStart = () => {
    addEvent('🔄 loadstart - Video loading started');
  };

  const handleLoadedMetadata = () => {
    addEvent('📊 loadedmetadata - Video metadata loaded');
    if (videoRef.current) {
      const video = videoRef.current;
      setDebugInfo({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        readyState: video.readyState,
        networkState: video.networkState,
        currentSrc: video.currentSrc,
        src: video.src
      });
      addEvent(`Duration: ${video.duration}s, Size: ${video.videoWidth}x${video.videoHeight}`);
    }
  };

  const handleLoadedData = () => {
    addEvent('✅ loadeddata - Video data loaded');
  };

  const handleCanPlay = () => {
    addEvent('▶️ canplay - Video can start playing');
  };

  const handleCanPlayThrough = () => {
    addEvent('🎬 canplaythrough - Video can play through without stopping');
  };

  const handlePlay = () => {
    addEvent('▶️ play - Video started playing');
  };

  const handlePause = () => {
    addEvent('⏸️ pause - Video paused');
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const error = video.error;
    let errorMessage = 'Unknown error';
    
    if (error) {
      switch (error.code) {
        case 1:
          errorMessage = 'MEDIA_ERR_ABORTED - Video loading aborted';
          break;
        case 2:
          errorMessage = 'MEDIA_ERR_NETWORK - Network error';
          break;
        case 3:
          errorMessage = 'MEDIA_ERR_DECODE - Video decode error';
          break;
        case 4:
          errorMessage = 'MEDIA_ERR_SRC_NOT_SUPPORTED - Video format not supported';
          break;
        default:
          errorMessage = `Error code: ${error.code}`;
      }
    }
    
    addEvent(`❌ error - ${errorMessage}`);
    console.error('Video error details:', error);
  };

  const handleStalled = () => {
    addEvent('⏸️ stalled - Video loading stalled');
  };

  const handleSuspend = () => {
    addEvent('⏸️ suspend - Video loading suspended');
  };

  const handleWaiting = () => {
    addEvent('⏳ waiting - Video waiting for data');
  };

  const handleProgress = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const progress = (bufferedEnd / video.duration) * 100;
        addEvent(`📈 progress - Buffered: ${progress.toFixed(1)}%`);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Video Debugger</h2>
        {(isLoopDetected || emergencyError) && (
          <div className="flex items-center gap-2">
            {emergencyError ? (
              <div className="bg-red-200 border border-red-500 text-red-800 px-3 py-1 rounded text-sm font-medium">
                🚨 Emergency: {emergencyError}
              </div>
            ) : (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded text-sm font-medium">
                ⚠️ Loop Detected - Logging Stopped
              </div>
            )}
            <button
              onClick={() => {
                setIsLoopDetected(false);
                setEmergencyError(null);
                // resetRenderCounter(); // DISABLED
                mountCount.current = 0;
                lastUrl.current = null;
                setVideoUrlState(videoUrl);
                console.log('🔄 Emergency reset - all systems reset');
              }}
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
            >
              Emergency Reset
            </button>
          </div>
        )}
      </div>
      
      {/* Performance Monitor - DISABLED */}
      {/* <PerformanceMonitor
        componentName="VideoDebugger"
        renderCount={renderCount}
        isEmergencyMode={isEmergencyMode}
        onReset={resetRenderCounter}
      /> */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Video Player */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-3">Video Player</h3>
          <div className="relative">
            <video
              ref={videoRef}
              src={videoUrlState || videoUrl}
              controls
              className="w-full max-w-md mx-auto rounded-lg shadow-lg"
              onLoadStart={handleLoadStart}
              onLoadedMetadata={handleLoadedMetadata}
              onLoadedData={handleLoadedData}
              onCanPlay={handleCanPlay}
              onCanPlayThrough={handleCanPlayThrough}
              onPlay={handlePlay}
              onPause={handlePause}
              onError={handleError}
              onStalled={handleStalled}
              onSuspend={handleSuspend}
              onWaiting={handleWaiting}
              onProgress={handleProgress}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Debug Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-3">Debug Information</h3>
          
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Video Details:</h4>
            <p><strong>Name:</strong> {videoName}</p>
            <p><strong>URL:</strong> {videoUrlState || videoUrl}</p>
            <p><strong>Is Sample:</strong> {isSampleVideo ? 'Yes' : 'No'}</p>
            <p><strong>Mount Count:</strong> {mountCount.current}</p>
            <p><strong>Render Count:</strong> N/A (Disabled)</p>
            <p><strong>Emergency Mode:</strong> N/A (Disabled)</p>
            <p><strong>Loop Detected:</strong> {isLoopDetected ? 'Yes' : 'No'}</p>
            <p><strong>Emergency Error:</strong> {emergencyError || 'None'}</p>
          </div>

          {Object.keys(debugInfo).length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">Video Properties:</h4>
              {Object.entries(debugInfo).map(([key, value]) => (
                <p key={key}><strong>{key}:</strong> {
                  typeof value === 'object' && value !== null ? 
                    ((value as any).tempoRatio ? `${(value as any).tempoRatio.toFixed(1)}:1` :
                     (value as any).shoulderTurn ? `${(value as any).shoulderTurn.toFixed(0)}°` :
                     (value as any).impact ? `${(value as any).impact.toFixed(1)}%` :
                     (value as any).planeDeviation ? `${(value as any).planeDeviation.toFixed(1)}°` :
                     (value as any).spineAngle ? `${(value as any).spineAngle.toFixed(1)}°` :
                     'Object data') : 
                    String(value)
                }</p>
              ))}
            </div>
          )}

          <div className="mb-4">
            <h4 className="font-semibold mb-2">Events Log:</h4>
            <div className="max-h-40 overflow-y-auto bg-gray-100 p-3 rounded text-sm font-mono">
              {events.map((event, index) => (
                <div key={index} className="mb-1">{event}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
