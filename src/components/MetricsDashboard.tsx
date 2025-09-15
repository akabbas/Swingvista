'use client';

import React, { useState, useEffect } from 'react';
import { TrajectoryPoint, SwingTrajectory } from '@/lib/mediapipe';
import { SwingPhase, SwingPhaseAnalysis } from '@/lib/swing-phases';
import { TrajectoryMetrics, TrajectoryAnalyzer } from '@/lib/trajectory-analysis';
import { SwingReportCard } from '@/lib/vista-swing-ai';

interface SwingData {
  id: string;
  timestamp: number;
  club: string;
  trajectory: SwingTrajectory;
  phases: SwingPhase[];
  phaseAnalysis: SwingPhaseAnalysis;
  metrics: TrajectoryMetrics;
  reportCard: SwingReportCard;
  videoUrl?: string;
}

interface MetricsDashboardProps {
  swings: SwingData[];
  selectedSwing?: SwingData;
  onSwingSelect?: (swing: SwingData) => void;
  className?: string;
}

export default function MetricsDashboard({
  swings,
  selectedSwing,
  onSwingSelect,
  className = ''
}: MetricsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [selectedClub, setSelectedClub] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'tempo' | 'smoothness'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'chart'>('grid');

  const analyzer = new TrajectoryAnalyzer();

  // Filter swings based on time range and club
  const filteredSwings = swings.filter(swing => {
    const now = new Date();
    const swingDate = new Date(swing.timestamp);
    const daysDiff = (now.getTime() - swingDate.getTime()) / (1000 * 60 * 60 * 24);

    const timeFilter = timeRange === 'week' ? daysDiff <= 7 :
                      timeRange === 'month' ? daysDiff <= 30 : true;

    const clubFilter = selectedClub === 'all' || swing.club === selectedClub;

    return timeFilter && clubFilter;
  });

  // Sort swings
  const sortedSwings = [...filteredSwings].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return b.timestamp - a.timestamp;
      case 'score':
        return getOverallScore(b.reportCard) - getOverallScore(a.reportCard);
      case 'tempo':
        return b.phaseAnalysis.tempoRatio - a.phaseAnalysis.tempoRatio;
      case 'smoothness':
        return b.metrics.smoothness - a.metrics.smoothness;
      default:
        return 0;
    }
  });

  // Calculate overall score from report card
  const getOverallScore = (reportCard: SwingReportCard): number => {
    const scores = {
      'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0
    };
    
    const componentScores = [
      reportCard.setup.grade,
      reportCard.grip.grade,
      reportCard.alignment.grade,
      reportCard.rotation.grade,
      reportCard.impact.grade,
      reportCard.followThrough.grade
    ].map(grade => scores[grade as keyof typeof scores] || 0);

    return componentScores.reduce((sum, score) => sum + score, 0) / componentScores.length;
  };

  // Calculate statistics
  const stats = {
    totalSwings: filteredSwings.length,
    averageScore: filteredSwings.length > 0 ? 
      filteredSwings.reduce((sum, swing) => sum + getOverallScore(swing.reportCard), 0) / filteredSwings.length : 0,
    averageTempo: filteredSwings.length > 0 ?
      filteredSwings.reduce((sum, swing) => sum + swing.phaseAnalysis.tempoRatio, 0) / filteredSwings.length : 0,
    averageSmoothness: filteredSwings.length > 0 ?
      filteredSwings.reduce((sum, swing) => sum + swing.metrics.smoothness, 0) / filteredSwings.length : 0,
    bestSwing: filteredSwings.length > 0 ?
      filteredSwings.reduce((best, swing) => 
        getOverallScore(swing.reportCard) > getOverallScore(best.reportCard) ? swing : best
      ) : null
  };

  // Get grade color
  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Format date
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Swing Metrics Dashboard</h2>
          <p className="text-gray-600">Track your progress and analyze your swing data</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="all">All Time</option>
          </select>

          <select
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Clubs</option>
            <option value="driver">Driver</option>
            <option value="iron">Iron</option>
            <option value="wedge">Wedge</option>
            <option value="putter">Putter</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="date">Date</option>
            <option value="score">Score</option>
            <option value="tempo">Tempo</option>
            <option value="smoothness">Smoothness</option>
          </select>

          <div className="flex border border-gray-300 rounded-md">
            {[
              { value: 'grid', icon: '⊞', label: 'Grid' },
              { value: 'list', icon: '☰', label: 'List' },
              { value: 'chart', icon: '📊', label: 'Chart' }
            ].map((mode) => (
              <button
                key={mode.value}
                onClick={() => setViewMode(mode.value as any)}
                className={`px-3 py-2 text-sm ${
                  viewMode === mode.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title={mode.label}
              >
                {mode.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Swings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSwings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageScore.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Tempo</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageTempo.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Smoothness</p>
              <p className="text-2xl font-bold text-gray-900">
                {(stats.averageSmoothness * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Swings List/Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSwings.map((swing) => (
            <div
              key={swing.id}
              onClick={() => onSwingSelect?.(swing)}
              className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow ${
                selectedSwing?.id === swing.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 capitalize">{swing.club}</h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(swing.timestamp)} at {formatTime(swing.timestamp)}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(swing.reportCard.overall.score)}`}>
                  {swing.reportCard.overall.score}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tempo Ratio</span>
                  <span className="font-medium">{swing.phaseAnalysis.tempoRatio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Smoothness</span>
                  <span className="font-medium">{(swing.metrics.smoothness * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max Velocity</span>
                  <span className="font-medium">{swing.metrics.maxVelocity.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Distance</span>
                  <span className="font-medium">{swing.metrics.totalDistance.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 italic">
                  "{swing.reportCard.overall.tip}"
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Club
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tempo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Smoothness
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Max Velocity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedSwings.map((swing) => (
                  <tr
                    key={swing.id}
                    onClick={() => onSwingSelect?.(swing)}
                    className={`cursor-pointer hover:bg-gray-50 ${
                      selectedSwing?.id === swing.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(swing.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {swing.club}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(swing.reportCard.overall.score)}`}>
                        {swing.reportCard.overall.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {swing.phaseAnalysis.tempoRatio.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(swing.metrics.smoothness * 100).toFixed(0)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {swing.metrics.maxVelocity.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {sortedSwings.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No swings found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or record a new swing.
          </p>
        </div>
      )}
    </div>
  );
}
