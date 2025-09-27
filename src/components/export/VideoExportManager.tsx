'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { VideoExporter } from '@/lib/data-export-integration';
import type { VideoExportOptions } from '@/lib/data-export-integration';
import type { PoseResult } from '@/lib/mediapipe';
import type { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';

export interface VideoExportManagerProps {
  videoElement: HTMLVideoElement;
  poses: PoseResult[];
  phases: EnhancedSwingPhase[];
  annotations: any[];
  voiceNotes: any[];
  onExportComplete?: (blob: Blob) => void;
  onExportError?: (error: string) => void;
  className?: string;
}

export default function VideoExportManager({
  videoElement,
  poses,
  phases,
  annotations,
  voiceNotes,
  onExportComplete,
  onExportError,
  className = ''
}: VideoExportManagerProps) {
  const [videoExporter, setVideoExporter] = useState<VideoExporter | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportOptions, setExportOptions] = useState<VideoExportOptions>({
    format: 'mp4',
    quality: 'high',
    resolution: { width: 1920, height: 1080 },
    frameRate: 30,
    includeOverlays: true,
    overlaySettings: {
      showPose: true,
      showPhases: true,
      showMetrics: true,
      showAnnotations: true,
      showVoiceNotes: true
    },
    compression: true,
    watermark: false
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize video exporter
  useEffect(() => {
    if (canvasRef.current && videoElement) {
      const exporter = new VideoExporter(canvasRef.current, videoElement);
      setVideoExporter(exporter);
    }
  }, [videoElement]);

  // Handle video export
  const handleVideoExport = useCallback(async () => {
    if (!videoExporter) {
      onExportError?.('Video exporter not initialized');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 2, 90));
      }, 100);

      const videoBlob = await videoExporter.exportVideoWithOverlays(
        exportOptions,
        poses,
        phases,
        annotations,
        voiceNotes
      );

      clearInterval(progressInterval);
      setExportProgress(100);

      onExportComplete?.(videoBlob);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Video export failed';
      onExportError?.(errorMessage);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [videoExporter, exportOptions, poses, phases, annotations, voiceNotes, onExportComplete, onExportError]);

  // Handle preview
  const handlePreview = useCallback(() => {
    setPreviewMode(!previewMode);
  }, [previewMode]);

  // Render preview frame
  const renderPreviewFrame = useCallback((frameIndex: number) => {
    if (!previewCanvasRef.current || !videoElement) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw video frame
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // Draw overlays
    if (exportOptions.includeOverlays) {
      if (exportOptions.overlaySettings.showPose && poses[frameIndex]) {
        drawPoseOverlay(ctx, poses[frameIndex], canvas.width, canvas.height);
      }
      
      if (exportOptions.overlaySettings.showPhases) {
        drawPhaseOverlay(ctx, phases, frameIndex, canvas.width, canvas.height);
      }
      
      if (exportOptions.overlaySettings.showMetrics && poses[frameIndex]) {
        drawMetricsOverlay(ctx, poses[frameIndex], canvas.width, canvas.height);
      }
      
      if (exportOptions.overlaySettings.showAnnotations) {
        drawAnnotationsOverlay(ctx, annotations, frameIndex, canvas.width, canvas.height);
      }
      
      if (exportOptions.overlaySettings.showVoiceNotes) {
        drawVoiceNotesOverlay(ctx, voiceNotes, frameIndex, canvas.width, canvas.height);
      }
    }
  }, [exportOptions, poses, phases, annotations, voiceNotes, videoElement]);

  // Draw pose overlay
  const drawPoseOverlay = (ctx: CanvasRenderingContext2D, pose: PoseResult, width: number, height: number) => {
    if (!pose.landmarks) return;

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    
    // Draw pose connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 7],
      [0, 4], [4, 5], [5, 6], [6, 8],
      [9, 10], [11, 12], [11, 23], [12, 24],
      [23, 24], [11, 13], [13, 15], [12, 14],
      [14, 16], [23, 25], [25, 27], [24, 26], [26, 28]
    ];

    connections.forEach(([startIdx, endIdx]) => {
      const start = pose.landmarks[startIdx];
      const end = pose.landmarks[endIdx];
      
      if (start && end && (start.visibility ?? 0) > 0.5 && (end.visibility ?? 0) > 0.5) {
        ctx.beginPath();
        ctx.moveTo(start.x * width, start.y * height);
        ctx.lineTo(end.x * width, end.y * height);
        ctx.stroke();
      }
    });

    // Draw landmarks
    pose.landmarks.forEach(landmark => {
      if ((landmark.visibility ?? 0) > 0.5) {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(landmark.x * width, landmark.y * height, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  // Draw phase overlay
  const drawPhaseOverlay = (ctx: CanvasRenderingContext2D, phases: EnhancedSwingPhase[], frameIndex: number, width: number, height: number) => {
    const currentPhase = phases.find(phase => 
      frameIndex >= phase.startFrame && frameIndex <= phase.endFrame
    );
    
    if (currentPhase) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 200, 40);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(currentPhase.name.toUpperCase(), 20, 30);
    }
  };

  // Draw metrics overlay
  const drawMetricsOverlay = (ctx: CanvasRenderingContext2D, pose: PoseResult, width: number, height: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(width - 150, 10, 140, 80);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText(`Confidence: ${(pose.confidence * 100).toFixed(0)}%`, width - 140, 30);
    ctx.fillText(`Timestamp: ${pose.timestamp.toFixed(2)}s`, width - 140, 50);
  };

  // Draw annotations overlay
  const drawAnnotationsOverlay = (ctx: CanvasRenderingContext2D, annotations: any[], frameIndex: number, width: number, height: number) => {
    const relevantAnnotations = annotations.filter(annotation => 
      annotation.timestamp <= frameIndex / 30 // Assuming 30fps
    );
    
    relevantAnnotations.forEach(annotation => {
      ctx.strokeStyle = annotation.color || '#ffff00';
      ctx.lineWidth = 2;
      
      if (annotation.type === 'arrow') {
        drawArrow(ctx, annotation.position, annotation.size);
      } else if (annotation.type === 'circle') {
        drawCircle(ctx, annotation.position, annotation.size);
      } else if (annotation.type === 'text') {
        drawText(ctx, annotation.position, annotation.content);
      }
    });
  };

  // Draw voice notes overlay
  const drawVoiceNotesOverlay = (ctx: CanvasRenderingContext2D, voiceNotes: any[], frameIndex: number, width: number, height: number) => {
    const relevantVoiceNotes = voiceNotes.filter(voiceNote => 
      voiceNote.timestamp <= frameIndex / 30
    );
    
    if (relevantVoiceNotes.length > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, height - 60, 200, 50);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.fillText('Voice Note Available', 20, height - 40);
    }
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, position: { x: number; y: number }, size: number) => {
    ctx.beginPath();
    ctx.moveTo(position.x, position.y);
    ctx.lineTo(position.x + size, position.y - size);
    ctx.lineTo(position.x + size - 5, position.y - size + 5);
    ctx.moveTo(position.x + size, position.y - size);
    ctx.lineTo(position.x + size - 5, position.y - size - 5);
    ctx.stroke();
  };

  const drawCircle = (ctx: CanvasRenderingContext2D, position: { x: number; y: number }, size: number) => {
    ctx.beginPath();
    ctx.arc(position.x, position.y, size / 2, 0, Math.PI * 2);
    ctx.stroke();
  };

  const drawText = (ctx: CanvasRenderingContext2D, position: { x: number; y: number }, text: string) => {
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText(text, position.x, position.y);
  };

  // Handle frame navigation
  const handleFrameChange = useCallback((frameIndex: number) => {
    setCurrentFrame(frameIndex);
    renderPreviewFrame(frameIndex);
  }, [renderPreviewFrame]);

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'mp4': return '🎥';
      case 'mov': return '🎬';
      case 'avi': return '📹';
      case 'webm': return '🌐';
      default: return '📁';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'low': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-green-500';
      case 'ultra': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getResolutionText = (resolution: { width: number; height: number }) => {
    return `${resolution.width}x${resolution.height}`;
  };

  return (
    <div className={`bg-gray-800 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Video Export</h3>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-white">
              {poses.length}
            </div>
            <div className="text-sm text-gray-400">Frames</div>
          </div>
        </div>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Format</label>
            <select
              value={exportOptions.format}
              onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
            >
              <option value="mp4">MP4</option>
              <option value="mov">MOV</option>
              <option value="avi">AVI</option>
              <option value="webm">WebM</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-2">Quality</label>
            <select
              value={exportOptions.quality}
              onChange={(e) => setExportOptions(prev => ({ ...prev, quality: e.target.value as any }))}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-2">Frame Rate</label>
            <select
              value={exportOptions.frameRate}
              onChange={(e) => setExportOptions(prev => ({ ...prev, frameRate: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
            >
              <option value={24}>24 fps</option>
              <option value={30}>30 fps</option>
              <option value={60}>60 fps</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Overlay Settings */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-white mb-4">Overlay Settings</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'showPose', label: 'Pose Overlay', icon: '👤' },
              { key: 'showPhases', label: 'Phase Indicators', icon: '📊' },
              { key: 'showMetrics', label: 'Metrics Display', icon: '📈' },
              { key: 'showAnnotations', label: 'Annotations', icon: '✏️' },
              { key: 'showVoiceNotes', label: 'Voice Notes', icon: '🎤' }
            ].map(option => (
              <label key={option.key} className="flex items-center space-x-2 p-2 bg-gray-700 rounded-lg">
                <input
                  type="checkbox"
                  checked={exportOptions.overlaySettings[option.key as keyof typeof exportOptions.overlaySettings] as boolean}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    overlaySettings: {
                      ...prev.overlaySettings,
                      [option.key]: e.target.checked
                    }
                  }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-300">{option.icon} {option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preview */}
        {previewMode && (
          <div className="mb-6">
            <h4 className="text-md font-semibold text-white mb-4">Preview</h4>
            <div className="bg-gray-700 rounded-lg p-4">
              <canvas
                ref={previewCanvasRef}
                width={exportOptions.resolution.width}
                height={exportOptions.resolution.height}
                className="w-full h-auto max-h-96 object-contain rounded-lg"
              />
              <div className="mt-4 flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max={poses.length - 1}
                  value={currentFrame}
                  onChange={(e) => handleFrameChange(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-300">
                  Frame {currentFrame} / {poses.length - 1}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Export Settings */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-white mb-4">Export Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Resolution</label>
              <select
                value={`${exportOptions.resolution.width}x${exportOptions.resolution.height}`}
                onChange={(e) => {
                  const [width, height] = e.target.value.split('x').map(Number);
                  setExportOptions(prev => ({
                    ...prev,
                    resolution: { width, height }
                  }));
                }}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
              >
                <option value="1280x720">720p (1280x720)</option>
                <option value="1920x1080">1080p (1920x1080)</option>
                <option value="2560x1440">1440p (2560x1440)</option>
                <option value="3840x2160">4K (3840x2160)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-2">Options</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.compression}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, compression: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-300">Compression</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.watermark}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, watermark: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-300">Watermark</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Export Summary */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-white mb-4">Export Summary</h4>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Format:</span>
                <span className="text-white ml-2">
                  {getFormatIcon(exportOptions.format)} {exportOptions.format.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Quality:</span>
                <span className={`ml-2 ${getQualityColor(exportOptions.quality)}`}>
                  {exportOptions.quality.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Resolution:</span>
                <span className="text-white ml-2">
                  {getResolutionText(exportOptions.resolution)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Frame Rate:</span>
                <span className="text-white ml-2">
                  {exportOptions.frameRate} fps
                </span>
              </div>
              <div>
                <span className="text-gray-400">Duration:</span>
                <span className="text-white ml-2">
                  {(poses.length / exportOptions.frameRate).toFixed(1)}s
                </span>
              </div>
              <div>
                <span className="text-gray-400">Overlays:</span>
                <span className="text-white ml-2">
                  {Object.values(exportOptions.overlaySettings).filter(Boolean).length} enabled
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handlePreview}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            {previewMode ? 'Hide Preview' : 'Show Preview'}
          </button>
          
          <button
            onClick={handleVideoExport}
            disabled={isExporting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? 'Exporting...' : 'Export Video'}
          </button>
        </div>

        {/* Export Progress */}
        {isExporting && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Export Progress</span>
              <span>{exportProgress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Hidden Canvas for Export */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
