'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PoseResult } from '@/lib/mediapipe';
import { UnifiedSwingData } from '@/lib/unified-analysis';
import { saveSwing } from '@/lib/supabase';

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

  // Initialize camera with proper constraints
  const initializeCamera = async () => {
    try {
      setError(null);
      
      // Request camera access with optimal constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 }
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
      
      // Start real-time pose detection
      startPoseDetection();

    } catch (err) {
      console.error('Camera initialization error:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera permissions and refresh the page.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please connect a camera and try again.');
        } else {
          setError('Failed to access camera. Please check your camera and try again.');
        }
      } else {
        setError('Failed to initialize camera. Please try again.');
      }
    }
  };

  // Real-time pose detection loop
  const startPoseDetection = useCallback(() => {
    const detectPose = async () => {
      if (!videoRef.current || !poseDetectorRef.current || !isCameraReady) {
        animationRef.current = requestAnimationFrame(detectPose);
        return;
      }

      try {
        const result = await poseDetectorRef.current.detectPose(videoRef.current);
        if (result) {
          setDetectedPoses(prev => {
            const newPoses = [...prev, result];
            // Keep last 30 frames (1 second at 30fps)
            return newPoses.slice(-30);
          });
          drawLandmarks(result);
        }
      } catch (error) {
        console.warn('Pose detection error:', error);
      }

      // Continue detection loop
      animationRef.current = requestAnimationFrame(detectPose);
    };

    detectPose();
  }, [isCameraReady]);

  // Draw landmarks on canvas
  const drawLandmarks = useCallback((poseResult: PoseResult) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video || !showLandmarks) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw landmarks
    const landmarks = poseResult.landmarks;
    const keyLandmarks = [
      { landmark: landmarks[16], color: '#FF6B6B', label: 'RW' }, // Right wrist
      { landmark: landmarks[15], color: '#4ECDC4', label: 'LW' }, // Left wrist
      { landmark: landmarks[12], color: '#45B7D1', label: 'RS' }, // Right shoulder
      { landmark: landmarks[11], color: '#96CEB4', label: 'LS' }, // Left shoulder
      { landmark: landmarks[24], color: '#FFEAA7', label: 'RH' }, // Right hip
      { landmark: landmarks[23], color: '#DDA0DD', label: 'LH' }, // Left hip
    ];

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
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw label
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.fillText(label, x + 12, y - 8);
      }
    });
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
      return;
    }

    if (detectedPoses.length < 10) {
      setError('Insufficient swing data recorded. Please record a longer swing (at least 1 second).');
      return;
    }

    if (!selectedClub) {
      setError('Please select a club type.');
      return;
    }

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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Live Swing Analysis</h1>
          <p className="text-xl text-blue-200">
            Record your swing and get instant AI-powered feedback with real-time pose detection
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Section */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
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
                    <button
                      onClick={startRecording}
                      disabled={!isCameraReady || isAnalyzing}
                      className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Start Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 font-medium flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                      Stop Recording
                    </button>
                  )}

                  {detectedPoses.length > 0 && !isRecording && (
                    <button
                      onClick={analyzeSwing}
                      disabled={isAnalyzing}
                      className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {isAnalyzing ? 'Analyzing...' : 'Analyze Swing'}
                    </button>
                  )}
                </div>

                {/* Progress Indicator */}
                {isAnalyzing && (
                  <div className="bg-blue-100 text-blue-800 py-3 px-4 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing Swing...
                    </div>
                    <div className="text-sm">
                      <div className="mb-1">{progress.step}</div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress.progress}%` }}
                        ></div>
                      </div>
                      <div className="mt-1 text-xs">{progress.progress}%</div>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="bg-red-100 text-red-800 py-3 px-4 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </div>
                  </div>
                )}

                {/* Recording Stats */}
                {detectedPoses.length > 0 && (
                  <div className="text-white text-sm">
                    <p>Frames recorded: {detectedPoses.length}</p>
                    <p>Duration: {(detectedPoses.length / 30).toFixed(1)}s</p>
                  </div>
                )}
              </div>
            </div>
          </div>

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
        </div>
      </div>
    </div>
  );
}