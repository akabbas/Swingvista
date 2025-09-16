"use client";
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MediaPipePoseDetector, type PoseResult } from '@/lib/mediapipe';
import { trackEvent } from '@/lib/analytics';
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
        
        // Calculate comprehensive swing metrics
        if (poseHistory.length > 10) {
          try {
            const swingDuration = (Date.now() - (swingStartTime || Date.now())) / 1000;
            const backswingFrames = Math.floor(poseHistory.length * 0.6);
            const downswingFrames = poseHistory.length - backswingFrames;
            const tempoRatio = backswingFrames / Math.max(downswingFrames, 1);
            
            const simpleMetrics = {
              overallScore: Math.min(95, 60 + (tempoRatio > 2.5 ? 15 : 0) + (shoulderHipAngle > 20 ? 10 : 0)),
              letterGrade: tempoRatio > 2.5 ? 'A' : tempoRatio > 2.0 ? 'B' : 'C',
              tempo: {
                tempoRatio: tempoRatio,
                backswingTime: swingDuration * 0.6,
                downswingTime: swingDuration * 0.4,
                score: Math.min(100, tempoRatio * 30)
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
            console.log('Swing analysis complete:', simpleMetrics);
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

  const drawPose = useCallback((pose: PoseResult | null) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ensure canvas matches video dimensions exactly
    const videoWidth = video.videoWidth || video.clientWidth;
    const videoHeight = video.videoHeight || video.clientHeight;
    
    if (videoWidth && videoHeight) {
      if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        console.log('Canvas resized to match video:', canvas.width, 'x', canvas.height);
      }
    } else {
      console.log('Video dimensions not available yet:', { 
        videoWidth, 
        videoHeight, 
        actualVideoWidth: video.videoWidth, 
        actualVideoHeight: video.videoHeight, 
        clientWidth: video.clientWidth, 
        clientHeight: video.clientHeight 
      });
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Debug: Draw a test circle to verify canvas is working
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 30, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('CANVAS WORKING!', 10, 40);
    ctx.fillText(`Size: ${canvas.width}x${canvas.height}`, 10, 70);
    
    // Debug logging
    console.log('Drawing pose:', pose ? 'pose detected' : 'no pose');
    if (pose && pose.landmarks) {
      console.log('Landmarks count:', pose.landmarks.length);
      console.log('First few landmarks:', pose.landmarks.slice(0, 3));
    }
    
    if (!pose || !pose.landmarks) {
      console.log('No pose or landmarks, drawing test stick figure');
      
      // Draw a simple test stick figure
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Head
      ctx.beginPath();
      ctx.arc(centerX, centerY - 60, 15, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
      ctx.fill();
      
      // Body
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 45);
      ctx.lineTo(centerX, centerY + 30);
      ctx.strokeStyle = 'rgba(0, 200, 255, 0.8)';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      // Arms
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 30);
      ctx.lineTo(centerX - 30, centerY);
      ctx.lineTo(centerX - 20, centerY + 10);
      ctx.moveTo(centerX, centerY - 30);
      ctx.lineTo(centerX + 30, centerY);
      ctx.lineTo(centerX + 20, centerY + 10);
      ctx.stroke();
      
      // Legs
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + 30);
      ctx.lineTo(centerX - 20, centerY + 60);
      ctx.moveTo(centerX, centerY + 30);
      ctx.lineTo(centerX + 20, centerY + 60);
      ctx.stroke();
      
      return;
    }

    // Analyze swing phase
    analyzeSwingPhase(pose);
    addPoseToHistory(pose);

    const points = pose.landmarks;
    
    // Draw stick figure with enhanced visibility
    const connect = (a: number, b: number, color = 'rgba(0, 255, 0, 0.8)', width = 3) => {
      const pa = points[a];
      const pb = points[b];
      if (!pa || !pb || (pa.visibility && pa.visibility < 0.5) || (pb.visibility && pb.visibility < 0.5)) return;
      
      ctx.beginPath();
      ctx.moveTo(pa.x * canvas.width, pa.y * canvas.height);
      ctx.lineTo(pb.x * canvas.width, pb.y * canvas.height);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    };

    // Draw joints with different colors based on importance
    const drawJoint = (index: number, color = 'rgba(0, 255, 0, 0.9)', size = 4) => {
      const p = points[index];
      if (!p || (p.visibility && p.visibility < 0.5)) return;
      
      const x = p.x * canvas.width;
      const y = p.y * canvas.height;
      
      // Outer glow
      ctx.beginPath();
      ctx.arc(x, y, size + 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
      
      // Main joint
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    };

    // Draw body skeleton
    // Head and neck
    drawJoint(0, 'rgba(255, 100, 100, 0.9)', 5); // Nose
    connect(0, 1, 'rgba(255, 100, 100, 0.8)', 2); // Nose to left eye
    connect(0, 2, 'rgba(255, 100, 100, 0.8)', 2); // Nose to right eye
    connect(1, 2, 'rgba(255, 100, 100, 0.8)', 2); // Eyes
    connect(1, 3, 'rgba(255, 100, 100, 0.8)', 2); // Left eye to ear
    connect(2, 4, 'rgba(255, 100, 100, 0.8)', 2); // Right eye to ear

    // Shoulders and arms
    drawJoint(11, 'rgba(0, 200, 255, 0.9)', 6); // Left shoulder
    drawJoint(12, 'rgba(0, 200, 255, 0.9)', 6); // Right shoulder
    connect(11, 12, 'rgba(0, 200, 255, 0.8)', 4); // Shoulders
    
    // Arms
    connect(11, 13, 'rgba(0, 200, 255, 0.8)', 3); // Left shoulder to elbow
    connect(13, 15, 'rgba(0, 200, 255, 0.8)', 3); // Left elbow to wrist
    connect(12, 14, 'rgba(0, 200, 255, 0.8)', 3); // Right shoulder to elbow
    connect(14, 16, 'rgba(0, 200, 255, 0.8)', 3); // Right elbow to wrist
    
    // Hands
    drawJoint(15, 'rgba(255, 255, 0, 0.9)', 4); // Left wrist
    drawJoint(16, 'rgba(255, 255, 0, 0.9)', 4); // Right wrist

    // Torso
    drawJoint(11, 'rgba(0, 200, 255, 0.9)', 6); // Left shoulder
    drawJoint(12, 'rgba(0, 200, 255, 0.9)', 6); // Right shoulder
    drawJoint(23, 'rgba(255, 150, 0, 0.9)', 6); // Left hip
    drawJoint(24, 'rgba(255, 150, 0, 0.9)', 6); // Right hip
    
    // Torso connections
    connect(11, 23, 'rgba(0, 200, 255, 0.8)', 4); // Left shoulder to hip
    connect(12, 24, 'rgba(0, 200, 255, 0.8)', 4); // Right shoulder to hip
    connect(23, 24, 'rgba(255, 150, 0, 0.8)', 4); // Hips

    // Legs
    drawJoint(25, 'rgba(255, 150, 0, 0.9)', 5); // Left knee
    drawJoint(26, 'rgba(255, 150, 0, 0.9)', 5); // Right knee
    drawJoint(27, 'rgba(255, 150, 0, 0.9)', 4); // Left ankle
    drawJoint(28, 'rgba(255, 150, 0, 0.9)', 4); // Right ankle
    
    connect(23, 25, 'rgba(255, 150, 0, 0.8)', 3); // Left hip to knee
    connect(25, 27, 'rgba(255, 150, 0, 0.8)', 3); // Left knee to ankle
    connect(24, 26, 'rgba(255, 150, 0, 0.8)', 3); // Right hip to knee
    connect(26, 28, 'rgba(255, 150, 0, 0.8)', 3); // Right knee to ankle

    // Draw swing plane line if swinging
    if (isSwinging && points[11] && points[12] && points[23] && points[24]) {
      const leftShoulder = points[11];
      const rightShoulder = points[12];
      const leftHip = points[23];
      const rightHip = points[24];
      
      const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
      const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
      const hipCenterX = (leftHip.x + rightHip.x) / 2;
      const hipCenterY = (leftHip.y + rightHip.y) / 2;
      
      // Draw swing plane line
      ctx.beginPath();
      ctx.moveTo(shoulderCenterX * canvas.width, shoulderCenterY * canvas.height);
      ctx.lineTo(hipCenterX * canvas.width, hipCenterY * canvas.height);
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [analyzeSwingPhase, addPoseToHistory, isSwinging]);

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
        // Test canvas after video is ready
        drawPose(null); // This should draw the test stick figure
      });
      
      await video.play();
      
      // Test canvas immediately as fallback
      console.log('Testing canvas immediately...');
      drawPose(null); // This should draw the test stick figure

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
            
            drawPose(pose);
            
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
  }, [drawPose, isRunning, stopCamera, updateFps]);

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
        // Redraw the test figure
        drawPose(null);
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
  }, [drawPose]);

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
            <canvas 
              ref={canvasRef} 
              className="absolute top-0 left-0 w-full h-full pointer-events-none z-10" 
              style={{ imageRendering: 'pixelated' }}
            />
            
            {/* Live feedback overlay */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg max-w-xs">
              <div className="text-sm font-semibold mb-1">Swing Phase: {currentPhase}</div>
              <div className="text-xs text-gray-300">{liveFeedback}</div>
            </div>
            
            {/* Swing status indicator */}
            <div className="absolute top-4 right-4">
              {isSwinging ? (
                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                  SWINGING
                </div>
              ) : (
                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  READY
                </div>
              )}
            </div>
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

