'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { StudentProgressManager, type StudentProgress, type ProgressMilestone, type SessionSummary, type StudentGoal } from '@/lib/coaching-features';

export interface StudentProgressDashboardProps {
  studentId: string;
  onProgressUpdate?: (progress: StudentProgress) => void;
  onMilestoneAdd?: (milestone: ProgressMilestone) => void;
  onGoalAdd?: (goal: StudentGoal) => void;
  className?: string;
}

export default function StudentProgressDashboard({
  studentId,
  onProgressUpdate,
  onMilestoneAdd,
  onGoalAdd,
  className = ''
}: StudentProgressDashboardProps) {
  const [progressManager] = useState(() => new StudentProgressManager());
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [milestoneForm, setMilestoneForm] = useState<Partial<ProgressMilestone>>({});
  const [goalForm, setGoalForm] = useState<Partial<StudentGoal>>({});
  const [sessionForm, setSessionForm] = useState<Partial<SessionSummary>>({});

  // Load progress data
  useEffect(() => {
    const progressData = progressManager.getStudentProgress(studentId);
    setProgress(progressData);
  }, [studentId, progressManager]);

  // Handle add milestone
  const handleAddMilestone = useCallback(() => {
    if (milestoneForm.title && milestoneForm.description) {
      const milestoneId = progressManager.addMilestone(studentId, {
        title: milestoneForm.title,
        description: milestoneForm.description,
        achievedAt: new Date(),
        metric: milestoneForm.metric || 'overall',
        value: milestoneForm.value || 0,
        category: milestoneForm.category || 'technique'
      });
      
      if (milestoneId) {
        const updatedProgress = progressManager.getStudentProgress(studentId);
        setProgress(updatedProgress);
        onMilestoneAdd?.(updatedProgress?.milestones.find(m => m.id === milestoneId)!);
        setIsAddingMilestone(false);
        setMilestoneForm({});
      }
    }
  }, [studentId, milestoneForm, progressManager, onMilestoneAdd]);

  // Handle add goal
  const handleAddGoal = useCallback(() => {
    if (goalForm.title && goalForm.description) {
      const goalId = progressManager.addGoal(studentId, {
        title: goalForm.title,
        description: goalForm.description,
        targetValue: goalForm.targetValue || 0,
        currentValue: goalForm.currentValue || 0,
        unit: goalForm.unit || 'score',
        deadline: goalForm.deadline || new Date(),
        isAchieved: false,
        category: goalForm.category || 'score'
      });
      
      if (goalId) {
        const updatedProgress = progressManager.getStudentProgress(studentId);
        setProgress(updatedProgress);
        onGoalAdd?.(updatedProgress?.goals.find(g => g.id === goalId)!);
        setIsAddingGoal(false);
        setGoalForm({});
      }
    }
  }, [studentId, goalForm, progressManager, onGoalAdd]);

  // Handle add session
  const handleAddSession = useCallback(() => {
    if (sessionForm.date && sessionForm.score !== undefined) {
      const sessionId = progressManager.addSessionSummary(studentId, {
        date: sessionForm.date,
        duration: sessionForm.duration || 60,
        score: sessionForm.score,
        focusAreas: sessionForm.focusAreas || [],
        improvements: sessionForm.improvements || [],
        challenges: sessionForm.challenges || [],
        nextSteps: sessionForm.nextSteps || [],
        annotations: sessionForm.annotations || 0,
        voiceNotes: sessionForm.voiceNotes || 0,
        lessonPlanId: sessionForm.lessonPlanId
      });
      
      if (sessionId) {
        const updatedProgress = progressManager.getStudentProgress(studentId);
        setProgress(updatedProgress);
        onProgressUpdate?.(updatedProgress!);
        setIsAddingSession(false);
        setSessionForm({});
      }
    }
  }, [studentId, sessionForm, progressManager, onProgressUpdate]);

  // Calculate progress trends
  const progressTrends = progress ? progressManager.calculateProgressTrends(studentId) : null;

  // Get recent sessions
  const recentSessions = progress?.sessionHistory.slice(-5) || [];

  // Get active goals
  const activeGoals = progress?.goals.filter(g => !g.isAchieved) || [];

  // Get recent milestones
  const recentMilestones = progress?.milestones.slice(-3) || [];

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-500';
      case 'declining': return 'text-red-500';
      case 'stable': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  };

  const getGoalProgress = (goal: StudentGoal) => {
    return Math.min(100, (goal.currentValue / goal.targetValue) * 100);
  };

  const getGoalColor = (goal: StudentGoal) => {
    const progress = getGoalProgress(goal);
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!progress) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-400">
          <p>No progress data available for this student.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Student Progress Dashboard</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsAddingMilestone(true)}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Add Milestone
            </button>
            <button
              onClick={() => setIsAddingGoal(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Add Goal
            </button>
            <button
              onClick={() => setIsAddingSession(true)}
              className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
            >
              Add Session
            </button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex space-x-2">
          {(['week', 'month', 'quarter', 'year'] as const).map(range => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-3 py-1 rounded text-sm ${
                selectedTimeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="p-4 border-b border-gray-700">
        <h4 className="text-md font-semibold text-white mb-4">Progress Overview</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-2xl font-bold text-white">{progress.overallScore.toFixed(1)}</div>
            <div className="text-sm text-gray-400">Overall Score</div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-2xl font-bold text-white">{progress.milestones.length}</div>
            <div className="text-sm text-gray-400">Milestones</div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-2xl font-bold text-white">{progress.sessionHistory.length}</div>
            <div className="text-sm text-gray-400">Sessions</div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-2xl font-bold text-white">{activeGoals.length}</div>
            <div className="text-sm text-gray-400">Active Goals</div>
          </div>
        </div>

        {/* Progress Trend */}
        {progressTrends && (
          <div className="mt-4 p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getTrendIcon(progressTrends.overallTrend)}</span>
              <span className="text-sm text-gray-300">
                Progress Trend: <span className={getTrendColor(progressTrends.overallTrend)}>
                  {progressTrends.overallTrend.toUpperCase()}
                </span>
              </span>
              <span className="text-sm text-gray-400">
                ({progressTrends.scoreChange > 0 ? '+' : ''}{progressTrends.scoreChange.toFixed(1)})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Recent Sessions */}
      <div className="p-4 border-b border-gray-700">
        <h4 className="text-md font-semibold text-white mb-4">Recent Sessions</h4>
        
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {recentSessions.map(session => (
            <div key={session.id} className="flex justify-between items-center p-2 bg-gray-700 rounded">
              <div>
                <div className="text-sm text-white">{session.date.toLocaleDateString()}</div>
                <div className="text-xs text-gray-400">
                  {session.duration} min • {session.focusAreas.join(', ')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">{session.score.toFixed(1)}</div>
                <div className="text-xs text-gray-400">
                  {session.annotations} annotations • {session.voiceNotes} voice notes
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Goals */}
      <div className="p-4 border-b border-gray-700">
        <h4 className="text-md font-semibold text-white mb-4">Active Goals</h4>
        
        <div className="space-y-3">
          {activeGoals.map(goal => (
            <div key={goal.id} className="p-3 bg-gray-700 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h5 className="text-sm font-medium text-white">{goal.title}</h5>
                  <p className="text-xs text-gray-400">{goal.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white">
                    {goal.currentValue} / {goal.targetValue} {goal.unit}
                  </div>
                  <div className="text-xs text-gray-400">
                    Due: {goal.deadline.toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getGoalColor(goal)}`}
                  style={{ width: `${getGoalProgress(goal)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Milestones */}
      <div className="p-4">
        <h4 className="text-md font-semibold text-white mb-4">Recent Milestones</h4>
        
        <div className="space-y-2">
          {recentMilestones.map(milestone => (
            <div key={milestone.id} className="p-3 bg-gray-700 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="text-sm font-medium text-white">{milestone.title}</h5>
                  <p className="text-xs text-gray-400">{milestone.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">
                    {milestone.achievedAt.toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-400">
                    {milestone.metric}: {milestone.value}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Milestone Modal */}
      {isAddingMilestone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Add Milestone</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Title:</label>
                <input
                  type="text"
                  value={milestoneForm.title || ''}
                  onChange={(e) => setMilestoneForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">Description:</label>
                <textarea
                  value={milestoneForm.description || ''}
                  onChange={(e) => setMilestoneForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Metric:</label>
                  <input
                    type="text"
                    value={milestoneForm.metric || ''}
                    onChange={(e) => setMilestoneForm(prev => ({ ...prev, metric: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Value:</label>
                  <input
                    type="number"
                    value={milestoneForm.value || ''}
                    onChange={(e) => setMilestoneForm(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">Category:</label>
                <select
                  value={milestoneForm.category || 'technique'}
                  onChange={(e) => setMilestoneForm(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="technique">Technique</option>
                  <option value="consistency">Consistency</option>
                  <option value="power">Power</option>
                  <option value="accuracy">Accuracy</option>
                  <option value="mental">Mental</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setIsAddingMilestone(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMilestone}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add Milestone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {isAddingGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Add Goal</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Title:</label>
                <input
                  type="text"
                  value={goalForm.title || ''}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">Description:</label>
                <textarea
                  value={goalForm.description || ''}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Current Value:</label>
                  <input
                    type="number"
                    value={goalForm.currentValue || ''}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, currentValue: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Target Value:</label>
                  <input
                    type="number"
                    value={goalForm.targetValue || ''}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, targetValue: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Unit:</label>
                  <input
                    type="text"
                    value={goalForm.unit || ''}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Deadline:</label>
                  <input
                    type="date"
                    value={goalForm.deadline ? goalForm.deadline.toISOString().split('T')[0] : ''}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, deadline: new Date(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setIsAddingGoal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGoal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Session Modal */}
      {isAddingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Add Session</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Date:</label>
                <input
                  type="date"
                  value={sessionForm.date ? sessionForm.date.toISOString().split('T')[0] : ''}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, date: new Date(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Duration (min):</label>
                  <input
                    type="number"
                    value={sessionForm.duration || ''}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Score:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sessionForm.score || ''}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, score: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">Focus Areas:</label>
                <input
                  type="text"
                  value={sessionForm.focusAreas?.join(', ') || ''}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, focusAreas: e.target.value.split(',').map(s => s.trim()).filter(s => s) }))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., grip, stance, follow-through"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">Improvements:</label>
                <textarea
                  value={sessionForm.improvements?.join('\n') || ''}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, improvements: e.target.value.split('\n').filter(s => s) }))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setIsAddingSession(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSession}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Add Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
