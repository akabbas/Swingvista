'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { ProgressTracking, SwingSession } from '@/lib/swing-comparison';

export interface ProgressTrackingVisualizationProps {
  progressTracking: ProgressTracking;
  selectedMetric?: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
  showTrends?: boolean;
  showMilestones?: boolean;
  className?: string;
}

export default function ProgressTrackingVisualization({
  progressTracking,
  selectedMetric = 'overallScore',
  timeRange = 'month',
  showTrends = true,
  showMilestones = true,
  className = ''
}: ProgressTrackingVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw progress chart
    drawProgressChart(ctx, progressTracking, selectedMetric, canvas.width, canvas.height);

    if (showTrends) {
      drawTrends(ctx, progressTracking, canvas.width, canvas.height);
    }

    if (showMilestones) {
      drawMilestones(ctx, progressTracking, canvas.width, canvas.height);
    }

  }, [progressTracking, selectedMetric, showTrends, showMilestones]);

  // Render loop
  useEffect(() => {
    const animate = () => {
      render();
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [render]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseMove={(e) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          // Calculate which point is being hovered
          const pointIndex = calculateHoveredPoint(x, y, progressTracking, selectedMetric, canvas.width, canvas.height);
          setHoveredPoint(pointIndex);
        }}
        onMouseLeave={() => setHoveredPoint(null)}
      />
      
      {/* Hover tooltip */}
      {hoveredPoint !== null && (
        <div className="absolute bg-black bg-opacity-90 text-white p-2 rounded-lg pointer-events-none z-10">
          <div className="text-sm">
            <div>Session: {hoveredPoint + 1}</div>
            <div>Score: {(progressTracking.progressMetrics[selectedMetric as keyof typeof progressTracking.progressMetrics][hoveredPoint] * 100).toFixed(0)}%</div>
            <div>Date: {progressTracking.sessions[hoveredPoint]?.timestamp.toLocaleDateString()}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Drawing functions

function drawProgressChart(
  ctx: CanvasRenderingContext2D,
  progressTracking: ProgressTracking,
  selectedMetric: string,
  width: number,
  height: number
) {
  const metrics = progressTracking.progressMetrics[selectedMetric as keyof typeof progressTracking.progressMetrics];
  if (!metrics || metrics.length === 0) return;

  // Set up chart area
  const margin = 40;
  const chartWidth = width - (margin * 2);
  const chartHeight = height - (margin * 2);
  const chartX = margin;
  const chartY = margin;

  // Draw background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(chartX, chartY, chartWidth, chartHeight);

  // Draw grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  
  // Horizontal grid lines
  for (let i = 0; i <= 5; i++) {
    const y = chartY + (i * chartHeight / 5);
    ctx.beginPath();
    ctx.moveTo(chartX, y);
    ctx.lineTo(chartX + chartWidth, y);
    ctx.stroke();
  }
  
  // Vertical grid lines
  for (let i = 0; i <= 10; i++) {
    const x = chartX + (i * chartWidth / 10);
    ctx.beginPath();
    ctx.moveTo(x, chartY);
    ctx.lineTo(x, chartY + chartHeight);
    ctx.stroke();
  }

  // Draw data points and line
  if (metrics.length > 1) {
    // Draw line
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    metrics.forEach((value, index) => {
      const x = chartX + (index * chartWidth / (metrics.length - 1));
      const y = chartY + chartHeight - (value * chartHeight);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Draw data points
    metrics.forEach((value, index) => {
      const x = chartX + (index * chartWidth / (metrics.length - 1));
      const y = chartY + chartHeight - (value * chartHeight);
      
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw point outline
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  // Draw axes labels
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  
  // Y-axis labels
  for (let i = 0; i <= 5; i++) {
    const value = (i * 0.2).toFixed(1);
    const y = chartY + chartHeight - (i * chartHeight / 5);
    ctx.fillText(value, chartX - 30, y + 4);
  }
  
  // X-axis labels
  for (let i = 0; i < metrics.length; i += Math.max(1, Math.floor(metrics.length / 10))) {
    const x = chartX + (i * chartWidth / (metrics.length - 1));
    ctx.fillText(`${i + 1}`, x - 10, chartY + chartHeight + 20);
  }

  // Draw title
  ctx.font = 'bold 16px Arial';
  ctx.fillText(`${selectedMetric} Progress`, chartX, chartY - 10);
}

function drawTrends(
  ctx: CanvasRenderingContext2D,
  progressTracking: ProgressTracking,
  width: number,
  height: number
) {
  const trends = progressTracking.improvementTrends;
  if (!trends || trends.length === 0) return;

  // Draw trends panel
  const panelX = width - 250;
  const panelY = 10;
  const panelWidth = 240;
  const panelHeight = 150;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('Improvement Trends', panelX + 10, panelY + 25);

  // Draw trends
  ctx.font = '12px Arial';
  trends.forEach((trend, index) => {
    const y = panelY + 45 + (index * 20);
    
    // Draw trend indicator
    const indicatorX = panelX + 10;
    const indicatorY = y - 10;
    const indicatorSize = 8;
    
    ctx.fillStyle = trend.trend === 'improving' ? '#00ff00' : 
                    trend.trend === 'declining' ? '#ff0000' : '#ffff00';
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, indicatorSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw trend text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${trend.metric}: ${trend.trend}`, panelX + 25, y);
    ctx.fillText(`(${trend.change > 0 ? '+' : ''}${trend.change.toFixed(2)})`, panelX + 25, y + 12);
  });
}

function drawMilestones(
  ctx: CanvasRenderingContext2D,
  progressTracking: ProgressTracking,
  width: number,
  height: number
) {
  const milestones = progressTracking.milestones;
  if (!milestones || milestones.length === 0) return;

  // Draw milestones panel
  const panelX = 10;
  const panelY = height - 120;
  const panelWidth = 300;
  const panelHeight = 110;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('Recent Milestones', panelX + 10, panelY + 25);

  // Draw milestones
  ctx.font = '12px Arial';
  milestones.slice(0, 3).forEach((milestone, index) => {
    const y = panelY + 45 + (index * 20);
    
    // Draw milestone indicator
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(panelX + 10, y - 5, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw milestone text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(milestone.achievement, panelX + 20, y);
    ctx.fillText(`(${milestone.value.toFixed(2)})`, panelX + 20, y + 12);
  });
}

function calculateHoveredPoint(
  mouseX: number,
  mouseY: number,
  progressTracking: ProgressTracking,
  selectedMetric: string,
  width: number,
  height: number
): number | null {
  const metrics = progressTracking.progressMetrics[selectedMetric as keyof typeof progressTracking.progressMetrics];
  if (!metrics || metrics.length === 0) return null;

  const margin = 40;
  const chartWidth = width - (margin * 2);
  const chartHeight = height - (margin * 2);
  const chartX = margin;
  const chartY = margin;

  // Check if mouse is within chart area
  if (mouseX < chartX || mouseX > chartX + chartWidth || 
      mouseY < chartY || mouseY > chartY + chartHeight) {
    return null;
  }

  // Find closest point
  let closestIndex = 0;
  let minDistance = Infinity;

  metrics.forEach((value, index) => {
    const x = chartX + (index * chartWidth / (metrics.length - 1));
    const y = chartY + chartHeight - (value * chartHeight);
    
    const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
    
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  return minDistance < 20 ? closestIndex : null;
}
