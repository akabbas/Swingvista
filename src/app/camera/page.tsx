"use client";
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MediaPipePoseDetector, type PoseResult } from '@/lib/mediapipe';
import { trackEvent } from '@/lib/analytics';
import CameraOverlayContainer from '@/components/ui/CameraOverlayContainer';
import { EnhancedSwingPhaseDetector, type EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';
import { EnhancedPhaseDetector, WeightDistribution, ClubPosition } from '@/lib/enhanced-phase-detector';
// import { SwingPhase } from '@/lib/swing-phases';
// import { calculateSwingMetrics } from '@/lib/golf-metrics';

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameHandleRef = useRef<number | null>(null);
  const detectorRef = useRef<MediaPipePoseDetector | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);
  const [fps, setFps] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<string>('Ready');
  const [liveFeedback, setLiveFeedback] = useState<string>('');
  const [swingMetrics, setSwingMetrics] = useState<any>(null);
  const [poseHistory, setPoseHistory] = useState<PoseResult[]>([]);
  const [isSwinging, setIsSwinging] = useState(false);
  const [swingStartTime, setSwingStartTime] = useState<number | null>(null);
  const [enhancedPhases, setEnhancedPhases] = useState<EnhancedSwingPhase[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [weightDistribution, setWeightDistribution] = useState<WeightDistribution>({ left: 50, right: 50, total: 100 });
  const [clubPosition, setClubPosition] = useState<ClubPosition>({ x: 0.5, y: 0.5 });
  
  // Enhanced phase detector instance
  const phaseDetectorRef = useRef<EnhancedPhaseDetector | null>(null);

  // Simple moving FPS calculator
  const fpsSamples = useRef<number[]>([]);
  const updateFps = useCallback((instantFps: number) => {
    fpsSamples.current.push(instantFps);
    if (fpsSamples.current.length > 20) fpsSamples.current.shift();
    const avg = fpsSamples.current.reduce((a, b) => a + b, 0) / fpsSamples.current.length;
    setFps(Math.round(avg));
  }, []);

  // Detect swing phase and provide feedback using enhanced detection
  const analyzeSwingPhase = useCallback((pose: PoseResult) => {
    if (!pose.landmarks) return;

    const landmarks = pose.landmarks;
    const rightWrist = landmarks[16]; // Right wrist for club position
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    if (!rightWrist || !leftShoulder || !rightShoulder || !leftHip || !rightHip) return;

    // Calculate body angles
    const shoulderAngle = Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    ) * (180 / Math.PI);

    const hipAngle = Math.atan2(
      rightHip.y - leftHip.y,
      rightHip.x - leftHip.x
    ) * (180 / Math.PI);

    const shoulderHipAngle = Math.abs(shoulderAngle - hipAngle);

    // Enhanced swing phase detection
    let phase = 'Ready';
    let feedback = '';

    // Check if we're starting a new swing
    if (!isSwinging && poseHistory.length === 0) {
      // Look for initial movement to start swing
      const movement = Math.sqrt(
        Math.pow(rightWrist.x - (rightWrist.x || 0), 2) + 
        Math.pow(rightWrist.y - (rightWrist.y || 0), 2)
      );
      
      if (movement > 0.02) {
        setIsSwinging(true);
        setSwingStartTime(Date.now());
        setPoseHistory([pose]);
        phase = 'Address';
        feedback = 'Starting swing - maintain good posture.';
      }
    } else if (isSwinging && poseHistory.length > 0) {
      // Analyze swing progression
      const lastPose = poseHistory[poseHistory.length - 1];
      const lastRightWrist = lastPose.landmarks?.[16];
      
      if (lastRightWrist) {
        const dy = rightWrist.y - lastRightWrist.y;
        const dx = rightWrist.x - lastRightWrist.x;
        const velocity = Math.sqrt(dx * dx + dy * dy);
        
        // Determine phase based on wrist movement and body position
        if (rightWrist.y < lastRightWrist.y && velocity > 0.01) {
          phase = 'Backswing';
          feedback = 'Good takeaway. Keep your left arm straight.';
        } else if (rightWrist.y > lastRightWrist.y && shoulderHipAngle > 30) {
          phase = 'Top';
          feedback = 'At the top. Start your downswing with your hips.';
        } else if (rightWrist.y < lastRightWrist.y && shoulderHipAngle > 20) {
          phase = 'Downswing';
          feedback = 'Power through! Keep your tempo smooth.';
        } else if (rightWrist.y > lastRightWrist.y && shoulderHipAngle < 20) {
          phase = 'Impact';
          feedback = 'Great impact! Follow through to finish.';
        } else if (rightWrist.y > lastRightWrist.y && shoulderHipAngle < 10) {
          phase = 'Follow-through';
          feedback = 'Excellent finish! Hold your balance.';
        } else {
          phase = 'Transition';
          feedback = 'Smooth transition between phases.';
        }
      }
      
      // Check if swing is complete
      if (poseHistory.length > 30 && shoulderHipAngle < 5 && rightWrist.y > 0.7) {
        setIsSwinging(false);
        setSwingStartTime(null);
        
        // Calculate comprehensive swing metrics using accurate calculations
        if (poseHistory.length > 10) {
          try {
            // Create mock phases for real-time analysis
            const swingDuration = (Date.now() - (swingStartTime || Date.now())) / 1000;
            const phases = [
              { 
                name: 'address' as const, 
                startTime: 0, 
                endTime: swingDuration * 0.1, 
                startFrame: 0, 
                endFrame: Math.floor(poseHistory.length * 0.1), 
                duration: swingDuration * 0.1 * 1000,
                keyLandmarks: [],
                color: '#3B82F6',
                description: 'Setup position',
                confidence: 0.9,
                keyMetrics: {}
              },
              { 
                name: 'backswing' as const, 
                startTime: swingDuration * 0.1, 
                endTime: swingDuration * 0.7, 
                startFrame: Math.floor(poseHistory.length * 0.1), 
                endFrame: Math.floor(poseHistory.length * 0.7), 
                duration: swingDuration * 0.6 * 1000,
                keyLandmarks: [],
                color: '#10B981',
                description: 'Backswing motion',
                confidence: 0.9,
                keyMetrics: {}
              },
              { 
                name: 'downswing' as const, 
                startTime: swingDuration * 0.7, 
                endTime: swingDuration * 0.9, 
                startFrame: Math.floor(poseHistory.length * 0.7), 
                endFrame: Math.floor(poseHistory.length * 0.9), 
                duration: swingDuration * 0.2 * 1000,
                keyLandmarks: [],
                color: '#F59E0B',
                description: 'Downswing motion',
                confidence: 0.9,
                keyMetrics: {}
              },
              { 
                name: 'impact' as const, 
                startTime: swingDuration * 0.9, 
                endTime: swingDuration * 0.95, 
                startFrame: Math.floor(poseHistory.length * 0.9), 
                endFrame: Math.floor(poseHistory.length * 0.95), 
                duration: swingDuration * 0.05 * 1000,
                keyLandmarks: [],
                color: '#EF4444',
                description: 'Impact position',
                confidence: 0.9,
                keyMetrics: {}
              },
              { 
                name: 'follow-through' as const, 
                startTime: swingDuration * 0.95, 
                endTime: swingDuration, 
                startFrame: Math.floor(poseHistory.length * 0.95), 
                endFrame: poseHistory.length - 1, 
                duration: swingDuration * 0.05 * 1000,
                keyLandmarks: [],
                color: '#8B5CF6',
                description: 'Follow through',
                confidence: 0.9,
                keyMetrics: {}
              }
            ];
            
            // Create mock trajectory
            const trajectory = {
              clubhead: poseHistory.map((pose, index) => ({
                x: pose.landmarks[16]?.x || 0.5,
                y: pose.landmarks[16]?.y || 0.5,
                z: pose.landmarks[16]?.z || 0,
                timestamp: pose.timestamp || index * 33,
                frame: index
              })),
              rightWrist: poseHistory.map((pose, index) => ({
                x: pose.landmarks[16]?.x || 0.5,
                y: pose.landmarks[16]?.y || 0.5,
                z: pose.landmarks[16]?.z || 0,
                timestamp: pose.timestamp || index * 33,
                frame: index
              })),
              leftWrist: poseHistory.map((pose, index) => ({
                x: pose.landmarks[15]?.x || 0.5,
                y: pose.landmarks[15]?.y || 0.5,
                z: pose.landmarks[15]?.z || 0,
                timestamp: pose.timestamp || index * 33,
                frame: index
              })),
              rightShoulder: poseHistory.map((pose, index) => ({
                x: pose.landmarks[12]?.x || 0.5,
                y: pose.landmarks[12]?.y || 0.5,
                z: pose.landmarks[12]?.z || 0,
                timestamp: pose.timestamp || index * 33,
                frame: index
              })),
              leftShoulder: poseHistory.map((pose, index) => ({
                x: pose.landmarks[11]?.x || 0.5,
                y: pose.landmarks[11]?.y || 0.5,
                z: pose.landmarks[11]?.z || 0,
                timestamp: pose.timestamp || index * 33,
                frame: index
              })),
              rightHip: poseHistory.map((pose, index) => ({
                x: pose.landmarks[24]?.x || 0.5,
                y: pose.landmarks[24]?.y || 0.5,
                z: pose.landmarks[24]?.z || 0,
                timestamp: pose.timestamp || index * 33,
                frame: index
              })),
              leftHip: poseHistory.map((pose, index) => ({
                x: pose.landmarks[23]?.x || 0.5,
                y: pose.landmarks[23]?.y || 0.5,
                z: pose.landmarks[23]?.z || 0,
                timestamp: pose.timestamp || index * 33,
                frame: index
              }))
            };
            
            // Import and use accurate calculations
            import('@/lib/accurate-swing-metrics').then(({ calculateAccurateSwingMetrics }) => {
              const accurateMetrics = calculateAccurateSwingMetrics(poseHistory, phases, trajectory);
              
              // Convert to the expected format
              const swingMetrics = {
                overallScore: accurateMetrics.overallScore,
                letterGrade: accurateMetrics.letterGrade,
                tempo: {
                  tempoRatio: accurateMetrics.tempo.tempoRatio,
                  backswingTime: accurateMetrics.tempo.backswingTime,
                  downswingTime: accurateMetrics.tempo.downswingTime,
                  score: accurateMetrics.tempo.score
                },
                rotation: {
                  shoulderTurn: accurateMetrics.rotation.shoulderTurn,
                  hipTurn: accurateMetrics.rotation.hipTurn,
                  xFactor: accurateMetrics.rotation.xFactor,
                  score: accurateMetrics.rotation.score
                },
                weightTransfer: {
                  backswing: accurateMetrics.weightTransfer.backswing,
                  impact: accurateMetrics.weightTransfer.impact,
                  finish: accurateMetrics.weightTransfer.finish,
                  score: accurateMetrics.weightTransfer.score
                },
                swingPlane: {
                  shaftAngle: accurateMetrics.swingPlane.shaftAngle,
                  planeDeviation: accurateMetrics.swingPlane.planeDeviation,
                  score: accurateMetrics.swingPlane.score
                },
                bodyAlignment: {
                  spineAngle: accurateMetrics.bodyAlignment.spineAngle,
                  headMovement: accurateMetrics.bodyAlignment.headMovement,
                  kneeFlex: accurateMetrics.bodyAlignment.kneeFlex,
                  score: accurateMetrics.bodyAlignment.score
                }
              };
              
              setSwingMetrics(swingMetrics);
              console.log('Accurate swing analysis complete:', swingMetrics);
            }).catch(error => {
              console.error('Error importing accurate metrics:', error);
              // Fallback to simple metrics
              const simpleMetrics = {
                overallScore: Math.min(95, 60 + (shoulderHipAngle > 20 ? 15 : 0)),
                letterGrade: shoulderHipAngle > 20 ? 'B' : 'C',
                tempo: {
                  tempoRatio: 3.0,
                  backswingTime: swingDuration * 0.6,
                  downswingTime: swingDuration * 0.4,
                  score: 75
                },
                rotation: {
                  shoulderTurn: Math.min(120, shoulderHipAngle * 2),
                  hipTurn: Math.min(60, shoulderHipAngle),
                  xFactor: Math.max(0, shoulderHipAngle - 10),
                  score: Math.min(100, shoulderHipAngle * 3)
                },
                weightTransfer: {
                  backswing: 60,
                  impact: 40,
                  finish: 80,
                  score: 70
                },
                swingPlane: {
                  shaftAngle: 65,
                  planeDeviation: 8,
                  score: 72
                },
                bodyAlignment: {
                  spineAngle: 5,
                  headMovement: 3,
                  kneeFlex: 15,
                  score: 78
                }
              };
              setSwingMetrics(simpleMetrics);
            });
          } catch (error) {
            console.error('Error calculating metrics:', error);
          }
        }
        setPoseHistory([]);
      }
    } else {
      phase = 'Ready';
      feedback = 'Get ready for your next swing.';
    }

    setCurrentPhase(phase);
    setLiveFeedback(feedback);
  }, [isSwinging, poseHistory, swingStartTime]);

  // Add pose to history for analysis
  const addPoseToHistory = useCallback((pose: PoseResult) => {
    if (isSwinging) {
      setPoseHistory(prev => {
        const newHistory = [...prev, pose];
        // Keep only last 30 poses (about 1 second at 30fps)
        return newHistory.slice(-30);
      });
    }
  }, [isSwinging]);

  // Update current time for overlays
  const updateCurrentTime = useCallback(() => {
    if (isSwinging && swingStartTime) {
      setCurrentTime(Date.now() - swingStartTime);
    } else {
      setCurrentTime(0);
    }
  }, [isSwinging, swingStartTime]);

  // Generate enhanced phases from pose history
  const generateEnhancedPhases = useCallback(() => {
    if (poseHistory.length < 10) return;

    try {
      const phaseDetector = new EnhancedSwingPhaseDetector();
      const landmarks = poseHistory.map(pose => pose.landmarks || []);
      const timestamps = poseHistory.map(pose => pose.timestamp || 0);
      
      // Create a simple trajectory from wrist positions
      const trajectory = {
        rightWrist: poseHistory.map(pose => ({
          x: pose.landmarks?.[16]?.x || 0,
          y: pose.landmarks?.[16]?.y || 0,
          z: pose.landmarks?.[16]?.z || 0,
          timestamp: pose.timestamp || 0,
          frame: poseHistory.indexOf(pose)
        })),
        leftWrist: poseHistory.map(pose => ({
          x: pose.landmarks?.[15]?.x || 0,
          y: pose.landmarks?.[15]?.y || 0,
          z: pose.landmarks?.[15]?.z || 0,
          timestamp: pose.timestamp || 0,
          frame: poseHistory.indexOf(pose)
        })),
        clubhead: [],
        rightShoulder: [],
        leftShoulder: [],
        rightHip: [],
        leftHip: []
      };

      const phases = phaseDetector.detectPhases(landmarks, trajectory, timestamps);
      setEnhancedPhases(phases);
    } catch (error) {
      console.error('Error generating enhanced phases:', error);
    }
  }, [poseHistory]);

  // Update current time and generate phases
  useEffect(() => {
    updateCurrentTime();
    generateEnhancedPhases();
  }, [updateCurrentTime, generateEnhancedPhases]);

  const stopCamera = useCallback(() => {
    console.log('Stopping camera...');
    setIsRunning(false);
    isRunningRef.current = false;
    if (frameHandleRef.current) {
      try {
        console.log('Canceling animation frame');
        cancelAnimationFrame(frameHandleRef.current);
      } catch (e) {
        console.log('Error canceling animation frame:', e);
      }
    }
    frameHandleRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (detectorRef.current) {
      detectorRef.current.destroy();
      detectorRef.current = null;
    }
    try { trackEvent('camera_session_end'); } catch {}
  }, []);

  const startCamera = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    isRunningRef.current = true;
    try {
      const video = videoRef.current;
      if (!video) return;

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
          facingMode: { ideal: 'environment' as any }
        },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      video.srcObject = stream;
      
      // Wait for video metadata to load before starting detection
      video.addEventListener('loadedmetadata', () => {
        console.log('Video metadata loaded:', video.videoWidth, 'x', video.videoHeight);
      });
      
      await video.play();

      const detector = MediaPipePoseDetector.getInstance();
      console.log('Initializing MediaPipe detector...');
      await detector.initialize();
      console.log('MediaPipe detector initialized successfully');
      detectorRef.current = detector;

      // Use requestAnimationFrame for reliable pose detection
      let lastProcessedTime = 0;
      const targetFPS = 30;
      const frameInterval = 1000 / targetFPS;
      
      console.log('Starting pose detection loop with requestAnimationFrame');

      const processFrame = async (timestamp: number) => {
        // Check if we should continue processing
        if (!isRunningRef.current) {
          console.log('Stopping pose detection loop - isRunningRef is false');
          return;
        }
        
        const v = videoRef.current;
        if (!v) {
          console.log('No video element, stopping loop');
          return;
        }

        // Throttle to target FPS
        if (timestamp - lastProcessedTime > frameInterval) {
          console.log('Processing frame at timestamp:', timestamp);
          
          try {
            const t0 = performance.now();
            const pose = await detector.detectPose(v);
            console.log('Pose detection result:', pose ? 'SUCCESS' : 'FAILED');
            
            if (pose && pose.landmarks) {
              console.log('Landmarks detected:', pose.landmarks.length);
              console.log('First landmark:', pose.landmarks[0]);
            } else {
              console.log('No pose or landmarks detected');
            }
            
            // Analyze swing phase and add to history
            if (pose) {
              analyzeSwingPhase(pose);
              addPoseToHistory(pose);
            }
            
            const t1 = performance.now();
            const instantFps = 1000 / Math.max(1, (t1 - t0));
            updateFps(instantFps);
            lastProcessedTime = timestamp;
          } catch (error) {
            console.error('Error in pose detection:', error);
          }
        }
        
        // Continue the loop
        frameHandleRef.current = requestAnimationFrame(processFrame);
      };

      // Start the detection loop
      frameHandleRef.current = requestAnimationFrame(processFrame);
      try { trackEvent('camera_session_start'); } catch {}
    } catch (err) {
      console.error('Camera start failed', err);
      stopCamera();
    }
  }, [isRunning, stopCamera, updateFps, analyzeSwingPhase, addPoseToHistory]);

  // Handle canvas resizing when video dimensions change
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;
    
    const resizeCanvas = () => {
      const videoWidth = video.videoWidth || video.clientWidth;
      const videoHeight = video.videoHeight || video.clientHeight;
      
      if (videoWidth && videoHeight && (canvas.width !== videoWidth || canvas.height !== videoHeight)) {
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        console.log('Canvas resized via observer:', canvas.width, 'x', canvas.height);
      }
    };
    
    // Listen for video resize events
    video.addEventListener('resize', resizeCanvas);
    video.addEventListener('loadedmetadata', resizeCanvas);
    
    // Also check periodically in case events don't fire
    const interval = setInterval(resizeCanvas, 1000);
    
    return () => {
      video.removeEventListener('resize', resizeCanvas);
      video.removeEventListener('loadedmetadata', resizeCanvas);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6 text-gray-900">
          📹 Camera Analysis
        </h1>
        <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
          Real-time golf swing analysis using on-device AI. No upload required.
        </p>

        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <div className="relative w-full max-w-3xl mx-auto">
            <video ref={videoRef} className="w-full rounded-lg bg-black" playsInline muted />
            
            {/* Enhanced Overlay System */}
            <CameraOverlayContainer
              videoRef={videoRef as React.RefObject<HTMLVideoElement>}
              poses={poseHistory}
              phases={enhancedPhases}
              currentTime={currentTime}
              isSwinging={isSwinging}
              swingPhase={currentPhase}
              liveFeedback={liveFeedback}
            />
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600">
            <span>FPS: {fps}</span>
            {isRunning ? (
              <span className="inline-flex items-center text-green-700">● Live</span>
            ) : (
              <span className="inline-flex items-center text-gray-500">● Idle</span>
            )}
            {isSwinging && swingStartTime && (
              <span className="text-orange-600">
                Swing Time: {((Date.now() - swingStartTime) / 1000).toFixed(1)}s
              </span>
            )}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            {!isRunning ? (
              <button onClick={startCamera} className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all shadow">
                🎬 Start Live Analysis
              </button>
            ) : (
              <button onClick={stopCamera} className="w-full sm:w-auto bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-all shadow">
                ⏹️ Stop
              </button>
            )}
            <Link 
              href="/" 
              className="w-full sm:w-auto bg-gray-100 text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all shadow text-center"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Swing Metrics Display */}
        {swingMetrics && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
            <h3 className="text-2xl font-bold mb-4 text-center">Last Swing Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {swingMetrics.letterGrade || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Overall Grade</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {swingMetrics.overallScore?.toFixed(1) || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Score (0-100)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {swingMetrics.tempo?.tempoRatio?.toFixed(1) || 'N/A'}:1
                </div>
                <div className="text-sm text-gray-600">Tempo Ratio</div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold mb-2">Rotation Analysis:</div>
                <div>Shoulder Turn: {swingMetrics.rotation?.shoulderTurn?.toFixed(0) || 'N/A'}°</div>
                <div>Hip Turn: {swingMetrics.rotation?.hipTurn?.toFixed(0) || 'N/A'}°</div>
                <div>X-Factor: {swingMetrics.rotation?.xFactor?.toFixed(0) || 'N/A'}°</div>
              </div>
              <div>
                <div className="font-semibold mb-2">Swing Plane:</div>
                <div>Shaft Angle: {swingMetrics.swingPlane?.shaftAngle?.toFixed(0) || 'N/A'}°</div>
                <div>Consistency: {swingMetrics.swingPlane?.planeDeviation ? (100 - swingMetrics.swingPlane.planeDeviation).toFixed(0) : 'N/A'}%</div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <button 
                onClick={() => setSwingMetrics(null)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Results
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4 text-center">How to Use Live Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Setup:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• Position yourself 6-8 feet from camera</li>
                <li>• Ensure good lighting on your body</li>
                <li>• Stand with your side to the camera</li>
                <li>• Make sure your full body is visible</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Analysis:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• Green stick figure shows pose detection</li>
                <li>• Red dashed line shows swing plane</li>
                <li>• Live feedback appears in top-left</li>
                <li>• Swing metrics calculated after each swing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

