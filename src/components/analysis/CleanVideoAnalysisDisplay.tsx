"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Play, Pause, Eye, EyeOff, Volume2, VolumeX } from 'lucide-react';
import { ClubShaftDetector } from '@/lib/tracking/clubShaftDetector';

interface CleanVideoAnalysisDisplayProps {
  videoFile?: File | null;
  videoUrl?: string;
  analysis?: any;
  isAnalyzing: boolean;
  poses?: any[];
}

export default function CleanVideoAnalysisDisplay({ 
  videoFile, 
  videoUrl, 
  analysis, 
  isAnalyzing, 
  poses 
}: CleanVideoAnalysisDisplayProps) {
  console.log('🎬 CLEAN VIDEO DISPLAY: Props received:', {
    hasVideoFile: !!videoFile,
    hasVideoUrl: !!videoUrl,
    hasAnalysis: !!analysis,
    isAnalyzing,
    posesCount: poses?.length || 0,
    poses: poses ? 'exists' : 'null'
  });
  
  // CRITICAL DEBUG: Verify poses data quality
  if (poses && poses.length > 0) {
    const firstPose = poses[0];
    const isMockData = firstPose?.landmarks?.every((lm: any) => lm.x === 0.5 && lm.y === 0.5);
    const hasVariedPositions = firstPose?.landmarks?.some((lm: any) => lm.x !== 0.5 || lm.y !== 0.5);
    
    console.log('🔍 POSE DATA VERIFICATION IN COMPONENT:');
    console.log('🔍 - Poses count:', poses.length);
    console.log('🔍 - First pose exists:', !!firstPose);
    console.log('🔍 - First pose landmarks count:', firstPose?.landmarks?.length || 0);
    console.log('🔍 - Is mock data:', isMockData);
    console.log('🔍 - Has varied positions:', hasVariedPositions);
    console.log('🔍 - Data quality:', isMockData ? 'MOCK/DUMMY' : 'REAL');
    
    if (firstPose?.landmarks && firstPose.landmarks.length > 0) {
      console.log('🔍 SAMPLE LANDMARK DATA (first 3):');
      firstPose.landmarks.slice(0, 3).forEach((lm: any, i: number) => {
        console.log(`🔍   Landmark ${i}: x=${lm.x.toFixed(3)}, y=${lm.y.toFixed(3)}, visibility=${(lm.visibility || 0).toFixed(3)}`);
      });
    }
  } else {
    console.log('❌ NO POSES DATA AVAILABLE');
  }
  const videoRef = useRef<HTMLVideoElement>(null);
  const poseCanvasRef = useRef<HTMLCanvasElement>(null);
  const clubPathCanvasRef = useRef<HTMLCanvasElement>(null);
  // Persistent club head history (normalized coordinates) for smooth trail
  const clubHeadHistoryRef = useRef<Array<{x:number,y:number,confidence:number,method:string}>>([]);
  // Track last video frame we appended to history to avoid duplicates
  const lastAppendedFrameRef = useRef<number>(-1);
  // Shaft detector integration
  const shaftDetectorRef = useRef<ClubShaftDetector | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(0.5); // Default to 0.5x speed for golf analysis
  const [showOverlays, setShowOverlays] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // Default to muted for analysis
  
  // Debug showOverlays state changes
  useEffect(() => {
    console.log('🎨 SHOW OVERLAYS STATE CHANGED:', showOverlays);
  }, [showOverlays]);
  
  // Force overlays to be enabled when component mounts
  useEffect(() => {
    if (!showOverlays) {
      console.log('🎨 FORCING OVERLAYS TO BE ENABLED');
      setShowOverlays(true);
    }
  }, []);
  const [overlaySettings, setOverlaySettings] = useState({
    stickFigure: true,
    swingPlane: true,
    phaseMarkers: true,
    clubPath: true,
    clubPathUsesEdgeDetection: true
  });

  // Video event handlers
  const handlePlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const handlePause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleMuteToggle = useCallback(() => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      videoRef.current.volume = newMutedState ? 0 : 1;
      setIsMuted(newMutedState);
      console.log('🔇 Video', newMutedState ? 'muted' : 'unmuted');
    }
  }, [isMuted]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime;
      setCurrentTime(newTime);
      
      // Debug video playback
      const frame = Math.floor(newTime * 30); // Assuming 30fps
      if (frame % 10 === 0) { // Log every 10 frames to avoid console spam
        console.log(`🎬 VIDEO TIME UPDATE: time=${newTime.toFixed(2)}s, frame=${frame}, playing=${!videoRef.current.paused}`);
      }
    }
  }, []);

  // Draw pose overlays
  // Draw test indicators to verify canvas is working (minimal version)
  const drawTestIndicators = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Just a small indicator in corner to show canvas is working
    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.beginPath();
    ctx.arc(canvas.width - 20, 20, 8, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  const drawPoseOverlay = useCallback((
    ctx: CanvasRenderingContext2D,
    frame: number,
    renderedWidth: number,
    renderedHeight: number,
    offsetX: number,
    offsetY: number
  ) => {
    console.log('🎨 DRAW POSE OVERLAY: Frame', frame, 'Poses available:', poses?.length);
    
    if (!poses || poses.length === 0) {
      console.log('❌ No poses available for overlay');
      return;
    }

    const pose = poses[frame];
    console.log('🎨 Pose for frame', frame, ':', pose ? 'exists' : 'null');
    
    if (!pose || !pose.landmarks || pose.landmarks.length === 0) {
      console.log('❌ No landmarks for frame', frame);
      return;
    }
    
    // CRITICAL DEBUG: Verify we have REAL pose data, not mock data
    const isMockData = pose.landmarks.every((lm: any) => lm.x === 0.5 && lm.y === 0.5);
    const hasVariedPositions = pose.landmarks.some((lm: any) => lm.x !== 0.5 || lm.y !== 0.5);
    
    console.log('🔍 POSE DATA VERIFICATION:');
    console.log('🔍 - Is mock data:', isMockData);
    console.log('🔍 - Has varied positions:', hasVariedPositions);
    console.log('🔍 - Data quality:', isMockData ? 'MOCK/DUMMY' : 'REAL');
    
    // Log first few landmark coordinates to verify real data
    if (frame < 3) {
      console.log('🔍 SAMPLE LANDMARK COORDINATES (first 5):');
      pose.landmarks.slice(0, 5).forEach((lm: any, i: number) => {
        console.log(`🔍   Landmark ${i}: x=${lm.x.toFixed(3)}, y=${lm.y.toFixed(3)}, visibility=${(lm.visibility || 0).toFixed(3)}`);
      });
    }
    
    // Debug: Count visible landmarks
    const visibleLandmarks = pose.landmarks.filter((lm: any) => (lm.visibility || 0) > 0.2);
    console.log('🎨 Drawing overlay with', pose.landmarks.length, 'landmarks,', visibleLandmarks.length, 'visible');
    
    // Debug: Log landmark visibility for diagonal angle troubleshooting
    if (frame % 30 === 0) { // Log every 30 frames
      console.log('🎨 LANDMARK VISIBILITY:', pose.landmarks.map((lm: any, i: number) => 
        `${i}:${(lm.visibility || 0).toFixed(2)}`
      ).join(' '));
    }

    // Get canvas reference
    const canvas = poseCanvasRef.current;
    if (!canvas) {
      console.log('❌ No canvas ref in drawPoseOverlay');
      return;
    }

    // Draw skeleton connections - MoveNet 17 keypoints
    // MoveNet keypoint indices:
    // 0: nose, 1: left_eye, 2: right_eye, 3: left_ear, 4: right_ear
    // 5: left_shoulder, 6: right_shoulder, 7: left_elbow, 8: right_elbow
    // 9: left_wrist, 10: right_wrist, 11: left_hip, 12: right_hip
    // 13: left_knee, 14: right_knee, 15: left_ankle, 16: right_ankle
    const connections = [
      // Face outline (nose to eyes to ears)
      [0, 1], [0, 2], [1, 3], [2, 4],
      // Torso (shoulders to hips)
      [5, 6], [5, 11], [6, 12], [11, 12],
      // Left arm (shoulder to elbow to wrist)
      [5, 7], [7, 9],
      // Right arm (shoulder to elbow to wrist)
      [6, 8], [8, 10],
      // Left leg (hip to knee to ankle)
      [11, 13], [13, 15],
      // Right leg (hip to knee to ankle)
      [12, 14], [14, 16]
    ];

    // Draw connections - adaptive for different camera angles
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    
    connections.forEach(([start, end]) => {
      const startLandmark = pose.landmarks[start];
      const endLandmark = pose.landmarks[end];
      
      if (startLandmark && endLandmark && 
          (startLandmark.visibility || 0) > 0.3 && 
          (endLandmark.visibility || 0) > 0.3) {
        
        // Calculate distance between points to avoid drawing very long lines
        const dx = startLandmark.x - endLandmark.x;
        const dy = startLandmark.y - endLandmark.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // More strict distance validation for better accuracy
        if (distance > 0.02 && distance < 0.6) {
          // Additional validation: check if landmarks are within reasonable bounds
          const startInBounds = startLandmark.x > 0 && startLandmark.x < 1 && startLandmark.y > 0 && startLandmark.y < 1;
          const endInBounds = endLandmark.x > 0 && endLandmark.x < 1 && endLandmark.y > 0 && endLandmark.y < 1;
          
          if (startInBounds && endInBounds) {
            // Map normalized (0..1) coordinates to the actual rendered video content
            const startX = offsetX + startLandmark.x * renderedWidth;
            const startY = offsetY + startLandmark.y * renderedHeight;
            const endX = offsetX + endLandmark.x * renderedWidth;
            const endY = offsetY + endLandmark.y * renderedHeight;
            
            // Debug: Log coordinates for first few frames
            if (frame < 3) {
              console.log(`🎨 Drawing line from (${startX.toFixed(1)}, ${startY.toFixed(1)}) to (${endX.toFixed(1)}, ${endY.toFixed(1)})`);
              console.log(`🎨 Normalized coords: start(${startLandmark.x.toFixed(3)}, ${startLandmark.y.toFixed(3)}) end(${endLandmark.x.toFixed(3)}, ${endLandmark.y.toFixed(3)})`);
              console.log(`🎨 Canvas size: ${canvas.width}x${canvas.height}, Rendered video: ${renderedWidth.toFixed(1)}x${renderedHeight.toFixed(1)}, Offset: ${offsetX.toFixed(1)},${offsetY.toFixed(1)}`);
            }
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          }
        }
      }
    });

    // Draw keypoints - adaptive for different camera angles with better validation
    pose.landmarks.forEach((landmark: any, index: number) => {
      if ((landmark.visibility || 0) > 0.3 && 
          landmark.x > 0 && landmark.x < 1 && 
          landmark.y > 0 && landmark.y < 1) { // Better validation for accuracy
        // Make keypoints slightly larger for better visibility
        const radius = 5;
        
        // Different colors for different body parts based on MoveNet 17 keypoints
        if (index >= 0 && index <= 4) {
          ctx.fillStyle = '#ff0000'; // Face (0-4: nose, eyes, ears) - red
        } else if (index >= 5 && index <= 10) {
          ctx.fillStyle = '#00ff00'; // Upper body (5-10: shoulders, elbows, wrists) - green
        } else if (index >= 11 && index <= 12) {
          ctx.fillStyle = '#ffff00'; // Hips (11-12) - yellow
        } else if (index >= 13 && index <= 16) {
          ctx.fillStyle = '#ff00ff'; // Legs (13-16: knees, ankles) - magenta
        } else {
          ctx.fillStyle = '#00ffff'; // Fallback - cyan
        }
        
        // Map normalized (0..1) coordinates to the actual rendered video content
        const keypointX = offsetX + landmark.x * renderedWidth;
        const keypointY = offsetY + landmark.y * renderedHeight;
        
        // Debug: Log keypoint coordinates for first few frames
        if (frame < 3 && index < 5) {
          console.log(`🎨 Keypoint ${index}: (${keypointX.toFixed(1)}, ${keypointY.toFixed(1)}) from normalized (${landmark.x.toFixed(3)}, ${landmark.y.toFixed(3)})`);
              console.log(`🎨 Canvas size: ${canvas.width}x${canvas.height}, Rendered video: ${renderedWidth.toFixed(1)}x${renderedHeight.toFixed(1)}, Offset: ${offsetX.toFixed(1)},${offsetY.toFixed(1)}`);
        }
        
        ctx.beginPath();
        ctx.arc(keypointX, keypointY, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add white outline for better visibility
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  }, [poses]);

  // Draw swing plane
  const drawSwingPlane = useCallback((
    ctx: CanvasRenderingContext2D,
    frame: number,
    renderedWidth: number,
    renderedHeight: number,
    offsetX: number,
    offsetY: number
  ) => {
    if (!poses || poses.length === 0) return;

    const pose = poses[frame];
    if (!pose || !pose.landmarks || pose.landmarks.length === 0) return;

    const canvas = poseCanvasRef.current;
    if (!canvas) return;

    // Find key points for swing plane (MoveNet indices)
    const leftShoulder = pose.landmarks[5];
    const rightShoulder = pose.landmarks[6];
    const leftHip = pose.landmarks[11];
    const rightHip = pose.landmarks[12];

    if (leftShoulder && rightShoulder && leftHip && rightHip &&
        (leftShoulder.visibility || 0) > 0.3 && (rightShoulder.visibility || 0) > 0.3 &&
        (leftHip.visibility || 0) > 0.3 && (rightHip.visibility || 0) > 0.3) {
      
      // Draw swing plane line (shoulder to hip)
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 4]);
      
      ctx.beginPath();
      ctx.moveTo(
        offsetX + ((leftShoulder.x + rightShoulder.x) / 2) * renderedWidth,
        offsetY + ((leftShoulder.y + rightShoulder.y) / 2) * renderedHeight
      );
      ctx.lineTo(
        offsetX + ((leftHip.x + rightHip.x) / 2) * renderedWidth,
        offsetY + ((leftHip.y + rightHip.y) / 2) * renderedHeight
      );
      ctx.stroke();
      
      ctx.setLineDash([]);
      
      // Draw swing plane label
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('SWING PLANE', 10, canvas.height - 100);
    }
  }, [poses]);

  // Draw phase markers
  const drawPhaseMarkers = useCallback((
    ctx: CanvasRenderingContext2D,
    frame: number,
    renderedWidth: number,
    renderedHeight: number,
    offsetX: number,
    offsetY: number
  ) => {
    if (!poses || poses.length === 0) return;

    const canvas = poseCanvasRef.current;
    if (!canvas) return;

    // Simple phase detection based on frame ranges
    const totalFrames = poses.length;
    const addressEnd = Math.floor(totalFrames * 0.1);
    const backswingEnd = Math.floor(totalFrames * 0.4);
    const downswingEnd = Math.floor(totalFrames * 0.7);
    const followThroughEnd = Math.floor(totalFrames * 0.9);

    let currentPhase = '';
    let phaseColor = '';

    if (frame <= addressEnd) {
      currentPhase = 'ADDRESS';
      phaseColor = '#00ff00';
    } else if (frame <= backswingEnd) {
      currentPhase = 'BACKSWING';
      phaseColor = '#ffff00';
    } else if (frame <= downswingEnd) {
      currentPhase = 'DOWNSWING';
      phaseColor = '#ff0000';
    } else if (frame <= followThroughEnd) {
      currentPhase = 'FOLLOW-THROUGH';
      phaseColor = '#ff8800';
    } else {
      currentPhase = 'FINISH';
      phaseColor = '#8800ff';
    }

    // Draw phase indicator box
    ctx.fillStyle = phaseColor;
    ctx.fillRect(10, 10, 200, 50);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(currentPhase, 20, 40);

    // Draw phase progress bar
    const progress = frame / totalFrames;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(offsetX + 10, offsetY + renderedHeight - 30, renderedWidth - 20, 15);
    ctx.fillStyle = phaseColor;
    ctx.fillRect(offsetX + 10, offsetY + renderedHeight - 30, (renderedWidth - 20) * progress, 15);
  }, [poses]);

  // Enhanced club head detection specifically for golf clubs
  const detectClubHead = useCallback((frame: number): {x: number, y: number, confidence: number, method: string} => {
    // Only log every 30 frames to reduce console spam
    if (frame % 30 === 0) {
    console.log(`🏌️ DETECTING CLUB HEAD: Frame ${frame}`);
    }
    
    // Prefer cached history for continuity
    if (!poses || poses.length === 0 || frame >= poses.length) {
      if (frame < 3) {
      console.log('❌ Cannot detect club head - missing poses');
      }
      return { x: 0.5, y: 0.5, confidence: 0, method: 'none' };
    }
    
    const pose = poses[frame];
    if (!pose || !pose.landmarks) {
      if (frame < 3) {
        console.log('❌ No pose or landmarks for frame', frame);
      }
      return { x: 0.5, y: 0.5, confidence: 0, method: 'none' };
    }

    // MoveNet wrist indices: 9 = left_wrist, 10 = right_wrist
    const leftWrist = pose.landmarks[9];
    const rightWrist = pose.landmarks[10];

    // Always log wrist data for debugging
    console.log(`🏌️ Wrist data - Left: ${leftWrist ? `x=${leftWrist.x.toFixed(3)}, y=${leftWrist.y.toFixed(3)}, vis=${(leftWrist.visibility || 0).toFixed(2)}` : 'null'}`);
    console.log(`🏌️ Wrist data - Right: ${rightWrist ? `x=${rightWrist.x.toFixed(3)}, y=${rightWrist.y.toFixed(3)}, vis=${(rightWrist.visibility || 0).toFixed(2)}` : 'null'}`);

    // Compute wrist center using available wrists (use counts to avoid nullable math)
    let wristCenterXSum = 0;
    let wristCenterYSum = 0;
    let wristCount = 0;
    let visibilitySum = 0;

    if (leftWrist && (leftWrist.visibility || 0) > 0.1) {
      wristCenterXSum += leftWrist.x;
      wristCenterYSum += leftWrist.y;
      visibilitySum += (leftWrist.visibility || 0);
      wristCount++;
    }
    if (rightWrist && (rightWrist.visibility || 0) > 0.1) {
      wristCenterXSum += rightWrist.x;
      wristCenterYSum += rightWrist.y;
      visibilitySum += (rightWrist.visibility || 0);
      wristCount++;
    }

    const wristCenterX = wristCount > 0 ? wristCenterXSum / wristCount : null;
    const wristCenterY = wristCount > 0 ? wristCenterYSum / wristCount : null;

    // Always log wrist center calculation
    console.log(`🏌️ Wrist center: ${wristCenterX !== null ? `x=${wristCenterX.toFixed(3)}, y=${wristCenterY?.toFixed(3) || 'null'}` : 'null'}, count=${wristCount}`);

    // Improved club head estimation: extrapolate beyond the dominant wrist along the forearm
    const leftElbow = pose.landmarks[7];
    const rightElbow = pose.landmarks[8];
    const leftShoulder = pose.landmarks[5];
    const rightShoulder = pose.landmarks[6];

    const hasLeftElbow = !!leftElbow && (leftElbow.visibility || 0) > 0.1;
    const hasRightElbow = !!rightElbow && (rightElbow.visibility || 0) > 0.1;
    const hasLeftWrist = !!leftWrist && (leftWrist.visibility || 0) > 0.1;
    const hasRightWrist = !!rightWrist && (rightWrist.visibility || 0) > 0.1;
    const hasLeftShoulder = !!leftShoulder && (leftShoulder.visibility || 0) > 0.1;
    const hasRightShoulder = !!rightShoulder && (rightShoulder.visibility || 0) > 0.1;

    // Torso center for outward direction heuristics
    let torsoCenterX = 0.5;
    let torsoCenterY = 0.5;
    let torsoCount = 0;
    if (hasLeftShoulder) { torsoCenterX += leftShoulder!.x; torsoCenterY += leftShoulder!.y; torsoCount++; }
    if (hasRightShoulder) { torsoCenterX += rightShoulder!.x; torsoCenterY += rightShoulder!.y; torsoCount++; }
    if (torsoCount > 0) { torsoCenterX /= (torsoCount + 1); torsoCenterY /= (torsoCount + 1); }

    // Compute candidate club head from each hand if available
    type Candidate = { x: number; y: number; score: number; hand: 'left' | 'right'; };
    const candidates: Candidate[] = [];

    const addCandidateFromHand = (wrist: any, elbow: any, hand: 'left' | 'right') => {
      if (!wrist || !elbow) return;
      const forearmDx = wrist.x - elbow.x;
      const forearmDy = wrist.y - elbow.y;
      const forearmLen = Math.hypot(forearmDx, forearmDy) || 1e-3;
      const ndx = forearmDx / forearmLen;
      const ndy = forearmDy / forearmLen;

      // Extension length scales with forearm length and grip width
      let wristSep = 0.08;
      if (hasLeftWrist && hasRightWrist) {
        const dx = (leftWrist!.x - rightWrist!.x);
        const dy = (leftWrist!.y - rightWrist!.y);
        wristSep = Math.hypot(dx, dy);
      }
      const extension = Math.max(0.10, Math.min(0.28, forearmLen * 1.2 + wristSep * 0.8));

      // Candidate is beyond the wrist along forearm direction
      let cx = wrist.x + ndx * extension;
      let cy = wrist.y + ndy * extension;

      // Heuristic: ensure candidate is outward from torso (away from body)
      const toWristX = wrist.x - torsoCenterX;
      const toWristY = wrist.y - torsoCenterY;
      const dot = toWristX * ndx + toWristY * ndy;
      if (dot < 0) {
        // Flip direction if pointing toward body
        cx = wrist.x - ndx * extension;
        cy = wrist.y - ndy * extension;
      }

      // Score: combine wrist visibility and distance from torso (favor further points)
      const vis = wrist.visibility || 0.5;
      const distFromTorso = Math.hypot(cx - torsoCenterX, cy - torsoCenterY);
      const score = vis * 0.7 + distFromTorso * 0.3;
      candidates.push({ x: cx, y: cy, score, hand });
    };

    if (hasLeftWrist && hasLeftElbow) addCandidateFromHand(leftWrist, leftElbow, 'left');
    if (hasRightWrist && hasRightElbow) addCandidateFromHand(rightWrist, rightElbow, 'right');

    // Default to wrist center if no candidate
    let targetX = wristCenterX ?? 0.5;
    let targetY = wristCenterY ?? 0.7;
    let confidence = wristCount > 0 ? Math.min(1, visibilitySum / wristCount) : 0;
    let method = 'wrist_center';

    if (candidates.length > 0) {
      // Pick best candidate
      candidates.sort((a, b) => b.score - a.score);
      targetX = candidates[0].x;
      targetY = candidates[0].y;
      method = `${candidates[0].hand}_hand_extrapolated`;
      // Boost confidence when we have a good candidate
      confidence = Math.max(confidence, 0.7);
    } else if (wristCenterX !== null && wristCenterY !== null) {
      // Slight outward bias from torso even with only wrist center
      const dx = (wristCenterX - torsoCenterX);
      const dy = (wristCenterY - torsoCenterY);
      const len = Math.hypot(dx, dy) || 1e-3;
      const ndx = dx / len;
      const ndy = dy / len;
      const outward = 0.12;
      targetX = wristCenterX + ndx * outward;
      targetY = wristCenterY + ndy * outward;
      method = 'center_outward_bias';
    }

    // Only log detailed target info on first few frames
    if (frame < 3) {
      console.log(`🏌️ Target before smoothing: x=${targetX.toFixed(3)}, y=${targetY.toFixed(3)}, confidence=${confidence.toFixed(2)}, method=${method}`);
    }

    // Get previous position for smoothing
    const prev = clubHeadHistoryRef.current[frame - 1] ?? clubHeadHistoryRef.current[clubHeadHistoryRef.current.length - 1] ?? null;
    
    let smoothedX = targetX;
    let smoothedY = targetY;

    if (prev) {
      // Only log smoothing details on first few frames
      if (frame < 3) {
        console.log(`🏌️ Previous position: x=${prev.x.toFixed(3)}, y=${prev.y.toFixed(3)}`);
      }
      
      // Calculate distance to previous position
      const dx = targetX - prev.x;
      const dy = targetY - prev.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (frame < 3) {
        console.log(`🏌️ Distance from previous: ${distance.toFixed(3)}`);
      }

    // Reasonable cap on jumps to avoid teleportation but keep responsive
    const maxStep = 0.25;
      if (distance > maxStep) {
        const t = maxStep / distance;
        targetX = prev.x + dx * t;
        targetY = prev.y + dy * t;
        if (frame < 3) {
          console.log(`🏌️ Capped jump to: x=${targetX.toFixed(3)}, y=${targetY.toFixed(3)}`);
        }
      }

    // Smoothing balanced for responsiveness
    const smoothingAlpha = 0.6;
      smoothedX = prev.x * (1 - smoothingAlpha) + targetX * smoothingAlpha;
      smoothedY = prev.y * (1 - smoothingAlpha) + targetY * smoothingAlpha;
      confidence = Math.max(confidence, prev.confidence * 0.8);
      method = 'smoothed_wrist';
      
      if (frame < 3) {
        console.log(`🏌️ After smoothing: x=${smoothedX.toFixed(3)}, y=${smoothedY.toFixed(3)}`);
      }
    }

    // Ensure bounds and validate coordinates
    smoothedX = Math.max(0, Math.min(1, smoothedX));
    smoothedY = Math.max(0, Math.min(1, smoothedY));
    
    // Safety check for NaN or invalid coordinates
    if (isNaN(smoothedX) || isNaN(smoothedY)) {
      console.warn(`🏌️ Invalid coordinates detected, using fallback`);
      smoothedX = 0.5;
      smoothedY = 0.7;
      confidence = 0.1;
      method = 'fallback';
    }

    const result = { x: smoothedX, y: smoothedY, confidence, method };

    // Always log final result for debugging
    console.log(`🏌️ Final club head: x=${result.x.toFixed(3)}, y=${result.y.toFixed(3)}, confidence=${result.confidence.toFixed(2)}, method=${result.method}`);

    return result;
  }, [poses]);

  // Draw club path
  const drawClubPath = useCallback((
    ctx: CanvasRenderingContext2D,
    frame: number,
    renderedWidth: number,
    renderedHeight: number,
    offsetX: number,
    offsetY: number
  ) => {
    console.log(`🎨 DRAW CLUB PATH CALLED: Frame ${frame}, History length: ${clubHeadHistoryRef.current.length}`);
    console.log(`🎨 Canvas context valid: ${!!ctx}`);
    console.log(`🎨 Dimensions: ${renderedWidth}x${renderedHeight}, Offset: ${offsetX},${offsetY}`);
    
    // Build continuous trail using cached clubHeadHistoryRef
    const history = clubHeadHistoryRef.current;

    // Append only if edge detection is disabled; when enabled, appends happen in drawOverlays
    if (!overlaySettings.clubPathUsesEdgeDetection) {
      if (frame !== lastAppendedFrameRef.current) {
        const detected = detectClubHead(frame);
        if (detected && !isNaN(detected.x) && !isNaN(detected.y)) {
          history.push(detected);
          lastAppendedFrameRef.current = frame;
          const MAX_HISTORY_POINTS = 300;
          if (history.length > MAX_HISTORY_POINTS) history.shift();
        }
      }
    }

    if (!history || history.length === 0) {
      return;
    }
    
    // Show full trail history (all points for complete swing visualization)
    const historyLen = history.length;

    // Only log every 30 frames
    if (frame % 30 === 0) {
      console.log(`🎨 Drawing trail with ${historyLen} points`);
    }

    // Validate canvas context
    if (!ctx) {
      console.error('❌ No canvas context available for club path');
      return;
    }

    // Draw trail with fade effect - 3px width, fading from old to new
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 3; // Thin trail as requested
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw trail segments with individual alpha for fade effect
    for (let i = 1; i < historyLen; i++) {
      const p0 = history[i - 1];
      const p1 = history[i];
      
      if (!p0 || !p1) continue;
      if (p0.x === undefined || p0.y === undefined || isNaN(p0.x) || isNaN(p0.y)) continue;
      if (p1.x === undefined || p1.y === undefined || isNaN(p1.x) || isNaN(p1.y)) continue;
      
      const px0 = offsetX + p0.x * renderedWidth;
      const py0 = offsetY + p0.y * renderedHeight;
      const px1 = offsetX + p1.x * renderedWidth;
      const py1 = offsetY + p1.y * renderedHeight;
      
      if (isNaN(px0) || isNaN(py0) || isNaN(px1) || isNaN(py1)) continue;
      
      // Fade: older points (low index) more transparent, newer (high index) more opaque
      // Alpha ranges from 0.3 (oldest) to 1.0 (newest)
      const fadeProgress = i / Math.max(1, historyLen - 1);
      const alpha = 0.3 + fadeProgress * 0.7;
      
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(px0, py0);
      ctx.lineTo(px1, py1);
    ctx.stroke();
    }
    
    // Reset alpha
    ctx.globalAlpha = 1.0;

    // Draw current club head marker (small dot)
    const current = history[historyLen - 1];
    if (current && current.x !== undefined && current.y !== undefined && !isNaN(current.x) && !isNaN(current.y)) {
      const cx = offsetX + current.x * renderedWidth;
      const cy = offsetY + current.y * renderedHeight;
      
      if (!isNaN(cx) && !isNaN(cy)) {
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2); // Small 5px marker
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.stroke();
      }
    }
  }, [poses, detectClubHead, overlaySettings.clubPathUsesEdgeDetection]);

  // Clear all overlays function
  const clearAllOverlays = useCallback(() => {
    console.log('🧹 CLEARING ALL OVERLAYS');
    
    if (poseCanvasRef.current) {
      const ctx = poseCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, poseCanvasRef.current.width, poseCanvasRef.current.height);
      }
    }
    if (clubPathCanvasRef.current) {
      const ctx = clubPathCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, clubPathCanvasRef.current.width, clubPathCanvasRef.current.height);
      }
    }
  }, []);

  // Toggle overlays with proper show/hide behavior
  const toggleOverlays = useCallback(() => {
    if (showOverlays) {
      // Hide overlays - clear all canvases
      console.log('👁️ HIDING OVERLAYS');
      clearAllOverlays();
      setShowOverlays(false);
    } else {
      // Show overlays - enable and redraw
      console.log('👁️ SHOWING OVERLAYS');
      setShowOverlays(true);
      // Wait for state to update, then draw
      setTimeout(() => {
        drawOverlays();
      }, 50);
    }
  }, [showOverlays, clearAllOverlays, drawOverlays]);

  // Force refresh function that works even without all conditions
  const forceRefreshOverlays = useCallback(() => {
    console.log('🔄 FORCE REFRESH OVERLAYS');
    
    // Clear all canvases
    clearAllOverlays();
    
    // Force show overlays if they're hidden
    if (!showOverlays) {
      console.log('🔄 Enabling overlays for refresh');
      setShowOverlays(true);
    }
    
    // Wait a bit for state to update, then draw
    setTimeout(() => {
      drawOverlays();
    }, 50);
  }, [drawOverlays, showOverlays, setShowOverlays, clearAllOverlays]);

  // Main drawing function
  const drawOverlays = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Calculate current frame from video time
    const currentFrame = Math.floor(video.currentTime * 30); // Assuming 30fps
    
    // Only log every 60 frames to reduce console spam
    if (currentFrame % 60 === 0) {
    console.log('🎨 DRAW OVERLAYS CALLED:', {
      hasCanvas: !!poseCanvasRef.current,
      hasVideo: !!videoRef.current,
      showOverlays,
      posesCount: poses?.length || 0,
      overlaySettings
    });
    }
    
    const poseCanvas = poseCanvasRef.current;
    const clubPathCanvas = clubPathCanvasRef.current;
    if (!poseCanvas || !clubPathCanvas || !video || !showOverlays || !poses || poses.length === 0) {
      // Only log on first few frames to avoid spam
      if (currentFrame < 3) {
      console.log('❌ Draw overlays skipped:', { 
        poseCanvas: !!poseCanvas, 
        clubPathCanvas: !!clubPathCanvas,
        video: !!video, 
        showOverlays,
        poses: !!poses,
        posesLength: poses?.length
      });
      }
      return;
    }

    const poseCtx = poseCanvas.getContext('2d');
    const clubPathCtx = clubPathCanvas.getContext('2d');
    if (!poseCtx || !clubPathCtx) {
      if (currentFrame < 3) {
      console.log('❌ No canvas context');
      }
      return;
    }

    // Get video display rect and compute rendered content rect (letterbox-aware)
    const videoRect = video.getBoundingClientRect();
    const displayWidth = videoRect.width;
    const displayHeight = videoRect.height;

    const nativeWidth = video.videoWidth || 640;
    const nativeHeight = video.videoHeight || 480;
    const nativeAspect = nativeWidth / nativeHeight;
    const displayAspect = displayWidth / displayHeight;

    let renderedWidth = displayWidth;
    let renderedHeight = displayHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (displayAspect > nativeAspect) {
      // Canvas wider than content; pillarbox left/right
      renderedHeight = displayHeight;
      renderedWidth = renderedHeight * nativeAspect;
      offsetX = (displayWidth - renderedWidth) / 2;
    } else if (displayAspect < nativeAspect) {
      // Canvas taller than content; letterbox top/bottom
      renderedWidth = displayWidth;
      renderedHeight = renderedWidth / nativeAspect;
      offsetY = (displayHeight - renderedHeight) / 2;
    }

    // Set canvas dimensions to match the display size
    poseCanvas.width = displayWidth;
    poseCanvas.height = displayHeight;
    clubPathCanvas.width = displayWidth;
    clubPathCanvas.height = displayHeight;
    
    // Prepare capture canvas at native resolution for tracker
    if (!captureCanvasRef.current) {
      captureCanvasRef.current = document.createElement('canvas');
    }
    const capCanvas = captureCanvasRef.current;
    if (capCanvas.width !== nativeWidth || capCanvas.height !== nativeHeight) {
      capCanvas.width = nativeWidth;
      capCanvas.height = nativeHeight;
    }
    const capCtx = capCanvas.getContext('2d');
    
    // Only log canvas dimensions every 60 frames
    if (currentFrame % 60 === 0) {
    console.log('🎨 Canvas dimensions set to:', {
        videoNative: { width: nativeWidth, height: nativeHeight },
        videoDisplay: { width: displayWidth, height: displayHeight },
        renderedContent: { width: renderedWidth, height: renderedHeight, offsetX, offsetY },
      poseCanvas: { width: poseCanvas.width, height: poseCanvas.height },
      clubPathCanvas: { width: clubPathCanvas.width, height: clubPathCanvas.height }
    });
    }
    
    // Set CSS size to match video display size exactly
    const containerRect = video.parentElement?.getBoundingClientRect();
    
    if (containerRect) {
      // Calculate the video's position within the container
      const videoOffsetX = videoRect.left - containerRect.left;
      const videoOffsetY = videoRect.top - containerRect.top;
      
      // Position both canvases to match the video's position and size
      const canvases = [poseCanvas, clubPathCanvas];
      canvases.forEach((canvas, index) => {
        canvas.style.position = 'absolute';
        canvas.style.top = videoOffsetY + 'px';
        canvas.style.left = videoOffsetX + 'px';
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        canvas.style.zIndex = `${10 + index}`; // Stack canvases with different z-indices
      });
      
      // Only log positioning every 60 frames
      if (currentFrame % 60 === 0) {
      console.log('🎨 Canvas positioning:', {
        videoOffsetX,
        videoOffsetY,
        videoRect: { width: videoRect.width, height: videoRect.height },
        containerRect: { width: containerRect.width, height: containerRect.height }
      });
      }
    }
    
    // Only log canvas sizes every 60 frames
    if (currentFrame % 60 === 0) {
    console.log('🎨 Pose canvas size set to:', poseCanvas.width, 'x', poseCanvas.height);
    console.log('🎨 Club path canvas size set to:', clubPathCanvas.width, 'x', clubPathCanvas.height);
      console.log('🎨 Video rect:', displayWidth, 'x', displayHeight);
    }

    // Only log frame info every 60 frames
    if (currentFrame % 60 === 0) {
      console.log('🎨 Current frame:', currentFrame, 'Video time:', video.currentTime);
    console.log('🎨 Poses array length:', poses?.length);
      console.log('🎨 Frame within bounds:', currentFrame < (poses?.length || 0));
    }

    // Clear both canvases
    poseCtx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);
    clubPathCtx.clearRect(0, 0, clubPathCanvas.width, clubPathCanvas.height);
    
    // TEST: Draw a visible test marker on club path canvas to verify it's visible
    clubPathCtx.fillStyle = '#ff0000'; // Red color
    clubPathCtx.beginPath();
    clubPathCtx.arc(50, 50, 20, 0, Math.PI * 2); // Large red circle at top-left
    clubPathCtx.fill();
    console.log('🎨 TEST: Drew red test marker on club path canvas');

    // ALWAYS draw test indicators regardless of overlay settings
    console.log('🎨 Drawing test indicators...');
    drawTestIndicators(poseCtx, poseCanvas);

    if (overlaySettings.stickFigure) {
      console.log('🎨 Drawing stick figure...');
      // Ensure frame is within bounds
      const safeFrame = Math.min(currentFrame, (poses?.length || 1) - 1);
      console.log('🎨 Safe frame for stick figure:', safeFrame);
      drawPoseOverlay(poseCtx, safeFrame, renderedWidth, renderedHeight, offsetX, offsetY);
    }
    if (overlaySettings.swingPlane) {
      console.log('🎨 Drawing swing plane...');
      const safeFrame = Math.min(currentFrame, (poses?.length || 1) - 1);
      drawSwingPlane(poseCtx, safeFrame, renderedWidth, renderedHeight, offsetX, offsetY);
    }
    if (overlaySettings.phaseMarkers) {
      console.log('🎨 Drawing phase markers...');
      const safeFrame = Math.min(currentFrame, (poses?.length || 1) - 1);
      drawPhaseMarkers(poseCtx, safeFrame, renderedWidth, renderedHeight, offsetX, offsetY);
    }
    // Shaft detector integration: compute club head position (before drawing path)
    if (overlaySettings.clubPath && overlaySettings.clubPathUsesEdgeDetection && poses && poses.length > 0 && capCtx) {
      capCtx.drawImage(video, 0, 0, nativeWidth, nativeHeight);
      const frameData = capCtx.getImageData(0, 0, nativeWidth, nativeHeight);

      if (!shaftDetectorRef.current) {
        shaftDetectorRef.current = new ClubShaftDetector();
        shaftDetectorRef.current.init(nativeWidth, nativeHeight);
      }

      const detector = shaftDetectorRef.current;
      const safeFrame = Math.min(currentFrame, (poses?.length || 1) - 1);
      const pose = poses[safeFrame];
      
      // Calculate wrist separation for club type estimation
      let wristSep = 0.08;
      if (pose && pose.landmarks) {
        const lw = pose.landmarks[9];
        const rw = pose.landmarks[10];
        if (lw && rw && (lw.visibility || 0) > 0.1 && (rw.visibility || 0) > 0.1) {
          wristSep = Math.hypot((lw.x - rw.x), (lw.y - rw.y));
        }
      }
      
      const result = detector.detectClubHead(frameData, pose, wristSep);
      
      if (result && currentFrame !== lastAppendedFrameRef.current) {
        clubHeadHistoryRef.current.push({
          x: result.clubHead.x,
          y: result.clubHead.y,
          confidence: result.confidence,
          method: result.method
        });
        lastAppendedFrameRef.current = currentFrame;
        const MAX_HISTORY_POINTS = 300;
        if (clubHeadHistoryRef.current.length > MAX_HISTORY_POINTS) {
          clubHeadHistoryRef.current.shift();
        }
        
        // Log detection info every 30 frames
        if (currentFrame % 30 === 0) {
          console.log(`🏌️ Club head detected: (${result.clubHead.x.toFixed(3)}, ${result.clubHead.y.toFixed(3)}), method: ${result.method}, confidence: ${result.confidence.toFixed(2)}`);
        }
      }
    }

    if (overlaySettings.clubPath) {
      console.log('🎨 Drawing club path...');
      console.log('🎨 Club path settings:', overlaySettings.clubPath);
      console.log('🎨 Club path canvas context:', !!clubPathCtx);
      console.log('🎨 Club path canvas element:', !!clubPathCanvas);
      console.log('🎨 Club path canvas size:', clubPathCanvas?.width, 'x', clubPathCanvas?.height);
      console.log('🎨 Club path canvas position:', clubPathCanvas?.style.position);
      console.log('🎨 Club path canvas z-index:', clubPathCanvas?.style.zIndex);
      console.log('🎨 Club path canvas visibility:', clubPathCanvas?.style.visibility);
      console.log('🎨 Club path canvas display:', clubPathCanvas?.style.display);
      console.log('🎨 Rendered dimensions:', renderedWidth, 'x', renderedHeight);
      console.log('🎨 Offset:', offsetX, offsetY);
      const safeFrame = Math.min(currentFrame, (poses?.length || 1) - 1);
      console.log(`🎨 Calling drawClubPath with frame ${safeFrame}`);
      drawClubPath(clubPathCtx, safeFrame, renderedWidth, renderedHeight, offsetX, offsetY);
    } else {
      console.log('🎨 Club path disabled in settings');
    }
  }, [showOverlays, overlaySettings, drawPoseOverlay, drawSwingPlane, drawPhaseMarkers, drawClubPath, poses]);

  // Animation loop for smooth overlay rendering
  useEffect(() => {
    let animationFrameId: number;
    let lastDrawTime = 0;
    const FRAME_INTERVAL = 1000 / 60; // Target 60fps for smooth animation
    
    function animationLoop(timestamp: number) {
      // Only draw if enough time has passed since last draw
      if (timestamp - lastDrawTime >= FRAME_INTERVAL) {
        console.log('🎬 Animation loop drawing overlays at timestamp:', timestamp);
        drawOverlays();
        lastDrawTime = timestamp;
      }
      
      // Continue the animation loop
      animationFrameId = requestAnimationFrame(animationLoop);
    }
    
    // Start the animation loop
    console.log('🎬 Starting animation loop for overlays');
    animationFrameId = requestAnimationFrame(animationLoop);
    
    // Cleanup function
    return () => {
      console.log('🎬 Stopping animation loop');
      cancelAnimationFrame(animationFrameId);
    };
  }, [drawOverlays]);

  // Reset club head history when poses change (new video)
  useEffect(() => {
    if (poses && poses.length > 0) {
      console.log('🏌️ RESETTING CLUB HEAD HISTORY for new video');
      clubHeadHistoryRef.current = [];
      shaftDetectorRef.current = null;
      lastAppendedFrameRef.current = -1;
    }
  }, [poses]);

  // Trigger initial overlay draw when video loads and auto-play
  useEffect(() => {
    if (videoRef.current && poses && poses.length > 0) {
      console.log('🎨 VIDEO LOADED - Triggering initial overlay draw');
      
      // Auto-play the video after a short delay
      const timeoutId = setTimeout(() => {
        drawOverlays();
        
        // Auto-play video with proper error handling
        if (videoRef.current) {
          console.log('🎬 Auto-playing video');
          videoRef.current.play()
            .then(() => console.log('🎬 Video playback started'))
            .catch(err => {
              console.warn('🎬 Auto-play failed (this is normal in some browsers):', err);
              // Don't treat this as a critical error
            });
        }
      }, 500); // Slightly longer delay to ensure video is ready
      
      return () => clearTimeout(timeoutId);
    }
  }, [poses, drawOverlays]);

  // Setup video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set default playback speed for golf analysis
    video.playbackRate = playbackSpeed;
    console.log('🎬 Setting video playback speed to:', playbackSpeed + 'x');

    const handleLoadedMetadata = () => {
      const canvas = poseCanvasRef.current;
      if (canvas) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }
      // Ensure playback speed is set after video loads
      video.playbackRate = playbackSpeed;
      
      // Set initial mute state
      video.muted = isMuted;
      video.volume = isMuted ? 0 : 1;
      console.log('🔇 Video', isMuted ? 'muted' : 'unmuted', 'for analysis');
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.warn('🎬 Video error (this may be normal):', e);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, [handleTimeUpdate, playbackSpeed, isMuted]);

  return (
    <div className="space-y-4">
      {/* Video Player */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full h-auto"
            style={{ maxHeight: '500px' }}
          />
          {/* Pose Canvas - for stick figure, swing plane, phase markers */}
          <canvas
            ref={poseCanvasRef}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ 
              width: '100%', 
              height: '100%',
              maxHeight: '500px',
              zIndex: 10
            }}
          />
          {/* Club Path Canvas - for club path only */}
          <canvas
            ref={clubPathCanvasRef}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ 
              width: '100%', 
              height: '100%',
              maxHeight: '500px',
              zIndex: 11
            }}
          />
        </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          
          <button
            onClick={toggleOverlays}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              showOverlays 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            {showOverlays ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
            {showOverlays ? 'Hide Overlays' : 'Show Overlays'}
          </button>
          
          <button
            onClick={forceRefreshOverlays}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh Overlays
          </button>
          
          <button
            onClick={handleMuteToggle}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              isMuted 
                ? 'bg-gray-300 text-gray-700 hover:bg-gray-400' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Speed:</span>
          <button
            onClick={() => {
              const newSpeed = 0.25;
              setPlaybackSpeed(newSpeed);
              if (videoRef.current) {
                videoRef.current.playbackRate = newSpeed;
                console.log('🎬 Speed set to:', newSpeed + 'x');
              }
            }}
            className={`px-3 py-1 text-sm rounded ${
              playbackSpeed === 0.25 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            0.25x
          </button>
          <button
            onClick={() => {
              const newSpeed = 0.5;
              setPlaybackSpeed(newSpeed);
              if (videoRef.current) {
                videoRef.current.playbackRate = newSpeed;
                console.log('🎬 Speed set to:', newSpeed + 'x');
              }
            }}
            className={`px-3 py-1 text-sm rounded ${
              playbackSpeed === 0.5 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            0.5x
          </button>
          <button
            onClick={() => {
              const newSpeed = 0.75;
              setPlaybackSpeed(newSpeed);
              if (videoRef.current) {
                videoRef.current.playbackRate = newSpeed;
                console.log('🎬 Speed set to:', newSpeed + 'x');
              }
            }}
            className={`px-3 py-1 text-sm rounded ${
              playbackSpeed === 0.75 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            0.75x
          </button>
          <button
            onClick={() => {
              const newSpeed = 1.0;
              setPlaybackSpeed(newSpeed);
              if (videoRef.current) {
                videoRef.current.playbackRate = newSpeed;
                console.log('🎬 Speed set to:', newSpeed + 'x');
              }
            }}
            className={`px-3 py-1 text-sm rounded ${
              playbackSpeed === 1.0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            1.0x
          </button>
        </div>

        <div className="text-sm text-gray-600">
          {poses ? `${poses.length} poses detected` : 'No pose data'}
        </div>
      </div>

      {/* Overlay Settings */}
      {showOverlays && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-3">Overlay Settings</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(overlaySettings).map(([key, value]) => (
              <label key={key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setOverlaySettings(prev => ({
                    ...prev,
                    [key]: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Summary */}
      {analysis && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Analysis Status</h4>
          <p className="text-blue-700 text-sm">
            {poses ? `Successfully analyzed ${poses.length} frames` : 'Analysis in progress...'}
          </p>
        </div>
      )}
    </div>
  );
}
