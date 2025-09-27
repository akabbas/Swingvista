'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AnalysisCache, type CacheEntry } from '@/lib/performance-optimization';

export interface CacheManagerProps {
  onCacheHit?: (key: string, data: any) => void;
  onCacheMiss?: (key: string) => void;
  className?: string;
}

export default function CacheManager({
  onCacheHit,
  onCacheMiss,
  className = ''
}: CacheManagerProps) {
  const [cache] = useState(() => new AnalysisCache());
  const [cacheStats, setCacheStats] = useState(cache.getStats());
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Update cache stats
  useEffect(() => {
    const interval = setInterval(() => {
      setCacheStats(cache.getStats());
      setCacheEntries(Array.from(cache['cache'].values()));
    }, 1000);

    return () => clearInterval(interval);
  }, [cache]);

  const handleGetCache = useCallback((key: string) => {
    const data = cache.get(key);
    if (data) {
      onCacheHit?.(key, data);
    } else {
      onCacheMiss?.(key);
    }
    return data;
  }, [cache, onCacheHit, onCacheMiss]);

  const handleSetCache = useCallback((key: string, data: any, ttl: number = 3600000) => {
    cache.set(key, data, ttl);
  }, [cache]);

  const handleClearCache = useCallback(() => {
    cache.clear();
  }, [cache]);

  const handleClearExpired = useCallback(() => {
    const now = Date.now();
    cacheEntries.forEach(entry => {
      if (now - entry.timestamp.getTime() > entry.ttl) {
        cache['cache'].delete(entry.key);
      }
    });
  }, [cache, cacheEntries]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getEntryStatus = (entry: CacheEntry): 'active' | 'expired' | 'expiring' => {
    const now = Date.now();
    const age = now - entry.timestamp.getTime();
    const ttl = entry.ttl;
    
    if (age > ttl) return 'expired';
    if (age > ttl * 0.8) return 'expiring';
    return 'active';
  };

  const getStatusColor = (status: 'active' | 'expired' | 'expiring') => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'expiring': return 'text-yellow-500';
      case 'expired': return 'text-red-500';
    }
  };

  const getStatusIcon = (status: 'active' | 'expired' | 'expiring') => {
    switch (status) {
      case 'active': return '🟢';
      case 'expiring': return '🟡';
      case 'expired': return '🔴';
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-white">Analysis Cache</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span>Entries: {cacheStats.entries}</span>
            <span>Size: {formatFileSize(cacheStats.size)}</span>
            <span>Hit Rate: {cacheStats.hitRate.toFixed(1)}%</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleClearExpired}
            className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-500"
          >
            Clear Expired
          </button>
          <button
            onClick={handleClearCache}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-500"
          >
            Clear All
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Cache Stats */}
      <div className="p-4 border-b border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{cacheStats.entries}</div>
            <div className="text-gray-400">Entries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{formatFileSize(cacheStats.size)}</div>
            <div className="text-gray-400">Total Size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{cacheStats.hitRate.toFixed(1)}%</div>
            <div className="text-gray-400">Hit Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {cacheEntries.filter(e => getEntryStatus(e) === 'active').length}
            </div>
            <div className="text-gray-400">Active</div>
          </div>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="p-4">
          <h3 className="text-sm font-medium text-white mb-3">Cache Entries</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {cacheEntries.length === 0 ? (
              <div className="text-center text-gray-400 py-4">
                <p>No cache entries</p>
              </div>
            ) : (
              cacheEntries.map(entry => {
                const status = getEntryStatus(entry);
                return (
                  <CacheEntryCard
                    key={entry.key}
                    entry={entry}
                    status={status}
                    onRemove={() => {
                      cache['cache'].delete(entry.key);
                    }}
                  />
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Cache Controls */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Cache automatically manages memory usage
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                // Test cache functionality
                const testKey = 'test_' + Date.now();
                const testData = { test: 'data', timestamp: new Date() };
                handleSetCache(testKey, testData, 5000); // 5 second TTL
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-500"
            >
              Test Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cache Entry Card Component
function CacheEntryCard({
  entry,
  status,
  onRemove
}: {
  entry: CacheEntry;
  status: 'active' | 'expired' | 'expiring';
  onRemove: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getStatusColor = (status: 'active' | 'expired' | 'expiring') => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'expiring': return 'text-yellow-500';
      case 'expired': return 'text-red-500';
    }
  };

  const getStatusIcon = (status: 'active' | 'expired' | 'expiring') => {
    switch (status) {
      case 'active': return '🟢';
      case 'expiring': return '🟡';
      case 'expired': return '🔴';
    }
  };

  return (
    <div className="bg-gray-700 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-lg">{getStatusIcon(status)}</span>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-white">
                {entry.key.length > 20 ? entry.key.substring(0, 20) + '...' : entry.key}
              </span>
              <span className={`text-xs ${getStatusColor(status)}`}>
                {status.toUpperCase()}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              {formatFileSize(entry.size)} • {formatTime(entry.timestamp)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-500"
          >
            {isExpanded ? '−' : '+'}
          </button>
          
          <button
            onClick={onRemove}
            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-500"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Key:</span>
              <span className="text-white font-mono">{entry.key}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Size:</span>
              <span className="text-white">{formatFileSize(entry.size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Created:</span>
              <span className="text-white">{entry.timestamp.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">TTL:</span>
              <span className="text-white">{Math.floor(entry.ttl / 1000)}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Data Type:</span>
              <span className="text-white">{typeof entry.data}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
