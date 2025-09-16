'use client';

import React, { useState, useEffect } from 'react';
import { OverlayMode } from './OverlaySystem';

interface OverlayControlsProps {
  currentMode: OverlayMode;
  onModeChange: (mode: OverlayMode) => void;
  autoSwitch: boolean;
  onAutoSwitchChange: (enabled: boolean) => void;
  showTooltips: boolean;
  onShowTooltipsChange: (enabled: boolean) => void;
  performanceMode: boolean;
  onPerformanceModeChange: (enabled: boolean) => void;
  className?: string;
}

const MODE_LABELS: Record<OverlayMode, { label: string; description: string; icon: string }> = {
  clean: {
    label: 'Clean View',
    description: 'No overlays - distraction-free viewing',
    icon: '🎬'
  },
  analysis: {
    label: 'Analysis View',
    description: 'Minimal overlays - key points and phases',
    icon: '📊'
  },
  technical: {
    label: 'Technical View',
    description: 'Full overlays - stick figures and detailed visuals',
    icon: '🔬'
  }
};

export default function OverlayControls({
  currentMode,
  onModeChange,
  autoSwitch,
  onAutoSwitchChange,
  showTooltips,
  onShowTooltipsChange,
  performanceMode,
  onPerformanceModeChange,
  className = ''
}: OverlayControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModeTooltip, setShowModeTooltip] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'o':
          event.preventDefault();
          // Cycle through modes: clean -> analysis -> technical -> clean
          const modes: OverlayMode[] = ['clean', 'analysis', 'technical'];
          const currentIndex = modes.indexOf(currentMode);
          const nextIndex = (currentIndex + 1) % modes.length;
          onModeChange(modes[nextIndex]);
          break;
        case 'a':
          event.preventDefault();
          onAutoSwitchChange(!autoSwitch);
          break;
        case 't':
          event.preventDefault();
          onShowTooltipsChange(!showTooltips);
          break;
        case 'p':
          event.preventDefault();
          onPerformanceModeChange(!performanceMode);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentMode, autoSwitch, showTooltips, performanceMode, onModeChange, onAutoSwitchChange, onShowTooltipsChange, onPerformanceModeChange]);

  const currentModeInfo = MODE_LABELS[currentMode];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Overlay Controls</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Current Mode Display */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="text-2xl">{currentModeInfo.icon}</div>
        <div>
          <div className="font-medium text-gray-800">{currentModeInfo.label}</div>
          <div className="text-sm text-gray-600">{currentModeInfo.description}</div>
        </div>
        <div className="ml-auto text-xs text-gray-500">
          Press 'O' to cycle
        </div>
      </div>

      {/* Mode Selection */}
      <div className="flex space-x-2 mb-4">
        {Object.entries(MODE_LABELS).map(([mode, info]) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode as OverlayMode)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentMode === mode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onMouseEnter={() => setShowModeTooltip(true)}
            onMouseLeave={() => setShowModeTooltip(false)}
          >
            <span className="mr-2">{info.icon}</span>
            {info.label}
          </button>
        ))}
      </div>

      {/* Expanded Settings */}
      {isExpanded && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          {/* Auto-Switch Setting */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">Auto-Switch Mode</div>
              <div className="text-sm text-gray-600">
                Switch to Analysis View during playback
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSwitch}
                onChange={(e) => onAutoSwitchChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Tooltips Setting */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">Show Tooltips</div>
              <div className="text-sm text-gray-600">
                Display helpful explanations (Press 'T')
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showTooltips}
                onChange={(e) => onShowTooltipsChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Performance Mode Setting */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">Performance Mode</div>
              <div className="text-sm text-gray-600">
                Reduce overlay updates for better performance (Press 'P')
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={performanceMode}
                onChange={(e) => onPerformanceModeChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Keyboard Shortcuts Help */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="font-medium text-gray-800 mb-2">Keyboard Shortcuts</div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div><kbd className="bg-white px-1 rounded">O</kbd> Cycle overlay modes</div>
              <div><kbd className="bg-white px-1 rounded">A</kbd> Toggle auto-switch</div>
              <div><kbd className="bg-white px-1 rounded">T</kbd> Toggle tooltips</div>
              <div><kbd className="bg-white px-1 rounded">P</kbd> Toggle performance mode</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
