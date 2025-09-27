'use client';

import React, { useState, useCallback, useRef } from 'react';
import { VideoCompressor, type VideoCompressionConfig } from '@/lib/performance-optimization';

export interface VideoCompressionManagerProps {
  onCompressionComplete?: (compressedBlob: Blob, originalSize: number, compressedSize: number) => void;
  onCompressionError?: (error: string) => void;
  className?: string;
}

export default function VideoCompressionManager({
  onCompressionComplete,
  onCompressionError,
  className = ''
}: VideoCompressionManagerProps) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compressionConfig, setCompressionConfig] = useState<VideoCompressionConfig>({
    quality: 0.8,
    maxWidth: 1280,
    maxHeight: 720,
    bitrate: 1000000,
    format: 'mp4'
  });
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    processingTime: number;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const compressor = useRef(new VideoCompressor(compressionConfig));

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setProgress(0);
    setCompressionStats(null);

    const startTime = Date.now();

    try {
      const compressedBlob = await compressor.current.compressVideo(file, (progress) => {
        setProgress(progress);
      });

      const processingTime = Date.now() - startTime;
      const originalSize = file.size;
      const compressedSize = compressedBlob.size;
      const compressionRatio = (1 - compressedSize / originalSize) * 100;

      setCompressionStats({
        originalSize,
        compressedSize,
        compressionRatio,
        processingTime
      });

      onCompressionComplete?.(compressedBlob, originalSize, compressedSize);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Compression failed';
      onCompressionError?.(errorMessage);
    } finally {
      setIsCompressing(false);
    }
  }, [compressor, onCompressionComplete, onCompressionError]);

  const handleConfigChange = useCallback((key: keyof VideoCompressionConfig, value: any) => {
    setCompressionConfig(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Update compressor with new config
    compressor.current = new VideoCompressor({
      ...compressionConfig,
      [key]: value
    });
  }, [compressionConfig]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Video Compression</h3>
      
      {/* File Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Video File
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          disabled={isCompressing}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
        />
      </div>

      {/* Compression Settings */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-white mb-3">Compression Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Quality</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={compressionConfig.quality}
              onChange={(e) => handleConfigChange('quality', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Low</span>
              <span>{compressionConfig.quality.toFixed(1)}</span>
              <span>High</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Max Width</label>
            <select
              value={compressionConfig.maxWidth}
              onChange={(e) => handleConfigChange('maxWidth', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value={640}>640px</option>
              <option value={1280}>1280px</option>
              <option value={1920}>1920px</option>
              <option value={2560}>2560px</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Max Height</label>
            <select
              value={compressionConfig.maxHeight}
              onChange={(e) => handleConfigChange('maxHeight', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value={480}>480px</option>
              <option value={720}>720px</option>
              <option value={1080}>1080px</option>
              <option value={1440}>1440px</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Bitrate (Mbps)</label>
            <select
              value={compressionConfig.bitrate / 1000000}
              onChange={(e) => handleConfigChange('bitrate', parseInt(e.target.value) * 1000000)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value={0.5}>0.5 Mbps</option>
              <option value={1}>1 Mbps</option>
              <option value={2}>2 Mbps</option>
              <option value={5}>5 Mbps</option>
              <option value={10}>10 Mbps</option>
            </select>
          </div>
        </div>
      </div>

      {/* Progress */}
      {isCompressing && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>Compressing...</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Compression Stats */}
      {compressionStats && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-3">Compression Results</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Original Size:</span>
              <span className="text-white ml-2">{formatFileSize(compressionStats.originalSize)}</span>
            </div>
            <div>
              <span className="text-gray-400">Compressed Size:</span>
              <span className="text-white ml-2">{formatFileSize(compressionStats.compressedSize)}</span>
            </div>
            <div>
              <span className="text-gray-400">Compression Ratio:</span>
              <span className="text-white ml-2">{compressionStats.compressionRatio.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-400">Processing Time:</span>
              <span className="text-white ml-2">{formatTime(compressionStats.processingTime)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Presets */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-white mb-3">Quick Presets</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCompressionConfig({
              quality: 0.6,
              maxWidth: 640,
              maxHeight: 480,
              bitrate: 500000,
              format: 'mp4'
            })}
            className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
          >
            Mobile (Low Quality)
          </button>
          <button
            onClick={() => setCompressionConfig({
              quality: 0.8,
              maxWidth: 1280,
              maxHeight: 720,
              bitrate: 1000000,
              format: 'mp4'
            })}
            className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
          >
            Standard (HD)
          </button>
          <button
            onClick={() => setCompressionConfig({
              quality: 0.9,
              maxWidth: 1920,
              maxHeight: 1080,
              bitrate: 2000000,
              format: 'mp4'
            })}
            className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
          >
            High Quality (Full HD)
          </button>
        </div>
      </div>
    </div>
  );
}
