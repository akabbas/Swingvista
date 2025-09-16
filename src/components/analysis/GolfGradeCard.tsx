'use client';

import type { GolfGrade } from '@/lib/golf-grading-system';

interface GolfGradeCardProps {
  grade: GolfGrade;
  className?: string;
}

export default function GolfGradeCard({ grade, className }: GolfGradeCardProps) {
  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getGradeIcon = (letter: string) => {
    if (letter.includes('A')) return '🏆';
    if (letter.includes('B')) return '🥈';
    if (letter.includes('C')) return '🥉';
    if (letter.includes('D')) return '📈';
    return '💪';
  };

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Overall Grade */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-green-400 to-blue-500 text-white mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{grade.overall.score}</div>
            <div className="text-sm">/100</div>
          </div>
        </div>
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getGradeColor(grade.overall.score)}`}>
          <span className="mr-2">{getGradeIcon(grade.overall.letter)}</span>
          {grade.overall.letter}
        </div>
        <p className="mt-2 text-gray-600 max-w-md mx-auto">{grade.overall.description}</p>
      </div>

      {/* Comparison Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{grade.comparison.vsProfessional}%</div>
          <div className="text-sm text-gray-600">vs Professional</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{grade.comparison.vsAmateur}%</div>
          <div className="text-sm text-gray-600">vs Amateur</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{grade.comparison.percentile}th</div>
          <div className="text-sm text-gray-600">Percentile</div>
        </div>
      </div>

      {/* Category Grades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(grade.categories).map(([category, data]) => (
          <div key={category} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-800 capitalize">{category}</h4>
              <div className={`px-2 py-1 rounded text-sm font-bold ${getGradeColor(data.score)}`}>
                {data.letter}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{data.score}/100</div>
            <div className="text-sm text-gray-600 mb-2">{data.description}</div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  data.score >= 90 ? 'bg-green-500' :
                  data.score >= 80 ? 'bg-blue-500' :
                  data.score >= 70 ? 'bg-yellow-500' :
                  data.score >= 60 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${data.score}%` }}
              />
            </div>
            
            {/* Benchmarks */}
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Pro: {data.benchmark.professional}</span>
                <span>Current: {data.current}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Recommendations</h3>
        
        {grade.recommendations.immediate.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">🚨 Immediate Fixes</h4>
            <ul className="space-y-1">
              {grade.recommendations.immediate.map((rec, idx) => (
                <li key={idx} className="text-sm text-red-700">• {rec}</li>
              ))}
            </ul>
          </div>
        )}
        
        {grade.recommendations.shortTerm.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">📅 Short-term (1-2 weeks)</h4>
            <ul className="space-y-1">
              {grade.recommendations.shortTerm.map((rec, idx) => (
                <li key={idx} className="text-sm text-yellow-700">• {rec}</li>
              ))}
            </ul>
          </div>
        )}
        
        {grade.recommendations.longTerm.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">🎯 Long-term (1+ months)</h4>
            <ul className="space-y-1">
              {grade.recommendations.longTerm.map((rec, idx) => (
                <li key={idx} className="text-sm text-blue-700">• {rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
