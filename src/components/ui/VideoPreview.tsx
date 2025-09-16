import React, { useEffect, useRef } from 'react';

interface VideoPreviewProps {
  file: File | null;
  className?: string;
}

export default function VideoPreview({ file, className = '' }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!file || !videoRef.current) return;
    
    // Create object URL for the video file
    const objectUrl = URL.createObjectURL(file);
    videoRef.current.src = objectUrl;
    
    // Clean up object URL when component unmounts or file changes
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!file) return null;

  return (
    <div className={`relative rounded-lg overflow-hidden shadow-lg ${className}`}>
      <video
        ref={videoRef}
        controls
        playsInline
        className="w-full max-h-[400px] object-contain bg-black"
        controlsList="nodownload"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
