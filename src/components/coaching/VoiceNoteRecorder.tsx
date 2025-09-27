'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { VoiceNoteManager, type VoiceNote } from '@/lib/coaching-features';

export interface VoiceNoteRecorderProps {
  onVoiceNoteAdd?: (voiceNote: VoiceNote) => void;
  onVoiceNoteUpdate?: (voiceNote: VoiceNote) => void;
  onVoiceNoteDelete?: (voiceNoteId: string) => void;
  className?: string;
}

export default function VoiceNoteRecorder({
  onVoiceNoteAdd,
  onVoiceNoteUpdate,
  onVoiceNoteDelete,
  className = ''
}: VoiceNoteRecorderProps) {
  const [voiceNoteManager] = useState(() => new VoiceNoteManager());
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [selectedVoiceNote, setSelectedVoiceNote] = useState<VoiceNote | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'feedback' | 'instruction' | 'encouragement' | 'correction' | 'general'>('feedback');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const audioRef = useRef<HTMLAudioElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle recording start
  const handleStartRecording = useCallback(async () => {
    try {
      await voiceNoteManager.startRecording();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [voiceNoteManager]);

  // Handle recording stop
  const handleStopRecording = useCallback(async () => {
    try {
      const voiceNote = await voiceNoteManager.stopRecording();
      setVoiceNotes(prev => [...prev, voiceNote]);
      setIsRecording(false);
      setRecordingTime(0);
      
      // Clear recording timer
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      onVoiceNoteAdd?.(voiceNote);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, [voiceNoteManager, onVoiceNoteAdd]);

  // Handle play voice note
  const handlePlayVoiceNote = useCallback((voiceNote: VoiceNote) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    voiceNoteManager.playVoiceNote(voiceNote);
    setIsPlaying(true);
    setSelectedVoiceNote(voiceNote);
    
    // Auto-stop playing after duration
    setTimeout(() => {
      setIsPlaying(false);
    }, voiceNote.duration);
  }, [voiceNoteManager]);

  // Handle transcribe voice note
  const handleTranscribeVoiceNote = useCallback(async (voiceNote: VoiceNote) => {
    setIsTranscribing(true);
    try {
      const transcriptText = await voiceNoteManager.transcribeVoiceNote(voiceNote);
      setTranscript(transcriptText);
      
      // Update voice note with transcript
      const updatedVoiceNote = { ...voiceNote, transcript: transcriptText };
      setVoiceNotes(prev => prev.map(vn => vn.id === voiceNote.id ? updatedVoiceNote : vn));
      onVoiceNoteUpdate?.(updatedVoiceNote);
    } catch (error) {
      console.error('Failed to transcribe:', error);
    } finally {
      setIsTranscribing(false);
    }
  }, [voiceNoteManager, onVoiceNoteUpdate]);

  // Handle delete voice note
  const handleDeleteVoiceNote = useCallback((voiceNoteId: string) => {
    setVoiceNotes(prev => prev.filter(vn => vn.id !== voiceNoteId));
    onVoiceNoteDelete?.(voiceNoteId);
  }, [onVoiceNoteDelete]);

  // Handle edit voice note
  const handleEditVoiceNote = useCallback((voiceNote: VoiceNote) => {
    setSelectedVoiceNote(voiceNote);
    setIsEditing(true);
    setEditContent(voiceNote.transcript || '');
  }, []);

  // Handle save edit
  const handleSaveEdit = useCallback(() => {
    if (selectedVoiceNote) {
      const updatedVoiceNote = { ...selectedVoiceNote, transcript: editContent };
      setVoiceNotes(prev => prev.map(vn => vn.id === selectedVoiceNote.id ? updatedVoiceNote : vn));
      onVoiceNoteUpdate?.(updatedVoiceNote);
      setIsEditing(false);
    }
  }, [selectedVoiceNote, editContent, onVoiceNoteUpdate]);

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-orange-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feedback': return 'bg-blue-100 text-blue-800';
      case 'instruction': return 'bg-green-100 text-green-800';
      case 'encouragement': return 'bg-yellow-100 text-yellow-800';
      case 'correction': return 'bg-red-100 text-red-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className={`bg-gray-800 rounded-lg ${className}`}>
      {/* Recording Controls */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Voice Notes</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-300">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as typeof selectedCategory)}
                className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
              >
                <option value="feedback">Feedback</option>
                <option value="instruction">Instruction</option>
                <option value="encouragement">Encouragement</option>
                <option value="correction">Correction</option>
                <option value="general">General</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-300">Priority:</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as typeof selectedPriority)}
                className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4">
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-all"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="w-16 h-16 bg-gray-600 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-all"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z"/>
              </svg>
            </button>
          )}
          
          {isRecording && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-white">Recording: {formatTime(recordingTime)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Voice Notes List */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-md font-semibold text-white">Recorded Notes ({voiceNotes.length})</h4>
          <div className="flex space-x-2">
            <select className="px-3 py-1 bg-gray-700 text-white rounded text-sm">
              <option value="all">All Categories</option>
              <option value="feedback">Feedback</option>
              <option value="instruction">Instruction</option>
              <option value="encouragement">Encouragement</option>
              <option value="correction">Correction</option>
              <option value="general">General</option>
            </select>
            <select className="px-3 py-1 bg-gray-700 text-white rounded text-sm">
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {voiceNotes.map(voiceNote => (
            <div
              key={voiceNote.id}
              className={`p-3 rounded-lg border ${
                selectedVoiceNote?.id === voiceNote.id
                  ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                  : 'border-gray-600 bg-gray-700'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(voiceNote.category)}`}>
                      {voiceNote.category}
                    </span>
                    <span className={`text-xs ${getPriorityColor(voiceNote.priority)}`}>
                      {voiceNote.priority.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(Math.floor(voiceNote.duration / 1000))}
                    </span>
                  </div>
                  
                  {voiceNote.transcript && (
                    <p className="text-sm text-gray-300 mb-2">{voiceNote.transcript}</p>
                  )}
                  
                  <div className="text-xs text-gray-400">
                    {voiceNote.createdAt.toLocaleString()}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePlayVoiceNote(voiceNote)}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  >
                    {isPlaying && selectedVoiceNote?.id === voiceNote.id ? '⏸️' : '▶️'}
                  </button>
                  
                  {!voiceNote.transcript && (
                    <button
                      onClick={() => handleTranscribeVoiceNote(voiceNote)}
                      disabled={isTranscribing}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isTranscribing ? '...' : 'Transcribe'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleEditVoiceNote(voiceNote)}
                    className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                  >
                    Edit
                  </button>
                  
                  <button
                    onClick={() => handleDeleteVoiceNote(voiceNote.id)}
                    className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && selectedVoiceNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Voice Note</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Transcript:</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Audio Element */}
      <audio ref={audioRef} />
    </div>
  );
}
