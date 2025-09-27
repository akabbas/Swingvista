'use client';

import React, { useState, useCallback } from 'react';
import type { InjuryPreventionAlert } from '@/lib/ai-predictive-analysis';

export interface InjuryPreventionAlertsProps {
  alerts: InjuryPreventionAlert[];
  onAlertSelect?: (alert: InjuryPreventionAlert) => void;
  onAlertDismiss?: (alertId: string) => void;
  onAlertAcknowledge?: (alertId: string) => void;
  className?: string;
}

export default function InjuryPreventionAlerts({
  alerts,
  onAlertSelect,
  onAlertDismiss,
  onAlertAcknowledge,
  className = ''
}: InjuryPreventionAlertsProps) {
  const [selectedAlert, setSelectedAlert] = useState<InjuryPreventionAlert | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());

  // Handle alert selection
  const handleAlertSelect = useCallback((alert: InjuryPreventionAlert) => {
    setSelectedAlert(alert);
    onAlertSelect?.(alert);
  }, [onAlertSelect]);

  // Handle alert dismiss
  const handleAlertDismiss = useCallback((alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    onAlertDismiss?.(alertId);
  }, [onAlertDismiss]);

  // Handle alert acknowledge
  const handleAlertAcknowledge = useCallback((alertId: string) => {
    setAcknowledgedAlerts(prev => new Set([...prev, alertId]));
    onAlertAcknowledge?.(alertId);
  }, [onAlertAcknowledge]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-orange-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-red-500';
      case 'caution': return 'text-yellow-500';
      case 'recommendation': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'caution': return '⚠️';
      case 'recommendation': return '💡';
      default: return 'ℹ️';
    }
  };

  const getTimeframeColor = (timeframe: string) => {
    switch (timeframe) {
      case 'immediate': return 'text-red-500';
      case 'short-term': return 'text-yellow-500';
      case 'long-term': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getTimeframeIcon = (timeframe: string) => {
    switch (timeframe) {
      case 'immediate': return '🚨';
      case 'short-term': return '⏰';
      case 'long-term': return '📅';
      default: return 'ℹ️';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'text-green-500';
    if (confidence > 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter out dismissed alerts
  const activeAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

  // Group alerts by severity
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');
  const highAlerts = activeAlerts.filter(alert => alert.severity === 'high');
  const mediumAlerts = activeAlerts.filter(alert => alert.severity === 'medium');
  const lowAlerts = activeAlerts.filter(alert => alert.severity === 'low');

  return (
    <div className={`bg-gray-800 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Injury Prevention Alerts</h3>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-white">{activeAlerts.length}</div>
            <div className="text-sm text-gray-400">Active Alerts</div>
          </div>
        </div>

        {/* Alert Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{criticalAlerts.length}</div>
            <div className="text-xs text-gray-400">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{highAlerts.length}</div>
            <div className="text-xs text-gray-400">High</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">{mediumAlerts.length}</div>
            <div className="text-xs text-gray-400">Medium</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{lowAlerts.length}</div>
            <div className="text-xs text-gray-400">Low</div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="p-4">
        <div className="space-y-4">
          {/* Critical Alerts */}
          {criticalAlerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border cursor-pointer ${
                selectedAlert?.id === alert.id
                  ? 'border-red-500 bg-red-900 bg-opacity-20'
                  : 'border-red-500 bg-red-900 bg-opacity-10'
              }`}
              onClick={() => handleAlertSelect(alert)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xl">{getTypeIcon(alert.type)}</span>
                    <h5 className="text-md font-medium text-white">{alert.title}</h5>
                    <span className={`px-2 py-1 rounded text-xs ${getSeverityBgColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className={`text-xs ${getTypeColor(alert.type)}`}>
                      {alert.type.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-2">{alert.description}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span>Body Parts: {alert.affectedBodyParts.join(', ')}</span>
                    <span>Timeframe: {alert.timeframe}</span>
                    <span>Confidence: {(alert.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAlertAcknowledge(alert.id);
                    }}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAlertDismiss(alert.id);
                    }}
                    className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* High Alerts */}
          {highAlerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border cursor-pointer ${
                selectedAlert?.id === alert.id
                  ? 'border-orange-500 bg-orange-900 bg-opacity-20'
                  : 'border-orange-500 bg-orange-900 bg-opacity-10'
              }`}
              onClick={() => handleAlertSelect(alert)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getTypeIcon(alert.type)}</span>
                    <h5 className="text-md font-medium text-white">{alert.title}</h5>
                    <span className={`px-2 py-1 rounded text-xs ${getSeverityBgColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className={`text-xs ${getTypeColor(alert.type)}`}>
                      {alert.type.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-2">{alert.description}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span>Body Parts: {alert.affectedBodyParts.join(', ')}</span>
                    <span>Timeframe: {alert.timeframe}</span>
                    <span>Confidence: {(alert.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAlertAcknowledge(alert.id);
                    }}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAlertDismiss(alert.id);
                    }}
                    className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Medium Alerts */}
          {mediumAlerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border cursor-pointer ${
                selectedAlert?.id === alert.id
                  ? 'border-yellow-500 bg-yellow-900 bg-opacity-20'
                  : 'border-yellow-500 bg-yellow-900 bg-opacity-10'
              }`}
              onClick={() => handleAlertSelect(alert)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getTypeIcon(alert.type)}</span>
                    <h5 className="text-md font-medium text-white">{alert.title}</h5>
                    <span className={`px-2 py-1 rounded text-xs ${getSeverityBgColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className={`text-xs ${getTypeColor(alert.type)}`}>
                      {alert.type.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-2">{alert.description}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span>Body Parts: {alert.affectedBodyParts.join(', ')}</span>
                    <span>Timeframe: {alert.timeframe}</span>
                    <span>Confidence: {(alert.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAlertAcknowledge(alert.id);
                    }}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAlertDismiss(alert.id);
                    }}
                    className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Low Alerts */}
          {lowAlerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border cursor-pointer ${
                selectedAlert?.id === alert.id
                  ? 'border-green-500 bg-green-900 bg-opacity-20'
                  : 'border-green-500 bg-green-900 bg-opacity-10'
              }`}
              onClick={() => handleAlertSelect(alert)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getTypeIcon(alert.type)}</span>
                    <h5 className="text-md font-medium text-white">{alert.title}</h5>
                    <span className={`px-2 py-1 rounded text-xs ${getSeverityBgColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className={`text-xs ${getTypeColor(alert.type)}`}>
                      {alert.type.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-2">{alert.description}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span>Body Parts: {alert.affectedBodyParts.join(', ')}</span>
                    <span>Timeframe: {alert.timeframe}</span>
                    <span>Confidence: {(alert.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAlertAcknowledge(alert.id);
                    }}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAlertDismiss(alert.id);
                    }}
                    className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">{selectedAlert.title}</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-md font-medium text-white mb-2">Description</h4>
                <p className="text-sm text-gray-300">{selectedAlert.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Severity</h4>
                  <span className={`px-2 py-1 rounded text-xs ${getSeverityBgColor(selectedAlert.severity)}`}>
                    {selectedAlert.severity.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Type</h4>
                  <span className={`text-sm ${getTypeColor(selectedAlert.type)}`}>
                    {selectedAlert.type.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Timeframe</h4>
                  <span className={`text-sm ${getTimeframeColor(selectedAlert.timeframe)}`}>
                    {selectedAlert.timeframe.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Confidence</h4>
                  <span className={`text-sm ${getConfidenceColor(selectedAlert.confidence)}`}>
                    {(selectedAlert.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-white mb-2">Affected Body Parts</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAlert.affectedBodyParts.map((part, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-700 text-white rounded text-xs">
                      {part}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-white mb-2">Risk Factors</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedAlert.riskFactors.map((factor, index) => (
                    <li key={index} className="text-sm text-gray-300">{factor}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-white mb-2">Prevention Measures</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedAlert.preventionMeasures.map((measure, index) => (
                    <li key={index} className="text-sm text-gray-300">{measure}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-white mb-2">Recommended Actions</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedAlert.recommendedActions.map((action, index) => (
                    <li key={index} className="text-sm text-gray-300">{action}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-white mb-2">Detected At</h4>
                <p className="text-sm text-gray-300">{formatDate(selectedAlert.detectedAt)}</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => handleAlertAcknowledge(selectedAlert.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Acknowledge
              </button>
              <button
                onClick={() => handleAlertDismiss(selectedAlert.id)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Dismiss
              </button>
              <button
                onClick={() => setSelectedAlert(null)}
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
