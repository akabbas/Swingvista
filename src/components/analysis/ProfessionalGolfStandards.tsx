/**
 * Professional Golf Standards Display
 * 
 * Shows the golden fundamentals of golf with professional benchmarks,
 * current performance, and improvement guidance.
 */

import React from 'react';
import { RealGolfAnalysis } from '@/lib/real-golf-analysis';

interface ProfessionalGolfStandardsProps {
  analysis: RealGolfAnalysis | null;
  className?: string;
}

// Golf fundamentals data (matching the backend)
const GOLF_FUNDAMENTALS = {
  TEMPO: {
    description: "3:1 Backswing to Downswing Ratio",
    ideal: 3.0,
    range: [2.8, 3.2],
    importance: "Critical for timing and power generation",
    weight: 0.15,
    category: "Timing",
    professional: "Tour players maintain 3:1 ratio for maximum power and consistency"
  },
  WEIGHT_TRANSFER: {
    description: "80-90% Weight on Front Foot at Impact",
    ideal: 85,
    range: [80, 90],
    importance: "Essential for power and ball striking",
    weight: 0.15,
    category: "Power",
    professional: "Elite players transfer 85-90% of weight to front foot at impact"
  },
  X_FACTOR: {
    description: "40-50° Shoulder-Hip Separation",
    ideal: 45,
    range: [40, 50],
    importance: "Creates torque for power generation",
    weight: 0.20,
    category: "Power",
    professional: "Professional golfers achieve 45° separation for optimal coil and release"
  },
  SWING_PLANE: {
    description: "On Plane with Minimal Deviation",
    ideal: 0,
    range: [-2, 2],
    importance: "Consistent ball striking and accuracy",
    weight: 0.15,
    category: "Accuracy",
    professional: "Tour players maintain swing plane within 2° for consistent ball striking"
  },
  CLUB_PATH: {
    description: "Slight Inside-Out Path",
    ideal: 0,
    range: [-2, 2],
    importance: "Optimal ball flight and accuracy",
    weight: 0.15,
    category: "Accuracy",
    professional: "Professional golfers swing 0-2° inside-out for optimal ball flight"
  },
  IMPACT: {
    description: "Hands Ahead of Ball at Impact",
    ideal: 0,
    range: [-1, 1],
    importance: "Proper compression and ball flight control",
    weight: 0.20,
    category: "Impact",
    professional: "Elite players keep hands 0-1\" ahead of ball for proper compression"
  },
  BODY_ALIGNMENT: {
    description: "Stable Head and Spine Angle",
    ideal: 0,
    range: [-2, 2],
    importance: "Consistent setup and ball striking",
    weight: 0.10,
    category: "Setup",
    professional: "Professional golfers maintain spine angle within 2° throughout swing"
  },
  FOLLOW_THROUGH: {
    description: "Complete Extension and Balance",
    ideal: 0.9,
    range: [0.8, 1.0],
    importance: "Power transfer and finish position",
    weight: 0.10,
    category: "Finish",
    professional: "Tour players achieve 90%+ extension with perfect balance"
  }
};

const GOLF_CATEGORIES = {
  TIMING: {
    name: "Timing & Rhythm",
    fundamentals: ["TEMPO"],
    description: "The foundation of a consistent golf swing",
    color: "#3B82F6"
  },
  POWER: {
    name: "Power Generation",
    fundamentals: ["WEIGHT_TRANSFER", "X_FACTOR"],
    description: "Creating maximum clubhead speed and distance",
    color: "#EF4444"
  },
  ACCURACY: {
    name: "Accuracy & Control",
    fundamentals: ["SWING_PLANE", "CLUB_PATH"],
    description: "Consistent ball striking and shot shaping",
    color: "#10B981"
  },
  IMPACT: {
    name: "Impact Position",
    fundamentals: ["IMPACT"],
    description: "The moment of truth - ball compression",
    color: "#F59E0B"
  },
  SETUP: {
    name: "Setup & Alignment",
    fundamentals: ["BODY_ALIGNMENT"],
    description: "Proper foundation for consistent swings",
    color: "#8B5CF6"
  },
  FINISH: {
    name: "Follow-Through",
    fundamentals: ["FOLLOW_THROUGH"],
    description: "Complete the swing with balance and extension",
    color: "#06B6D4"
  }
};

