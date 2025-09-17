'use client';

import { useEffect, useState } from 'react';

interface MediaPipeComponentProps {
  onMediaPipeReady?: (detector: any) => void;
  onError?: (error: Error) => void;
}

// EMERGENCY FIX: Client-side only MediaPipe component
export default function MediaPipeComponent({ onMediaPipeReady, onError }: MediaPipeComponentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }

    const initializeMediaPipe = async () => {
      try {
        console.log('🔄 Initializing MediaPipe component...');
        
        // Check if already loaded globally
        if ((window as any).MediaPipePose && (window as any).MediaPipePose.Pose) {
          console.log('✅ MediaPipe already available globally');
          onMediaPipeReady?.({ Pose: (window as any).MediaPipePose.Pose });
          setIsLoading(false);
          return;
        }

        // Try CDN loading
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
        script.crossOrigin = 'anonymous';
        
        script.onload = () => {
          setTimeout(() => {
            if ((window as any).MediaPipePose && (window as any).MediaPipePose.Pose) {
              console.log('✅ MediaPipe loaded successfully in component');
              onMediaPipeReady?.({ Pose: (window as any).MediaPipePose.Pose });
              setIsLoading(false);
            } else {
              throw new Error('MediaPipe not defined after script load');
            }
          }, 100);
        };
        
        script.onerror = () => {
          throw new Error('Failed to load MediaPipe script');
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.error('❌ MediaPipe component initialization failed:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        onError?.(error instanceof Error ? error : new Error('Unknown error'));
        setIsLoading(false);
      }
    };

    initializeMediaPipe();
  }, [onMediaPipeReady, onError]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium mb-2">MediaPipe Error</h3>
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <p className="text-blue-700 text-sm">Loading MediaPipe...</p>
        </div>
      </div>
    );
  }

  return null; // Component is just for initialization
}
