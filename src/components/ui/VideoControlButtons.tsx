'use client';

import React, { useCallback } from 'react';
import { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';

interface VideoControlButtonsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  phases: EnhancedSwingPhase[];
  onReloadVideo?: () => void;
  className?: string;
}

export default function VideoControlButtons({
  videoRef,
  phases,
  onReloadVideo,
  className = ''
}: VideoControlButtonsProps) {
  // Find impact phase
  const impactPhase = phases.find(phase => 
    phase.name.toLowerCase() === 'impact' || 
    phase.name.toLowerCase() === 'ballcontact'
  );

  // Handle impact button click
  const handleImpactSeek = useCallback(() => {
    if (!videoRef.current || !impactPhase) {
      console.warn('Cannot seek to impact: video or impact phase not available');
      return;
    }

    const video = videoRef.current;
    
    // Calculate impact time (middle of impact phase)
    const impactTime = (impactPhase.startTime + impactPhase.endTime) / 2 / 1000; // Convert to seconds
    
    console.log('🎯 Impact Seek:', {
      impactPhase,
      impactTime,
      videoDuration: video.duration
    });

    // Ensure time is within video bounds
    const seekTime = Math.max(0, Math.min(impactTime, video.duration));
    
    // Seek to impact frame
    video.currentTime = seekTime;
    
    // Play video from impact point
    video.play().catch(error => {
      console.error('Failed to play video after impact seek:', error);
    });
  }, [videoRef, impactPhase]);

  // Handle reload video
  const handleReloadVideo = useCallback(() => {
    if (!videoRef.current) {
      console.warn('Cannot reload video: video ref not available');
      return;
    }

    const video = videoRef.current;
    
    console.log('🔄 Reloading video...');
    
    // Pause video first
    video.pause();
    
    // Reset to beginning
    video.currentTime = 0;
    
    // Reload the video element
    video.load();
    
    // Call external reload handler if provided
    if (onReloadVideo) {
      onReloadVideo();
    }
    
    // Play video after reload
    setTimeout(() => {
      video.play().catch(error => {
        console.error('Failed to play video after reload:', error);
      });
    }, 100);
  }, [videoRef, onReloadVideo]);

  // Quick phase jump buttons
  const handlePhaseJump = useCallback((phaseName: string) => {
    if (!videoRef.current) return;

    const phase = phases.find(p => p.name.toLowerCase() === phaseName.toLowerCase());
    if (!phase) {
      console.warn(`Phase "${phaseName}" not found`);
      return;
    }

    const video = videoRef.current;
    const seekTime = phase.startTime / 1000; // Convert to seconds
    
    video.currentTime = Math.max(0, Math.min(seekTime, video.duration));
    video.play().catch(console.error);
  }, [videoRef, phases]);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
        <span className="text-sm font-medium text-gray-600 mr-2">Quick Actions:</span>
        
        {/* Reload Video Button */}
        <button
          onClick={handleReloadVideo}
          className="px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-1.5 text-sm font-medium"
          title="Reload video from beginning"
        >
          <span>🔄</span>
          <span>Reload Video</span>
        </button>

        {/* Impact Button */}
        {impactPhase && (
          <button
            onClick={handleImpactSeek}
            className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-1.5 text-sm font-medium"
            title="Jump to impact position"
          >
            <span>🎯</span>
            <span>Impact</span>
          </button>
        )}
      </div>

      {/* Phase Jump Buttons */}
      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
        <span className="text-sm font-medium text-blue-700 mr-2">Jump to:</span>
        
        <button
          onClick={() => handlePhaseJump('address')}
          className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
        >
          Address
        </button>
        
        <button
          onClick={() => handlePhaseJump('backswing')}
          className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
        >
          Backswing
        </button>
        
        <button
          onClick={() => handlePhaseJump('top')}
          className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
        >
          Top
        </button>
        
        <button
          onClick={() => handlePhaseJump('downswing')}
          className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
        >
          Downswing
        </button>
        
        <button
          onClick={() => handlePhaseJump('follow-through')}
          className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
        >
          Follow Through
        </button>
      </div>
    </div>
  );
}