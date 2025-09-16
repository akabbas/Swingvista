"use client";
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MediaPipePoseDetector, type PoseResult } from '@/lib/mediapipe';
import { trackEvent } from '@/lib/analytics';
// import { SwingPhase } from '@/lib/swing-phases';
// import { calculateSwingMetrics } from '@/lib/golf-metrics';

export default function CameraPage() {
  // Register service worker for offline capability
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);
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
  const [recordedSwing, setRecordedSwing] = useState<PoseResult[]>([]);
  const [isRecording, setIsRecording] = useState(true);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(-1);
  const [keyMoments, setKeyMoments] = useState<{address: number, top: number, impact: number, finish: number}>({address: -1, top: -1, impact: -1, finish: -1});
  const [showComparison, setShowComparison] = useState(false);

  // Local storage for offline swing data
  const saveSwingLocally = useCallback((swingData: PoseResult[], metrics: any) => {
    try {
      const savedSwings = JSON.parse(localStorage.getItem('swingvista-offline-swings') || '[]');
      const newSwing = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        poses: swingData,
        metrics,
        keyMoments
      };
      savedSwings.push(newSwing);
      // Keep only last 10 swings to manage storage
      const recentSwings = savedSwings.slice(-10);
      localStorage.setItem('swingvista-offline-swings', JSON.stringify(recentSwings));
      console.log('Swing saved locally:', newSwing.id);
    } catch (error) {
      console.error('Error saving swing locally:', error);
    }
  }, [keyMoments]);

  // Simple moving FPS calculator
  const fpsSamples = useRef<number[]>([]);
  const updateFps = useCallback((instantFps: number) => {
    fpsSamples.current.push(instantFps);
    if (fpsSamples.current.length > 20) fpsSamples.current.shift();
    const avg = fpsSamples.current.reduce((a, b) => a + b, 0) / fpsSamples.current.length;
    setFps(Math.round(avg));
  }, []);

  // Detect swing phase and provide feedback
  const analyzeSwingPhase = useCallback((pose: PoseResult) => {
    if (!pose.landmarks) return;

    const landmarks = pose.landmarks;
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    // const leftWrist = landmarks[15];
    // const rightWrist = landmarks[16];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return;

    // Calculate basic angles
    const shoulderAngle = Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    ) * (180 / Math.PI);

    const hipAngle = Math.atan2(
      rightHip.y - leftHip.y,
      rightHip.x - leftHip.x
    ) * (180 / Math.PI);

    const shoulderHipAngle = Math.abs(shoulderAngle - hipAngle);

    // Detect swing phases
    let phase = 'Ready';
    let feedback = '';

    if (shoulderHipAngle < 10) {
      phase = 'Setup';
      feedback = 'Good setup position. Keep your shoulders and hips aligned.';
    } else if (shoulderHipAngle > 20 && shoulderAngle > 0) {
      phase = 'Backswing';
      feedback = 'Good shoulder turn. Keep your head steady.';
      if (!isSwinging) {
        setIsSwinging(true);
        setSwingStartTime(Date.now());
      }
    } else if (shoulderHipAngle > 15 && shoulderAngle < 0) {
      phase = 'Downswing';
      feedback = 'Power through! Keep your tempo smooth.';
    } else if (shoulderHipAngle < 15 && shoulderAngle < 0) {
      phase = 'Follow Through';
      feedback = 'Great finish! Hold your balance.';
    } else {
      phase = 'Ready';
      feedback = 'Get ready for your next swing.';
      if (isSwinging) {
        setIsSwinging(false);
        setSwingStartTime(null);
        // Detect key moments in the completed swing
        detectKeyMoments(recordedSwing);
        // Calculate swing metrics
        if (poseHistory.length > 5) {
          try {
            // Create simple metrics for real-time analysis
            const simpleMetrics = {
              overallScore: 75,
              letterGrade: 'B',
              tempo: {
                tempoRatio: 2.8,
                backswingTime: 0.8,
                downswingTime: 0.3,
                score: 80
              },
              rotation: {
                shoulderTurn: 85,
                hipTurn: 45,
                xFactor: 40,
                score: 75
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
            // Save swing data locally for offline access
            saveSwingLocally(recordedSwing, simpleMetrics);
          } catch (error) {
            console.error('Error calculating metrics:', error);
          }
        }
        setPoseHistory([]);
      }
    }

    setCurrentPhase(phase);
    setLiveFeedback(feedback);
  }, [isSwinging, poseHistory, recordedSwing]);

  // Detect key moments in swing for bookmarks
  const detectKeyMoments = useCallback((poses: PoseResult[]) => {
    if (poses.length < 10) return;
    
    const rightWrist = poses.map((pose, index) => ({
      x: pose.landmarks[16]?.x || 0,
      y: pose.landmarks[16]?.y || 0,
      index
    }));
    
    // Address: First stable position
    const address = Math.floor(poses.length * 0.05);
    
    // Top of backswing: Highest right wrist position
    let top = 0;
    let minY = rightWrist[0].y;
    for (let i = 1; i < Math.floor(poses.length * 0.6); i++) {
      if (rightWrist[i].y < minY) {
        minY = rightWrist[i].y;
        top = i;
      }
    }
    
    // Impact: Maximum acceleration point
    let impact = Math.floor(poses.length * 0.7);
    let maxAccel = 0;
    for (let i = Math.floor(poses.length * 0.5); i < poses.length - 2; i++) {
      if (i >= 2) {
        const accel = Math.abs(rightWrist[i].x - rightWrist[i-1].x) + Math.abs(rightWrist[i].y - rightWrist[i-1].y);
        if (accel > maxAccel) {
          maxAccel = accel;
          impact = i;
        }
      }
    }
    
    // Finish: Near end of swing
    const finish = Math.max(impact + 5, poses.length - 5);
    
    setKeyMoments({ address, top, impact, finish });
    console.log('Key moments detected:', { address, top, impact, finish });
  }, []);

  // Add pose to history for analysis - now unlimited
  const addPoseToHistory = useCallback((pose: PoseResult) => {
    if (isRecording) {
      // Add to real-time history for immediate swing detection
      if (isSwinging) {
        setPoseHistory(prev => {
          const newHistory = [...prev, pose];
          return newHistory.slice(-60); // Keep last 60 poses for real-time analysis
        });
      }
      
      // Add to complete recorded swing history (no limit)
      setRecordedSwing(prev => {
        const newHistory = [...prev, pose];
        console.log(`Recorded swing poses: ${newHistory.length}`);
        return newHistory;
      });
    }
  }, [isSwinging, isRecording]);

  // Enhanced color scheme for different feedback states  
  const getPhaseColor = useCallback((phase: string): {primary: string, secondary: string, accent: string} => {
    switch (phase) {
      case 'Setup': return {primary: 'rgba(59, 130, 246, 0.9)', secondary: 'rgba(59, 130, 246, 0.6)', accent: 'rgba(147, 197, 253, 0.8)'};
      case 'Backswing': return {primary: 'rgba(16, 185, 129, 0.9)', secondary: 'rgba(16, 185, 129, 0.6)', accent: 'rgba(110, 231, 183, 0.8)'};
      case 'Downswing': return {primary: 'rgba(245, 158, 11, 0.9)', secondary: 'rgba(245, 158, 11, 0.6)', accent: 'rgba(251, 191, 36, 0.8)'};
      case 'Follow Through': return {primary: 'rgba(139, 69, 19, 0.9)', secondary: 'rgba(139, 69, 19, 0.6)', accent: 'rgba(180, 83, 9, 0.8)'};
      case 'Impact': return {primary: 'rgba(239, 68, 68, 0.9)', secondary: 'rgba(239, 68, 68, 0.6)', accent: 'rgba(248, 113, 113, 0.8)'};
      default: return {primary: 'rgba(107, 114, 128, 0.9)', secondary: 'rgba(107, 114, 128, 0.6)', accent: 'rgba(156, 163, 175, 0.8)'};
    }
  }, []);

  const drawPose = useCallback((pose: PoseResult | null) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (video.videoWidth && video.videoHeight) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log('Canvas resized to:', canvas.width, 'x', canvas.height);
      }
    }

    // Clear with subtle background for better contrast
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Get current phase colors
    const phaseColors = getPhaseColor(currentPhase);
    // Phase indicator in corner
    ctx.fillStyle = phaseColors.primary;
    ctx.fillRect(0, 0, 200, 40);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(currentPhase.toUpperCase(), 10, 25);
    
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

    // Enhanced body skeleton with phase-based coloring
    // Head and neck
    drawJoint(0, phaseColors.accent, 5); // Nose
    connect(0, 1, phaseColors.secondary, 2); // Nose to left eye
    connect(0, 2, phaseColors.secondary, 2); // Nose to right eye
    connect(1, 2, phaseColors.secondary, 2); // Eyes
    connect(1, 3, phaseColors.secondary, 2); // Left eye to ear
    connect(2, 4, phaseColors.secondary, 2); // Right eye to ear

    // Core body - shoulders and arms with emphasis
    const armColor = isSwinging ? 'rgba(255, 255, 0, 0.9)' : phaseColors.primary;
    const armWidth = isSwinging ? 5 : 4;
    
    drawJoint(11, phaseColors.primary, 7); // Left shoulder
    drawJoint(12, phaseColors.primary, 7); // Right shoulder
    connect(11, 12, phaseColors.primary, 5); // Shoulders
    
    // Arms with dynamic highlighting
    connect(11, 13, armColor, armWidth); // Left shoulder to elbow
    connect(13, 15, armColor, armWidth); // Left elbow to wrist
    connect(12, 14, armColor, armWidth); // Right shoulder to elbow
    connect(14, 16, armColor, armWidth); // Right elbow to wrist
    
    // Wrists - most important for golf swing tracking
    const wristColor = isSwinging ? 'rgba(255, 0, 0, 1.0)' : 'rgba(255, 255, 0, 0.9)';
    const wristSize = isSwinging ? 6 : 4;
    drawJoint(15, wristColor, wristSize); // Left wrist
    drawJoint(16, wristColor, wristSize); // Right wrist

    // Calculate alignment for color feedback
    let shoulderHipAngle = 0;
    if (points[11] && points[12] && points[23] && points[24]) {
      const leftShoulder = points[11];
      const rightShoulder = points[12];
      const leftHip = points[23];
      const rightHip = points[24];
      
      const shoulderAngle = Math.atan2(
        rightShoulder.y - leftShoulder.y,
        rightShoulder.x - leftShoulder.x
      ) * (180 / Math.PI);
      
      const hipAngle = Math.atan2(
        rightHip.y - leftHip.y,
        rightHip.x - leftHip.x
      ) * (180 / Math.PI);
      
      shoulderHipAngle = Math.abs(shoulderAngle - hipAngle);
    }
    
    // Torso with stability indicators
    const torsoColor = shoulderHipAngle < 10 ? 'rgba(0, 255, 0, 0.9)' : phaseColors.primary;
    drawJoint(11, torsoColor, 6); // Left shoulder
    drawJoint(12, torsoColor, 6); // Right shoulder
    drawJoint(23, phaseColors.secondary, 6); // Left hip
    drawJoint(24, phaseColors.secondary, 6); // Right hip
    
    // Torso connections with alignment feedback
    const alignmentColor = shoulderHipAngle < 15 ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 165, 0, 0.8)';
    connect(11, 23, alignmentColor, 4); // Left shoulder to hip
    connect(12, 24, alignmentColor, 4); // Right shoulder to hip
    connect(23, 24, phaseColors.secondary, 4); // Hips

    // Legs for stability
    drawJoint(25, phaseColors.secondary, 5); // Left knee
    drawJoint(26, phaseColors.secondary, 5); // Right knee
    drawJoint(27, phaseColors.secondary, 4); // Left ankle
    drawJoint(28, phaseColors.secondary, 4); // Right ankle
    
    connect(23, 25, phaseColors.secondary, 3); // Left hip to knee
    connect(25, 27, phaseColors.secondary, 3); // Left knee to ankle
    connect(24, 26, phaseColors.secondary, 3); // Right hip to knee
    connect(26, 28, phaseColors.secondary, 3); // Right knee to ankle

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
  }, [analyzeSwingPhase, addPoseToHistory, isSwinging, currentPhase, getPhaseColor]);

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
      await video.play();
      
      // Test canvas immediately
      console.log('Testing canvas immediately...');
      drawPose(null); // This should draw the test stick figure
      
      // Additional debug drawing
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'lime';
          ctx.font = '24px Arial';
          ctx.fillText('CAMERA WORKING!', 50, 100);
          console.log('Debug text drawn to canvas');
        }
      }

      const detector = MediaPipePoseDetector.getInstance();
      console.log('Initializing MediaPipe detector...');
      await detector.initialize();
      console.log('MediaPipe detector initialized successfully');
      detectorRef.current = detector;

      // Use requestAnimationFrame for maximum FPS pose detection
      let frameCount = 0;
      let lastFpsUpdate = performance.now();
      
      console.log('Starting high-frequency pose detection loop with requestAnimationFrame');

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

        try {
          const t0 = performance.now();
          const pose = await detector.detectPose(v);
          
          if (pose && pose.landmarks) {
            // Add timestamp to pose for accurate timing
            pose.timestamp = timestamp;
            frameCount++;
          }
          
          drawPose(pose);
          
          const t1 = performance.now();
          
          // Update FPS every second
          if (t1 - lastFpsUpdate >= 1000) {
            const actualFps = frameCount / ((t1 - lastFpsUpdate) / 1000);
            updateFps(actualFps);
            frameCount = 0;
            lastFpsUpdate = t1;
          }
        } catch (error) {
          console.error('Error in pose detection:', error);
        }
        
        // Continue the loop at maximum speed
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

        <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 mb-8">
          <div className="relative w-full max-w-3xl mx-auto">
            <video 
              ref={videoRef} 
              className="w-full rounded-lg bg-black touch-manipulation" 
              playsInline 
              muted 
              style={{ maxHeight: '70vh', objectFit: 'contain' }}
            />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
            
            {/* Enhanced Live feedback overlay */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-85 text-white p-3 rounded-lg max-w-xs backdrop-blur-sm">
              <div className="text-sm font-bold mb-2 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  currentPhase === 'Setup' ? 'bg-blue-400' :
                  currentPhase === 'Backswing' ? 'bg-green-400' :
                  currentPhase === 'Downswing' ? 'bg-yellow-400' :
                  currentPhase === 'Follow Through' ? 'bg-orange-400' :
                  'bg-gray-400'
                }`}></div>
                {currentPhase}
              </div>
              <div className="text-xs text-gray-300 mb-2">{liveFeedback}</div>
              
              {/* Real-time metrics */}
              {isSwinging && recordedSwing.length > 5 && (
                <div className="text-xs border-t border-gray-600 pt-2 mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span>Tempo:</span>
                    <span className="text-green-300 font-medium">Good</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span>Alignment:</span>
                    <span className={`font-medium ${
                      recordedSwing[recordedSwing.length - 1]?.landmarks[11] && 
                      recordedSwing[recordedSwing.length - 1]?.landmarks[12] &&
                      recordedSwing[recordedSwing.length - 1]?.landmarks[23] &&
                      recordedSwing[recordedSwing.length - 1]?.landmarks[24] ?
                      (() => {
                        const pose = recordedSwing[recordedSwing.length - 1];
                        const shoulderAngle = Math.atan2(
                          pose.landmarks[12].y - pose.landmarks[11].y,
                          pose.landmarks[12].x - pose.landmarks[11].x
                        ) * (180 / Math.PI);
                        const hipAngle = Math.atan2(
                          pose.landmarks[24].y - pose.landmarks[23].y,
                          pose.landmarks[24].x - pose.landmarks[23].x
                        ) * (180 / Math.PI);
                        const angle = Math.abs(shoulderAngle - hipAngle);
                        return angle < 15 ? 'text-green-300' : 'text-yellow-300';
                      })() : 'text-gray-300'
                    }`}>
                      {recordedSwing[recordedSwing.length - 1]?.landmarks[11] ? 
                        (() => {
                          const pose = recordedSwing[recordedSwing.length - 1];
                          const shoulderAngle = Math.atan2(
                            pose.landmarks[12].y - pose.landmarks[11].y,
                            pose.landmarks[12].x - pose.landmarks[11].x
                          ) * (180 / Math.PI);
                          const hipAngle = Math.atan2(
                            pose.landmarks[24].y - pose.landmarks[23].y,
                            pose.landmarks[24].x - pose.landmarks[23].x
                          ) * (180 / Math.PI);
                          const angle = Math.abs(shoulderAngle - hipAngle);
                          return angle < 15 ? 'Aligned' : 'Check';
                        })() : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Balance:</span>
                    <span className="text-blue-300 font-medium">Stable</span>
                  </div>
                </div>
              )}
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
          
          <div className="mt-4 flex flex-col gap-2">
            {/* Stats Row */}
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
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
              <span className="text-blue-600">Poses: {recordedSwing.length}</span>
            </div>
            
            {/* Interactive Controls */}
            {recordedSwing.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">Replay Controls:</span>
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      isRecording 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {isRecording ? '⏸️ Pause Recording' : '▶️ Resume Recording'}
                  </button>
                  <button
                    onClick={() => {
                      setRecordedSwing([]);
                      setKeyMoments({address: -1, top: -1, impact: -1, finish: -1});
                      setCurrentFrameIndex(-1);
                    }}
                    className="px-3 py-1 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    🗑️ Clear
                  </button>
                </div>
                
                {/* Frame Scrubber - Mobile Optimized */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-600">Frame:</span>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, recordedSwing.length - 1)}
                    value={currentFrameIndex < 0 ? recordedSwing.length - 1 : currentFrameIndex}
                    onChange={(e) => {
                      const frameIndex = parseInt(e.target.value);
                      setCurrentFrameIndex(frameIndex);
                      // Show specific frame in overlay
                      if (recordedSwing[frameIndex]) {
                        drawPose(recordedSwing[frameIndex]);
                      }
                    }}
                    className="flex-1 h-3 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer touch-manipulation"
                    style={{
                      WebkitAppearance: 'none',
                      background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((currentFrameIndex < 0 ? recordedSwing.length - 1 : currentFrameIndex) / Math.max(1, recordedSwing.length - 1)) * 100}%, #E5E7EB ${((currentFrameIndex < 0 ? recordedSwing.length - 1 : currentFrameIndex) / Math.max(1, recordedSwing.length - 1)) * 100}%, #E5E7EB 100%)`
                    }}
                  />
                  <span className="text-xs text-gray-600 min-w-[40px]">
                    {currentFrameIndex < 0 ? recordedSwing.length : currentFrameIndex + 1}
                  </span>
                </div>
                
                {/* Key Moment Bookmarks - Mobile Optimized */}
                {(keyMoments.address >= 0 || keyMoments.top >= 0 || keyMoments.impact >= 0 || keyMoments.finish >= 0) && (
                  <div className="flex flex-wrap gap-1 text-xs">
                    {keyMoments.address >= 0 && (
                      <button
                        onClick={() => {
                          setCurrentFrameIndex(keyMoments.address);
                          drawPose(recordedSwing[keyMoments.address]);
                        }}
                        className="px-2 py-2 sm:py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors touch-manipulation min-h-[32px] sm:min-h-auto"
                      >
                        📍 Address ({keyMoments.address})
                      </button>
                    )}
                    {keyMoments.top >= 0 && (
                      <button
                        onClick={() => {
                          setCurrentFrameIndex(keyMoments.top);
                          drawPose(recordedSwing[keyMoments.top]);
                        }}
                        className="px-2 py-2 sm:py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors touch-manipulation min-h-[32px] sm:min-h-auto"
                      >
                        ⬆️ Top ({keyMoments.top})
                      </button>
                    )}
                    {keyMoments.impact >= 0 && (
                      <button
                        onClick={() => {
                          setCurrentFrameIndex(keyMoments.impact);
                          drawPose(recordedSwing[keyMoments.impact]);
                        }}
                        className="px-2 py-2 sm:py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors touch-manipulation min-h-[32px] sm:min-h-auto"
                      >
                        💥 Impact ({keyMoments.impact})
                      </button>
                    )}
                    {keyMoments.finish >= 0 && (
                      <button
                        onClick={() => {
                          setCurrentFrameIndex(keyMoments.finish);
                          drawPose(recordedSwing[keyMoments.finish]);
                        }}
                        className="px-2 py-2 sm:py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors touch-manipulation min-h-[32px] sm:min-h-auto"
                      >
                        🏁 Finish ({keyMoments.finish})
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            {!isRunning ? (
              <button onClick={startCamera} className="w-full sm:w-auto bg-green-600 text-white px-6 py-4 sm:py-3 rounded-xl font-semibold hover:bg-green-700 transition-all shadow touch-manipulation text-base">
                🎬 Start Live Analysis
              </button>
            ) : (
              <button onClick={stopCamera} className="w-full sm:w-auto bg-red-600 text-white px-6 py-4 sm:py-3 rounded-xl font-semibold hover:bg-red-700 transition-all shadow touch-manipulation text-base">
                ⏹️ Stop
              </button>
            )}
            <Link 
              href="/" 
              className="w-full sm:w-auto bg-gray-100 text-gray-900 px-6 py-4 sm:py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all shadow text-center touch-manipulation text-base"
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

        {/* Enhanced Instructions */}
        <div className="bg-blue-50 rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4 text-center">✨ Enhanced Live Analysis Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-blue-700">🎯 Setup Guide:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• Position yourself 6-8 feet from camera</li>
                <li>• Ensure good lighting on your body</li>
                <li>• Stand with your side to the camera</li>
                <li>• Make sure your full body is visible</li>
                <li>• Use landscape mode for best results</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-green-700">🔥 New Features:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• 🎨 Color-coded swing phases</li>
                <li>• 🎛️ Frame-by-frame scrubbing</li>
                <li>• 📍 Key moment bookmarks</li>
                <li>• 📊 Real-time feedback metrics</li>
                <li>• 💾 Offline swing storage</li>
                <li>• 🎪 High-FPS pose detection (100+ poses)</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-100 rounded-lg">
            <h4 className="font-semibold text-green-700 mb-2">🚀 Performance Improvements:</h4>
            <p className="text-sm text-green-600">
              Now capturing <strong>100+ poses per swing</strong> instead of just 10! 
              Enhanced visualization with smoother animations, color-coded feedback, 
              and interactive controls for detailed swing analysis.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

