"use client";
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MediaPipePoseDetector, type PoseResult } from '@/lib/mediapipe';
import { trackEvent } from '@/lib/analytics';
import CameraOverlayContainer from '@/components/ui/CameraOverlayContainer';
import { EnhancedPhaseDetector, WeightDistribution, ClubPosition } from '@/lib/enhanced-phase-detector';
import { calculateSwingMetrics } from '@/lib/golf-metrics';

export default function CameraEnhancedPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameHandleRef = useRef<number | null>(null);
  const poseDetectorRef = useRef<MediaPipePoseDetector | null>(null);
  const phaseDetectorRef = useRef<EnhancedPhaseDetector | null>(null);

  // State management
  const [isDetecting, setIsDetecting] = useState(false);
  const [fps, setFps] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<string>('Ready');
  const [liveFeedback, setLiveFeedback] = useState<string>('');
  const [swingMetrics, setSwingMetrics] = useState<any>(null);
  const [poseHistory, setPoseHistory] = useState<PoseResult[]>([]);
  const [isSwinging, setIsSwinging] = useState(false);
  const [swingStartTime, setSwingStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [weightDistribution, setWeightDistribution] = useState<WeightDistribution>({ left: 50, right: 50, total: 100 });
  const [clubPosition, setClubPosition] = useState<ClubPosition>({ x: 0.5, y: 0.5 });

  // Simple moving FPS calculator
  const fpsSamples = useRef<number[]>([]);
  const updateFps = useCallback((instantFps: number) => {
    fpsSamples.current.push(instantFps);
    if (fpsSamples.current.length > 20) fpsSamples.current.shift();
    const avg = fpsSamples.current.reduce((a, b) => a + b, 0) / fpsSamples.current.length;
    setFps(Math.round(avg));
  }, []);

  // Initialize enhanced phase detector
  useEffect(() => {
    if (!phaseDetectorRef.current) {
      phaseDetectorRef.current = new EnhancedPhaseDetector();
    }
  }, []);

  // Detect swing phase and provide feedback using enhanced detection
  const analyzeSwingPhase = useCallback((pose: PoseResult) => {
    if (!pose.landmarks || !phaseDetectorRef.current) return;

    // Update pose history
    setPoseHistory(prev => [...prev.slice(-20), pose]);

    // Calculate current time
    const currentTime = Date.now();
    setCurrentTime(currentTime);

    // Use enhanced phase detector
    const currentFrame = poseHistory.length;
    const detectedPhase = phaseDetectorRef.current.detectSwingPhase([...poseHistory, pose], currentFrame, currentTime);
    
    // Update weight distribution and club position
    const weightDist = phaseDetectorRef.current.calculateWeightDistribution(pose);
    const clubPos = phaseDetectorRef.current.calculateClubHeadPosition(pose);
    
    setWeightDistribution(weightDist);
    setClubPosition(clubPos);
    setCurrentPhase(detectedPhase.name);

    // Generate feedback based on phase
    let feedback = '';
    switch (detectedPhase.name) {
      case 'address':
        feedback = 'Setup position - maintain good posture and balance.';
        break;
      case 'backswing':
        feedback = 'Good takeaway. Keep your left arm straight.';
        break;
      case 'top':
        feedback = 'At the top. Start your downswing with your hips.';
        break;
      case 'downswing':
        feedback = 'Power through! Keep your tempo smooth.';
        break;
      case 'impact':
        feedback = 'Great impact! Follow through to finish.';
        break;
      case 'follow-through':
        feedback = 'Excellent finish! Hold your balance.';
        break;
      default:
        feedback = 'Ready to swing.';
    }

    setLiveFeedback(feedback);

    // Check if swing is complete
    if (detectedPhase.name === 'follow-through' && poseHistory.length > 30) {
      // Calculate final metrics
      const metrics = calculateSwingMetrics([...poseHistory, pose], [], { path: [], smoothness: 0, accuracy: 0 });
      setSwingMetrics(metrics);
      
      // Reset after a delay
      setTimeout(() => {
        setPoseHistory([]);
        setSwingMetrics(null);
        phaseDetectorRef.current?.reset();
      }, 3000);
    }
  }, [poseHistory]);

  // Process video frame for pose detection
  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !poseDetectorRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Detect poses
    const pose = await poseDetectorRef.current.detectPose(video);
    
    if (pose && pose.landmarks) {
      analyzeSwingPhase(pose);
      
      // Draw pose landmarks
      ctx.fillStyle = '#00FF00';
      pose.landmarks.forEach((landmark, index) => {
        if (landmark.visibility && landmark.visibility > 0.5) {
          ctx.beginPath();
          ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    }

    // Continue processing
    frameHandleRef.current = requestAnimationFrame(processFrame);
  }, [analyzeSwingPhase]);

  // Start camera and pose detection
  const startDetection = useCallback(async () => {
    try {
      setIsDetecting(true);
      
      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

      // Initialize pose detector
      if (!poseDetectorRef.current) {
        poseDetectorRef.current = MediaPipePoseDetector.getInstance();
        await poseDetectorRef.current.initialize();
      }

      // Start processing frames
      processFrame();
      
      trackEvent('camera_started', { method: 'enhanced_phase_detection' });
    } catch (error) {
      console.error('Error starting camera:', error);
      setIsDetecting(false);
    }
  }, [processFrame]);

  // Stop detection
  const stopDetection = useCallback(() => {
    if (frameHandleRef.current) {
      cancelAnimationFrame(frameHandleRef.current);
      frameHandleRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsDetecting(false);
    setPoseHistory([]);
    setSwingMetrics(null);
    phaseDetectorRef.current?.reset();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-400 hover:text-blue-300">
            SwingVista AI
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">Enhanced Phase Detection</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">{fps} FPS</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Feed */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Live Camera Analysis</h2>
              
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto rounded-lg"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                />
                
                {/* Overlay Information */}
                <div className="absolute top-4 left-4 bg-black bg-opacity-75 p-3 rounded-lg">
                  <div className="text-sm">
                    <div className="font-semibold text-green-400">Phase: {currentPhase}</div>
                    <div className="text-gray-300">Weight: {weightDistribution.left}% L / {weightDistribution.right}% R</div>
                    <div className="text-gray-300">Club: X={clubPosition.x.toFixed(2)}, Y={clubPosition.y.toFixed(2)}</div>
                    <div className="text-gray-300">Total: {weightDistribution.total}%</div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-4 flex space-x-4">
                {!isDetecting ? (
                  <button
                    onClick={startDetection}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                  >
                    Start Analysis
                  </button>
                ) : (
                  <button
                    onClick={stopDetection}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium"
                  >
                    Stop Analysis
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="space-y-6">
            {/* Current Phase */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Current Phase</h3>
              <div className="text-2xl font-bold text-blue-400 mb-2">{currentPhase}</div>
              <div className="text-sm text-gray-300">{liveFeedback}</div>
            </div>

            {/* Weight Distribution */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Weight Distribution</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Left Foot</span>
                  <span className="font-mono">{weightDistribution.left}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${weightDistribution.left}%` }}
                  ></div>
                </div>
                <div className="flex justify-between">
                  <span>Right Foot</span>
                  <span className="font-mono">{weightDistribution.right}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${weightDistribution.right}%` }}
                  ></div>
                </div>
                <div className="text-center text-sm text-gray-400 mt-2">
                  Total: {weightDistribution.total}%
                </div>
              </div>
            </div>

            {/* Club Position */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Club Position</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>X Position</span>
                  <span className="font-mono">{clubPosition.x.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Y Position</span>
                  <span className="font-mono">{clubPosition.y.toFixed(3)}</span>
                </div>
                {clubPosition.angle && (
                  <div className="flex justify-between">
                    <span>Angle</span>
                    <span className="font-mono">{clubPosition.angle.toFixed(1)}°</span>
                  </div>
                )}
              </div>
            </div>

            {/* Debug Information */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Debug Info</h3>
              <div className="text-sm space-y-1">
                <div>Frames: {poseHistory.length}</div>
                <div>Time: {currentTime}ms</div>
                <div>Phase History: {phaseDetectorRef.current?.getPhaseHistory().length || 0} transitions</div>
              </div>
            </div>

            {/* Swing Metrics */}
            {swingMetrics && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Swing Metrics</h3>
                <div className="text-sm space-y-1">
                  {Object.entries(swingMetrics).map(([key, value]) => {
                    // Handle different metric types properly
                    let displayValue = 'N/A';
                    
                    if (typeof value === 'number') {
                      displayValue = value.toFixed(2);
                    } else if (typeof value === 'object' && value !== null) {
                      // Handle metric objects with specific properties
                      if (key === 'tempo' && (value as any).tempoRatio !== undefined) {
                        displayValue = `${(value as any).tempoRatio.toFixed(1)}:1`;
                      } else if (key === 'rotation' && (value as any).shoulderTurn !== undefined) {
                        displayValue = `${(value as any).shoulderTurn.toFixed(0)}°`;
                      } else if (key === 'weightTransfer' && (value as any).impact !== undefined) {
                        displayValue = `${(value as any).impact.toFixed(1)}%`;
                      } else if (key === 'swingPlane' && (value as any).planeDeviation !== undefined) {
                        displayValue = `${(value as any).planeDeviation.toFixed(1)}°`;
                      } else if (key === 'bodyAlignment' && (value as any).spineAngle !== undefined) {
                        displayValue = `${(value as any).spineAngle.toFixed(1)}°`;
                      } else {
                        // For other objects, show a summary
                        const objKeys = Object.keys(value);
                        if (objKeys.length > 0) {
                          displayValue = `${objKeys.length} metrics`;
                        } else {
                          displayValue = 'No data';
                        }
                      }
                    } else if (typeof value === 'string') {
                      displayValue = value;
                    } else if (typeof value === 'boolean') {
                      displayValue = value ? 'Yes' : 'No';
                    }
                    
                    return (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-mono text-green-400">{displayValue}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}





