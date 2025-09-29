'use client';

import React from 'react';

interface SimpleVideoInfoProps {
  videoUrl: string;
  videoName: string;
  isSampleVideo: boolean;
}

export default function SimpleVideoInfo({ videoUrl, videoName, isSampleVideo }: SimpleVideoInfoProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
      <h4 className="font-semibold text-gray-700 mb-2">Video Information</h4>
      <div className="text-sm text-gray-600 space-y-1">
        <p><strong>Name:</strong> {videoName}</p>
        <p><strong>Type:</strong> {isSampleVideo ? 'Sample Video' : 'User Upload'}</p>
        <p><strong>URL:</strong> {videoUrl.substring(0, 50)}...</p>
        <p><strong>Status:</strong> Ready for analysis</p>
      </div>
    </div>
  );
}



