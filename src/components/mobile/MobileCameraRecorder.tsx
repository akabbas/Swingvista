'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { MobileCameraManager, type MobileCameraConfig } from '@/lib/mobile-optimization';

export interface MobileCameraRecorderProps {
  onRecordingComplete?: (videoBlob: Blob) => void;
  onFrameCapture?: (imageBlob: Blob) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function MobileCameraRecorder({
  onRecordingComplete,
  onFrameCapture,
  onError,
  className = ''
}: MobileCameraRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraManager] = useState(() => new MobileCameraManager());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraConfig, setCameraConfig] = useState<MobileCameraConfig>({
    facingMode: 'environment',
    width: 1280,
    height: 720,
    frameRate: 30,
    quality: 0.8,
    stabilization: true,
    flash: 'auto'
  });

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      await cameraManager.initializeCamera(videoRef.current);
      setIsInitialized(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Camera initialization failed';
      onError?.(errorMessage);
    }
  }, [cameraManager, onError]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await cameraManager.startRecording();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Recording start failed';
      onError?.(errorMessage);
    }
  }, [cameraManager, isInitialized, onError]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (!isRecording) return;

    try {
      const videoBlob = await cameraManager.stopRecording();
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
      onRecordingComplete?.(videoBlob);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Recording stop failed';
      onError?.(errorMessage);
    }
  }, [cameraManager, isRecording, onRecordingComplete, onError]);

  // Pause/resume recording
  const togglePause = useCallback(() => {
    if (isRecording) {
      setIsPaused(!isPaused);
    }
  }, [isRecording, isPaused]);

  // Capture frame
  const captureFrame = useCallback(async () => {
    if (!isInitialized) return;

    try {
      const imageBlob = await cameraManager.captureFrame();
      onFrameCapture?.(imageBlob);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Frame capture failed';
      onError?.(errorMessage);
    }
  }, [cameraManager, isInitialized, onFrameCapture, onError]);

  // Switch camera
  const switchCamera = useCallback(() => {
    setCameraConfig(prev => ({
      ...prev,
      facingMode: prev.facingMode === 'user' ? 'environment' : 'user'
    }));
  }, []);

  // Update camera config
  useEffect(() => {
    if (isInitialized) {
      // Reinitialize camera with new config
      initializeCamera();
    }
  }, [cameraConfig, initializeCamera, isInitialized]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cameraManager.cleanup();
    };
  }, [cameraManager]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
        style={{ transform: 'scaleX(-1)' }} // Mirror for selfie mode
      />
      
      {/* Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ transform: 'scaleX(-1)' }} // Mirror for selfie mode
      />
      
      {/* Recording Indicator */}
      {isRecording && (
        <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">
            {formatTime(recordingTime)}
          </span>
        </div>
      )}
      
      {/* Pause Indicator */}
      {isPaused && (
        <div className="absolute top-4 right-4 bg-yellow-600 text-white px-3 py-1 rounded-full">
          <span className="text-sm font-medium">PAUSED</span>
        </div>
      )}
      
      {/* Camera Controls */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
        {/* Switch Camera Button */}
        <button
          onClick={switchCamera}
          className="w-12 h-12 bg-gray-800 bg-opacity-80 text-white rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        
        {/* Record/Stop Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            isRecording 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          {isRecording ? (
            <div className="w-6 h-6 bg-white rounded-sm"></div>
          ) : (
            <div className="w-6 h-6 bg-white rounded-full"></div>
          )}
        </button>
        
        {/* Capture Frame Button */}
        <button
          onClick={captureFrame}
          className="w-12 h-12 bg-gray-800 bg-opacity-80 text-white rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
      
      {/* Pause/Resume Button */}
      {isRecording && (
        <button
          onClick={togglePause}
          className="absolute top-4 right-4 w-10 h-10 bg-gray-800 bg-opacity-80 text-white rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
        >
          {isPaused ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          )}
        </button>
      )}
      
      {/* Camera Settings */}
      <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-80 text-white p-2 rounded-lg">
        <div className="text-xs space-y-1">
          <div>Camera: {cameraConfig.facingMode === 'user' ? 'Front' : 'Back'}</div>
          <div>Quality: {(cameraConfig.quality * 100).toFixed(0)}%</div>
          <div>Resolution: {cameraConfig.width}x{cameraConfig.height}</div>
        </div>
      </div>
      
      {/* Initialization Button */}
      {!isInitialized && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center">
          <button
            onClick={initializeCamera}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            Initialize Camera
          </button>
        </div>
      )}
      
      {/* Error Message */}
      <div className="absolute bottom-20 left-4 right-4">
        {/* Error messages would be displayed here */}
      </div>
    </div>
  );
}