export default function ProfessionalGolfStandards({ analysis, className = '' }: ProfessionalGolfStandardsProps) {
  if (!analysis) return null;

  // Get current values from analysis
  const getCurrentValue = (fundamental: string) => {
    switch (fundamental) {
      case 'TEMPO':
        return analysis.metrics?.tempo?.ratio || 0;
      case 'WEIGHT_TRANSFER':
        return (analysis.metrics?.weightTransfer?.transfer || 0) * 100;
      case 'X_FACTOR':
        return analysis.metrics?.rotation?.xFactor || 0;
      case 'SWING_PLANE':
        return analysis.metrics?.swingPlane?.deviation || 0;
      case 'CLUB_PATH':
        return analysis.metrics?.clubPath?.insideOut || 0;
      case 'IMPACT':
        return analysis.metrics?.impact?.handPosition || 0;
      case 'BODY_ALIGNMENT':
        return analysis.metrics?.bodyAlignment?.headMovement || 0;
      case 'FOLLOW_THROUGH':
        return (analysis.metrics?.followThrough?.extension || 0) * 100;
      default:
        return 0;
    }
  };

  // Calculate performance score for a fundamental
  const getPerformanceScore = (fundamental: string) => {
    const current = getCurrentValue(fundamental);
    const ideal = GOLF_FUNDAMENTALS[fundamental as keyof typeof GOLF_FUNDAMENTALS].ideal;
    const range = GOLF_FUNDAMENTALS[fundamental as keyof typeof GOLF_FUNDAMENTALS].range;
    
    const deviation = Math.abs(current - ideal);
    const maxDeviation = range[1] - ideal;
    const score = Math.max(0, 100 - (deviation / maxDeviation) * 100);
    
    return Math.round(score);
  };

  // Get performance status
  const getPerformanceStatus = (score: number) => {
    if (score >= 90) return { status: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 80) return { status: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 70) return { status: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (score >= 60) return { status: 'Needs Work', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { status: 'Poor', color: 'text-red-600', bg: 'bg-red-50' };
  };

  return (
    <div className={`professional-golf-standards ${className}`}>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
        <div className="flex items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800">🏌️ Professional Golf Standards</h3>
          <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
            Golden Fundamentals
          </span>
        </div>
        <p className="text-gray-600 mb-6">
          These are the fundamental principles that professional golfers master. 
          Compare your swing to these tour-level standards.
        </p>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(GOLF_CATEGORIES).map(([categoryKey, category]) => (
            <div key={categoryKey} className="bg-white rounded-lg p-4 shadow-sm border-l-4" style={{ borderLeftColor: category.color }}>
              <div className="flex items-center mb-3">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: category.color }}
                ></div>
                <h4 className="font-semibold text-gray-800">{category.name}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-4">{category.description}</p>
              
              {/* Fundamentals in this category */}
              <div className="space-y-3">
                {category.fundamentals.map((fundamentalKey) => {
                  const fundamental = GOLF_FUNDAMENTALS[fundamentalKey as keyof typeof GOLF_FUNDAMENTALS];
                  const currentValue = getCurrentValue(fundamentalKey);
                  const score = getPerformanceScore(fundamentalKey);
                  const performance = getPerformanceStatus(score);
                  
                  return (
                    <div key={fundamentalKey} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-sm text-gray-700">{fundamental.description}</h5>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${performance.bg} ${performance.color}`}>
                          {performance.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Your Value: {currentValue.toFixed(1)}</span>
                          <span>Ideal: {fundamental.ideal}</span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${score}%`,
                              backgroundColor: category.color
                            }}
                          ></div>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          <div>Range: {fundamental.range[0]} to {fundamental.range[1]}</div>
                          <div className="italic">{fundamental.professional}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Overall Performance Summary */}
        <div className="mt-6 bg-white rounded-lg p-4 border">
          <h4 className="font-semibold text-gray-800 mb-3">📊 Overall Performance Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(GOLF_CATEGORIES).map(([categoryKey, category]) => {
              const categoryFundamentals = category.fundamentals;
              const categoryScores = categoryFundamentals.map(f => getPerformanceScore(f));
              const averageScore = Math.round(categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length);
              const performance = getPerformanceStatus(averageScore);
              
              return (
                <div key={categoryKey} className="text-center">
                  <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg`}
                       style={{ backgroundColor: category.color }}>
                    {averageScore}
                  </div>
                  <div className="text-sm font-medium text-gray-700">{category.name}</div>
                  <div className={`text-xs ${performance.color}`}>{performance.status}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Professional Tips */}
        <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
          <h4 className="font-semibold text-gray-800 mb-2">💡 Professional Tips</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Focus on the fundamentals with the lowest scores first</li>
            <li>• Practice with a metronome to improve tempo (3:1 ratio)</li>
            <li>• Work on weight transfer by finishing with your right foot stepping forward</li>
            <li>• Maintain spine angle throughout the swing for consistency</li>
            <li>• Practice the "coil drill" to improve shoulder-hip separation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
