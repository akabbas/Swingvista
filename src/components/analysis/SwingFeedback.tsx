'use client';

import Tooltip from '../ui/Tooltip';
import type { AISwingAnalysis } from '@/lib/ai-swing-analyzer';

interface FeedbackData {
  strengths?: string[];
  focusAreas?: string[];
  recommendations?: string[];
}

interface SwingFeedbackProps {
  title?: string;
  analysis?: AISwingAnalysis;
}

export default function SwingFeedback({ title = 'Your Swing Analysis', analysis }: SwingFeedbackProps) {
  // Add comprehensive error handling and loading state
  if (!analysis) {
    return (
      <div className="w-full space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center text-gray-500">Loading analysis...</div>
        </div>
      </div>
    );
  }

  try {
    // Add default values to prevent undefined errors
    const strengths = analysis.strengths || [];
    const improvements = analysis.improvements || [];
    const technicalNotes = analysis.technicalNotes || [];
    const recordingQuality = analysis.recordingQuality || { score: 1, angle: 'unknown', recommendations: [] };
    const openAI = analysis.openAI || null;
    const swingMetrics = analysis.swingMetrics || {
      tempo: { backswingTime: 0, downswingTime: 0, ratio: 0, assessment: 'No data available' },
      rotation: { shoulders: 0, xFactor: 0, assessment: 'No data available' },
      balance: { score: 0, assessment: 'No data available' },
      plane: { assessment: 'No data available' }
    };
    const overallScore = analysis.overallScore || 0;
    
    // Safe tempo text calculation
    const tempoText = swingMetrics.tempo ? 
      `${swingMetrics.tempo.backswingTime?.toFixed(2) || '0.00'}s : ${swingMetrics.tempo.downswingTime?.toFixed(2) || '0.00'}s` :
      '0.00s : 0.00s';

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        <div className="text-right">
          <div className="text-3xl font-bold text-green-600">{overallScore}/100</div>
          <div className="text-sm text-gray-500">Overall Score</div>
        </div>
      </div>

      {/* Recording Quality Alert */}
      {recordingQuality.score < 0.7 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Recording Quality Notice</h4>
          <p className="text-sm text-yellow-700 mb-2">Angle: {recordingQuality.angle} | Quality: {(recordingQuality.score * 100).toFixed(0)}%</p>
          <ul className="text-sm text-yellow-600">
            {recordingQuality.recommendations.map((rec, idx) => (
              <li key={idx}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border p-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-800">Swing Tempo</h4>
            <Tooltip content="Backswing to downswing timing ratio. Ideal ≈ 3:1.">
              <span className="text-xs text-gray-500">Info</span>
            </Tooltip>
          </div>
          <p className="text-sm text-gray-600">Times: {tempoText}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{swingMetrics.tempo?.tempoRatio?.toFixed(2) || '0.00'} : 1</p>
          <p className="text-xs text-gray-500 mt-1">Ideal ≈ 3.0 : 1</p>
        </div>

        <div className="rounded-xl border p-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-800">Shoulder Rotation</h4>
            <Tooltip content="Rotation at top relative to setup. Typical 80°–110°.">
              <span className="text-xs text-gray-500">Info</span>
            </Tooltip>
          </div>
          <p className="text-2xl font-bold text-gray-900">{swingMetrics.rotation?.shoulderTurn?.toFixed(1) || '0.0'}°</p>
          <p className="text-xs text-gray-500 mt-1">Target 90–100°</p>
        </div>

        <div className="rounded-xl border p-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-800">X-Factor</h4>
            <Tooltip content="Shoulder-hip separation. Target 20-30°.">
              <span className="text-xs text-gray-500">Info</span>
            </Tooltip>
          </div>
          <p className="text-2xl font-bold text-gray-900">{swingMetrics.rotation?.xFactor?.toFixed(1) || '0.0'}°</p>
          <p className="text-xs text-gray-500 mt-1">Target 20–30°</p>
        </div>

        <div className="rounded-xl border p-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-800">Balance</h4>
            <Tooltip content="Stability throughout the swing.">
              <span className="text-xs text-gray-500">Info</span>
            </Tooltip>
          </div>
          <p className="text-2xl font-bold text-gray-900">{((swingMetrics.balance?.score || 0) * 100).toFixed(0)}%</p>
          <p className="text-xs text-gray-500 mt-1">Stability Score</p>
        </div>
      </div>

      {/* OpenAI Analysis */}
      {openAI && (
        <div className="rounded-xl border p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <h4 className="font-medium text-purple-800 text-lg">Professional AI Analysis</h4>
          </div>
          
          {openAI.overallAssessment && (
            <div className="mb-4">
              <h5 className="font-medium text-gray-700 mb-2">Overall Assessment</h5>
              <p className="text-gray-600">{openAI.overallAssessment}</p>
            </div>
          )}
          
          {openAI.keyTip && (
            <div className="mb-4">
              <h5 className="font-medium text-gray-700 mb-2">Key Tip</h5>
              <p className="text-gray-600 bg-white p-3 rounded-lg border-l-4 border-purple-400">
                {openAI.keyTip}
              </p>
            </div>
          )}
          
          {openAI.recordingTips && openAI.recordingTips.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Recording Tips</h5>
              <ul className="space-y-1">
                {openAI.recordingTips.map((tip, idx) => (
                  <li key={idx} className="text-sm text-gray-600">• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* AI-Generated Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        {strengths && strengths.length > 0 && (
          <div className="rounded-xl border p-4 bg-green-50 border-green-200">
            <h4 className="font-medium text-green-800 mb-3">✅ Strengths</h4>
            <ul className="space-y-2">
              {strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mt-1 mr-2 text-green-600">•</span>
                  <p className="text-sm text-green-700">{strength}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {improvements && improvements.length > 0 && (
          <div className="rounded-xl border p-4 bg-blue-50 border-blue-200">
            <h4 className="font-medium text-blue-800 mb-3">🎯 Focus Areas</h4>
            <ul className="space-y-2">
              {improvements.map((improvement, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mt-1 mr-2 text-blue-600">•</span>
                  <p className="text-sm text-blue-700">{improvement}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Technical Notes */}
      {technicalNotes && technicalNotes.length > 0 && (
        <div className="rounded-xl border p-4 bg-gray-50">
          <h4 className="font-medium text-gray-800 mb-3">📊 Technical Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {technicalNotes.map((note, idx) => (
              <div key={idx} className="text-sm text-gray-600">
                {note}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Metric Assessments */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-800">Detailed Analysis</h4>
        
        <div className="bg-white rounded-lg border p-4">
          <h5 className="font-medium text-gray-700 mb-2">Tempo Analysis</h5>
          <p className="text-sm text-gray-600">{swingMetrics.tempo?.assessment || 'No tempo data available'}</p>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <h5 className="font-medium text-gray-700 mb-2">Rotation Analysis</h5>
          <p className="text-sm text-gray-600">{swingMetrics.rotation?.assessment || 'No rotation data available'}</p>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <h5 className="font-medium text-gray-700 mb-2">Balance Analysis</h5>
          <p className="text-sm text-gray-600">{swingMetrics.balance?.assessment || 'No balance data available'}</p>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <h5 className="font-medium text-gray-700 mb-2">Swing Plane Analysis</h5>
          <p className="text-sm text-gray-600">{swingMetrics.plane?.assessment || 'No swing plane data available'}</p>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('Error in SwingFeedback:', error);
    return (
      <div className="w-full space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-medium mb-2">Error Loading Feedback</h3>
          <p className="text-red-700 text-sm">
            There was an error loading your swing analysis. Please try refreshing the page or uploading your video again.
          </p>
          <details className="mt-2">
            <summary className="text-red-600 text-xs cursor-pointer">Technical Details</summary>
            <pre className="text-xs text-red-500 mt-1 overflow-auto">
              {error instanceof Error ? error.message : 'Unknown error'}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}


