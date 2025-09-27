'use client';

import React, { useState, useRef, useCallback } from 'react';
import SwingAnnotationTool from '@/components/coaching/SwingAnnotationTool';
import VoiceNoteRecorder from '@/components/coaching/VoiceNoteRecorder';
import LessonPlanManager from '@/components/coaching/LessonPlanManager';
import StudentProgressDashboard from '@/components/coaching/StudentProgressDashboard';
import type { SwingAnnotation } from '@/lib/coaching-features';
import type { VoiceNote } from '@/lib/coaching-features';
import type { LessonPlan } from '@/lib/coaching-features';
import type { StudentProgress } from '@/lib/coaching-features';

export default function TestCoachingFeaturesPage() {
  const [activeTab, setActiveTab] = useState<'annotations' | 'voice' | 'lessons' | 'progress'>('annotations');
  const [videoRef] = useState<React.RefObject<HTMLVideoElement>>(useRef<HTMLVideoElement>(null));
  const [annotations, setAnnotations] = useState<SwingAnnotation[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('student-1');
  const [coachingSession, setCoachingSession] = useState({
    id: 'session-1',
    coachId: 'coach-1',
    studentId: 'student-1',
    startTime: new Date(),
    status: 'in-progress' as const
  });

  // Handle annotation events
  const handleAnnotationAdd = useCallback((annotation: SwingAnnotation) => {
    setAnnotations(prev => [...prev, annotation]);
    console.log('Annotation added:', annotation);
  }, []);

  const handleAnnotationUpdate = useCallback((annotation: SwingAnnotation) => {
    setAnnotations(prev => prev.map(a => a.id === annotation.id ? annotation : a));
    console.log('Annotation updated:', annotation);
  }, []);

  const handleAnnotationDelete = useCallback((annotationId: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== annotationId));
    console.log('Annotation deleted:', annotationId);
  }, []);

  // Handle voice note events
  const handleVoiceNoteAdd = useCallback((voiceNote: VoiceNote) => {
    setVoiceNotes(prev => [...prev, voiceNote]);
    console.log('Voice note added:', voiceNote);
  }, []);

  const handleVoiceNoteUpdate = useCallback((voiceNote: VoiceNote) => {
    setVoiceNotes(prev => prev.map(vn => vn.id === voiceNote.id ? voiceNote : vn));
    console.log('Voice note updated:', voiceNote);
  }, []);

  const handleVoiceNoteDelete = useCallback((voiceNoteId: string) => {
    setVoiceNotes(prev => prev.filter(vn => vn.id !== voiceNoteId));
    console.log('Voice note deleted:', voiceNoteId);
  }, []);

  // Handle lesson plan events
  const handleLessonPlanCreate = useCallback((lessonPlan: LessonPlan) => {
    setLessonPlans(prev => [...prev, lessonPlan]);
    console.log('Lesson plan created:', lessonPlan);
  }, []);

  const handleLessonPlanUpdate = useCallback((lessonPlan: LessonPlan) => {
    setLessonPlans(prev => prev.map(lp => lp.id === lessonPlan.id ? lessonPlan : lp));
    console.log('Lesson plan updated:', lessonPlan);
  }, []);

  const handleLessonPlanDelete = useCallback((lessonPlanId: string) => {
    setLessonPlans(prev => prev.filter(lp => lp.id !== lessonPlanId));
    console.log('Lesson plan deleted:', lessonPlanId);
  }, []);

  const handleLessonPlanComplete = useCallback((lessonPlanId: string) => {
    setLessonPlans(prev => prev.map(lp => 
      lp.id === lessonPlanId 
        ? { ...lp, completedDate: new Date(), isActive: false }
        : lp
    ));
    console.log('Lesson plan completed:', lessonPlanId);
  }, []);

  // Handle progress events
  const handleProgressUpdate = useCallback((progress: StudentProgress) => {
    console.log('Progress updated:', progress);
  }, []);

  const handleMilestoneAdd = useCallback((milestone: any) => {
    console.log('Milestone added:', milestone);
  }, []);

  const handleGoalAdd = useCallback((goal: any) => {
    console.log('Goal added:', goal);
  }, []);

  // Mock data for demonstration
  const mockStudents = [
    { id: 'student-1', name: 'John Smith', level: 'Intermediate' },
    { id: 'student-2', name: 'Sarah Johnson', level: 'Beginner' },
    { id: 'student-3', name: 'Mike Davis', level: 'Advanced' }
  ];

  const mockCoachingStats = {
    totalSessions: 45,
    activeStudents: 12,
    completedLessons: 28,
    annotationsCreated: 156,
    voiceNotesRecorded: 89
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Professional Coaching Features
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="flex space-x-4 mb-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('annotations')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === 'annotations' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Swing Annotations
              </button>
              <button
                onClick={() => setActiveTab('voice')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === 'voice' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Voice Notes
              </button>
              <button
                onClick={() => setActiveTab('lessons')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === 'lessons' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Lesson Plans
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === 'progress' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Progress Dashboard
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'annotations' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Swing Annotation Tools</h3>
                  <SwingAnnotationTool
                    videoRef={videoRef}
                    onAnnotationAdd={handleAnnotationAdd}
                    onAnnotationUpdate={handleAnnotationUpdate}
                    onAnnotationDelete={handleAnnotationDelete}
                    className="h-96"
                  />
                </div>
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Voice Note Recording</h3>
                  <VoiceNoteRecorder
                    onVoiceNoteAdd={handleVoiceNoteAdd}
                    onVoiceNoteUpdate={handleVoiceNoteUpdate}
                    onVoiceNoteDelete={handleVoiceNoteDelete}
                    className="h-96"
                  />
                </div>
              </div>
            )}

            {activeTab === 'lessons' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Lesson Plan Management</h3>
                  <LessonPlanManager
                    onLessonPlanCreate={handleLessonPlanCreate}
                    onLessonPlanUpdate={handleLessonPlanUpdate}
                    onLessonPlanDelete={handleLessonPlanDelete}
                    onLessonPlanComplete={handleLessonPlanComplete}
                    className="h-96"
                  />
                </div>
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Student Progress Dashboard</h3>
                  <StudentProgressDashboard
                    studentId={selectedStudent}
                    onProgressUpdate={handleProgressUpdate}
                    onMilestoneAdd={handleMilestoneAdd}
                    onGoalAdd={handleGoalAdd}
                    className="h-96"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Coaching Stats */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Coaching Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Total Sessions:</span>
                  <span className="text-sm text-white">{mockCoachingStats.totalSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Active Students:</span>
                  <span className="text-sm text-white">{mockCoachingStats.activeStudents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Completed Lessons:</span>
                  <span className="text-sm text-white">{mockCoachingStats.completedLessons}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Annotations Created:</span>
                  <span className="text-sm text-white">{mockCoachingStats.annotationsCreated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Voice Notes:</span>
                  <span className="text-sm text-white">{mockCoachingStats.voiceNotesRecorded}</span>
                </div>
              </div>
            </div>

            {/* Student Selection */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Select Student</h3>
              <div className="space-y-2">
                {mockStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg ${
                      selectedStudent === student.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-medium">{student.name}</div>
                    <div className="text-xs opacity-75">{student.level}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Coaching Features */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Coaching Features</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Swing annotation tools for coaches</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Voice note recording for feedback</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Lesson plan integration</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Student progress dashboards</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Real-time collaboration</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Progress tracking and analytics</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('annotations')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  Create Annotation
                </button>
                <button
                  onClick={() => setActiveTab('voice')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  Record Voice Note
                </button>
                <button
                  onClick={() => setActiveTab('lessons')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  Create Lesson Plan
                </button>
                <button
                  onClick={() => setActiveTab('progress')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  View Progress
                </button>
              </div>
            </div>

            {/* Current Session */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Current Session</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Student:</span>
                  <span className="text-white">
                    {mockStudents.find(s => s.id === selectedStudent)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Start Time:</span>
                  <span className="text-white">
                    {coachingSession.startTime.toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Status:</span>
                  <span className="text-white">{coachingSession.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Annotations:</span>
                  <span className="text-white">{annotations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Voice Notes:</span>
                  <span className="text-white">{voiceNotes.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
