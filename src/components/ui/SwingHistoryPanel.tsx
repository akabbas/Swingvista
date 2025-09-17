"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { SwingHistoryManager, SwingHistoryEntry, SwingComparison } from '@/lib/swing-history';

interface SwingHistoryPanelProps {
  currentSwing?: SwingHistoryEntry;
  onSelectSwing?: (swing: SwingHistoryEntry) => void;
  onCompareSwings?: (comparison: SwingComparison) => void;
  className?: string;
}

const SwingHistoryPanel: React.FC<SwingHistoryPanelProps> = ({
  currentSwing,
  onSelectSwing,
  onCompareSwings,
  className = ""
}) => {
  const [history, setHistory] = useState<SwingHistoryEntry[]>([]);
  const [selectedSwing, setSelectedSwing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'recent' | 'grade'>('recent');
  const [gradeFilter, setGradeFilter] = useState<string>('A+');
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(() => {
    setIsLoading(true);
    try {
      let entries: SwingHistoryEntry[];
      
      switch (filter) {
        case 'recent':
          entries = SwingHistoryManager.getRecentSwings(20);
          break;
        case 'grade':
          entries = SwingHistoryManager.getSwingsByGrade(gradeFilter);
          break;
        default:
          entries = SwingHistoryManager.getHistory();
      }
      
      setHistory(entries);
    } catch (error) {
      console.error('Failed to load swing history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, gradeFilter]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSwingSelect = useCallback((swing: SwingHistoryEntry) => {
    setSelectedSwing(swing.id);
    onSelectSwing?.(swing);
  }, [onSelectSwing]);

  const handleCompare = useCallback((swing: SwingHistoryEntry) => {
    if (!currentSwing) return;
    
    const comparison = SwingHistoryManager.compareSwings(currentSwing.id, swing.id);
    if (comparison) {
      onCompareSwings?.(comparison);
    }
  }, [currentSwing, onCompareSwings]);

  const handleDeleteSwing = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this swing? This action cannot be undone.')) {
      const success = SwingHistoryManager.deleteSwing(id);
      if (success) {
        loadHistory();
        if (selectedSwing === id) {
          setSelectedSwing(null);
        }
      }
    }
  }, [selectedSwing, loadHistory]);

  const handleExportCSV = useCallback(() => {
    try {
      const csv = SwingHistoryManager.exportToCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `swing-history-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  }, []);

  const handleExportJSON = useCallback(() => {
    try {
      const json = SwingHistoryManager.exportToJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `swing-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export JSON:', error);
      alert('Failed to export JSON. Please try again.');
    }
  }, []);

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-50';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-50';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-50';
    if (grade.startsWith('D')) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (duration: number) => {
    return (duration / 1000).toFixed(1) + 's';
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Swing History</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Export JSON
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-4 mb-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="recent">Recent Swings</option>
            <option value="all">All Swings</option>
            <option value="grade">By Grade</option>
          </select>
          
          {filter === 'grade' && (
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="A+">A+</option>
              <option value="A">A</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B">B</option>
              <option value="B-">B-</option>
              <option value="C+">C+</option>
              <option value="C">C</option>
              <option value="C-">C-</option>
              <option value="D+">D+</option>
              <option value="D">D</option>
              <option value="F">F</option>
            </select>
          )}
        </div>

        {/* Storage Usage */}
        <div className="text-sm text-gray-600">
          {history.length} swings stored • {SwingHistoryManager.getStorageSize() > 1024 * 1024 
            ? `${(SwingHistoryManager.getStorageSize() / (1024 * 1024)).toFixed(1)}MB used`
            : `${(SwingHistoryManager.getStorageSize() / 1024).toFixed(1)}KB used`
          }
        </div>
      </div>

      {/* Swing List */}
      <div className="space-y-3">
        {history.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Swing History</h3>
            <p className="text-gray-600">
              Complete your first swing analysis to start building your history.
            </p>
          </div>
        ) : (
          history.map((swing) => (
            <div
              key={swing.id}
              className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
                selectedSwing === swing.id
                  ? 'border-green-500 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => handleSwingSelect(swing)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">{swing.fileName}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(swing.grade.overall.letter)}`}>
                      {swing.grade.overall.letter}
                    </span>
                    <span className="text-sm text-gray-500">
                      {swing.grade.overall.score}/100
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{formatDate(swing.date)}</span>
                    <span>{formatDuration(swing.duration)}</span>
                    <span>{swing.poses.length} poses</span>
                    {swing.notes && (
                      <span className="text-blue-600">📝 Has notes</span>
                    )}
                    {swing.tags && swing.tags.length > 0 && (
                      <span className="text-purple-600">🏷️ {swing.tags.length} tags</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {currentSwing && currentSwing.id !== swing.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompare(swing);
                      }}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Compare
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSwing(swing.id);
                    }}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SwingHistoryPanel;
