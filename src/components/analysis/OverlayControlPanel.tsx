'use client';

import React, { useState } from 'react';

interface OverlaySettings {
  stickFigure: boolean;
  swingPlane: boolean;
  phaseMarkers: boolean;
  clubPath: boolean;
  impactZone: boolean;
  weightTransfer: boolean;
  spineAngle: boolean;
  tempoGuide: boolean;
  groundForce: boolean;
  releasePoint: boolean;
}

interface OverlayControlPanelProps {
  overlaySettings: OverlaySettings;
  onSettingsChange: (settings: OverlaySettings) => void;
  className?: string;
}

export default function OverlayControlPanel({ 
  overlaySettings, 
  onSettingsChange, 
  className = '' 
}: OverlayControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const overlayOptions = [
    { key: 'stickFigure', icon: '🧍', label: 'Stick Figure', description: 'Body pose skeleton' },
    { key: 'swingPlane', icon: '📐', label: 'Swing Plane', description: 'Club path visualization' },
    { key: 'phaseMarkers', icon: '📍', label: 'Phase Markers', description: 'Swing phase indicators' },
    { key: 'clubPath', icon: '🏌️', label: 'Club Path', description: 'Club trajectory trail' },
    { key: 'impactZone', icon: '💥', label: 'Impact Zone', description: 'Impact position markers' },
    { key: 'weightTransfer', icon: '⚖️', label: 'Weight Transfer', description: 'Weight shift indicators' },
    { key: 'spineAngle', icon: '📏', label: 'Spine Angle', description: 'Spine alignment lines' },
    { key: 'tempoGuide', icon: '🎵', label: 'Tempo Guide', description: 'Rhythm timing guides' },
    { key: 'groundForce', icon: '👣', label: 'Ground Force', description: 'Pressure distribution' },
    { key: 'releasePoint', icon: '🎯', label: 'Release Point', description: 'Club release visualization' }
  ];

  const toggleOverlay = (key: keyof OverlaySettings) => {
    onSettingsChange({
      ...overlaySettings,
      [key]: !overlaySettings[key]
    });
  };

  const showAllOverlays = () => {
    const allTrue = overlayOptions.reduce((acc, option) => {
      acc[option.key as keyof OverlaySettings] = true;
      return acc;
    }, {} as OverlaySettings);
    onSettingsChange(allTrue);
  };

  const hideAllOverlays = () => {
    const allFalse = overlayOptions.reduce((acc, option) => {
      acc[option.key as keyof OverlaySettings] = false;
      return acc;
    }, {} as OverlaySettings);
    onSettingsChange(allFalse);
  };

  const activeOverlayCount = Object.values(overlaySettings).filter(Boolean).length;

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div 
        className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🎛️</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Analysis Overlays</h3>
              <p className="text-sm text-gray-600">
                {activeOverlayCount} of {overlayOptions.length} overlays active
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm text-gray-500 ${isExpanded ? 'rotate-180' : ''} transition-transform`}>
              ▼
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4">
          {/* Quick Actions */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={showAllOverlays}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded transition-colors"
            >
              Show All
            </button>
            <button
              onClick={hideAllOverlays}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm py-2 px-3 rounded transition-colors"
            >
              Hide All
            </button>
          </div>

          {/* Overlay Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overlayOptions.map((option) => {
              const isActive = overlaySettings[option.key as keyof OverlaySettings];
              
              return (
                <div
                  key={option.key}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() => toggleOverlay(option.key as keyof OverlaySettings)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{option.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{option.label}</div>
                      <div className="text-xs text-gray-600">{option.description}</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      isActive
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {isActive && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Preset Configurations */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Presets</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => onSettingsChange({
                  stickFigure: true,
                  swingPlane: true,
                  phaseMarkers: true,
                  clubPath: false,
                  impactZone: false,
                  weightTransfer: false,
                  spineAngle: false,
                  tempoGuide: false,
                  groundForce: false,
                  releasePoint: false
                })}
                className="text-xs py-2 px-3 bg-green-100 hover:bg-green-200 text-green-800 rounded transition-colors"
              >
                Basic Analysis
              </button>
              <button
                onClick={() => onSettingsChange({
                  stickFigure: true,
                  swingPlane: true,
                  phaseMarkers: true,
                  clubPath: true,
                  impactZone: true,
                  weightTransfer: true,
                  spineAngle: false,
                  tempoGuide: false,
                  groundForce: false,
                  releasePoint: false
                })}
                className="text-xs py-2 px-3 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
              >
                Advanced Analysis
              </button>
              <button
                onClick={() => onSettingsChange({
                  stickFigure: false,
                  swingPlane: false,
                  phaseMarkers: true,
                  clubPath: true,
                  impactZone: true,
                  weightTransfer: false,
                  spineAngle: false,
                  tempoGuide: true,
                  groundForce: true,
                  releasePoint: true
                })}
                className="text-xs py-2 px-3 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded transition-colors"
              >
                Impact Focus
              </button>
              <button
                onClick={() => onSettingsChange({
                  stickFigure: true,
                  swingPlane: false,
                  phaseMarkers: false,
                  clubPath: false,
                  impactZone: false,
                  weightTransfer: true,
                  spineAngle: true,
                  tempoGuide: true,
                  groundForce: true,
                  releasePoint: false
                })}
                className="text-xs py-2 px-3 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded transition-colors"
              >
                Body Mechanics
              </button>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600">
              <strong>Tip:</strong> Use different overlay combinations to focus on specific aspects of your swing. 
              Start with "Basic Analysis" for an overview, then try "Advanced Analysis" for detailed insights.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





