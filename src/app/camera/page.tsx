'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PoseResult } from '@/lib/mediapipe';
import { UnifiedSwingData } from '@/lib/unified-analysis';
import { saveSwing } from '@/lib/supabase';
import { getEnvironmentConfig, logEnvironmentInfo } from '@/lib/environment';
import { logger, logError, logInfo, logWarn } from '@/lib/logger';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProgressBar from '@/components/ui/ProgressBar';
import ErrorAlert from '@/components/ui/ErrorAlert';
import MonitoringDashboard from '@/components/ui/MonitoringDashboard';

// Using UnifiedSwingData from unified-analysis.ts

export default function CameraPage() {
  // Simplified state management
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedClub, setSelectedClub] = useState('driver');
  const [analysisResult, setAnalysisResult] = useState<UnifiedSwingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ step: '', progress: 0 });
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [detectedPoses, setDetectedPoses] = useState<PoseResult[]>([]);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [environmentConfig] = useState(getEnvironmentConfig());
  const [performanceStats, setPerformanceStats] = useState({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0
  });
  const [showMonitoring, setShowMonitoring] = useState(false);

  // Log environment info in development
  useEffect(() => {
    logEnvironmentInfo();
  }, []);

  // Essential refs only
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseDetectorRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const clubs = [
    { value: 'driver', label: 'Driver' },
    { value: 'iron', label: 'Iron' },
    { value: 'wedge', label: 'Wedge' },
    { value: 'putter', label: 'Putter' }
  ];

  // Helper function to get grade colors
  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-600';
      case 'F': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Initialize camera with proper constraints and mobile optimization
  const initializeCamera = async () => {
    try {
      setError(null);
      logInfo('Starting camera initialization', { userAgent: navigator.userAgent }, 'Camera');
      
      // Detect mobile device for optimized constraints
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      logInfo('Device type detected', { isMobile }, 'Camera');
      
      // Request camera access with optimal constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: isMobile ? 640 : 1280 },
          height: { ideal: isMobile ? 480 : 720 },
          frameRate: { ideal: isMobile ? 15 : 30, max: isMobile ? 15 : 30 },
          facingMode: isMobile ? 'user' : 'environment'
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }

      // Dynamically import MediaPipe only on client side
      const { MediaPipePoseDetector } = await import('@/lib/mediapipe');
      
      // Initialize MediaPipe pose detector
      poseDetectorRef.current = new MediaPipePoseDetector({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        smoothingWindow: 5
      });
      
      await poseDetectorRef.current.initialize();
      logInfo('MediaPipe pose detector initialized successfully', {}, 'Camera');
      
      // Start real-time pose detection
      startPoseDetection();

    } catch (err) {
      console.error('Camera initialization error:', err);
      logError('Camera initialization failed', { error: err }, 'Camera');
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera permissions and refresh the page. On mobile, make sure you\'re using HTTPS.');
          logWarn('Camera access denied by user', { errorName: err.name }, 'Camera');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please connect a camera and try again.');
          logWarn('No camera device found', { errorName: err.name }, 'Camera');
        } else if (err.name === 'NotReadableError') {
          setError('Camera is already in use by another application. Please close other camera apps and try again.');
          logWarn('Camera device in use', { errorName: err.name }, 'Camera');
        } else if (err.name === 'OverconstrainedError') {
          setError('Camera constraints not supported. Trying with lower resolution...');
          logWarn('Camera constraints not supported, trying fallback', { errorName: err.name }, 'Camera');
          // Try with lower constraints
          try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({
              video: { width: 320, height: 240, frameRate: 15 },
              audio: false
            });
            streamRef.current = fallbackStream;
            if (videoRef.current) {
              videoRef.current.srcObject = fallbackStream;
              videoRef.current.play();
              videoRef.current.onloadedmetadata = () => {
                setIsCameraReady(true);
              };
            }
            return;
          } catch (fallbackErr) {
            setError('Camera not supported. Please try a different device or browser.');
          }
        } else {
          setError('Failed to access camera. Please check your camera and try again.');
        }
      } else {
        setError('Failed to initialize camera. Please try again.');
      }
    }
  };

  // Real-time pose detection loop with throttling, error recovery, and performance monitoring
  const startPoseDetection = useCallback(() => {
    let lastDetectionTime = 0;
    let consecutiveErrors = 0;
    const maxErrors = 5;
    const detectionInterval = 1000 / 15; // 15 FPS for pose detection (reduced from 30)
    
    // Performance monitoring
    let frameCount = 0;
    let lastFpsTime = Date.now();
    let frameTimes: number[] = [];

    const detectPose = async () => {
      if (!videoRef.current || !poseDetectorRef.current || !isCameraReady) {
        animationRef.current = requestAnimationFrame(detectPose);
        return;
      }

      const now = Date.now();
      if (now - lastDetectionTime < detectionInterval) {
        animationRef.current = requestAnimationFrame(detectPose);
        return;
      }

      const frameStartTime = performance.now();

      try {
        const result = await poseDetectorRef.current.detectPose(videoRef.current);
        if (result) {
          setDetectedPoses(prev => {
            const newPoses = [...prev, result];
            // Keep last 60 frames (4 seconds at 15fps)
            return newPoses.slice(-60);
          });
          drawLandmarks(result);
          consecutiveErrors = 0; // Reset error counter on success
        }
        lastDetectionTime = now;
        
        // Performance monitoring
        frameCount++;
        const frameTime = performance.now() - frameStartTime;
        frameTimes.push(frameTime);
        
        // Keep only last 30 frame times for average calculation
        if (frameTimes.length > 30) {
          frameTimes = frameTimes.slice(-30);
        }
        
        // Update performance stats every second
        if (now - lastFpsTime >= 1000) {
          const fps = frameCount;
          const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
          const memoryUsage = (performance as any).memory ? 
            Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : 0;
          
          setPerformanceStats({
            fps,
            frameTime: Math.round(avgFrameTime),
            memoryUsage
          });
          
          frameCount = 0;
          lastFpsTime = now;
        }
        
      } catch (error) {
        console.warn('Pose detection error:', error);
        logWarn('Pose detection error', { error, consecutiveErrors }, 'PoseDetection');
        consecutiveErrors++;
        
        // If too many consecutive errors, try to reinitialize
        if (consecutiveErrors >= maxErrors) {
          console.error('Too many pose detection errors, attempting recovery...');
          logError('Too many pose detection errors, attempting recovery', { consecutiveErrors }, 'PoseDetection');
          try {
            await poseDetectorRef.current.initialize();
            consecutiveErrors = 0;
            logInfo('Pose detector reinitialized successfully', {}, 'PoseDetection');
          } catch (reinitError) {
            console.error('Failed to reinitialize pose detector:', reinitError);
            logError('Failed to reinitialize pose detector', { error: reinitError }, 'PoseDetection');
            setError('Pose detection failed. Please refresh the page.');
          }
        }
      }

      // Continue detection loop
      animationRef.current = requestAnimationFrame(detectPose);
    };

    detectPose();
  }, [isCameraReady]);

  // Draw landmarks on canvas with performance optimizations
  const drawLandmarks = useCallback((poseResult: PoseResult) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video || !showLandmarks) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Only resize canvas if dimensions changed
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Clear canvas efficiently
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw landmarks with visibility threshold
    const landmarks = poseResult.landmarks;
    const keyLandmarks = [
      { landmark: landmarks[16], color: '#FF6B6B', label: 'RW' }, // Right wrist
      { landmark: landmarks[15], color: '#4ECDC4', label: 'LW' }, // Left wrist
      { landmark: landmarks[12], color: '#45B7D1', label: 'RS' }, // Right shoulder
      { landmark: landmarks[11], color: '#96CEB4', label: 'LS' }, // Left shoulder
      { landmark: landmarks[24], color: '#FFEAA7', label: 'RH' }, // Right hip
      { landmark: landmarks[23], color: '#DDA0DD', label: 'LH' }, // Left hip
    ];

    // Batch drawing operations for better performance
    ctx.save();
    ctx.lineWidth = 2;
    ctx.font = '12px Arial';
    
    keyLandmarks.forEach(({ landmark, color, label }) => {
      if (landmark && landmark.visibility && landmark.visibility > 0.5) {
        const x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;

        // Draw circle
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        // Draw label
        ctx.fillStyle = '#000000';
        ctx.fillText(label, x + 12, y - 8);
      }
    });
    
    ctx.restore();
  }, [showLandmarks]);

  // Start recording
  const startRecording = () => {
    if (!isCameraReady) {
      setError('Camera not ready. Please wait for camera to initialize.');
      return;
    }

    setIsRecording(true);
    setDetectedPoses([]);
    setAnalysisResult(null);
    setError(null);
  };

  // Stop recording
  const stopRecording = () => {
    setIsRecording(false);
  };

  // Analyze swing using unified analysis
  const analyzeSwing = async () => {
    if (detectedPoses.length === 0) {
      setError('No swing data recorded. Please record a swing first.');
      logWarn('Analysis attempted with no pose data', {}, 'Analysis');
      return;
    }

    if (detectedPoses.length < 10) {
      setError('Insufficient swing data recorded. Please record a longer swing (at least 1 second).');
      logWarn('Analysis attempted with insufficient pose data', { poseCount: detectedPoses.length }, 'Analysis');
      return;
    }

    if (!selectedClub) {
      setError('Please select a club type.');
      logWarn('Analysis attempted without club selection', {}, 'Analysis');
      return;
    }

    logInfo('Starting swing analysis', { poseCount: detectedPoses.length, club: selectedClub }, 'Analysis');
    setIsAnalyzing(true);
    setError(null);
    setProgress({ step: 'Initializing analysis...', progress: 0 });

    try {
      // Create unified analysis worker
      workerRef.current = new Worker(new URL('../../workers/unified-analysis.worker.ts', import.meta.url));
      
      // Set up worker message handling
      workerRef.current.onmessage = (e) => {
        const { type, data } = e.data;
        
        if (type === 'PROGRESS') {
          setProgress(data);
        } else if (type === 'SWING_ANALYZED') {
          setAnalysisResult(data);
          setIsAnalyzing(false);
          
          // Save to Supabase
          saveSwingToDatabase(data);
          
          if (workerRef.current) workerRef.current.terminate();
        } else if (type === 'ERROR') {
          setError(data.error || 'Analysis failed. Please try again.');
          setIsAnalyzing(false);
          if (workerRef.current) workerRef.current.terminate();
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        setError('Analysis worker failed. Please try again.');
        setIsAnalyzing(false);
        if (workerRef.current) workerRef.current.terminate();
      };

      // Start unified analysis
      workerRef.current.postMessage({
        type: 'ANALYZE_SWING',
        data: {
          poses: detectedPoses,
          club: selectedClub,
          swingId: `camera_${Date.now()}`,
          source: 'camera' as const
        }
      });

      // Set timeout for analysis (2 minutes max)
      setTimeout(() => {
        if (workerRef.current) {
          workerRef.current.terminate();
          setError('Analysis timed out. Please try with a shorter recording.');
          setIsAnalyzing(false);
        }
      }, 2 * 60 * 1000);

    } catch (error) {
      console.error('Error starting analysis:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start analysis. Please try again.';
      setError(errorMessage);
      setIsAnalyzing(false);
    }
  };

  // Save swing to database
  const saveSwingToDatabase = async (swingData: UnifiedSwingData) => {
    try {
      const result = await saveSwing(swingData);
      if (result.success) {
        console.log('Swing saved to database successfully');
      } else {
        console.error('Failed to save swing to database:', result.error);
      }
    } catch (error) {
      console.error('Error saving swing to database:', error);
    }
  };

  // Reset analysis
  const resetAnalysis = () => {
    setAnalysisResult(null);
    setError(null);
    setDetectedPoses([]);
    setProgress({ step: '', progress: 0 });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop animation loop
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Cleanup pose detector
      if (poseDetectorRef.current) {
        poseDetectorRef.current.destroy();
      }
      
      // Terminate worker
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Initialize camera on mount
  useEffect(() => {
    initializeCamera();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <header className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1"></div>
            <h1 className="text-4xl font-bold text-white">Live Swing Analysis</h1>
            <div className="flex-1 flex justify-end">
              <Button
                onClick={() => setShowMonitoring(true)}
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/30 hover:bg-white/20"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Monitor
              </Button>
            </div>
          </div>
          <p className="text-xl text-blue-200">
            Record your swing and get instant AI-powered feedback with real-time pose detection
          </p>
        </header>

        {/* Main Content */}
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Section */}
          <section className="space-y-6" aria-label="Camera Feed and Controls">
            <article className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Camera Feed</h2>
              
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-auto"
                  muted
                  playsInline
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 10 }}
                />
                
                {isRecording && (
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center space-x-2 bg-red-500 text-white px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Recording</span>
                    </div>
                  </div>
                )}

                {!isCameraReady && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-white text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p>Initializing camera...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-white font-medium">Club Type:</label>
                  <select
                    value={selectedClub}
                    onChange={(e) => setSelectedClub(e.target.value)}
                    className="px-4 py-2 bg-white/20 text-white rounded-lg border border-white/30"
                    disabled={isRecording || isAnalyzing}
                  >
                    {clubs.map((club) => (
                      <option key={club.value} value={club.value}>
                        {club.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-white font-medium">Show Landmarks:</label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showLandmarks}
                      onChange={(e) => setShowLandmarks(e.target.checked)}
                      className="rounded"
                    />
                    <span className="ml-2 text-white text-sm">Overlay pose landmarks</span>
                  </label>
                </div>

                {/* Recording Controls */}
                <div className="flex space-x-4">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      disabled={!isCameraReady || isAnalyzing}
                      variant="danger"
                      size="lg"
                      fullWidth
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      }
                    >
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      variant="secondary"
                      size="lg"
                      fullWidth
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                      }
                    >
                      Stop Recording
                    </Button>
                  )}

                  {detectedPoses.length > 0 && !isRecording && (
                    <Button
                      onClick={analyzeSwing}
                      disabled={isAnalyzing}
                      variant="success"
                      size="lg"
                      fullWidth
                      loading={isAnalyzing}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      }
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Analyze Swing'}
                    </Button>
                  )}
                </div>

                {/* Progress Indicator */}
                {isAnalyzing && (
                  <div className="bg-blue-100 text-blue-800 py-3 px-4 rounded-lg">
                    <LoadingSpinner 
                      size="md" 
                      text="Analyzing Swing..." 
                      className="mb-4"
                    />
                    <ProgressBar 
                      progress={progress.progress}
                      step={progress.step}
                      showPercentage={true}
                    />
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="space-y-3">
                    <ErrorAlert 
                      message={error} 
                      onDismiss={() => setError(null)}
                      type="error"
                      className="bg-red-100 text-red-800"
                    />
                    {error.includes('Camera') && (
                      <Button
                        onClick={() => {
                          setError(null);
                          setIsCameraReady(false);
                          initializeCamera();
                        }}
                        variant="secondary"
                        size="sm"
                        fullWidth
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        }
                      >
                        Retry Camera
                      </Button>
                    )}
                  </div>
                )}

                {/* Recording Stats */}
                {detectedPoses.length > 0 && (
                  <div className="text-white text-sm space-y-1">
                    <p>Frames recorded: {detectedPoses.length}</p>
                    <p>Duration: {(detectedPoses.length / 15).toFixed(1)}s</p>
                  </div>
                )}

                {/* Performance Stats */}
                {isCameraReady && (
                  <div className="bg-blue-900/30 text-blue-200 text-xs p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">Performance</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        performanceStats.fps >= 10 ? 'bg-green-600' : 
                        performanceStats.fps >= 5 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}>
                        {performanceStats.fps} FPS
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Frame Time: {performanceStats.frameTime}ms</div>
                      <div>Memory: {performanceStats.memoryUsage}MB</div>
                    </div>
                  </div>
                )}
              </div>
            </article>
          </section>

          {/* Results Section */}
          <div className="space-y-6">
            {analysisResult ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4">Analysis Results</h2>
                
                {/* VistaSwing AI Report Card */}
                {analysisResult.aiFeedback.reportCard && (
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-200 mb-6">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">VistaSwing AI Report Card</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {/* Setup */}
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-700">Setup</span>
                          <span className={`text-2xl font-bold ${getGradeColor(analysisResult.aiFeedback.reportCard.setup.grade)}`}>
                            {analysisResult.aiFeedback.reportCard.setup.grade}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{analysisResult.aiFeedback.reportCard.setup.tip}</p>
                      </div>

                      {/* Grip */}
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-700">Grip</span>
                          <span className={`text-2xl font-bold ${getGradeColor(analysisResult.aiFeedback.reportCard.grip.grade)}`}>
                            {analysisResult.aiFeedback.reportCard.grip.grade}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{analysisResult.aiFeedback.reportCard.grip.tip}</p>
                      </div>

                      {/* Alignment */}
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-700">Alignment</span>
                          <span className={`text-2xl font-bold ${getGradeColor(analysisResult.aiFeedback.reportCard.alignment.grade)}`}>
                            {analysisResult.aiFeedback.reportCard.alignment.grade}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{analysisResult.aiFeedback.reportCard.alignment.tip}</p>
                      </div>

                      {/* Rotation */}
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-700">Rotation</span>
                          <span className={`text-2xl font-bold ${getGradeColor(analysisResult.aiFeedback.reportCard.rotation.grade)}`}>
                            {analysisResult.aiFeedback.reportCard.rotation.grade}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{analysisResult.aiFeedback.reportCard.rotation.tip}</p>
                      </div>

                      {/* Impact */}
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-700">Impact</span>
                          <span className={`text-2xl font-bold ${getGradeColor(analysisResult.aiFeedback.reportCard.impact.grade)}`}>
                            {analysisResult.aiFeedback.reportCard.impact.grade}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{analysisResult.aiFeedback.reportCard.impact.tip}</p>
                      </div>

                      {/* Follow Through */}
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-700">Follow Through</span>
                          <span className={`text-2xl font-bold ${getGradeColor(analysisResult.aiFeedback.reportCard.followThrough.grade)}`}>
                            {analysisResult.aiFeedback.reportCard.followThrough.grade}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{analysisResult.aiFeedback.reportCard.followThrough.tip}</p>
                      </div>
                    </div>

                    {/* Overall Score */}
                    <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-lg border border-green-300">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-bold text-gray-900">Overall Score</span>
                        <span className={`text-4xl font-bold ${getGradeColor(analysisResult.aiFeedback.reportCard.overall.score)}`}>
                          {analysisResult.aiFeedback.reportCard.overall.score}
                        </span>
                      </div>
                      <p className="text-gray-700 font-medium">{analysisResult.aiFeedback.reportCard.overall.tip}</p>
                    </div>
                  </div>
                )}

                {/* Technical Metrics */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Technical Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Swing Plane:</span>
                      <span className="font-medium">{analysisResult.metrics.swingPlaneAngle.toFixed(1)}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tempo Ratio:</span>
                      <span className="font-medium">{analysisResult.metrics.tempoRatio.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hip Rotation:</span>
                      <span className="font-medium">{analysisResult.metrics.hipRotation.toFixed(1)}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shoulder Rotation:</span>
                      <span className="font-medium">{analysisResult.metrics.shoulderRotation.toFixed(1)}°</span>
                    </div>
                  </div>
                </div>

                {/* Processing Info */}
                <div className="text-white text-sm">
                  <p>Processed {analysisResult.frameCount} frames in {analysisResult.processingTime}ms</p>
                  <p>Detected {analysisResult.phases.length} swing phases</p>
                </div>

                {/* Reset Button */}
                <button
                  onClick={resetAnalysis}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium mt-4"
                >
                  Reset Analysis
                </button>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4">Instructions</h2>
                <div className="text-blue-200 space-y-4">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">1️⃣</span>
                    <div>
                      <p className="font-semibold">Select Club Type</p>
                      <p className="text-sm">Choose the club you're using for this swing</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">2️⃣</span>
                    <div>
                      <p className="font-semibold">Start Recording</p>
                      <p className="text-sm">Click "Start Recording" and perform your swing</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">3️⃣</span>
                    <div>
                      <p className="font-semibold">Stop Recording</p>
                      <p className="text-sm">Click "Stop Recording" when you finish your swing</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">4️⃣</span>
                    <div>
                      <p className="font-semibold">Analyze Swing</p>
                      <p className="text-sm">Click "Analyze Swing" to get AI-powered feedback</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      
      <MonitoringDashboard
        isOpen={showMonitoring}
        onClose={() => setShowMonitoring(false)}
      />
    </div>
  );
}