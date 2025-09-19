'use client';

import React, { useRef, useEffect, useState } from 'react';

interface VideoDebuggerProps {
  videoUrl: string;
  videoName: string;
  isSampleVideo?: boolean;
}

export default function VideoDebugger({ videoUrl, videoName, isSampleVideo = false }: VideoDebuggerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [events, setEvents] = useState<string[]>([]);

  const addEvent = (event: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setEvents(prev => [...prev, `[${timestamp}] ${event}`]);
    console.log(`🎥 Video Debug: ${event}`);
  };

  useEffect(() => {
    addEvent(`Component mounted with URL: ${videoUrl}`);
    addEvent(`Is Sample Video: ${isSampleVideo}`);
    addEvent(`URL type: ${videoUrl.startsWith('blob:') ? 'BLOB' : 'FILE'}`);
    
    // Only test URL accessibility for non-blob URLs
    if (!videoUrl.startsWith('blob:')) {
      // Test if URL is accessible
      fetch(videoUrl, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            addEvent(`✅ URL is accessible (${response.status})`);
            addEvent(`Content-Type: ${response.headers.get('content-type')}`);
            addEvent(`Content-Length: ${response.headers.get('content-length')}`);
          } else {
            addEvent(`❌ URL not accessible (${response.status})`);
          }
        })
        .catch(error => {
          addEvent(`❌ URL fetch error: ${error.message}`);
        });
    } else {
      addEvent(`⚠️ Skipping URL accessibility test for blob URL`);
    }
  }, [videoUrl, isSampleVideo]);

  const handleLoadStart = () => {
    addEvent('🔄 loadstart - Video loading started');
  };

  const handleLoadedMetadata = () => {
    addEvent('📊 loadedmetadata - Video metadata loaded');
    if (videoRef.current) {
      const video = videoRef.current;
      setDebugInfo({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        readyState: video.readyState,
        networkState: video.networkState,
        currentSrc: video.currentSrc,
        src: video.src
      });
      addEvent(`Duration: ${video.duration}s, Size: ${video.videoWidth}x${video.videoHeight}`);
    }
  };

  const handleLoadedData = () => {
    addEvent('✅ loadeddata - Video data loaded');
  };

  const handleCanPlay = () => {
    addEvent('▶️ canplay - Video can start playing');
  };

  const handleCanPlayThrough = () => {
    addEvent('🎬 canplaythrough - Video can play through without stopping');
  };

  const handlePlay = () => {
    addEvent('▶️ play - Video started playing');
  };

  const handlePause = () => {
    addEvent('⏸️ pause - Video paused');
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const error = video.error;
    let errorMessage = 'Unknown error';
    
    if (error) {
      switch (error.code) {
        case 1:
          errorMessage = 'MEDIA_ERR_ABORTED - Video loading aborted';
          break;
        case 2:
          errorMessage = 'MEDIA_ERR_NETWORK - Network error';
          break;
        case 3:
          errorMessage = 'MEDIA_ERR_DECODE - Video decode error';
          break;
        case 4:
          errorMessage = 'MEDIA_ERR_SRC_NOT_SUPPORTED - Video format not supported';
          break;
        default:
          errorMessage = `Error code: ${error.code}`;
      }
    }
    
    addEvent(`❌ error - ${errorMessage}`);
    console.error('Video error details:', error);
  };

  const handleStalled = () => {
    addEvent('⏸️ stalled - Video loading stalled');
  };

  const handleSuspend = () => {
    addEvent('⏸️ suspend - Video loading suspended');
  };

  const handleWaiting = () => {
    addEvent('⏳ waiting - Video waiting for data');
  };

  const handleProgress = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const progress = (bufferedEnd / video.duration) * 100;
        addEvent(`📈 progress - Buffered: ${progress.toFixed(1)}%`);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Video Debugger</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Video Player */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-3">Video Player</h3>
          <div className="relative">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full max-w-md mx-auto rounded-lg shadow-lg"
              onLoadStart={handleLoadStart}
              onLoadedMetadata={handleLoadedMetadata}
              onLoadedData={handleLoadedData}
              onCanPlay={handleCanPlay}
              onCanPlayThrough={handleCanPlayThrough}
              onPlay={handlePlay}
              onPause={handlePause}
              onError={handleError}
              onStalled={handleStalled}
              onSuspend={handleSuspend}
              onWaiting={handleWaiting}
              onProgress={handleProgress}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Debug Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-3">Debug Information</h3>
          
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Video Details:</h4>
            <p><strong>Name:</strong> {videoName}</p>
            <p><strong>URL:</strong> {videoUrl}</p>
            <p><strong>Is Sample:</strong> {isSampleVideo ? 'Yes' : 'No'}</p>
          </div>

          {Object.keys(debugInfo).length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">Video Properties:</h4>
              {Object.entries(debugInfo).map(([key, value]) => (
                <p key={key}><strong>{key}:</strong> {String(value)}</p>
              ))}
            </div>
          )}

          <div className="mb-4">
            <h4 className="font-semibold mb-2">Events Log:</h4>
            <div className="max-h-40 overflow-y-auto bg-gray-100 p-3 rounded text-sm font-mono">
              {events.map((event, index) => (
                <div key={index} className="mb-1">{event}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
