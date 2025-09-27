'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { LessonPlanManager as LessonPlanManagerClass, type LessonPlan, type LessonExercise } from '@/lib/coaching-features';

export interface LessonPlanManagerProps {
  onLessonPlanCreate?: (lessonPlan: LessonPlan) => void;
  onLessonPlanUpdate?: (lessonPlan: LessonPlan) => void;
  onLessonPlanDelete?: (lessonPlanId: string) => void;
  onLessonPlanComplete?: (lessonPlanId: string) => void;
  className?: string;
}

export default function LessonPlanManager({
  onLessonPlanCreate,
  onLessonPlanUpdate,
  onLessonPlanDelete,
  onLessonPlanComplete,
  className = ''
}: LessonPlanManagerProps) {
  const [lessonPlanManager] = useState(() => new LessonPlanManagerClass());
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [selectedLessonPlan, setSelectedLessonPlan] = useState<LessonPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'active' | 'completed' | 'scheduled'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState<Partial<LessonPlan>>({
    title: '',
    description: '',
    objectives: [],
    exercises: [],
    duration: 60,
    difficulty: 'beginner',
    focusAreas: [],
    equipment: [],
    prerequisites: [],
    expectedOutcomes: [],
    notes: '',
    isActive: true
  });

  // Load lesson plans
  useEffect(() => {
    const plans = lessonPlanManager.getAllLessonPlans();
    setLessonPlans(plans);
  }, [lessonPlanManager]);

  // Handle create lesson plan
  const handleCreateLessonPlan = useCallback(() => {
    setIsCreating(true);
    setFormData({
      title: '',
      description: '',
      objectives: [],
      exercises: [],
      duration: 60,
      difficulty: 'beginner',
      focusAreas: [],
      equipment: [],
      prerequisites: [],
      expectedOutcomes: [],
      notes: '',
      isActive: true
    });
  }, []);

  // Handle edit lesson plan
  const handleEditLessonPlan = useCallback((lessonPlan: LessonPlan) => {
    setSelectedLessonPlan(lessonPlan);
    setIsEditing(true);
    setFormData(lessonPlan);
  }, []);

  // Handle view lesson plan
  const handleViewLessonPlan = useCallback((lessonPlan: LessonPlan) => {
    setSelectedLessonPlan(lessonPlan);
    setIsViewing(true);
  }, []);

  // Handle delete lesson plan
  const handleDeleteLessonPlan = useCallback((lessonPlanId: string) => {
    if (confirm('Are you sure you want to delete this lesson plan?')) {
      lessonPlanManager.deleteLessonPlan(lessonPlanId);
      setLessonPlans(prev => prev.filter(lp => lp.id !== lessonPlanId));
      onLessonPlanDelete?.(lessonPlanId);
    }
  }, [lessonPlanManager, onLessonPlanDelete]);

  // Handle complete lesson plan
  const handleCompleteLessonPlan = useCallback((lessonPlanId: string) => {
    lessonPlanManager.completeLessonPlan(lessonPlanId);
    setLessonPlans(prev => prev.map(lp => 
      lp.id === lessonPlanId 
        ? { ...lp, completedDate: new Date(), isActive: false }
        : lp
    ));
    onLessonPlanComplete?.(lessonPlanId);
  }, [lessonPlanManager, onLessonPlanComplete]);

  // Handle save lesson plan
  const handleSaveLessonPlan = useCallback(() => {
    if (isCreating) {
      const lessonPlanId = lessonPlanManager.createLessonPlan(formData as Omit<LessonPlan, 'id' | 'createdAt' | 'updatedAt'>);
      const newLessonPlan = lessonPlanManager.getLessonPlan(lessonPlanId);
      if (newLessonPlan) {
        setLessonPlans(prev => [...prev, newLessonPlan]);
        onLessonPlanCreate?.(newLessonPlan);
      }
    } else if (isEditing && selectedLessonPlan) {
      lessonPlanManager.updateLessonPlan(selectedLessonPlan.id, formData);
      const updatedLessonPlan = lessonPlanManager.getLessonPlan(selectedLessonPlan.id);
      if (updatedLessonPlan) {
        setLessonPlans(prev => prev.map(lp => lp.id === selectedLessonPlan.id ? updatedLessonPlan : lp));
        onLessonPlanUpdate?.(updatedLessonPlan);
      }
    }
    
    setIsCreating(false);
    setIsEditing(false);
    setSelectedLessonPlan(null);
    setFormData({});
  }, [isCreating, isEditing, selectedLessonPlan, formData, lessonPlanManager, onLessonPlanCreate, onLessonPlanUpdate]);

  // Handle add objective
  const handleAddObjective = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      objectives: [...(prev.objectives || []), '']
    }));
  }, []);

  // Handle update objective
  const handleUpdateObjective = useCallback((index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives?.map((obj, i) => i === index ? value : obj) || []
    }));
  }, []);

  // Handle remove objective
  const handleRemoveObjective = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives?.filter((_, i) => i !== index) || []
    }));
  }, []);

  // Handle add exercise
  const handleAddExercise = useCallback(() => {
    const newExercise: LessonExercise = {
      id: `exercise_${Date.now()}`,
      name: '',
      description: '',
      instructions: [],
      duration: 10,
      repetitions: 1,
      focusArea: '',
      difficulty: 'easy',
      equipment: [],
      notes: '',
      isCompleted: false
    };
    
    setFormData(prev => ({
      ...prev,
      exercises: [...(prev.exercises || []), newExercise]
    }));
  }, []);

  // Handle update exercise
  const handleUpdateExercise = useCallback((index: number, updates: Partial<LessonExercise>) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises?.map((ex, i) => i === index ? { ...ex, ...updates } : ex) || []
    }));
  }, []);

  // Handle remove exercise
  const handleRemoveExercise = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises?.filter((_, i) => i !== index) || []
    }));
  }, []);

  // Filter lesson plans
  const filteredLessonPlans = lessonPlans.filter(plan => {
    const matchesCategory = filterCategory === 'all' || 
      (filterCategory === 'active' && plan.isActive) ||
      (filterCategory === 'completed' && plan.completedDate) ||
      (filterCategory === 'scheduled' && plan.scheduledDate);
    
    const matchesSearch = !searchTerm || 
      plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'professional': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (plan: LessonPlan) => {
    if (plan.completedDate) return 'bg-green-100 text-green-800';
    if (plan.scheduledDate && plan.scheduledDate > new Date()) return 'bg-blue-100 text-blue-800';
    if (plan.isActive) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (plan: LessonPlan) => {
    if (plan.completedDate) return 'Completed';
    if (plan.scheduledDate && plan.scheduledDate > new Date()) return 'Scheduled';
    if (plan.isActive) return 'Active';
    return 'Inactive';
  };

  return (
    <div className={`bg-gray-800 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Lesson Plans</h3>
          <button
            onClick={handleCreateLessonPlan}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create New Plan
          </button>
        </div>

        {/* Filters */}
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">Filter:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as typeof filterCategory)}
              className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
            >
              <option value="all">All Plans</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search lesson plans..."
              className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Lesson Plans List */}
      <div className="p-4">
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {filteredLessonPlans.map(plan => (
            <div key={plan.id} className="p-3 bg-gray-700 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-md font-medium text-white">{plan.title}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(plan.difficulty)}`}>
                      {plan.difficulty}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(plan)}`}>
                      {getStatusText(plan)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-2">{plan.description}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span>Duration: {plan.duration} min</span>
                    <span>Exercises: {plan.exercises.length}</span>
                    <span>Focus: {plan.focusAreas.join(', ')}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewLessonPlan(plan)}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEditLessonPlan(plan)}
                    className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                  >
                    Edit
                  </button>
                  {plan.isActive && (
                    <button
                      onClick={() => handleCompleteLessonPlan(plan.id)}
                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    >
                      Complete
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteLessonPlan(plan.id)}
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

      {/* Create/Edit Modal */}
      {(isCreating || isEditing) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">
              {isCreating ? 'Create Lesson Plan' : 'Edit Lesson Plan'}
            </h3>
            
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Title:</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Duration (minutes):</label>
                  <input
                    type="number"
                    value={formData.duration || 60}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">Description:</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Difficulty:</label>
                  <select
                    value={formData.difficulty || 'beginner'}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="professional">Professional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Focus Areas:</label>
                  <input
                    type="text"
                    value={formData.focusAreas?.join(', ') || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, focusAreas: e.target.value.split(',').map(s => s.trim()).filter(s => s) }))}
                    placeholder="e.g., grip, stance, follow-through"
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              
              {/* Objectives */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm text-gray-300">Objectives:</label>
                  <button
                    onClick={handleAddObjective}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  >
                    Add Objective
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.objectives?.map((objective, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={objective}
                        onChange={(e) => handleUpdateObjective(index, e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                        placeholder="Enter objective..."
                      />
                      <button
                        onClick={() => handleRemoveObjective(index)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Exercises */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm text-gray-300">Exercises:</label>
                  <button
                    onClick={handleAddExercise}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  >
                    Add Exercise
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.exercises?.map((exercise, index) => (
                    <div key={exercise.id} className="p-3 bg-gray-700 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">Name:</label>
                          <input
                            type="text"
                            value={exercise.name}
                            onChange={(e) => handleUpdateExercise(index, { name: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">Duration (min):</label>
                          <input
                            type="number"
                            value={exercise.duration}
                            onChange={(e) => handleUpdateExercise(index, { duration: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <label className="block text-sm text-gray-300 mb-1">Description:</label>
                        <textarea
                          value={exercise.description}
                          onChange={(e) => handleUpdateExercise(index, { description: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
                          rows={2}
                        />
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => handleRemoveExercise(index)}
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        >
                          Remove Exercise
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Notes:</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                  setFormData({});
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLessonPlan}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isCreating ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewing && selectedLessonPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">{selectedLessonPlan.title}</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-md font-medium text-white mb-2">Description</h4>
                <p className="text-sm text-gray-300">{selectedLessonPlan.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Duration</h4>
                  <p className="text-sm text-gray-300">{selectedLessonPlan.duration} minutes</p>
                </div>
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Difficulty</h4>
                  <p className="text-sm text-gray-300">{selectedLessonPlan.difficulty}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-white mb-2">Objectives</h4>
                <ul className="text-sm text-gray-300 list-disc list-inside">
                  {selectedLessonPlan.objectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-white mb-2">Exercises</h4>
                <div className="space-y-2">
                  {selectedLessonPlan.exercises.map((exercise, index) => (
                    <div key={exercise.id} className="p-3 bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="text-sm font-medium text-white">{exercise.name}</h5>
                          <p className="text-xs text-gray-300">{exercise.description}</p>
                          <p className="text-xs text-gray-400">Duration: {exercise.duration} min</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(exercise.difficulty)}`}>
                          {exercise.difficulty}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setIsViewing(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
