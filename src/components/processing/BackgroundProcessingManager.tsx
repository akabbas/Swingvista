'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BackgroundProcessor, type BackgroundProcessingJob } from '@/lib/performance-optimization';

export interface BackgroundProcessingManagerProps {
  onJobComplete?: (jobId: string, result: any) => void;
  onJobError?: (jobId: string, error: string) => void;
  className?: string;
}

export default function BackgroundProcessingManager({
  onJobComplete,
  onJobError,
  className = ''
}: BackgroundProcessingManagerProps) {
  const [processor] = useState(() => new BackgroundProcessor());
  const [jobs, setJobs] = useState<BackgroundProcessingJob[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Update jobs list
  useEffect(() => {
    const interval = setInterval(() => {
      setJobs(processor.getAllJobs());
    }, 100);

    return () => clearInterval(interval);
  }, [processor]);

  const handleJobComplete = useCallback((jobId: string, result: any) => {
    onJobComplete?.(jobId, result);
  }, [onJobComplete]);

  const handleJobError = useCallback((jobId: string, error: string) => {
    onJobError?.(jobId, error);
  }, [onJobError]);

  const cancelJob = useCallback((jobId: string) => {
    processor.cancelJob(jobId);
  }, [processor]);

  const clearCompletedJobs = useCallback(() => {
    setJobs(prev => prev.filter(job => job.status !== 'completed'));
  }, []);

  const getStatusColor = (status: BackgroundProcessingJob['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-500';
      case 'processing': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: BackgroundProcessingJob['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const activeJobs = jobs.filter(job => job.status === 'processing' || job.status === 'pending');
  const completedJobs = jobs.filter(job => job.status === 'completed');
  const failedJobs = jobs.filter(job => job.status === 'failed');

  return (
    <div className={`bg-gray-800 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-white">Background Processing</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span>Active: {activeJobs.length}</span>
            <span>Completed: {completedJobs.length}</span>
            <span>Failed: {failedJobs.length}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearCompletedJobs}
            className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
          >
            Clear Completed
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-sm font-medium text-white mb-3">Active Jobs</h3>
          <div className="space-y-2">
            {activeJobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                onCancel={() => cancelJob(job.id)}
                onComplete={handleJobComplete}
                onError={handleJobError}
              />
            ))}
          </div>
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="p-4">
          {/* Completed Jobs */}
          {completedJobs.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-white mb-3">Completed Jobs</h3>
              <div className="space-y-2">
                {completedJobs.slice(0, 5).map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onCancel={() => cancelJob(job.id)}
                    onComplete={handleJobComplete}
                    onError={handleJobError}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Failed Jobs */}
          {failedJobs.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Failed Jobs</h3>
              <div className="space-y-2">
                {failedJobs.slice(0, 5).map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onCancel={() => cancelJob(job.id)}
                    onComplete={handleJobComplete}
                    onError={handleJobError}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Jobs Message */}
      {jobs.length === 0 && (
        <div className="p-8 text-center text-gray-400">
          <p>No background processing jobs</p>
        </div>
      )}
    </div>
  );
}

// Job Card Component
function JobCard({
  job,
  onCancel,
  onComplete,
  onError
}: {
  job: BackgroundProcessingJob;
  onCancel: () => void;
  onComplete: (jobId: string, result: any) => void;
  onError: (jobId: string, error: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: BackgroundProcessingJob['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-500';
      case 'processing': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: BackgroundProcessingJob['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    return `${(duration / 1000).toFixed(1)}s`;
  };

  return (
    <div className="bg-gray-700 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-lg">{getStatusIcon(job.status)}</span>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-white">
                {job.type.replace('_', ' ').toUpperCase()}
              </span>
              <span className={`text-xs ${getStatusColor(job.status)}`}>
                {job.status.toUpperCase()}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              {formatDuration(job.startTime, job.endTime)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {job.status === 'processing' && (
            <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          )}
          
          {job.status === 'processing' && (
            <span className="text-xs text-gray-400">
              {job.progress.toFixed(0)}%
            </span>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-500"
          >
            {isExpanded ? '−' : '+'}
          </button>
          
          {(job.status === 'pending' || job.status === 'processing') && (
            <button
              onClick={onCancel}
              className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-500"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {job.status === 'processing' && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Processing...</span>
            <span>{job.progress.toFixed(0)}%</span>
          </div>
          <div className="w-full h-1 bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Job ID:</span>
              <span className="text-white font-mono">{job.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Start Time:</span>
              <span className="text-white">{job.startTime.toLocaleTimeString()}</span>
            </div>
            {job.endTime && (
              <div className="flex justify-between">
                <span className="text-gray-400">End Time:</span>
                <span className="text-white">{job.endTime.toLocaleTimeString()}</span>
              </div>
            )}
            {job.error && (
              <div className="flex justify-between">
                <span className="text-gray-400">Error:</span>
                <span className="text-red-400">{job.error}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
