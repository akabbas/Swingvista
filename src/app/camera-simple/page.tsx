"use client";
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RealtimePoseDetector, type RealtimePoseResult } from '@/lib/realtime-pose-detector';

export default function SimpleCameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<RealtimePoseDetector | null>(null);
  
  const [isRunning, setIsRunning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poseCount, setPoseCount] = useState(0);
  const [fps, setFps] = useState(0);

  // FPS calculation
  const lastTimeRef = useRef<number>(Date.now());
  const frameCountRef = useRef<number>(0);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      setError(null);
      console.log('📹 Initializing camera...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        console.log('✅ Camera initialized');
      }
    } catch (err) {
      console.error('❌ Camera initialization failed:', err);
      setError('Failed to access camera. Please check permissions.');
    }
  }, []);

  // Initialize pose detector
  const initializeDetector = useCallback(async () => {
    try {
      setError(null);
      console.log('🎯 Initializing pose detector...');

      const detector = new RealtimePoseDetector();
      await detector.initialize();
      
      detectorRef.current = detector;
      setIsInitialized(true);
      console.log('✅ Pose detector initialized');
    } catch (err) {
      console.error('❌ Pose detector initialization failed:', err);
      setError('Failed to initialize pose detection. Please refresh the page.');
    }
  }, []);

  // Start pose detection
  const startDetection = useCallback(() => {
    if (!detectorRef.current || !videoRef.current || !canvasRef.current) {
      setError('Not ready for detection. Please wait for initialization.');
      return;
    }

    try {
      setIsRunning(true);
      setPoseCount(0);
      setFps(0);
      frameCountRef.current = 0;
      lastTimeRef.current = Date.now();

      detectorRef.current.startDetection(
        videoRef.current,
        canvasRef.current,
        (pose: RealtimePoseResult) => {
          setPoseCount(prev => prev + 1);
          
          // Calculate FPS
          frameCountRef.current++;
          const now = Date.now();
          if (now - lastTimeRef.current >= 1000) {
            setFps(frameCountRef.current);
            frameCountRef.current = 0;
            lastTimeRef.current = now;
          }
        }
      );

      console.log('🎬 Started pose detection');
    } catch (err) {
      console.error('❌ Failed to start detection:', err);
      setError('Failed to start pose detection.');
    }
  }, []);

  // Stop pose detection
  const stopDetection = useCallback(() => {
    if (detectorRef.current) {
      detectorRef.current.stopDetection();
      setIsRunning(false);
      console.log('🛑 Stopped pose detection');
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (detectorRef.current) {
        detectorRef.current.dispose();
      }
    };
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeCamera();
    initializeDetector();
  }, [initializeCamera, initializeDetector]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Real-Time Golf Analysis</h1>
              <p className="text-gray-600">Live pose tracking for golf swing analysis</p>
            </div>
            <Link 
              href="/upload" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📤 Upload Video
            </Link>
          </div>

          {/* Status */}
          <div className="flex items-center gap-4 text-sm">
            <div className={`px-3 py-1 rounded-full ${isInitialized ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {isInitialized ? '✅ Ready' : '⏳ Initializing...'}
            </div>
            <div className={`px-3 py-1 rounded-full ${isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {isRunning ? '🎬 Live' : '⏸️ Stopped'}
            </div>
            <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-800">
              FPS: {fps}
            </div>
            <div className="px-3 py-1 rounded-full bg-purple-100 text-purple-800">
              Poses: {poseCount}
            </div>
          </div>
        </div>

        {/* Camera View */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-w-2xl mx-auto rounded-lg"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ zIndex: 10 }}
            />
          </div>

          {/* Controls */}
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={startDetection}
              disabled={!isInitialized || isRunning}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? '🎬 Detecting...' : '▶️ Start Detection'}
            </button>
            <button
              onClick={stopDetection}
              disabled={!isRunning}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              ⏹️ Stop
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
            <ol className="list-decimal list-inside text-blue-800 space-y-1">
              <li>Position yourself in front of the camera</li>
              <li>Click "Start Detection" to begin live pose tracking</li>
              <li>Perform your golf swing - you should see green lines tracking your body</li>
              <li>Click "Stop" when finished</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
