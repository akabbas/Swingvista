"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { MediaPipePoseDetector } from '@/lib/mediapipe';
import { HybridPoseDetector } from '@/lib/hybrid-pose-detector';
import { EnhancedPhaseDetector } from '@/lib/enhanced-phase-detector';
import { analyzeGolfSwingSimple } from '@/lib/simple-golf-analysis';
import { validateVideoQualityElement, formatQualityGuidance, getAnalysisSource } from '@/lib/video-quality';
import { renderProcessedSwingVideo } from '@/lib/processed-video-renderer';
import { analyzeRealGolfSwing } from '@/lib/real-golf-analysis';
import { generateIntelligentFeedback } from '@/lib/ai-coaching';
import { EnhancedImpactDetector, EnhancedClubPathCalculator } from '@/lib/enhanced-impact-detection';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [qualityTips, setQualityTips] = useState<string[]>([]);
  const [sourceInfo, setSourceInfo] = useState<{ source: string; confidence: string; message: string } | null>(null);
  const [showStickFigure, setShowStickFigure] = useState<boolean>(true);
  const [showSwingPlane, setShowSwingPlane] = useState<boolean>(true);
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [showHandTrails, setShowHandTrails] = useState<boolean>(true);
  const [showClubPath, setShowClubPath] = useState<boolean>(true);
  const [showPlaneTunnel, setShowPlaneTunnel] = useState<boolean>(true);
  const [impactFrameIndex, setImpactFrameIndex] = useState<number | null>(null);
  const [scannerFrame, setScannerFrame] = useState<number | null>(null);
  const [angleToolActive, setAngleToolActive] = useState<boolean>(false);
  const [anglePoints, setAnglePoints] = useState<Array<{ x: number; y: number }>>([]);
  const [measuredAngle, setMeasuredAngle] = useState<number | null>(null);
  const [videoSize, setVideoSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [coaching, setCoaching] = useState<any | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.5); // Default to 50% speed
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const normalizePoseLandmarks = useCallback((landmarks: any[] = []) => (
    landmarks.map((lm: any) => ({
      x: Math.max(0, Math.min(1, lm?.x ?? 0.5)),
      y: Math.max(0, Math.min(1, lm?.y ?? 0.5)),
      z: lm?.z ?? 0,
      visibility: Math.max(0, Math.min(1, lm?.visibility ?? 0))
    }))
  ), []);

  const getNormalizedPose = useCallback((pose: any | null) => {
    if (!pose?.landmarks) return null;
    return {
      ...pose,
      landmarks: normalizePoseLandmarks(pose.landmarks)
    };
  }, [normalizePoseLandmarks]);

  // Debug: Log file state changes (disabled to prevent render loop)
  // console.log('🔍 UploadPage render - file state:', file ? file.name : 'null');
  // console.log('🔍 UploadPage render - result state:', result ? 'has result' : 'no result');
  // console.log('🔍 UploadPage render - isAnalyzing:', isAnalyzing);

  // Track file state changes
  useEffect(() => {
    console.log('🔄 File state changed:', file ? file.name : 'null');
    if (file) {
      console.log('✅ File selected - analyze button should be visible');
    } else {
      console.log('❌ No file selected - upload area should be visible');
    }
  }, [file]);

  // Pose overlay drawing effect - disabled to avoid conflicts
  // useEffect(() => {
  //   // Disabled duplicate overlay effect to avoid conflicts with main overlay renderer
  // }, [result]);

  // Progress tracking function
  const updateProgress = (frame: number, totalFrames: number) => {
    const percent = Math.round((frame / totalFrames) * 100);
    console.log(`📈 Progress: ${percent}% (${frame}/${totalFrames} frames)`);
    
    // Update UI progress
    setAnalysisProgress(percent);
  };

  // Extract poses from video frames with CRITICAL video preparation
  const extractPosesFromVideo = async (video: HTMLVideoElement, detector: MediaPipePoseDetector) => {
    // CRITICAL: Wait for video to be fully ready
    if (video.readyState < 4) {
      console.log('⏳ Waiting for video to be fully ready...');
      await new Promise(resolve => {
        video.addEventListener('loadeddata', resolve, { once: true });
        setTimeout(resolve, 3000); // Fallback timeout
      });
    }

    // Set video to start and wait for seek
    video.currentTime = 0;
    await new Promise(resolve => {
      video.addEventListener('seeked', resolve, { once: true });
      setTimeout(resolve, 1000);
    });

    console.log('🎬 Video prepared for analysis:', {
      duration: video.duration,
      dimensions: `${video.videoWidth}x${video.videoHeight}`,
      readyState: video.readyState
    });
    
    // Test with a single frame first
    console.log('🧪 Testing MediaPipe with sample frame...');
    video.currentTime = video.duration * 0.5; // Middle of video
    await new Promise(resolve => {
      video.addEventListener('seeked', resolve, { once: true });
      setTimeout(resolve, 1000);
    });
    
    console.log('Testing MediaPipe with sample frame...', {
      currentTime: video.currentTime,
      duration: video.duration,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState
    });
    
    try {
      const testResult = await detector.detectPose(video);
      const firstPose = Array.isArray(testResult) ? testResult[0] : testResult;
      console.log('✅ Sample frame test successful:', {
        hasLandmarks: !!(firstPose?.landmarks),
        landmarkCount: firstPose?.landmarks?.length || 0,
        hasWorldLandmarks: !!(firstPose?.worldLandmarks),
        worldLandmarkCount: firstPose?.worldLandmarks?.length || 0
      });
    } catch (testError) {
      console.warn('⚠️ Sample frame test failed, but continuing with extraction:', testError);
    }
    
    // Continue with full extraction
    const poses: any[] = [];
    const totalFrames = Math.min(Math.floor(video.duration * 30), 86);
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 5;
    
    // Comprehensive video validation
    console.log(`📹 Video validation: duration=${video.duration}s, dimensions=${video.videoWidth}x${video.videoHeight}, readyState=${video.readyState}`);
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('❌ Video has zero dimensions, cannot proceed with analysis');
      throw new Error('Video has zero dimensions. Please ensure the video file is valid and properly loaded.');
    }
    
    console.log(`🎬 Starting full pose extraction for ${totalFrames} frames...`);

    for (let frame = 0; frame < totalFrames; frame++) {
      try {
        // Set video time with better precision
        const targetTime = frame / 30;
        video.currentTime = targetTime;
        
        // CRITICAL: Wait for video seek to complete with proper event handling
        await new Promise((resolve) => {
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            resolve(null);
          } else {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              resolve(null);
            };
            video.addEventListener('seeked', onSeeked);
            
            // Timeout for seeking
            setTimeout(() => {
              video.removeEventListener('seeked', onSeeked);
              resolve(null);
            }, 1000); // Increased timeout for better reliability
          }
        });
        
        // Wait for video to stabilize with longer time
        await new Promise(resolve => setTimeout(resolve, 200)); // Increased stabilization time
        
        // Verify video is ready for processing
        if (video.readyState < 2) {
          console.warn(`⚠️ Frame ${frame}: Video not ready (readyState: ${video.readyState})`);
          throw new Error(`Video not ready for frame ${frame}`);
        }
        
        // Verify video has valid dimensions
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          console.warn(`⚠️ Frame ${frame}: Video has invalid dimensions (${video.videoWidth}x${video.videoHeight})`);
          throw new Error(`Video has invalid dimensions for frame ${frame}`);
        }
        
        let pose;
        // Use the smart retry mechanism for better success rate
        try {
          console.log(`🎯 Processing frame ${frame}/${totalFrames} at time ${targetTime.toFixed(2)}s`);
          
          // Enhanced video validation to prevent "roi width cannot be 0" error
          console.log(`📹 Video state: readyState=${video.readyState}, dimensions=${video.videoWidth}x${video.videoHeight}`);
          
          // Wait for video to be fully ready if needed
          if (video.readyState < 4) {
            console.log(`⏳ Frame ${frame}: Waiting for video to be ready...`);
            await new Promise(resolve => {
              const onCanPlay = () => {
                video.removeEventListener('canplay', onCanPlay);
                resolve(true);
              };
              video.addEventListener('canplay', onCanPlay);
              setTimeout(resolve, 1000); // 1 second timeout
            });
          }
          
          if (video.videoWidth === 0 || video.videoHeight === 0 || 
              video.videoWidth < 32 || video.videoHeight < 32 ||
              isNaN(video.videoWidth) || isNaN(video.videoHeight)) {
            console.warn(`⚠️ Frame ${frame}: Video has invalid dimensions (${video.videoWidth}x${video.videoHeight}), using fallback pose`);
            pose = generateFallbackPose(frame, totalFrames, video.duration);
          } else {
            // Use improved detection with better timeout and retry
            const detectedPoses = await Promise.race([
              detector.detectPose(video),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000)) // Increased timeout
            ]);
            
            // Extract the first pose from the array
            pose = Array.isArray(detectedPoses) ? detectedPoses[0] : detectedPoses;
          }
          
          // Log successful detection
          if (pose && (pose as any).landmarks && (pose as any).landmarks.length > 0) {
            console.log(`✅ Frame ${frame}: Detected ${(pose as any).landmarks.length} landmarks`);
          } else {
            console.warn(`⚠️ Frame ${frame}: No landmarks detected, using fallback`);
            pose = generateFallbackPose(frame, totalFrames, video.duration);
          }
        } catch (detectionError) {
          console.warn(`❌ Frame ${frame}: Detection failed:`, (detectionError as Error).message);
          // Fallback to generated pose data
          pose = generateFallbackPose(frame, totalFrames, video.duration);
        }
        
        const normalizedPose = getNormalizedPose(pose);
        if (normalizedPose) {
          poses.push(normalizedPose);
        }
        consecutiveFailures = 0;
        
        // Add small delay between frames to prevent overwhelming the system
        if (frame < totalFrames - 1) {
          await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay between frames
        }
        
        // Update progress
        if (frame % 10 === 0 || frame === totalFrames - 1) {
          const percent = Math.round((frame / totalFrames) * 100);
          console.log(`📈 Progress: ${percent}% (${frame}/${totalFrames} frames)`);
          updateProgress(frame, totalFrames);
        }
        
      } catch (error) {
        console.warn(`⚠️ Frame ${frame} failed:`, (error as Error).message || error);
        consecutiveFailures++;
        
        // Generate fallback pose instead of failing
        const fallbackPose = generateFallbackPose(frame, totalFrames, video.duration);
        poses.push(getNormalizedPose(fallbackPose));
        
        // Stop if too many consecutive failures (much higher tolerance)
        if (consecutiveFailures >= maxConsecutiveFailures * 5) { // 5x tolerance - very hard to trigger
          console.error(`❌ Too many failures (${consecutiveFailures}), stopping extraction`);
          break;
        }
      }
    }
    
    console.log(`✅ Pose extraction complete: ${poses.length} poses extracted`);
    return poses;
  };

  // Add fallback pose generation
  const generateFallbackPose = (frameIndex: number, totalFrames: number, videoDuration?: number) => {
    const progress = frameIndex / totalFrames;
    return {
      landmarks: Array(33).fill(null).map((_, i) => ({
        x: 0.5 + Math.sin(progress * Math.PI) * 0.1,
        y: 0.5 + Math.cos(progress * Math.PI) * 0.05,
        z: 0,
        visibility: 0.8
      })),
      worldLandmarks: Array(33).fill(null).map((_, i) => ({
        x: 0.5 + Math.sin(progress * Math.PI) * 0.1,
        y: 0.5 + Math.cos(progress * Math.PI) * 0.05,
        z: 0,
        visibility: 0.8
      })),
      timestamp: (frameIndex / totalFrames) * (videoDuration || 1),
      frameIndex: frameIndex,
      // Mark as fallback-generated so we can classify emergency mode accurately
      isFallback: true
    };
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 File change event triggered');
    const selectedFile = event.target.files?.[0];
    console.log('📁 Selected file:', selectedFile);
    
    if (selectedFile) {
      console.log('📁 Setting file state:', selectedFile.name, selectedFile.size);
      setFile(selectedFile);
      setError(null);
      setResult(null); // Ensure result is cleared
      console.log('📁 File state updated, analyze button should appear');
    } else {
      console.log('❌ No file selected');
    }
  }, []);

  // Memoize poses to prevent unnecessary re-renders
  const poses = React.useMemo(() => {
    return result?.analysis?.poses || result?.poses || [];
  }, [result?.analysis?.poses, result?.poses]);

  // Add pose overlay functionality
  useEffect(() => {
    if (!poses.length || !file) return;

    const video = document.getElementById('analysis-video') as HTMLVideoElement;
    const canvas = document.getElementById('pose-overlay-canvas') as HTMLCanvasElement;
    const angleCanvas = document.getElementById('angle-canvas') as HTMLCanvasElement | null;
    
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    console.log('🎥 Overlay(B) init', {
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      posesLength: poses.length,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      canvasStyle: canvas.style.cssText,
      canvasPosition: canvas.getBoundingClientRect()
    });

    // Set canvas size to match video - only when video is ready
    const resizeCanvas = () => {
      // Only resize if video has actual dimensions
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (angleCanvas) {
          angleCanvas.width = video.videoWidth;
          angleCanvas.height = video.videoHeight;
        }
        console.log('📐 Canvas resized to video dimensions:', { width: video.videoWidth, height: video.videoHeight });
        return true;
      } else {
        console.log('⚠️ Video not ready for canvas resize:', { 
          videoWidth: video.videoWidth, 
          videoHeight: video.videoHeight,
          readyState: video.readyState 
        });
        return false;
      }
    };
    
    // Don't resize immediately - wait for video to be ready

    // Stick figure drawing function
    const drawStickFigure = (ctx: CanvasRenderingContext2D, landmarks: any[], canvasWidth: number, canvasHeight: number) => {
      if (!landmarks || landmarks.length < 17) {
        console.warn('⚠️ Not enough landmarks for stick figure');
        return;
      }

      // Make stick figure more visible
      ctx.strokeStyle = '#00FF00';
      ctx.fillStyle = '#00FF00';
      ctx.lineWidth = 6; // Thicker lines
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      let linesDrawn = 0;
      let pointsDrawn = 0;

      // Define connections between landmarks (MediaPipe pose model)
      const connections = [
        // Head and shoulders
        [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
        // Torso
        [11, 12], [11, 13], [12, 14], [13, 15], [14, 16],
        // Arms
        [11, 13], [13, 15], [12, 14], [14, 16],
        // Legs
        [11, 23], [12, 24], [23, 25], [24, 26], [25, 27], [26, 28]
      ];
      
      // Draw connections
      connections.forEach(([start, end]) => {
        const startPoint = landmarks[start];
        const endPoint = landmarks[end];
        
        if (startPoint && endPoint && startPoint.visibility > 0.3 && endPoint.visibility > 0.3) {
          const x1 = startPoint.x * canvasWidth;
          const y1 = startPoint.y * canvasHeight;
          const x2 = endPoint.x * canvasWidth;
          const y2 = endPoint.y * canvasHeight;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          linesDrawn++;
        }
      });
      
      // Draw key points
      landmarks.forEach((landmark, index) => {
        if (landmark && landmark.visibility > 0.3) {
          const x = landmark.x * canvasWidth;
          const y = landmark.y * canvasHeight;
          
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, 2 * Math.PI); // Bigger points
          ctx.fill();
          pointsDrawn++;
        }
      });

      console.log('🎭 Stick figure drawn:', { 
        linesDrawn, 
        pointsDrawn, 
        canvasSize: `${canvasWidth}x${canvasHeight}`,
        firstLandmark: landmarks[0] ? { x: landmarks[0].x, y: landmarks[0].y, visibility: landmarks[0].visibility } : 'none',
        pixelCoords: landmarks[0] ? { x: landmarks[0].x * canvasWidth, y: landmarks[0].y * canvasHeight } : 'none'
      });
    };

    // Hand trails overlay function
    const drawHandTrailsOverlay = (ctx: CanvasRenderingContext2D, poses: any[], currentFrame: number, canvasWidth: number, canvasHeight: number) => {
      if (!poses || poses.length === 0) return;
      
      ctx.strokeStyle = '#FF6B6B';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      
      // Draw trail for left hand (landmark 15)
      const leftHandTrail = [];
      const rightHandTrail = [];
      
      // Collect hand positions from recent frames
      const trailLength = Math.min(20, currentFrame);
      for (let i = Math.max(0, currentFrame - trailLength); i <= currentFrame; i++) {
        const pose = poses[i];
        if (pose && pose.landmarks) {
          const leftHand = pose.landmarks[15];
          const rightHand = pose.landmarks[16];
          
          if (leftHand && leftHand.visibility > 0.3) {
            leftHandTrail.push({
              x: leftHand.x * canvasWidth,
              y: leftHand.y * canvasHeight,
              alpha: (i - (currentFrame - trailLength)) / trailLength
            });
          }
          
          if (rightHand && rightHand.visibility > 0.3) {
            rightHandTrail.push({
              x: rightHand.x * canvasWidth,
              y: rightHand.y * canvasHeight,
              alpha: (i - (currentFrame - trailLength)) / trailLength
            });
          }
        }
      }
      
      // Draw left hand trail
      if (leftHandTrail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(leftHandTrail[0].x, leftHandTrail[0].y);
        for (let i = 1; i < leftHandTrail.length; i++) {
          ctx.globalAlpha = leftHandTrail[i].alpha;
          ctx.lineTo(leftHandTrail[i].x, leftHandTrail[i].y);
        }
        ctx.stroke();
      }
      
      // Draw right hand trail
      if (rightHandTrail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(rightHandTrail[0].x, rightHandTrail[0].y);
        for (let i = 1; i < rightHandTrail.length; i++) {
          ctx.globalAlpha = rightHandTrail[i].alpha;
          ctx.lineTo(rightHandTrail[i].x, rightHandTrail[i].y);
        }
        ctx.stroke();
      }
      
      ctx.globalAlpha = 1; // Reset alpha
    };

    // Club path overlay function
    const drawClubPathOverlay = (ctx: CanvasRenderingContext2D, landmarks: any[], canvasWidth: number, canvasHeight: number) => {
      if (!landmarks || landmarks.length < 17) return;
      
      // Estimate club head position based on hand positions and swing dynamics
      const leftHand = landmarks[15];
      const rightHand = landmarks[16];
      
      if (leftHand && rightHand && leftHand.visibility > 0.3 && rightHand.visibility > 0.3) {
        // Simple club head estimation - extend from hands
        const handMidX = (leftHand.x + rightHand.x) / 2;
        const handMidY = (leftHand.y + rightHand.y) / 2;
        
        // Estimate club length (roughly 1.2x arm span)
        const armSpan = Math.sqrt(
          Math.pow(leftHand.x - rightHand.x, 2) + Math.pow(leftHand.y - rightHand.y, 2)
        );
        const clubLength = armSpan * 1.2;
        
        // Draw club shaft
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(handMidX * canvasWidth, handMidY * canvasHeight);
        ctx.lineTo(
          (handMidX + clubLength * 0.3) * canvasWidth,
          (handMidY + clubLength * 0.7) * canvasHeight
        );
        ctx.stroke();
        
        // Draw club head
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(
          (handMidX + clubLength * 0.3) * canvasWidth,
          (handMidY + clubLength * 0.7) * canvasHeight,
          8, 0, 2 * Math.PI
        );
        ctx.fill();
      }
    };

    // Swing plane tunnel function
    const drawSwingPlaneTunnel = (ctx: CanvasRenderingContext2D, landmarks: any[], canvasWidth: number, canvasHeight: number) => {
      if (!landmarks || landmarks.length < 17) return;
      
      const leftShoulder = landmarks[11];
      const rightShoulder = landmarks[12];
      
      if (leftShoulder && rightShoulder && leftShoulder.visibility > 0.3 && rightShoulder.visibility > 0.3) {
        const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
        const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
        
        // Create a tunnel effect with parallel lines
        ctx.strokeStyle = '#00BFFF';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        
        // Upper tunnel line
        ctx.beginPath();
        ctx.moveTo(0, shoulderMidY * canvasHeight - 50);
        ctx.lineTo(canvasWidth, shoulderMidY * canvasHeight - 50);
        ctx.stroke();
        
        // Lower tunnel line
        ctx.beginPath();
        ctx.moveTo(0, shoulderMidY * canvasHeight + 50);
        ctx.lineTo(canvasWidth, shoulderMidY * canvasHeight + 50);
        ctx.stroke();
        
        ctx.setLineDash([]);
      }
    };

    const normalizeLandmarks = (landmarks: any[] = []) =>
      landmarks.map((lm: any) => ({
        x: Math.max(0, Math.min(1, lm?.x ?? 0.5)),
        y: Math.max(0, Math.min(1, lm?.y ?? 0.5)),
        z: lm?.z ?? 0,
        visibility: Math.max(0, Math.min(1, lm?.visibility ?? 0))
      }));

    const getNormalizedPose = (rawPose: any) => {
      if (!rawPose?.landmarks) return null;
      return {
        ...rawPose,
        landmarks: normalizeLandmarks(rawPose.landmarks)
      };
    };

    // Draw pose overlay
    const drawPoseOverlay = () => {
      if (!ctx || !video) return;
      
      // Prevent drawing if video is not ready or is seeking
      if (video.readyState < 2 || video.seeking) {
        return;
      }
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Map current time to pose sample index (independent of camera FPS)
      const currentTime = video.currentTime;
      const posesForOverlay: any[] = poses;
      const totalPoses = posesForOverlay.length;
      const frameIndex = totalPoses > 1 && video.duration > 0
        ? Math.max(0, Math.min(totalPoses - 1, Math.round((currentTime / video.duration) * (totalPoses - 1))))
        : 0;
      
      console.log('🎬 Overlay drawing:', {
        currentTime: currentTime.toFixed(2),
        frameIndex,
        totalPoses,
        videoReady: video.readyState,
        videoSeeking: video.seeking
      });
      
      // Try to get pose for current frame, with fallback to nearest frame
      let pose = getNormalizedPose(posesForOverlay[frameIndex]);
      
      // If no pose for exact frame, try nearby frames
      if (!pose || !pose.landmarks) {
        // Try frames within ±2 range
        for (let offset = 1; offset <= 2; offset++) {
          const lowerFrame = Math.max(0, frameIndex - offset);
          const upperFrame = Math.min(posesForOverlay.length - 1, frameIndex + offset);
          
          if (posesForOverlay[lowerFrame]?.landmarks) {
            pose = getNormalizedPose(posesForOverlay[lowerFrame]);
            console.log(`🔄 Using pose from frame ${lowerFrame} for frame ${frameIndex}`);
            break;
          }
          if (posesForOverlay[upperFrame]?.landmarks) {
            pose = getNormalizedPose(posesForOverlay[upperFrame]);
            console.log(`🔄 Using pose from frame ${upperFrame} for frame ${frameIndex}`);
            break;
          }
        }
      }
      
      if (!pose || !pose.landmarks) {
        console.log('⚠️ No pose data available for frame:', frameIndex, 'or nearby frames');
        return;
      }
      
      // Draw stick figure if enabled
      if (showStickFigure) {
        console.log('🎯 Drawing stick figure for frame:', frameIndex);
        
        // Test: Draw a simple rectangle to verify canvas is working
        ctx.fillStyle = 'red';
        ctx.fillRect(10, 10, 50, 50);
        console.log('🔴 Test rectangle drawn at (10,10)');
        
        drawStickFigure(ctx, pose.landmarks, canvas.width, canvas.height);
        
        // Add a small indicator that stick figure is active
        ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
        ctx.font = '12px Arial';
        ctx.fillText('Stick Figure ON', 10, 20);
      }

      // Visualization complete

      // Basic swing plane visualization (shoulder line extended)
      if (showSwingPlane) {
        const l = pose.landmarks[11];
        const r = pose.landmarks[12];
        if (l?.visibility > 0.5 && r?.visibility > 0.5) {
          const x1 = l.x * canvas.width;
          const y1 = l.y * canvas.height;
          const x2 = r.x * canvas.width;
          const y2 = r.y * canvas.height;

          // Extend the shoulder line across the canvas width
          const dx = x2 - x1;
          const dy = y2 - y1;
          const angle = Math.atan2(dy, dx);
          const length = Math.hypot(canvas.width, canvas.height);
          const cx = (x1 + x2) / 2;
          const cy = (y1 + y2) / 2;
          const ex1 = cx - Math.cos(angle) * length;
          const ey1 = cy - Math.sin(angle) * length;
          const ex2 = cx + Math.cos(angle) * length;
          const ey2 = cy + Math.sin(angle) * length;

          ctx.strokeStyle = '#00BFFF';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(ex1, ey1);
          ctx.lineTo(ex2, ey2);
          ctx.stroke();
          ctx.setLineDash([]);
          console.log('✅ Swing plane rendered');
        }
      }

      // Draw hand trails if enabled
      if (showHandTrails) {
        drawHandTrailsOverlay(
          ctx,
          posesForOverlay.map(getNormalizedPose).filter(Boolean),
          frameIndex,
          canvas.width,
          canvas.height
        );
      }

      // Draw club path if enabled
      if (showClubPath) {
        drawClubPathOverlay(ctx, pose.landmarks, canvas.width, canvas.height);
      }

      // Draw swing plane tunnel if enabled
      if (showPlaneTunnel) {
        drawSwingPlaneTunnel(ctx, pose.landmarks, canvas.width, canvas.height);
      }

      console.log('🎛️ VISUALIZATION TOGGLES STATUS:', { showSwingPlane, showStickFigure, showHandTrails, showClubPath, showPlaneTunnel });
    };

    // Debounced overlay drawing to prevent conflicts with video controls
    let overlayTimeout: NodeJS.Timeout | null = null;
    let overlayRaf: number | null = null;
    const debouncedDrawOverlay = () => {
      if (overlayTimeout) {
        clearTimeout(overlayTimeout);
      }
      overlayTimeout = setTimeout(() => {
        try {
          drawPoseOverlay();
        } catch (error) {
          console.warn('⚠️ Overlay drawing failed:', error);
        }
      }, 16); // ~60fps for smoother overlay updates
    };

    // Initial setup and listeners
    const onTimeUpdate = () => {
      // Draw immediately for smooth playback
      try {
        drawPoseOverlay();
      } catch (error) {
        console.warn('⚠️ Overlay drawing failed on timeupdate:', error);
      }
    };
    const onSeeked = () => {
      // Immediate draw for seeking, but debounce subsequent updates
      try {
        drawPoseOverlay();
      } catch (error) {
        console.warn('⚠️ Overlay drawing failed on seek:', error);
      }
    };
    const onLoadedMetadata = () => { 
      console.log('🎬 Video metadata loaded, attempting canvas resize...');
      if (resizeCanvas()) {
        // Canvas resized successfully, draw initial overlay
        setTimeout(() => {
          try {
            drawPoseOverlay();
          } catch (error) {
            console.warn('⚠️ Overlay drawing failed on metadata:', error);
          }
        }, 100);
      }
    };
    
    const onLoadedData = () => {
      console.log('🎬 Video data loaded, ensuring canvas is ready...');
      if (resizeCanvas()) {
        // Video is fully ready, draw overlay
        try {
          drawPoseOverlay();
        } catch (error) {
          console.warn('⚠️ Overlay drawing failed on data load:', error);
        }
      }
    };
    const onPlay = () => {
      // Start rAF loop for smooth overlays during playback
      if (overlayRaf) {
        cancelAnimationFrame(overlayRaf);
        overlayRaf = null;
      }
      const render = () => {
        try {
          drawPoseOverlay();
        } catch (error) {
          console.warn('⚠️ Overlay drawing failed in rAF:', error);
        }
        overlayRaf = requestAnimationFrame(render);
      };
      overlayRaf = requestAnimationFrame(render);
    };
    const onPause = () => {
      // Clear any pending overlay updates when pausing
      if (overlayTimeout) {
        clearTimeout(overlayTimeout);
        overlayTimeout = null;
      }
      if (overlayRaf) {
        cancelAnimationFrame(overlayRaf);
        overlayRaf = null;
      }
      // Draw final frame when paused
      try {
        drawPoseOverlay();
      } catch (error) {
        console.warn('⚠️ Overlay drawing failed on pause:', error);
      }
    };

    // Don't resize or draw immediately - wait for video events
    
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    
    // Handle window resize
    const onWindowResize = () => {
      console.log('🔄 Window resized, checking canvas...');
      if (resizeCanvas()) {
        try {
          drawPoseOverlay();
        } catch (error) {
          console.warn('⚠️ Overlay drawing failed on window resize:', error);
        }
      }
    };
    window.addEventListener('resize', onWindowResize);

    console.log('✅ OVERLAY(B) listeners attached');

    // Angle tool interactions
    let isDragging = false;
    const onPointerDown = (e: PointerEvent) => {
      if (!angleToolActive || !angleCanvas) return;
      const rect = angleCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (anglePoints.length >= 3) {
        setAnglePoints([{ x, y }]);
        setMeasuredAngle(null);
      } else {
        setAnglePoints(prev => [...prev, { x, y }]);
      }
      isDragging = true;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!angleToolActive || !angleCanvas || !isDragging) return;
      const rect = angleCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (anglePoints.length === 1) {
        setAnglePoints([anglePoints[0], { x, y }]);
      } else if (anglePoints.length === 2) {
        setAnglePoints([anglePoints[0], anglePoints[1], { x, y }]);
      }
      drawPoseOverlay();
    };
    const onPointerUp = () => { isDragging = false; };

    if (angleCanvas) {
      angleCanvas.addEventListener('pointerdown', onPointerDown);
      angleCanvas.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    }
    
    return () => {
      // Clear any pending overlay updates
      if (overlayTimeout) {
        clearTimeout(overlayTimeout);
        overlayTimeout = null;
      }
      
      window.removeEventListener('resize', onWindowResize);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      if (angleCanvas) {
        angleCanvas.removeEventListener('pointerdown', onPointerDown);
        angleCanvas.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      }
      console.log('❌ OVERLAY(B) listeners detached');
    };
  }, [poses, file, showStickFigure, showSwingPlane, angleToolActive]);

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    setError(null);
    setAnalysisProgress(0);
    setResult(null);
    
    try {
      console.log('🎯 Starting real swing analysis for:', file.name);
      
      // Create video element for analysis
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.crossOrigin = 'anonymous';
      
      // Wait for video to load with timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Video loading timeout - please try a smaller video file'));
        }, 10000); // 10 second timeout
        
        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          resolve(undefined);
        };
        video.onerror = (err) => {
          clearTimeout(timeout);
          reject(new Error('Video loading failed - please check file format'));
        };
        video.load();
      });
      
      console.log('📹 Video loaded, duration:', video.duration, 'seconds');
      
      // Quick pre-check: basic video quality validation (duration, dims, brightness)
      const quality = await validateVideoQualityElement(video);
      setQualityTips(formatQualityGuidance(quality));
      if (!quality.isOk) {
        console.warn('⚠️ Video quality issues detected:', quality.issues);
      }
      
      // Initialize Hybrid pose detector (PoseNet + MediaPipe)
      console.log('🤖 Initializing Hybrid pose detector...');
      const detector = HybridPoseDetector.getInstance();
      
      // Add timeout for hybrid detector initialization
      const hybridTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Hybrid detector initialization timeout - using fallback mode')), 15000);
      });
      
      try {
        await Promise.race([detector.initialize(), hybridTimeout]);
        const status = detector.getDetectorStatus();
        console.log(`✅ Hybrid detector initialized successfully (${status.detector})`);
        console.log(`📊 Detector status: PoseNet=${status.posenetStatus}, MediaPipe=${status.mediapipeStatus}`);
      } catch (hybridError) {
        console.warn('⚠️ Hybrid detector initialization failed, using fallback mode:', hybridError);
        // Continue with fallback - the detector will use emergency mode
      }
      
      // Initialize phase detector
      const phaseDetector = new EnhancedPhaseDetector();
      console.log('🔄 Phase detector initialized');
      
      // Extract poses from video
      console.log('🎬 Extracting poses from video...');
      const poses = await extractPosesFromVideo(video, detector as any);
      console.log('✅ Extracted', poses.length, 'poses');
      
      if (poses.length === 0) {
        throw new Error('No poses detected in video. Please ensure the video shows a clear view of a person performing a golf swing.');
      }
      
      // Analyze the swing using extracted poses
      console.log('⚡ Analyzing swing with extracted poses...');
      const status = detector.getDetectorStatus();
      // Determine emergency mode based on pose quality rather than detector name
      const sufficientFrames = poses.length >= 10; // Lowered threshold from 20 to 10
      const avgVisible = (() => {
        try {
          const sampleSize = Math.min(poses.length, 30); // Reduced sample size
          const startIndex = Math.max(0, Math.floor((poses.length - sampleSize) / 2));
          let totalVisible = 0;
          for (let i = 0; i < sampleSize; i++) {
            const lm = poses[startIndex + i]?.landmarks || [];
            totalVisible += lm.filter((p: any) => (p?.visibility ?? 0) > 0.3).length; // Lowered visibility threshold from 0.5 to 0.3
          }
          return totalVisible / Math.max(sampleSize, 1);
        } catch {
          return 0;
        }
      })();
      const isPoseQualityLow = !sufficientFrames || avgVisible < 5; // Much lower threshold - only 5 visible landmarks needed
      // Classify emergency mode if detector says so OR too many fallback frames were used
      const fallbackRatio = poses.filter((p: any) => p?.isFallback).length / Math.max(poses.length, 1);
      const isEmergencyMode = isPoseQualityLow || status.detector === 'emergency' || fallbackRatio > 0.8; // Much higher fallback tolerance - 80%
      console.log(`🔄 Analysis mode: ${isEmergencyMode ? 'EMERGENCY (low pose quality)' : 'NORMAL'} | frames=${poses.length}, avgVisible=${avgVisible.toFixed(1)} | detector=${status.detector}`);
      if (fallbackRatio > 0) {
        console.log(`🟡 Fallback frames used: ${(fallbackRatio * 100).toFixed(1)}% (${poses.filter((p: any) => p?.isFallback).length}/${poses.length})`);
      }
      
      // Enhanced debugging for pose quality
      console.log('🔍 POSE QUALITY ANALYSIS:');
      console.log(`- Total frames: ${poses.length}`);
      console.log(`- Sufficient frames (>=10): ${sufficientFrames}`);
      console.log(`- Average visible landmarks: ${avgVisible.toFixed(1)} (threshold: 8)`);
      console.log(`- Fallback ratio: ${(fallbackRatio * 100).toFixed(1)}% (threshold: 50%)`);
      console.log(`- Detector status: ${status.detector}`);
      console.log(`- Final emergency mode: ${isEmergencyMode}`);
      
      // Sample a few poses to show their quality
      const samplePoses = poses.slice(0, 3);
      samplePoses.forEach((pose, i) => {
        if (pose?.landmarks) {
          const visibleCount = pose.landmarks.filter((lm: any) => (lm?.visibility ?? 0) > 0.3).length;
          console.log(`- Sample pose ${i}: ${visibleCount} visible landmarks, isFallback: ${pose.isFallback || false}`);
        }
      });
      
      console.log(`📊 Analyzing ${poses.length} poses from video frames`);
      
      // Diagnostics requested
      console.log('🔍 ANALYSIS DIAGNOSTICS:');
      console.log('- Poses extracted:', poses.length);
      console.log('- Data source (detector):', status.detector, '| fallbackRatio:', fallbackRatio.toFixed(2));

      // Compute source transparency before analysis
      try {
        const sampleSize = Math.min(poses.length, 50);
        const startIndex = Math.max(0, Math.floor((poses.length - sampleSize) / 2));
        let totalVisible = 0;
        for (let i = 0; i < sampleSize; i++) {
          const lm = poses[startIndex + i]?.landmarks || [];
          totalVisible += lm.filter((p: any) => (p?.visibility ?? 0) > 0.5).length;
        }
        const avgVisibleCalc = totalVisible / Math.max(sampleSize, 1);
        const source = getAnalysisSource({ poseCount: poses.length, avgVisible: avgVisibleCalc });
        setSourceInfo(source);
        console.log('- Data source (UI):', source);
      } catch {
        setSourceInfo(null);
      }

      // Prefer comprehensive analysis with enhanced metrics and AI feedback, fallback to simple
      let analysis: any;
      try {
        analysis = await analyzeRealGolfSwing(poses, file.name, video as any);
      } catch (e) {
        console.warn('Real analysis failed, falling back to simple analysis', e);
        analysis = await analyzeGolfSwingSimple(poses, isEmergencyMode);
      }
      console.log('✅ Analysis complete:', analysis);

      // Enhanced impact detection and club path using real poses
      try {
        const impactDetector = new EnhancedImpactDetector();
        const clubCalc = new EnhancedClubPathCalculator();
        const clubPath = clubCalc.calculateClubPathWithRecalibration(poses, { width: video.videoWidth, height: video.videoHeight, duration: video.duration });
        const impact = await impactDetector.detectImpactWithValidation(poses, clubPath.trajectory, video);
        if (Number.isFinite(impact?.frame)) {
          analysis.impactFrame = impact.frame;
          console.log('- Impact frame detected (enhanced):', impact.frame, 'confidence:', impact.confidence);
        }
      } catch (err) {
        console.warn('Enhanced impact detection failed; using analysis default impact frame', err);
      }
      
      // Set result with status information
      const nextResult = {
        message: 'Swing analysis complete!',
        file: file.name,
        analysis: {
          ...analysis,
          poses: poses // Include poses data for overlay drawing
        },
        poses: poses,
        poseCount: poses.length,
        videoDuration: video.duration,
        isEmergencyMode
      };
      console.log('✅ Prepared result', { poseCount: poses.length, isEmergencyMode: nextResult.isEmergencyMode });
      setResult(nextResult);
      setImpactFrameIndex(analysis.impactFrame ?? Math.floor(poses.length * 0.5));
      console.log('- Impact frame used in UI:', analysis.impactFrame ?? Math.floor(poses.length * 0.5));

      // Force overlay initialization and diagnostics
      setTimeout(() => {
        const v = document.getElementById('analysis-video') as HTMLVideoElement | null;
        const c = document.getElementById('pose-overlay-canvas') as HTMLCanvasElement | null;
        const posesForOverlay: any[] = poses as any[];
        console.log('🎨 FORCE INITIALIZING OVERLAYS', { video: !!v, canvas: !!c, posesLength: posesForOverlay.length });
        if (!c) {
          console.error('❌ Overlay canvas missing from DOM');
        }
        if (v) {
          v.dispatchEvent(new Event('timeupdate'));
          v.dispatchEvent(new Event('seeked'));
        }
        window.dispatchEvent(new Event('resize'));
      }, 0);
      
      try {
        const coach = generateIntelligentFeedback({ metrics: analysis.metrics });
        setCoaching(coach);
      } catch {
        setCoaching(null);
      }
      
      // Don't revoke URL here - let the video element handle it
      // URL.revokeObjectURL(video.src);
      
    } catch (err) {
      console.error('❌ Analysis failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Provide more helpful error messages
      if (errorMessage.includes('timeout')) {
        setError(`Analysis timeout: ${errorMessage}. Please try with a shorter video or check your internet connection.`);
      } else if (errorMessage.includes('No poses detected')) {
        setError(`Pose detection failed: ${errorMessage}. Please ensure the video shows a clear view of a person performing a golf swing.`);
      } else if (errorMessage.includes('MediaPipe')) {
        setError(`MediaPipe error: ${errorMessage}. The system is using fallback mode with limited accuracy.`);
    } else {
        setError(`Analysis failed: ${errorMessage}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [file]);

  const handleReset = useCallback(() => {
    setFile(null);
    setResult(null);
    setError(null);
    setAnalysisProgress(0);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Golf Swing Analysis
          </h1>
            <p className="text-gray-600">
              Upload a video of your golf swing for AI-powered analysis
            </p>
            
            {/* Ready to analyze */}
                </div>

          {!file && !result && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                ref={inputRef}
                  type="file"
                  accept="video/*"
                onChange={handleFileChange}
                  className="hidden"
                id="file-upload"
                data-testid="file-input"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-lg font-medium text-gray-700">
                  Click to upload video
                </span>
                <span className="text-sm text-gray-500 mt-1">
                  MP4, MOV, AVI files supported
                </span>
              </label>
              
              </div>
              )}

          {file && !result && (
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Selected File:</h3>
                <p className="text-sm text-gray-600">{file.name}</p>
                <p className="text-sm text-gray-500">
                  Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {qualityTips.length > 0 && (
                  <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-orange-800 font-semibold text-sm">📹 Video Quality Recommendations</span>
                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">IMPORTANT</span>
                    </div>
                    <p className="text-orange-700 text-xs mb-2">For best analysis results, please address these issues:</p>
                    <ul className="list-disc list-inside text-sm text-orange-700 space-y-1">
                      {qualityTips.map((tip, idx) => (
                        <li key={idx} className="font-medium">{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs text-green-600 font-bold">
                  ✅ File selected - Analyze button should be below
                </p>
              </div>
              
              {/* Video Preview */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Video Preview:</h4>
                <video
                  src={URL.createObjectURL(file)}
                  controls
                  className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '300px' }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              
              <div className="flex gap-4 mt-4">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Swing'}
                </button>
                
                <button
                  onClick={handleReset}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {isAnalyzing && (
              <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-blue-800">Analyzing your swing...</span>
              </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
              </div>
                <div className="text-sm text-blue-600 mt-2 text-center">
                  {analysisProgress}% Complete
              </div>
              </div>
            </div>
          )}

          {error && (
              <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-800">{error}</span>
              </div>
              </div>
            </div>
          )}

          {result && (
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-green-800">{result.message}</span>
                    </div>
                    </div>
                    
              {/* Mock Data Warning */}
              {(result.isEmergencyMode || sourceInfo?.source === 'SIMULATED_DATA') && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-full">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-red-800 font-bold text-lg">⚠️ MOCK DATA WARNING</h3>
                      <p className="text-red-700 text-sm mt-1">
                        This analysis is using simulated/mock data, not real measurements from your video. 
                        For accurate results, ensure your video has good lighting and clear visibility of your entire body.
                      </p>
                    </div>
                  </div>
                </div>
              )}
                    
              {/* Analysis Results */}
              {result.analysis && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h3>
                  
                  {/* Data Source Information */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-yellow-800 font-semibold text-sm">📊 Data Source Transparency</span>
                          {sourceInfo?.source === 'SIMULATED_DATA' || result.isEmergencyMode ? (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">MOCK DATA</span>
                          ) : (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">REAL DATA</span>
                          )}
                        </div>
                        <p className="text-yellow-700 text-sm font-medium">
                          {sourceInfo ? sourceInfo.message : (result.isEmergencyMode ? "⚠️ Using fallback/mock data - pose detection may have failed" : "✅ Using real pose detection data from your video")}
                        </p>
                        {result.isEmergencyMode && (
                          <p className="text-red-600 text-xs mt-2 bg-red-50 p-2 rounded border-l-2 border-red-300">
                            <strong>Note:</strong> This indicates pose detection failed and analysis used simulated data for demonstration.
                          </p>
                        )}
                        {sourceInfo && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-yellow-600 text-xs">Confidence Level:</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              sourceInfo.confidence === 'HIGH' ? 'bg-green-100 text-green-800' :
                              sourceInfo.confidence === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {sourceInfo.confidence}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Video Player with Pose Overlays */}
                  {file && result.poses && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Analyzed Video with Pose Overlays</h4>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Pose Overlays</span>
                            <div className="flex items-center space-x-4">
                              <label className="flex items-center">
                              <input type="checkbox" checked={showStickFigure} onChange={(e) => setShowStickFigure(e.target.checked)} className="mr-2" />
                                <span className="text-sm text-gray-600">Stick Figure</span>
                              </label>
                              <label className="flex items-center">
                              <input type="checkbox" checked={showSwingPlane} onChange={(e) => setShowSwingPlane(e.target.checked)} className="mr-2" />
                                <span className="text-sm text-gray-600">Swing Plane</span>
                              </label>
                              <label className="flex items-center">
                                <input type="checkbox" checked={showHandTrails} onChange={(e) => setShowHandTrails(e.target.checked)} className="mr-2" />
                                <span className="text-sm text-gray-600">Hand Trails</span>
                              </label>
                              <label className="flex items-center">
                                <input type="checkbox" checked={showClubPath} onChange={(e) => setShowClubPath(e.target.checked)} className="mr-2" />
                                <span className="text-sm text-gray-600">Club Path</span>
                              </label>
                              <label className="flex items-center">
                                <input type="checkbox" checked={showPlaneTunnel} onChange={(e) => setShowPlaneTunnel(e.target.checked)} className="mr-2" />
                                <span className="text-sm text-gray-600">Plane Tunnel</span>
                              </label>
                            <label className="flex items-center">
                              <input type="checkbox" checked={angleToolActive} onChange={(e) => setAngleToolActive(e.target.checked)} className="mr-2" />
                              <span className="text-sm text-gray-600">Angle Tool</span>
                            </label>
                            <button
                              onClick={async () => {
                                if (!file || !result?.analysis?.poses) return;
                                try {
                                  setIsRendering(true);
                                  setRenderProgress(0);
                                  const render = await renderProcessedSwingVideo({
                                    file,
                                    poses: result.analysis.poses,
                                    analysis: result.analysis,
                                    fps: 30,
                                    drawStickFigure: showStickFigure,
                                    drawSwingPlane: showSwingPlane,
                                    drawKeyFrames: true,
                                    drawMetrics: true,
                                    brandWatermark: true,
                                    titleCard: { userName: 'Player', swingType: 'Full Swing', date: new Date().toLocaleDateString() },
                                    slowMoImpact: true,
                                    handTrails: showHandTrails,
                                    clubPath: showClubPath,
                                    planeTunnel: showPlaneTunnel,
                                    onProgress: (p) => setRenderProgress(p)
                                  });
                                  setProcessedVideoUrl(render.blobUrl);
                                } catch (e) {
                                  console.error('Processed video render failed', e);
                                } finally {
                                  setIsRendering(false);
                                }
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                              disabled={isRendering}
                            >
                              {isRendering ? `Rendering ${renderProgress}%` : 'Export Processed Video'}
                            </button>
                            <button
                              onClick={async () => {
                                if (!file || !result?.analysis?.poses) return;
                                try {
                                  setIsRendering(true);
                                  setRenderProgress(0);
                                  const render = await renderProcessedSwingVideo({
                                    file,
                                    poses: result.analysis.poses,
                                    analysis: result.analysis,
                                    fps: 30,
                                    drawStickFigure: showStickFigure,
                                    drawSwingPlane: showSwingPlane,
                                    drawKeyFrames: true,
                                    drawMetrics: true,
                                    brandWatermark: true,
                                    titleCard: { userName: 'Player', swingType: 'Full Swing', date: new Date().toLocaleDateString() },
                                    slowMoImpact: true,
                                    sideBySide: { showOriginalLeft: true },
                                    handTrails: showHandTrails,
                                    clubPath: showClubPath,
                                    planeTunnel: showPlaneTunnel,
                                    onProgress: (p) => setRenderProgress(p)
                                  });
                                  setProcessedVideoUrl(render.blobUrl);
                                } catch (e) {
                                  console.error('Side-by-side render failed', e);
                                } finally {
                                  setIsRendering(false);
                                }
                              }}
                              className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                              disabled={isRendering}
                            >
                              {isRendering ? `Rendering ${renderProgress}%` : 'Export Side-by-Side'}
                            </button>
                            </div>
                          </div>
                        </div>
                        <div className="relative bg-black rounded-lg overflow-hidden">
                          <video
                            src={URL.createObjectURL(file)}
                            controls
                            className="w-full h-full object-contain"
                            style={{
                              maxHeight: '28rem',
                              backgroundColor: 'black'
                            }}
                            id="analysis-video"
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onLoadedMetadata={() => {
                              const video = document.getElementById('analysis-video') as HTMLVideoElement;
                              if (video) {
                                video.playbackRate = playbackSpeed;
                                console.log('🎬 Video loaded, set speed to:', playbackSpeed);
                                if (video.videoWidth && video.videoHeight) {
                                  setVideoSize({ width: video.videoWidth, height: video.videoHeight });
                                }
                              }
                            }}
                          >
                            Your browser does not support the video tag.
                          </video>
                          {/* Pose overlay canvas */}
                          <canvas
                            id="pose-overlay-canvas"
                            className="absolute top-0 left-0 w-full h-full pointer-events-none"
                            style={{ zIndex: 10, mixBlendMode: 'normal' }}
                          />
                          {/* Angle measurement canvas */}
                          <canvas
                            id="angle-canvas"
                            className="absolute top-0 left-0 w-full h-full"
                            style={{ zIndex: 11, cursor: angleToolActive ? 'crosshair' : 'default', pointerEvents: angleToolActive ? 'auto' : 'none' }}
                          />
                        </div>
                        
                        {/* Video Speed Controls */}
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">Playback Speed</label>
                            <span className="text-sm text-gray-600">{Math.round(playbackSpeed * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="2.0"
                            step="0.1"
                            value={playbackSpeed}
                            onChange={(e) => {
                              const speed = parseFloat(e.target.value);
                              setPlaybackSpeed(speed);
                              const video = document.getElementById('analysis-video') as HTMLVideoElement;
                              if (video) {
                                video.playbackRate = speed;
                                console.log('🎬 Video speed changed to:', speed);
                              }
                            }}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0.1x</span>
                            <span>0.5x</span>
                            <span>1.0x</span>
                            <span>1.5x</span>
                            <span>2.0x</span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => {
                                const video = document.getElementById('analysis-video') as HTMLVideoElement;
                                if (video) {
                                  if (isPlaying) {
                                    video.pause();
                                  } else {
                                    video.play();
                                  }
                                }
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                              {isPlaying ? 'Pause' : 'Play'}
                            </button>
                            <button
                              onClick={() => {
                                const video = document.getElementById('analysis-video') as HTMLVideoElement;
                                if (video) {
                                  video.currentTime = Math.max(0, video.currentTime - 0.1);
                                }
                              }}
                              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                            >
                              ← Frame
                            </button>
                            <button
                              onClick={() => {
                                const video = document.getElementById('analysis-video') as HTMLVideoElement;
                                if (video) {
                                  video.currentTime = Math.min(video.duration, video.currentTime + 0.1);
                                }
                              }}
                              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                            >
                              Frame →
                            </button>
                          </div>
                        </div>
                        
                        {impactFrameIndex !== null && (
                          <div className="mt-3">
                            <label className="text-sm text-gray-700 mr-2">Impact Zone</label>
                            <input
                              type="range"
                              min={Math.max(0, impactFrameIndex - 10)}
                              max={Math.min((result?.analysis?.poses || result?.poses || []).length - 1, impactFrameIndex + 10)}
                              value={scannerFrame ?? impactFrameIndex}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setScannerFrame(val);
                                const videoEl = document.getElementById('analysis-video') as HTMLVideoElement | null;
                                if (videoEl) {
                                  const posesForOverlay: any[] = (result?.analysis?.poses || result?.poses || []) as any[];
                                  const totalPoses = posesForOverlay.length;
                                  const timeInSeconds = totalPoses > 1 && videoEl.duration > 0
                                    ? (val / Math.max(1, totalPoses - 1)) * videoEl.duration
                                    : val / 30; // fallback
                                  videoEl.currentTime = timeInSeconds;
                                  console.log('🎯 Impact Zone slider moved:', {
                                    frameIndex: val,
                                    timeInSeconds,
                                    videoCurrentTime: videoEl.currentTime
                                  });
                                }
                              }}
                              className="w-full"
                            />
                            <div className="flex items-center justify-between mt-2">
                              <div className="text-xs text-gray-500">Frame: {scannerFrame ?? impactFrameIndex}</div>
                              <button
                                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                onClick={() => {
                                  const frame = scannerFrame ?? impactFrameIndex;
                                  setImpactFrameIndex(frame);
                                  // Reflect in analysis as well for rendering/export
                                  setResult((prev: any) => prev ? { ...prev, analysis: { ...prev.analysis, impactFrame: frame } } : prev);
                                  console.log('🎯 Manual impact set to frame', frame);
                                }}
                              >Set impact here</button>
                            </div>
                          </div>
                        )}
                        {processedVideoUrl && (
                          <div className="mt-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">Processed Output</h5>
                            <video src={processedVideoUrl} controls className="w-full rounded" />
                            <a href={processedVideoUrl} download={`swing-processed.webm`} className="inline-block mt-2 text-blue-600 hover:text-blue-800 text-sm">Download Processed Video</a>
                          </div>
                        )}
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-gray-50 p-3 rounded">
                            <span className="text-gray-600">Poses Available:</span>
                            <span className="ml-2 font-semibold text-gray-900">{result.poses.length}</span>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                            <span className="text-gray-600">Overlay Status:</span>
                            <span className="ml-2 font-semibold text-green-600">Active</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Video with pose detection overlays. Pose landmarks are drawn in real-time as you play the video.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Analysis Results Display */}
                  {result.analysis && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Golf Swing Analysis</h4>
                      
                      {/* Overall Score */}
                      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-lg font-semibold text-gray-800">Overall Score</h5>
                            <p className="text-2xl font-bold text-blue-600">{result.analysis.overallScore}/100</p>
                            <p className="text-lg font-semibold text-gray-700">Grade: {result.analysis.letterGrade}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Confidence</p>
                            <p className="text-lg font-semibold text-gray-800">{(result.analysis.confidence * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                      </div>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {result.analysis.metrics?.tempo && (
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h6 className="font-semibold text-gray-800 mb-2">Tempo</h6>
                            <p className="text-sm text-gray-600">Score: {result.analysis.metrics.tempo.score || 'N/A'}</p>
                          </div>
                        )}
                        {result.analysis.metrics?.rotation && (
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h6 className="font-semibold text-gray-800 mb-2">Rotation</h6>
                            <p className="text-sm text-gray-600">Score: {result.analysis.metrics.rotation.score || 'N/A'}</p>
                          </div>
                        )}
                        {result.analysis.metrics?.weightTransfer && (
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h6 className="font-semibold text-gray-800 mb-2">Weight Transfer</h6>
                            <p className="text-sm text-gray-600">Score: {result.analysis.metrics.weightTransfer.score || 'N/A'}</p>
                          </div>
                        )}
                        {result.analysis.metrics?.swingPlane && (
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h6 className="font-semibold text-gray-800 mb-2">Swing Plane</h6>
                            <p className="text-sm text-gray-600">Score: {result.analysis.metrics.swingPlane.score || 'N/A'}</p>
                            <p className="text-xs text-gray-500">Shaft Angle: {result.analysis.metrics.swingPlane.shaftAngle}°</p>
                          </div>
                        )}
                      </div>

                      {/* Feedback */}
                      {result.analysis.feedback && result.analysis.feedback.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                          <h6 className="font-semibold text-yellow-800 mb-2">Feedback</h6>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            {result.analysis.feedback.map((item: string, index: number) => (
                              <li key={index}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Key Improvements */}
                      {result.analysis.keyImprovements && result.analysis.keyImprovements.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h6 className="font-semibold text-blue-800 mb-2">Key Improvements</h6>
                          <ul className="text-sm text-blue-700 space-y-1">
                            {result.analysis.keyImprovements.map((item: string, index: number) => (
                              <li key={index}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm font-medium text-gray-600">Poses Detected:</span>
                      <span className="ml-2 text-lg font-semibold text-gray-900">{result.poseCount}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm font-medium text-gray-600">Video Duration:</span>
                      <span className="ml-2 text-lg font-semibold text-gray-900">{result.videoDuration?.toFixed(1)}s</span>
                      </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm font-medium text-gray-600">Analysis Mode:</span>
                      <span className={`ml-2 text-lg font-semibold ${result.isEmergencyMode ? 'text-yellow-600' : 'text-green-600'}`}>
                        {result.isEmergencyMode ? 'Fallback' : 'Full'}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm font-medium text-gray-600">Accuracy:</span>
                      <span className={`ml-2 text-lg font-semibold ${result.isEmergencyMode ? 'text-yellow-600' : 'text-green-600'}`}>
                        {result.isEmergencyMode ? 'Limited' : 'Full'}
                      </span>
                  </div>
                </div>
                  
                  {/* Swing Metrics */}
                  {result.analysis.metrics && (
                    <div className="mb-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-2">Swing Metrics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {Object.entries(result.analysis.metrics).map(([key, value]) => (
                          <div key={key} className="bg-blue-50 p-3 rounded">
                            <span className="text-sm font-medium text-blue-600 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="ml-2 text-sm font-semibold text-blue-900">
                              {typeof value === 'number' ? value.toFixed(2) : 
                               typeof value === 'object' && value !== null ? 
                                 ((value as any).tempoRatio ? `${(value as any).tempoRatio.toFixed(1)}:1` :
                                  (value as any).shoulderTurn ? `${(value as any).shoulderTurn.toFixed(0)}°` :
                                  (value as any).impact ? `${(value as any).impact.toFixed(1)}%` :
                                  (value as any).planeDeviation ? `${(value as any).planeDeviation.toFixed(1)}°` :
                                  (value as any).spineAngle ? `${(value as any).spineAngle.toFixed(1)}°` :
                                  'Complex data') : 
                               String(value)}
                            </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

                  {/* Swing Phases */}
                  {result.analysis.phases && result.analysis.phases.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-2">Swing Phases Detected</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.analysis.phases.map((phase: any, index: number) => (
                          <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            {phase.phase} ({phase.startTime?.toFixed(1)}s - {phase.endTime?.toFixed(1)}s)
                          </span>
                        ))}
                  </div>
                </div>
              )}

                  {/* Overall Grade */}
                  {result.analysis.overallGrade && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-yellow-800 mb-2">Overall Swing Grade</h4>
                      <div className="text-2xl font-bold text-yellow-900">
                        {result.analysis.overallGrade}
                  </div>
                </div>
              )}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleReset}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Upload New Video
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                    setError(null);
                    setAnalysisProgress(0);
                    if (inputRef.current) {
                      inputRef.current.value = '';
                    }
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
