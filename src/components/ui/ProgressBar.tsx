'use client';

interface ProgressBarProps {
  progress: number;
  step?: string;
  className?: string;
  showPercentage?: boolean;
}

export default function ProgressBar({ 
  progress, 
  step, 
  className = '',
  showPercentage = true 
}: ProgressBarProps) {
  return (
    <div className={`w-full ${className}`}>
      {step && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{step}</span>
          {showPercentage && (
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
