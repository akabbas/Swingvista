'use client';

import React, { useState, useCallback, useEffect } from 'react';
import type { SwingLibrary, SwingSession, SwingCategory } from '@/lib/swing-comparison';

export interface SwingLibraryManagerProps {
  swingLibrary: SwingLibrary;
  onSwingSelect: (swing: SwingSession) => void;
  onSwingDelete: (swingId: string) => void;
  onSwingTag: (swingId: string, tags: string[]) => void;
  onSwingCategorize: (swingId: string, category: SwingCategory) => void;
  onFilterChange: (filters: SwingLibrary['filters']) => void;
  className?: string;
}

export default function SwingLibraryManager({
  swingLibrary,
  onSwingSelect,
  onSwingDelete,
  onSwingTag,
  onSwingCategorize,
  onFilterChange,
  className = ''
}: SwingLibraryManagerProps) {
  const [selectedSwing, setSelectedSwing] = useState<SwingSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort swings
  const filteredSwings = React.useMemo(() => {
    let swings = swingLibrary.sessions;

    // Apply search filter
    if (searchTerm) {
      swings = swings.filter(swing => 
        swing.sessionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        swing.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        swing.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    swings = [...swings].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'score':
          comparison = a.metrics.overallProfessionalScore - b.metrics.overallProfessionalScore;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return swings;
  }, [swingLibrary.sessions, searchTerm, sortBy, sortOrder]);

  const handleSwingSelect = useCallback((swing: SwingSession) => {
    setSelectedSwing(swing);
    onSwingSelect(swing);
  }, [onSwingSelect]);

  const handleSwingDelete = useCallback((swingId: string) => {
    if (confirm('Are you sure you want to delete this swing?')) {
      onSwingDelete(swingId);
      if (selectedSwing?.id === swingId) {
        setSelectedSwing(null);
      }
    }
  }, [onSwingDelete, selectedSwing]);

  const handleSwingTag = useCallback((swingId: string, newTags: string[]) => {
    onSwingTag(swingId, newTags);
  }, [onSwingTag]);

  const handleSwingCategorize = useCallback((swingId: string, category: SwingCategory) => {
    onSwingCategorize(swingId, category);
  }, [onSwingCategorize]);

  const handleFilterChange = useCallback((filterType: string, value: any) => {
    const newFilters = { ...swingLibrary.filters };
    
    switch (filterType) {
      case 'dateRange':
        newFilters.dateRange = value;
        break;
      case 'category':
        newFilters.category = value;
        break;
      case 'tags':
        newFilters.tags = value;
        break;
      case 'bestSwings':
        newFilters.bestSwings = value;
        break;
      case 'scoreRange':
        newFilters.scoreRange = value;
        break;
    }
    
    onFilterChange(newFilters);
  }, [swingLibrary.filters, onFilterChange]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 p-4 rounded-t-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Swing Library</h2>
        
        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Search swings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'score' | 'category')}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="date">Sort by Date</option>
              <option value="score">Sort by Score</option>
              <option value="category">Sort by Category</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 hover:bg-gray-600"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
          
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-2">
            <select
              value={swingLibrary.filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              {swingLibrary.categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <label className="flex items-center space-x-2 text-white">
              <input
                type="checkbox"
                checked={swingLibrary.filters.bestSwings || false}
                onChange={(e) => handleFilterChange('bestSwings', e.target.checked)}
                className="rounded"
              />
              <span>Best Swings Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Swing List */}
      <div className="flex-1 overflow-y-auto bg-gray-900">
        {filteredSwings.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>No swings found matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {filteredSwings.map((swing) => (
              <SwingCard
                key={swing.id}
                swing={swing}
                isSelected={selectedSwing?.id === swing.id}
                onSelect={() => handleSwingSelect(swing)}
                onDelete={() => handleSwingDelete(swing.id)}
                onTag={(tags) => handleSwingTag(swing.id, tags)}
                onCategorize={(category) => handleSwingCategorize(swing.id, category)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selected Swing Details */}
      {selectedSwing && (
        <div className="bg-gray-800 p-4 rounded-b-lg">
          <SwingDetails
            swing={selectedSwing}
            onTag={(tags) => handleSwingTag(selectedSwing.id, tags)}
            onCategorize={(category) => handleSwingCategorize(selectedSwing.id, category)}
          />
        </div>
      )}
    </div>
  );
}

// Swing Card Component
function SwingCard({
  swing,
  isSelected,
  onSelect,
  onDelete,
  onTag,
  onCategorize
}: {
  swing: SwingSession;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTag: (tags: string[]) => void;
  onCategorize: (category: SwingCategory) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTags, setEditTags] = useState(swing.tags);
  const [editCategory, setEditCategory] = useState(swing.category);

  const handleSave = () => {
    onTag(editTags);
    onCategorize(editCategory);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTags(swing.tags);
    setEditCategory(swing.category);
    setIsEditing(false);
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
        isSelected 
          ? 'border-blue-500 bg-blue-900 bg-opacity-20' 
          : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold text-white">{swing.sessionName}</h3>
          <p className="text-sm text-gray-400">{swing.timestamp.toLocaleDateString()}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-xs ${
            swing.bestSwing ? 'bg-yellow-600 text-yellow-100' : 'bg-gray-600 text-gray-300'
          }`}>
            {swing.bestSwing ? 'Best' : 'Regular'}
          </span>
          <span className="text-sm text-white">
            {(swing.metrics.overallProfessionalScore * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-2">
        <span className="text-sm text-gray-400">Category: {swing.category}</span>
        <span className="text-sm text-gray-400">Grade: {swing.metrics.professionalGrade}</span>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {swing.tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-blue-600 text-blue-100 rounded text-xs"
          >
            {tag}
          </span>
        ))}
      </div>

      {swing.notes && (
        <p className="text-sm text-gray-300 mb-2">{swing.notes}</p>
      )}

      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
            className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-500"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-500"
          >
            Delete
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-4 p-3 bg-gray-700 rounded">
          <div className="space-y-2">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Tags (comma-separated):</label>
              <input
                type="text"
                value={editTags.join(', ')}
                onChange={(e) => setEditTags(e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                className="w-full px-2 py-1 bg-gray-600 text-white rounded text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Category:</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as SwingCategory)}
                className="w-full px-2 py-1 bg-gray-600 text-white rounded text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="practice">Practice</option>
                <option value="lesson">Lesson</option>
                <option value="tournament">Tournament</option>
                <option value="warmup">Warmup</option>
                <option value="drill">Drill</option>
                <option value="analysis">Analysis</option>
                <option value="comparison">Comparison</option>
                <option value="improvement">Improvement</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-500"
              >
                Save
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Swing Details Component
function SwingDetails({
  swing,
  onTag,
  onCategorize
}: {
  swing: SwingSession;
  onTag: (tags: string[]) => void;
  onCategorize: (category: SwingCategory) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTags, setEditTags] = useState(swing.tags);
  const [editCategory, setEditCategory] = useState(swing.category);
  const [editNotes, setEditNotes] = useState(swing.notes);

  const handleSave = () => {
    onTag(editTags);
    onCategorize(editCategory);
    setIsEditing(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Swing Details</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-500"
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Tags:</label>
            <input
              type="text"
              value={editTags.join(', ')}
              onChange={(e) => setEditTags(e.target.value.split(',').map(t => t.trim()).filter(t => t))}
              className="w-full px-2 py-1 bg-gray-600 text-white rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Category:</label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value as SwingCategory)}
              className="w-full px-2 py-1 bg-gray-600 text-white rounded text-sm"
            >
              <option value="practice">Practice</option>
              <option value="lesson">Lesson</option>
              <option value="tournament">Tournament</option>
              <option value="warmup">Warmup</option>
              <option value="drill">Drill</option>
              <option value="analysis">Analysis</option>
              <option value="comparison">Comparison</option>
              <option value="improvement">Improvement</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Notes:</label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-2 py-1 bg-gray-600 text-white rounded text-sm"
              rows={3}
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-500"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-300">Score:</span>
            <span className="text-sm text-white">{(swing.metrics.overallProfessionalScore * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-300">Grade:</span>
            <span className="text-sm text-white">{swing.metrics.professionalGrade}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-300">Category:</span>
            <span className="text-sm text-white">{swing.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-300">Best Swing:</span>
            <span className="text-sm text-white">{swing.bestSwing ? 'Yes' : 'No'}</span>
          </div>
          {swing.notes && (
            <div>
              <span className="text-sm text-gray-300">Notes:</span>
              <p className="text-sm text-white mt-1">{swing.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
