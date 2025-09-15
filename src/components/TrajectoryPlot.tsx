'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TrajectoryPoint, SwingTrajectory } from '@/lib/mediapipe';
import { SwingPhase } from '@/lib/swing-phases';
import { TrajectoryVisualization, TrajectoryAnalyzer } from '@/lib/trajectory-analysis';

interface TrajectoryPlotProps {
  trajectory: SwingTrajectory;
  phases: SwingPhase[];
  currentFrame?: number;
  onFrameSelect?: (frame: number) => void;
  showVelocity?: boolean;
  showAcceleration?: boolean;
  showPhases?: boolean;
  selectedBodyPart?: keyof SwingTrajectory;
  className?: string;
}

export default function TrajectoryPlot({
  trajectory,
  phases,
  currentFrame = 0,
  onFrameSelect,
  showVelocity = true,
  showAcceleration = false,
  showPhases = true,
  selectedBodyPart = 'rightWrist',
  className = ''
}: TrajectoryPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredFrame, setHoveredFrame] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [plotType, setPlotType] = useState<'2d' | '3d'>('2d');
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [internalShowVelocity, setShowVelocity] = useState(showVelocity);
  const [internalShowAcceleration, setShowAcceleration] = useState(showAcceleration);
  const [internalShowPhases, setShowPhases] = useState(showPhases);
  const [internalSelectedBodyPart, setSelectedBodyPart] = useState(selectedBodyPart);

  const analyzer = new TrajectoryAnalyzer();
  const visualization = analyzer.createVisualizationData(trajectory[internalSelectedBodyPart], phases);

  // Draw the trajectory plot
  const drawPlot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const padding = 40;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    if (showGrid) {
      drawGrid(ctx, padding, plotWidth, plotHeight);
    }

    // Draw phases
    if (internalShowPhases) {
      drawPhases(ctx, phases, padding, plotWidth, plotHeight);
    }

    // Draw trajectory
    drawTrajectory(ctx, trajectory[internalSelectedBodyPart], padding, plotWidth, plotHeight);

    // Draw velocity/acceleration
    if (internalShowVelocity) {
      drawVelocityProfile(ctx, visualization.velocityProfile, padding, plotWidth, plotHeight);
    }

    if (internalShowAcceleration) {
      drawAccelerationProfile(ctx, visualization.velocityProfile, padding, plotWidth, plotHeight);
    }

    // Draw current frame indicator
    if (currentFrame < trajectory[internalSelectedBodyPart].length) {
      drawCurrentFrame(ctx, trajectory[internalSelectedBodyPart][currentFrame], padding, plotWidth, plotHeight);
    }

    // Draw hovered frame
    if (hoveredFrame !== null && hoveredFrame < trajectory[internalSelectedBodyPart].length) {
      drawHoveredFrame(ctx, trajectory[internalSelectedBodyPart][hoveredFrame], padding, plotWidth, plotHeight);
    }

    // Draw labels
    if (showLabels) {
      drawLabels(ctx, padding, plotWidth, plotHeight);
    }
  }, [trajectory, phases, currentFrame, hoveredFrame, selectedBodyPart, showVelocity, showAcceleration, showPhases, showGrid, showLabels, visualization]);

  // Draw grid
  const drawGrid = (ctx: CanvasRenderingContext2D, padding: number, plotWidth: number, plotHeight: number) => {
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * plotWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + plotHeight);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = padding + (i / 10) * plotHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + plotWidth, y);
      ctx.stroke();
    }
  };

  // Draw phases
  const drawPhases = (ctx: CanvasRenderingContext2D, phases: SwingPhase[], padding: number, plotWidth: number, plotHeight: number) => {
    phases.forEach((phase) => {
      const startX = padding + (phase.startFrame / (trajectory[selectedBodyPart].length - 1)) * plotWidth;
      const endX = padding + (phase.endFrame / (trajectory[selectedBodyPart].length - 1)) * plotWidth;
      const phaseWidth = endX - startX;

      ctx.fillStyle = phase.color + '20';
      ctx.fillRect(startX, padding, phaseWidth, plotHeight);

      // Phase label
      ctx.fillStyle = phase.color;
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(phase.name, startX + phaseWidth / 2, padding - 10);
    });
  };

  // Draw trajectory path
  const drawTrajectory = (ctx: CanvasRenderingContext2D, points: TrajectoryPoint[], padding: number, plotWidth: number, plotHeight: number) => {
    if (points.length < 2) return;

    // Normalize coordinates to plot area
    const normalizedPoints = points.map(point => ({
      x: padding + point.x * plotWidth,
      y: padding + (1 - point.y) * plotHeight // Flip Y axis
    }));

    // Draw trajectory line
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(normalizedPoints[0].x, normalizedPoints[0].y);

    for (let i = 1; i < normalizedPoints.length; i++) {
      ctx.lineTo(normalizedPoints[i].x, normalizedPoints[i].y);
    }

    ctx.stroke();

    // Draw trajectory points
    ctx.fillStyle = '#3B82F6';
    normalizedPoints.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // Draw velocity profile
  const drawVelocityProfile = (ctx: CanvasRenderingContext2D, velocityProfile: any, padding: number, plotWidth: number, plotHeight: number) => {
    const { frames, velocities } = velocityProfile;
    if (velocities.length < 2) return;

    const maxVelocity = Math.max(...velocities);
    const normalizedVelocities = velocities.map((v: number) => v / maxVelocity);

    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(padding, padding + plotHeight);

    normalizedVelocities.forEach((velocity: number, index: number) => {
      const x = padding + (index / (velocities.length - 1)) * plotWidth;
      const y = padding + plotHeight - velocity * plotHeight;
      ctx.lineTo(x, y);
    });

    ctx.stroke();
  };

  // Draw acceleration profile
  const drawAccelerationProfile = (ctx: CanvasRenderingContext2D, velocityProfile: any, padding: number, plotWidth: number, plotHeight: number) => {
    const { frames, accelerations } = velocityProfile;
    if (accelerations.length < 2) return;

    const maxAcceleration = Math.max(...accelerations);
    const normalizedAccelerations = accelerations.map((a: number) => a / maxAcceleration);

    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(padding, padding + plotHeight);

    normalizedAccelerations.forEach((acceleration: number, index: number) => {
      const x = padding + (index / (accelerations.length - 1)) * plotWidth;
      const y = padding + plotHeight - acceleration * plotHeight;
      ctx.lineTo(x, y);
    });

    ctx.stroke();
  };

  // Draw current frame indicator
  const drawCurrentFrame = (ctx: CanvasRenderingContext2D, point: TrajectoryPoint, padding: number, plotWidth: number, plotHeight: number) => {
    const x = padding + point.x * plotWidth;
    const y = padding + (1 - point.y) * plotHeight;

    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();

    // Draw frame number
    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(currentFrame.toString(), x, y - 15);
  };

  // Draw hovered frame
  const drawHoveredFrame = (ctx: CanvasRenderingContext2D, point: TrajectoryPoint, padding: number, plotWidth: number, plotHeight: number) => {
    const x = padding + point.x * plotWidth;
    const y = padding + (1 - point.y) * plotHeight;

    ctx.fillStyle = '#8B5CF6';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Draw frame number
    ctx.fillStyle = '#8B5CF6';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(hoveredFrame!.toString(), x, y - 15);
  };

  // Draw labels
  const drawLabels = (ctx: CanvasRenderingContext2D, padding: number, plotWidth: number, plotHeight: number) => {
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    // X-axis label
    ctx.fillText('X Position', padding + plotWidth / 2, padding + plotHeight + 30);

    // Y-axis label
    ctx.save();
    ctx.translate(15, padding + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Y Position', 0, 0);
    ctx.restore();
  };

  // Handle mouse events
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const padding = 40;
    const plotWidth = canvas.width - 2 * padding;
    const plotHeight = canvas.height - 2 * padding;

    // Check if mouse is within plot area
    if (x >= padding && x <= padding + plotWidth && y >= padding && y <= padding + plotHeight) {
      const frame = Math.floor(((x - padding) / plotWidth) * (trajectory[selectedBodyPart].length - 1));
      setHoveredFrame(Math.max(0, Math.min(frame, trajectory[selectedBodyPart].length - 1)));
    } else {
      setHoveredFrame(null);
    }
  }, [trajectory, selectedBodyPart]);

  const handleMouseClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !onFrameSelect) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;

    const padding = 40;
    const plotWidth = canvas.width - 2 * padding;

    const frame = Math.floor(((x - padding) / plotWidth) * (trajectory[selectedBodyPart].length - 1));
    onFrameSelect(Math.max(0, Math.min(frame, trajectory[selectedBodyPart].length - 1)));
  }, [trajectory, selectedBodyPart, onFrameSelect]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = 400;
        drawPlot();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [drawPlot]);

  // Redraw when data changes
  useEffect(() => {
    drawPlot();
  }, [drawPlot]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={internalShowVelocity}
              onChange={(e) => setShowVelocity(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Velocity</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={internalShowAcceleration}
              onChange={(e) => setShowAcceleration(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Acceleration</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={internalShowPhases}
              onChange={(e) => setShowPhases(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Phases</span>
          </label>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={internalSelectedBodyPart as string}
            onChange={(e) => setSelectedBodyPart(e.target.value as keyof SwingTrajectory)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="rightWrist">Right Wrist</option>
            <option value="leftWrist">Left Wrist</option>
            <option value="rightShoulder">Right Shoulder</option>
            <option value="leftShoulder">Left Shoulder</option>
            <option value="rightHip">Right Hip</option>
            <option value="leftHip">Left Hip</option>
            <option value="clubhead">Clubhead</option>
          </select>
        </div>
      </div>

      {/* Plot Canvas */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onClick={handleMouseClick}
          className="w-full cursor-crosshair"
        />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-gray-50 p-3 rounded">
          <div className="font-medium text-gray-700">Total Distance</div>
          <div className="text-lg font-bold text-blue-600">
            {visualization.metrics.totalDistance.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <div className="font-medium text-gray-700">Max Velocity</div>
          <div className="text-lg font-bold text-green-600">
            {visualization.metrics.maxVelocity.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <div className="font-medium text-gray-700">Smoothness</div>
          <div className="text-lg font-bold text-purple-600">
            {(visualization.metrics.smoothness * 100).toFixed(0)}%
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <div className="font-medium text-gray-700">Peak Frame</div>
          <div className="text-lg font-bold text-orange-600">
            {visualization.metrics.peakFrame}
          </div>
        </div>
      </div>
    </div>
  );
}
