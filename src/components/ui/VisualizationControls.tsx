"use client";

import React, { useState, useCallback } from 'react';

interface VisualizationControlsProps {
  onToggleOverlay: (overlayType: string, enabled: boolean) => void;
  onPlaybackSpeedChange: (speed: number) => void;
  onResetSettings: () => void;
  className?: string;
}

interface OverlaySettings {
  stickFigure: boolean;
  swingPlane: boolean;
  phaseMarkers: boolean;
  clubPath: boolean;
  impactZone: boolean;
  weightTransfer: boolean;
  spineAngle: boolean;
}

const VisualizationControls: React.FC<VisualizationControlsProps> = ({
  onToggleOverlay,
  onPlaybackSpeedChange,
  onResetSettings,
  className = ""
}) => {
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>({
    stickFigure: true,
    swingPlane: true,
    phaseMarkers: true,
    clubPath: true,
    impactZone: true,
    weightTransfer: true,
    spineAngle: true
  });

  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showAllOverlays, setShowAllOverlays] = useState(true);

  const handleOverlayToggle = useCallback((overlayType: keyof OverlaySettings) => {
    const newValue = !overlaySettings[overlayType];
    setOverlaySettings(prev => ({ ...prev, [overlayType]: newValue }));
    onToggleOverlay(overlayType, newValue);
  }, [overlaySettings, onToggleOverlay]);

  const handlePlaybackSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    onPlaybackSpeedChange(speed);
  }, [onPlaybackSpeedChange]);

  const handleToggleAllOverlays = useCallback(() => {
    const newValue = !showAllOverlays;
    setShowAllOverlays(newValue);
    
    const newSettings = {
      stickFigure: newValue,
      swingPlane: newValue,
      phaseMarkers: newValue,
      clubPath: newValue,
      impactZone: newValue,
      weightTransfer: newValue,
      spineAngle: newValue
    };
    
    setOverlaySettings(newSettings);
    
    // Notify parent of all changes
    Object.entries(newSettings).forEach(([key, value]) => {
      onToggleOverlay(key, value);
    });
  }, [showAllOverlays, onToggleOverlay]);

  const handleResetSettings = useCallback(() => {
    const defaultSettings = {
      stickFigure: true,
      swingPlane: true,
      phaseMarkers: true,
      clubPath: true,
      impactZone: true,
      weightTransfer: true,
      spineAngle: true
    };
    
    setOverlaySettings(defaultSettings);
    setShowAllOverlays(true);
    setPlaybackSpeed(1.0);
    
    // Notify parent of all changes
    Object.entries(defaultSettings).forEach(([key, value]) => {
      onToggleOverlay(key, value);
    });
    onPlaybackSpeedChange(1.0);
    onResetSettings();
  }, [onToggleOverlay, onPlaybackSpeedChange, onResetSettings]);

  const overlayOptions = [
    { key: 'stickFigure' as keyof OverlaySettings, label: 'Stick Figure', icon: '🧍', description: 'Body pose skeleton' },
    { key: 'swingPlane' as keyof OverlaySettings, label: 'Swing Plane', icon: '📐', description: 'Club path visualization' },
    { key: 'phaseMarkers' as keyof OverlaySettings, label: 'Phase Markers', icon: '📍', description: 'Swing phase indicators' },
    { key: 'clubPath' as keyof OverlaySettings, label: 'Club Path', icon: '🏌️', description: 'Club trajectory trail' },
    { key: 'impactZone' as keyof OverlaySettings, label: 'Impact Zone', icon: '💥', description: 'Impact position markers' },
    { key: 'weightTransfer' as keyof OverlaySettings, label: 'Weight Transfer', icon: '⚖️', description: 'Weight shift indicators' },
    { key: 'spineAngle' as keyof OverlaySettings, label: 'Spine Angle', icon: '📏', description: 'Spine alignment lines' }
  ];

  const speedOptions = [
    { value: 0.25, label: '0.25x' },
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 1.0, label: '1x (Normal)' },
    { value: 1.25, label: '1.25x' },
    { value: 1.5, label: '1.5x' },
    { value: 2.0, label: '2x' }
  ];

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <span className="text-2xl mr-2">🎛️</span>
          Visualization Controls
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={handleToggleAllOverlays}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showAllOverlays 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showAllOverlays ? 'Hide All' : 'Show All'}
          </button>
          <button
            onClick={handleResetSettings}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Overlay Controls */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Overlay Settings</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {overlayOptions.map((option) => (
              <label
                key={option.key}
                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  overlaySettings[option.key]
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={overlaySettings[option.key]}
                  onChange={() => handleOverlayToggle(option.key)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{option.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Playback Speed Controls */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Playback Speed</h4>
          <div className="flex flex-wrap gap-2">
            {speedOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePlaybackSpeedChange(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  playbackSpeed === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Current speed: {playbackSpeed}x
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => {
                setOverlaySettings({
                  stickFigure: true,
                  swingPlane: false,
                  phaseMarkers: true,
                  clubPath: false,
                  impactZone: true,
                  weightTransfer: false,
                  spineAngle: false
                });
                // Notify parent of changes
                onToggleOverlay('stickFigure', true);
                onToggleOverlay('swingPlane', false);
                onToggleOverlay('phaseMarkers', true);
                onToggleOverlay('clubPath', false);
                onToggleOverlay('impactZone', true);
                onToggleOverlay('weightTransfer', false);
                onToggleOverlay('spineAngle', false);
              }}
              className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span className="text-lg">🎯</span>
              <div className="text-left">
                <div className="font-medium text-blue-900">Basic Analysis</div>
                <div className="text-sm text-blue-700">Stick figure + phases + impact</div>
              </div>
            </button>
            
            <button
              onClick={() => {
                setOverlaySettings({
                  stickFigure: true,
                  swingPlane: true,
                  phaseMarkers: true,
                  clubPath: true,
                  impactZone: true,
                  weightTransfer: true,
                  spineAngle: true
                });
                // Notify parent of changes
                Object.entries({
                  stickFigure: true,
                  swingPlane: true,
                  phaseMarkers: true,
                  clubPath: true,
                  impactZone: true,
                  weightTransfer: true,
                  spineAngle: true
                }).forEach(([key, value]) => {
                  onToggleOverlay(key, value);
                });
              }}
              className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <span className="text-lg">🔬</span>
              <div className="text-left">
                <div className="font-medium text-green-900">Full Analysis</div>
                <div className="text-sm text-green-700">All overlays enabled</div>
              </div>
            </button>
          </div>
        </div>

        {/* Current Settings Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-2">Current Settings</h5>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Active overlays: {Object.values(overlaySettings).filter(Boolean).length} of {overlayOptions.length}</div>
            <div>Playback speed: {playbackSpeed}x</div>
            <div>All overlays: {showAllOverlays ? 'Enabled' : 'Disabled'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizationControls;
