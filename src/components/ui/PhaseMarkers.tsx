'use client';

import React, { useRef, useEffect, useCallback, memo } from 'react';
import type { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';

export interface PhaseMarkersProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  phases: EnhancedSwingPhase[];
  currentTime?: number;
  showPhaseBars?: boolean;
  showPhaseNames?: boolean;
  showPhaseGrades?: boolean;
  showPhaseRecommendations?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const PhaseMarkers = memo(function PhaseMarkers({
  videoRef,
  phases,
  currentTime = 0,
  showPhaseBars = true,
  showPhaseNames = true,
  showPhaseGrades = true,
  showPhaseRecommendations = true,
  className = '',
  style = {}
}: PhaseMarkersProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // Get current phase based on time
  const getCurrentPhase = useCallback((time: number): EnhancedSwingPhase | null => {
    return phases.find(phase => 
      time >= phase.startTime && time <= phase.endTime
    ) || null;
  }, [phases]);

  // Draw phase timeline bars
  const drawPhaseBars = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    if (!phases || phases.length === 0) return;

    const currentPhase = getCurrentPhase(currentTime);
    
    // Draw top phase bar
    if (showPhaseBars) {
      phases.forEach(phase => {
        const startX = (phase.startTime / phases[phases.length - 1].endTime) * canvasWidth;
        const endX = (phase.endTime / phases[phases.length - 1].endTime) * canvasWidth;
        const width = endX - startX;
        
        // Highlight current phase
        const isCurrentPhase = currentPhase?.name === phase.name;
        const alpha = isCurrentPhase ? 0.8 : 0.4;
        
        ctx.fillStyle = `${phase.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fillRect(startX, 0, width, 8);
        ctx.fillRect(startX, canvasHeight - 8, width, 8);
      });
    }
  }, [phases, currentTime, getCurrentPhase, showPhaseBars]);

  // Draw phase names and grades
  const drawPhaseNames = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    if (!phases || phases.length === 0) return;

    const currentPhase = getCurrentPhase(currentTime);
    
    if (!currentPhase || !showPhaseNames) return;

    // Draw phase info box
    const boxWidth = 250;
    const boxHeight = 80;
    const boxX = 10;
    const boxY = 10;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Phase name
    ctx.fillStyle = currentPhase.color;
    ctx.font = 'bold 18px Arial';
    ctx.fillText(currentPhase.name.toUpperCase(), boxX + 10, boxY + 25);

    // Phase grade
    if (showPhaseGrades) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.fillText(`Grade: ${currentPhase.grade}`, boxX + 10, boxY + 45);
      ctx.fillText(`Confidence: ${(currentPhase.confidence * 100).toFixed(0)}%`, boxX + 10, boxY + 60);
    }

    // Phase description
    ctx.fillStyle = '#cccccc';
    ctx.font = '12px Arial';
    const description = currentPhase.description;
    const maxWidth = boxWidth - 20;
    const lines = wrapText(ctx, description, maxWidth);
    lines.forEach((line, index) => {
      ctx.fillText(line, boxX + 10, boxY + 80 + (index * 15));
    });
  }, [phases, currentTime, getCurrentPhase, showPhaseNames, showPhaseGrades]);

  // Draw phase recommendations
  const drawPhaseRecommendations = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    if (!phases || phases.length === 0) return;

    const currentPhase = getCurrentPhase(currentTime);
    
    if (!currentPhase || !showPhaseRecommendations || !currentPhase.recommendations) return;

    // Draw recommendations box
    const boxWidth = 300;
    const boxHeight = Math.min(200, currentPhase.recommendations.length * 25 + 40);
    const boxX = canvasWidth - boxWidth - 10;
    const boxY = canvasHeight - boxHeight - 10;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Title
    ctx.fillStyle = currentPhase.color;
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Recommendations', boxX + 10, boxY + 20);

    // Recommendations
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    currentPhase.recommendations.forEach((recommendation, index) => {
      const y = boxY + 40 + (index * 20);
      ctx.fillText(`• ${recommendation}`, boxX + 10, y);
    });
  }, [phases, currentTime, getCurrentPhase, showPhaseRecommendations]);

  // Draw phase progress indicator
  const drawPhaseProgress = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    if (!phases || phases.length === 0) return;

    const currentPhase = getCurrentPhase(currentTime);
    
    if (!currentPhase) return;

    // Calculate progress within current phase
    const phaseProgress = (currentTime - currentPhase.startTime) / (currentPhase.endTime - currentPhase.startTime);
    const clampedProgress = Math.max(0, Math.min(1, phaseProgress));

    // Draw progress bar
    const progressBarWidth = canvasWidth - 20;
    const progressBarHeight = 6;
    const progressBarX = 10;
    const progressBarY = canvasHeight - 20;

    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

    // Progress
    ctx.fillStyle = currentPhase.color;
    ctx.fillRect(progressBarX, progressBarY, progressBarWidth * clampedProgress, progressBarHeight);

    // Progress text
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText(`${(clampedProgress * 100).toFixed(0)}%`, progressBarX + progressBarWidth + 10, progressBarY + 4);
  }, [phases, currentTime, getCurrentPhase]);

  // Draw phase metrics
  const drawPhaseMetrics = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    if (!phases || phases.length === 0) return;

    const currentPhase = getCurrentPhase(currentTime);
    
    if (!currentPhase || !currentPhase.metrics) return;

    // Draw metrics box
    const boxWidth = 200;
    const boxHeight = 120;
    const boxX = canvasWidth - boxWidth - 10;
    const boxY = 10;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Title
    ctx.fillStyle = currentPhase.color;
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Phase Metrics', boxX + 10, boxY + 20);

    // Metrics
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px Arial';
    let yOffset = 40;

    Object.entries(currentPhase.metrics).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        let displayValue = value;
        let unit = '';
        
        if (typeof value === 'number') {
          if (key.includes('Angle') || key.includes('Rotation')) {
            unit = '°';
            displayValue = value.toFixed(1);
          } else if (key.includes('Score') || key.includes('Balance')) {
            unit = '%';
            displayValue = value.toFixed(0);
          } else if (key.includes('Distance')) {
            unit = 'm';
            displayValue = value.toFixed(2);
          }
        } else if (typeof value === 'object' && value.left !== undefined && value.right !== undefined) {
          displayValue = `L:${value.left.toFixed(0)}% R:${value.right.toFixed(0)}%`;
        }
        
        ctx.fillText(`${key}: ${displayValue}${unit}`, boxX + 10, boxY + yOffset);
        yOffset += 15;
      }
    });
  }, [phases, currentTime, getCurrentPhase]);

  // Helper function to wrap text
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match video
    const videoWidth = video.videoWidth || video.clientWidth;
    const videoHeight = video.videoHeight || video.clientHeight;
    
    if (videoWidth && videoHeight) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw phase markers
    drawPhaseBars(ctx, canvas.width, canvas.height);
    drawPhaseNames(ctx, canvas.width, canvas.height);
    drawPhaseRecommendations(ctx, canvas.width, canvas.height);
    drawPhaseProgress(ctx, canvas.width, canvas.height);
    drawPhaseMetrics(ctx, canvas.width, canvas.height);

  }, [
    currentTime, 
    drawPhaseBars,
    drawPhaseNames,
    drawPhaseRecommendations,
    drawPhaseProgress,
    drawPhaseMetrics
  ]);

  // Handle canvas resizing
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    const resizeCanvas = () => {
      const videoWidth = video.videoWidth || video.clientWidth;
      const videoHeight = video.videoHeight || video.clientHeight;
      
      if (videoWidth && videoHeight) {
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        render();
      }
    };

    video.addEventListener('loadedmetadata', resizeCanvas);
    video.addEventListener('resize', resizeCanvas);
    window.addEventListener('resize', resizeCanvas);

    return () => {
      video.removeEventListener('loadedmetadata', resizeCanvas);
      video.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [render]);

  // Render loop
  useEffect(() => {
    const animate = () => {
      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{
        imageRendering: 'pixelated',
        ...style
      }}
    />
  );
});

export default PhaseMarkers;

