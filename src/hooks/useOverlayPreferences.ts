'use client';

import { useState, useEffect, useCallback } from 'react';
import { OverlayMode } from '@/components/analysis/OverlaySystem';

interface OverlayPreferences {
  mode: OverlayMode;
  autoSwitch: boolean;
  showTooltips: boolean;
  performanceMode: boolean;
}

const DEFAULT_PREFERENCES: OverlayPreferences = {
  mode: 'analysis',
  autoSwitch: true,
  showTooltips: true,
  performanceMode: false,
};

const STORAGE_KEY = 'swingvista-overlay-preferences';

export function useOverlayPreferences() {
  const [preferences, setPreferences] = useState<OverlayPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load overlay preferences:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback((newPreferences: Partial<OverlayPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save overlay preferences:', error);
    }
  }, [preferences]);

  // Update overlay mode
  const setOverlayMode = useCallback((mode: OverlayMode) => {
    savePreferences({ mode });
  }, [savePreferences]);

  // Toggle auto-switch behavior
  const setAutoSwitch = useCallback((enabled: boolean) => {
    savePreferences({ autoSwitch: enabled });
  }, [savePreferences]);

  // Toggle tooltips
  const setShowTooltips = useCallback((enabled: boolean) => {
    savePreferences({ showTooltips: enabled });
  }, [savePreferences]);

  // Toggle performance mode
  const setPerformanceMode = useCallback((enabled: boolean) => {
    savePreferences({ performanceMode: enabled });
  }, [savePreferences]);

  // Get smart overlay mode based on playback state
  const getSmartOverlayMode = useCallback((isPlaying: boolean): OverlayMode => {
    if (!preferences.autoSwitch) {
      return preferences.mode;
    }

    // Auto-switch logic
    if (isPlaying) {
      return 'analysis'; // Minimal overlays during playback
    } else {
      return preferences.mode; // User's preferred mode when paused
    }
  }, [preferences]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to reset overlay preferences:', error);
    }
  }, []);

  return {
    preferences,
    isLoaded,
    setOverlayMode,
    setAutoSwitch,
    setShowTooltips,
    setPerformanceMode,
    getSmartOverlayMode,
    resetToDefaults,
  };
}
