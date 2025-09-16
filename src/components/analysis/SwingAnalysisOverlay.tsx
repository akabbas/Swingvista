import React, { useEffect, useRef, useState } from 'react';
import { SwingMetrics } from '@/lib/golf-metrics';
import { PoseResult } from '@/lib/mediapipe';

interface SwingAnalysisOverlayProps {
  videoUrl: string;
  poseData: PoseResult[];
  metrics: SwingMetrics;
  className?: string;
}

export default function SwingAnalysisOverlay({ videoUrl, poseData, metrics, className = '' }: SwingAnalysisOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPhase, setCurrentPhase] = useState('');
  const [feedback, setFeedback] = useState<string[]>([]);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to video
    const resizeCanvas = () => {
      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track video phases and provide feedback
    video.addEventListener('timeupdate', () => {
      const progress = (video.currentTime / video.duration) * 100;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw phase indicators and feedback based on video progress
      if (progress < 20) {
        setCurrentPhase('Setup');
        setFeedback([
          `Spine Angle: ${metrics.bodyAlignment.spineAngle.toFixed(1)}°`,
          metrics.bodyAlignment.spineAngle > 35 ? '✅ Good spine angle' : '⚠️ Stand more upright'
        ]);
      } else if (progress < 40) {
        setCurrentPhase('Backswing');
        setFeedback([
          `Shoulder Turn: ${metrics.rotation.shoulderTurn.toFixed(1)}°`,
          `Hip Turn: ${metrics.rotation.hipTurn.toFixed(1)}°`,
          metrics.rotation.shoulderTurn > 85 ? '✅ Full shoulder turn' : '⚠️ Turn shoulders more',
          metrics.rotation.xFactor > 35 ? '✅ Good X-Factor' : '⚠️ Increase shoulder-hip differential'
        ]);
      } else if (progress < 60) {
        setCurrentPhase('Downswing');
        setFeedback([
          `Tempo Ratio: ${metrics.tempo.tempoRatio.toFixed(1)}:1`,
          metrics.tempo.tempoRatio > 2.8 && metrics.tempo.tempoRatio < 3.2 
            ? '✅ Perfect tempo' 
            : '⚠️ Adjust tempo towards 3:1 ratio'
        ]);
      } else if (progress < 80) {
        setCurrentPhase('Impact');
        setFeedback([
          `Weight Transfer: ${metrics.weightTransfer.impact.toFixed(1)}%`,
          metrics.weightTransfer.impact > 80 ? '✅ Great weight shift' : '⚠️ Transfer more weight forward'
        ]);
      } else {
        setCurrentPhase('Follow Through');
        setFeedback([
          `Overall Grade: ${metrics.letterGrade} (${metrics.overallScore.toFixed(1)})`,
          metrics.overallScore > 90 ? '🏆 Tour quality!' 
          : metrics.overallScore > 80 ? '✨ Excellent swing!'
          : metrics.overallScore > 70 ? '👍 Good swing'
          : '💪 Keep practicing'
        ]);
      }

      // Draw current pose data
      const frameIndex = Math.floor((progress / 100) * poseData.length);
      if (frameIndex < poseData.length) {
        drawPose(ctx, poseData[frameIndex], canvas.width, canvas.height);
      }

      // Draw phase indicator
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 150, 40);
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.fillText(currentPhase, 20, 35);

      // Draw feedback
      const feedbackY = canvas.height - (feedback.length * 25 + 20);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, feedbackY, 300, feedback.length * 25 + 10);
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      feedback.forEach((text, i) => {
        ctx.fillText(text, 20, feedbackY + 25 + (i * 25));
      });
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [poseData, metrics, currentPhase, feedback]);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        className="w-full rounded-lg"
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />
    </div>
  );
}

function drawPose(ctx: CanvasRenderingContext2D, pose: PoseResult, width: number, height: number) {
  const landmarks = pose.landmarks;
  
  // Draw connections
  const connections = [
    // Shoulders
    [11, 12],
    // Arms
    [11, 13], [13, 15],
    [12, 14], [14, 16],
    // Torso
    [11, 23], [12, 24],
    [23, 24],
    // Legs
    [23, 25], [25, 27],
    [24, 26], [26, 28]
  ];

  ctx.strokeStyle = 'rgba(0, 150, 255, 0.7)';
  ctx.lineWidth = 3;

  connections.forEach(([i, j]) => {
    const start = landmarks[i];
    const end = landmarks[j];
    if (start && end && start.visibility && end.visibility && 
        start.visibility > 0.5 && end.visibility > 0.5) {
      ctx.beginPath();
      ctx.moveTo(start.x * width, start.y * height);
      ctx.lineTo(end.x * width, end.y * height);
      ctx.stroke();
    }
  });

  // Draw landmarks
  landmarks.forEach(point => {
    if (point.visibility && point.visibility > 0.5) {
      ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
}
