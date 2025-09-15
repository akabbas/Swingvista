'use client';

import { useState } from 'react';
import { SwingExporter, ExportData, ExportOptions } from '@/lib/export-utils';
import Button from './Button';
import ProgressBar from './ProgressBar';
import ErrorAlert from './ErrorAlert';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  swingData: ExportData;
  onExportComplete?: () => void;
}

export default function ExportDialog({ 
  isOpen, 
  onClose, 
  swingData, 
  onExportComplete 
}: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeTrajectory: true,
    includePhases: true,
    includeMetrics: true,
    includeReportCard: true,
    videoQuality: 'medium',
    frameRate: 30
  });

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);
      setExportProgress(0);
      setExportStep('Preparing export...');

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `swing-${swingData.swingId}-${timestamp}`;

      if (exportOptions.format === 'json') {
        setExportStep('Generating JSON data...');
        setExportProgress(20);
        
        const jsonData = SwingExporter.exportAsJSON(swingData, exportOptions);
        
        setExportStep('Preparing download...');
        setExportProgress(50);
        
        await SwingExporter.downloadFile(
          jsonData,
          `${filename}.json`,
          'application/json',
          (progress) => {
            setExportProgress(50 + (progress * 0.5));
          }
        );
      } else if (exportOptions.format === 'csv') {
        setExportStep('Generating CSV data...');
        setExportProgress(20);
        
        const csvData = SwingExporter.exportAsCSV(swingData, exportOptions);
        
        setExportStep('Preparing download...');
        setExportProgress(50);
        
        await SwingExporter.downloadFile(
          csvData,
          `${filename}.csv`,
          'text/csv',
          (progress) => {
            setExportProgress(50 + (progress * 0.5));
          }
        );
      }

      setExportStep('Export completed!');
      setExportProgress(100);
      
      setTimeout(() => {
        onExportComplete?.();
        onClose();
        setIsExporting(false);
        setExportProgress(0);
        setExportStep('');
      }, 1000);

    } catch (error) {
      console.error('Export failed:', error);
      setError(error instanceof Error ? error.message : 'Export failed');
      setIsExporting(false);
      setExportProgress(0);
      setExportStep('');
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Export Swing Data</h2>
            <button
              onClick={handleClose}
              disabled={isExporting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <ErrorAlert 
              message={error} 
              onDismiss={() => setError(null)}
              className="mb-4"
            />
          )}

          {/* Export Options */}
          {!isExporting && (
            <div className="space-y-4 mb-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportOptions(prev => ({ ...prev, format: 'json' }))}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      exportOptions.format === 'json'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-semibold">JSON</div>
                      <div className="text-xs text-gray-500">Structured data</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setExportOptions(prev => ({ ...prev, format: 'csv' }))}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      exportOptions.format === 'csv'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-semibold">CSV</div>
                      <div className="text-xs text-gray-500">Spreadsheet format</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Data Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Include Data
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeTrajectory}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        includeTrajectory: e.target.checked 
                      }))}
                      className="rounded mr-3"
                    />
                    <span className="text-sm text-gray-700">Trajectory Data</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includePhases}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        includePhases: e.target.checked 
                      }))}
                      className="rounded mr-3"
                    />
                    <span className="text-sm text-gray-700">Swing Phases</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeMetrics}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        includeMetrics: e.target.checked 
                      }))}
                      className="rounded mr-3"
                    />
                    <span className="text-sm text-gray-700">Metrics & Analysis</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeReportCard}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        includeReportCard: e.target.checked 
                      }))}
                      className="rounded mr-3"
                    />
                    <span className="text-sm text-gray-700">AI Report Card</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Progress Display */}
          {isExporting && (
            <div className="mb-6">
              <div className="text-center mb-4">
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  Exporting {exportOptions.format.toUpperCase()}...
                </div>
                <div className="text-sm text-gray-600">{exportStep}</div>
              </div>
              <ProgressBar 
                progress={exportProgress}
                showPercentage={true}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isExporting}
              className="flex-1"
            >
              {isExporting ? 'Exporting...' : 'Cancel'}
            </Button>
            {!isExporting && (
              <Button
                onClick={handleExport}
                variant="primary"
                className="flex-1"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              >
                Export
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
