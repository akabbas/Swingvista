'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { SwingAnnotationManager, type SwingAnnotation } from '@/lib/coaching-features';

export interface SwingAnnotationToolProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onAnnotationAdd?: (annotation: SwingAnnotation) => void;
  onAnnotationUpdate?: (annotation: SwingAnnotation) => void;
  onAnnotationDelete?: (annotationId: string) => void;
  className?: string;
}

export default function SwingAnnotationTool({
  videoRef,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete,
  className = ''
}: SwingAnnotationToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [annotationManager, setAnnotationManager] = useState<SwingAnnotationManager | null>(null);
  const [selectedTool, setSelectedTool] = useState<'arrow' | 'circle' | 'rectangle' | 'line' | 'text' | 'highlight'>('arrow');
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const [selectedSize, setSelectedSize] = useState(20);
  const [selectedOpacity, setSelectedOpacity] = useState(0.8);
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [selectedCategory, setSelectedCategory] = useState<'technique' | 'timing' | 'posture' | 'grip' | 'stance' | 'follow-through' | 'general'>('general');
  const [annotations, setAnnotations] = useState<SwingAnnotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<SwingAnnotation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  // Initialize annotation manager
  useEffect(() => {
    if (canvasRef.current) {
      const manager = new SwingAnnotationManager(canvasRef.current);
      setAnnotationManager(manager);
    }
  }, []);

  // Handle annotation events
  useEffect(() => {
    if (annotationManager) {
      // Listen for annotation events
      const handleAnnotationAdd = (annotation: SwingAnnotation) => {
        setAnnotations(prev => [...prev, annotation]);
        onAnnotationAdd?.(annotation);
      };

      const handleAnnotationUpdate = (annotation: SwingAnnotation) => {
        setAnnotations(prev => prev.map(a => a.id === annotation.id ? annotation : a));
        onAnnotationUpdate?.(annotation);
      };

      const handleAnnotationDelete = (annotationId: string) => {
        setAnnotations(prev => prev.filter(a => a.id !== annotationId));
        onAnnotationDelete?.(annotationId);
      };

      // These would be connected to the annotation manager events
      // For now, we'll handle them through the UI
    }
  }, [annotationManager, onAnnotationAdd, onAnnotationUpdate, onAnnotationDelete]);

  // Handle tool selection
  const handleToolSelect = useCallback((tool: typeof selectedTool) => {
    setSelectedTool(tool);
    setSelectedAnnotation(null);
    setIsEditing(false);
  }, []);

  // Handle color selection
  const handleColorSelect = useCallback((color: string) => {
    setSelectedColor(color);
  }, []);

  // Handle size change
  const handleSizeChange = useCallback((size: number) => {
    setSelectedSize(size);
  }, []);

  // Handle opacity change
  const handleOpacityChange = useCallback((opacity: number) => {
    setSelectedOpacity(opacity);
  }, []);

  // Handle priority change
  const handlePriorityChange = useCallback((priority: typeof selectedPriority) => {
    setSelectedPriority(priority);
  }, []);

  // Handle category change
  const handleCategoryChange = useCallback((category: typeof selectedCategory) => {
    setSelectedCategory(category);
  }, []);

  // Handle annotation selection
  const handleAnnotationSelect = useCallback((annotation: SwingAnnotation) => {
    setSelectedAnnotation(annotation);
    setIsEditing(false);
  }, []);

  // Handle annotation edit
  const handleAnnotationEdit = useCallback((annotation: SwingAnnotation) => {
    setSelectedAnnotation(annotation);
    setIsEditing(true);
    setEditText(annotation.content);
  }, []);

  // Handle annotation delete
  const handleAnnotationDelete = useCallback((annotationId: string) => {
    if (annotationManager) {
      annotationManager.deleteAnnotation(annotationId);
      setAnnotations(prev => prev.filter(a => a.id !== annotationId));
      onAnnotationDelete?.(annotationId);
    }
  }, [annotationManager, onAnnotationDelete]);

  // Handle text edit
  const handleTextEdit = useCallback(() => {
    if (selectedAnnotation && annotationManager) {
      const updatedAnnotation = {
        ...selectedAnnotation,
        content: editText
      };
      
      annotationManager.updateAnnotation(selectedAnnotation.id, updatedAnnotation);
      setAnnotations(prev => prev.map(a => a.id === selectedAnnotation.id ? updatedAnnotation : a));
      onAnnotationUpdate?.(updatedAnnotation);
      setIsEditing(false);
    }
  }, [selectedAnnotation, editText, annotationManager, onAnnotationUpdate]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    if (annotationManager) {
      annotationManager.clearAnnotations();
      setAnnotations([]);
    }
  }, [annotationManager]);

  // Handle filter by category
  const handleFilterByCategory = useCallback((category: string) => {
    if (category === 'all') {
      setAnnotations(annotationManager?.getAllAnnotations() || []);
    } else {
      setAnnotations(annotationManager?.getAnnotationsByCategory(category) || []);
    }
  }, [annotationManager]);

  // Handle filter by priority
  const handleFilterByPriority = useCallback((priority: string) => {
    if (priority === 'all') {
      setAnnotations(annotationManager?.getAllAnnotations() || []);
    } else {
      setAnnotations(annotationManager?.getAnnotationsByPriority(priority) || []);
    }
  }, [annotationManager]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-orange-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technique': return 'bg-blue-100 text-blue-800';
      case 'timing': return 'bg-green-100 text-green-800';
      case 'posture': return 'bg-purple-100 text-purple-800';
      case 'grip': return 'bg-yellow-100 text-yellow-800';
      case 'stance': return 'bg-pink-100 text-pink-800';
      case 'follow-through': return 'bg-indigo-100 text-indigo-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex flex-wrap items-center space-x-4 mb-4">
          {/* Tool Selection */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleToolSelect('arrow')}
              className={`px-3 py-2 rounded-lg ${
                selectedTool === 'arrow' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              →
            </button>
            <button
              onClick={() => handleToolSelect('circle')}
              className={`px-3 py-2 rounded-lg ${
                selectedTool === 'circle' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              ○
            </button>
            <button
              onClick={() => handleToolSelect('rectangle')}
              className={`px-3 py-2 rounded-lg ${
                selectedTool === 'rectangle' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              □
            </button>
            <button
              onClick={() => handleToolSelect('line')}
              className={`px-3 py-2 rounded-lg ${
                selectedTool === 'line' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              —
            </button>
            <button
              onClick={() => handleToolSelect('text')}
              className={`px-3 py-2 rounded-lg ${
                selectedTool === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              T
            </button>
            <button
              onClick={() => handleToolSelect('highlight')}
              className={`px-3 py-2 rounded-lg ${
                selectedTool === 'highlight' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              ●
            </button>
          </div>

          {/* Color Selection */}
          <div className="flex space-x-2">
            {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff'].map(color => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className={`w-8 h-8 rounded-full border-2 ${
                  selectedColor === color ? 'border-white' : 'border-gray-400'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Size Control */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">Size:</label>
            <input
              type="range"
              min="5"
              max="50"
              value={selectedSize}
              onChange={(e) => handleSizeChange(parseInt(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-300">{selectedSize}</span>
          </div>

          {/* Opacity Control */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">Opacity:</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={selectedOpacity}
              onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-300">{Math.round(selectedOpacity * 100)}%</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center space-x-4">
          {/* Priority Selection */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">Priority:</label>
            <select
              value={selectedPriority}
              onChange={(e) => handlePriorityChange(e.target.value as typeof selectedPriority)}
              className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Category Selection */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value as typeof selectedCategory)}
              className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
            >
              <option value="technique">Technique</option>
              <option value="timing">Timing</option>
              <option value="posture">Posture</option>
              <option value="grip">Grip</option>
              <option value="stance">Stance</option>
              <option value="follow-through">Follow-through</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Clear All */}
          <button
            onClick={handleClearAll}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-96 bg-black"
          style={{ cursor: 'crosshair' }}
        />
        
        {/* Video Overlay */}
        {videoRef.current && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ zIndex: -1 }}
          />
        )}
      </div>

      {/* Annotations List */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Annotations ({annotations.length})</h3>
          <div className="flex space-x-2">
            <select
              onChange={(e) => handleFilterByCategory(e.target.value)}
              className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
            >
              <option value="all">All Categories</option>
              <option value="technique">Technique</option>
              <option value="timing">Timing</option>
              <option value="posture">Posture</option>
              <option value="grip">Grip</option>
              <option value="stance">Stance</option>
              <option value="follow-through">Follow-through</option>
              <option value="general">General</option>
            </select>
            <select
              onChange={(e) => handleFilterByPriority(e.target.value)}
              className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {annotations.map(annotation => (
            <div
              key={annotation.id}
              className={`p-3 rounded-lg border ${
                selectedAnnotation?.id === annotation.id
                  ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                  : 'border-gray-600 bg-gray-700'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-white">
                      {annotation.type.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(annotation.category)}`}>
                      {annotation.category}
                    </span>
                    <span className={`text-xs ${getPriorityColor(annotation.priority)}`}>
                      {annotation.priority.toUpperCase()}
                    </span>
                  </div>
                  
                  {annotation.content && (
                    <p className="text-sm text-gray-300 mb-2">{annotation.content}</p>
                  )}
                  
                  <div className="text-xs text-gray-400">
                    {annotation.createdAt.toLocaleString()}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAnnotationEdit(annotation)}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleAnnotationDelete(annotation.id)}
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
      {isEditing && selectedAnnotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Annotation</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Content:</label>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  rows={3}
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
                  onClick={handleTextEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
