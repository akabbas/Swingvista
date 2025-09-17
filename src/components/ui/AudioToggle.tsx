"use client";

import React, { useState, useCallback } from 'react';

interface AudioToggleProps {
  isMuted: boolean;
  onToggle: (muted: boolean) => void;
  className?: string;
}

const AudioToggle: React.FC<AudioToggleProps> = ({
  isMuted,
  onToggle,
  className = ""
}) => {
  const handleToggle = useCallback(() => {
    onToggle(!isMuted);
  }, [isMuted, onToggle]);

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
        isMuted
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'bg-green-100 text-green-700 hover:bg-green-200'
      } ${className}`}
      title={isMuted ? 'Unmute audio' : 'Mute audio'}
    >
      <span className="text-lg">
        {isMuted ? '🔇' : '🔊'}
      </span>
      <span className="text-sm font-medium">
        {isMuted ? 'Muted' : 'Audio On'}
      </span>
    </button>
  );
};

export default AudioToggle;
