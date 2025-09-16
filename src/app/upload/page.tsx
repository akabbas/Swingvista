"use client";
import Link from 'next/link';
import React, { useMemo, useRef, useState } from 'react';
import ProgressBar from '@/components/ui/ProgressBar';
import ErrorAlert from '@/components/ui/ErrorAlert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SwingFeedback from '@/components/analysis/SwingFeedback';
import PoseOverlay from '@/components/analysis/PoseOverlay';
import DrillRecommendations from '@/components/analysis/DrillRecommendations';
import GolfGradeCard from '@/components/analysis/GolfGradeCard';
import ProgressChart from '@/components/analysis/ProgressChart';
import { extractPosesFromVideo } from '@/lib/video-poses';
import { AISwingAnalyzer } from '@/lib/ai-swing-analyzer';
import { ProgressTracker } from '@/lib/swing-progress';
import type { PoseResult } from '@/lib/mediapipe';

type WorkerResponse = { type: 'PROGRESS' | 'SWING_ANALYZED' | 'ERROR'; data: any };

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [step, setStep] = useState<string>('');
  const [result, setResult] = useState<any | null>(null);
  const [poses, setPoses] = useState<PoseResult[] | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'video' | 'metrics' | 'progress'>('video' as const);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressHistory, setProgressHistory] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const videoUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  const worker = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const W = new Worker(new URL('../../workers/unified-analysis.worker.ts', import.meta.url));
    return W;
  }, []);

  const reset = () => {
    setError(null);
    setProgress(0);
    setStep('');
    setResult(null);
    setPoses(null);
    setAiAnalysis(null);
    setIsAnalyzing(false);
  };

  const loadProgressHistory = () => {
    const history = ProgressTracker.getHistory();
    setProgressHistory(history);
  };

  // Load progress history on component mount
  React.useEffect(() => {
    loadProgressHistory();
  }, []);

  const onChooseFile = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult(null);
    setError(null);
  };

  const useTigerSample = async () => {
    try {
      setError(null);
      const res = await fetch('/fixtures/swings/tiger-iron.mp4');
      if (!res.ok) throw new Error('Sample video not found. Please add it to public/fixtures/swings/tiger-iron.mp4');
      const blob = await res.blob();
      const sampleFile = new File([blob], 'tiger-iron.mp4', { type: blob.type || 'video/mp4' });
      setFile(sampleFile);
      setResult(null);
      setPoses(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err: any) {
      setError(err?.message || 'Failed to load sample video');
    }
  };

  const useAbergSample = async () => {
    try {
      setError(null);
      const res = await fetch('/fixtures/swings/ludvig_aberg_driver.mp4');
      if (!res.ok) throw new Error('Sample video not found. Please add it to public/fixtures/swings/ludvig_aberg_driver.mp4');
      const blob = await res.blob();
      const sampleFile = new File([blob], 'ludvig_aberg_driver.mp4', { type: blob.type || 'video/mp4' });
      setFile(sampleFile);
      setResult(null);
      setPoses(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err: any) {
      setError(err?.message || 'Failed to load sample video');
    }
  };

  const useHomaSample = async () => {
    try {
      setError(null);
      const res = await fetch('/fixtures/swings/max_homa_iron.mp4');
      if (!res.ok) throw new Error('Sample video not found. Please add it to public/fixtures/swings/max_homa_iron.mp4');
      const blob = await res.blob();
      const sampleFile = new File([blob], 'max_homa_iron.mp4', { type: blob.type || 'video/mp4' });
      setFile(sampleFile);
      setResult(null);
      setPoses(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err: any) {
      setError(err?.message || 'Failed to load sample video');
    }
  };

  const analyze = async () => {
    if (!file) { setError('Please choose a video file first.'); return; }
    reset();
    setIsAnalyzing(true);
    try {
      setStep('Initializing...'); setProgress(5);
      const extracted = await extractPosesFromVideo(file, { sampleFps: 30, maxFrames: 600 }, (s, p) => { setStep(s); setProgress(p * 0.6); });
      if (extracted.length < 10) throw new Error('Could not detect enough pose frames. Try a clearer video.');
      setPoses(extracted);

      if (!worker) throw new Error('Worker not available');
      const club = 'driver';
      const swingId = `swing_${Date.now()}`;
      const source = 'upload' as const;

      const analysisPromise = new Promise<any>((resolve, reject) => {
        const onMessage = (e: MessageEvent<WorkerResponse>) => {
          const { type, data } = e.data;
          if (type === 'PROGRESS') {
            setStep(String(data.step || 'Analyzing...'));
            const workerProgress = Number(data.progress || 0);
            setProgress(60 + (workerProgress * 0.4));
          } else if (type === 'SWING_ANALYZED') {
            worker.removeEventListener('message', onMessage as any);
            resolve(data);
          } else if (type === 'ERROR') {
            worker.removeEventListener('message', onMessage as any);
            reject(new Error(data?.error || 'Unknown analysis error'));
          }
        };
        worker.addEventListener('message', onMessage as any);
        worker.postMessage({ type: 'ANALYZE_SWING', data: { poses: extracted, club, swingId, source } });
      });

      const analysis = await analysisPromise;
      setResult(analysis);
      
      // Generate AI analysis
      setStep('Generating AI analysis...');
      const aiAnalyzer = new AISwingAnalyzer();
      const aiResult = await aiAnalyzer.analyze(extracted, analysis.trajectory, analysis.phases, club);
      setAiAnalysis(aiResult);
      
      // Save to progress history
      ProgressTracker.saveAnalysis(aiResult, videoUrl || undefined);
      loadProgressHistory();
      
      setStep('Done'); setProgress(100);
    } catch (err: any) {
      setError(err?.message || 'Failed to analyze video');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6 text-gray-900">
          📤 Upload Video
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Upload your golf swing videos for detailed analysis and personalized feedback.
        </p>
        
        <div className="bg-gray-50 rounded-2xl p-8 md:p-12 mb-12 text-left">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Upload Area</h2>
          <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={onFileChange} />
          {error && <ErrorAlert message={error} className="mb-4" />}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <button onClick={onChooseFile} className="w-full md:w-auto bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all shadow">
              📁 {file ? 'Change File' : 'Choose File'}
            </button>
            <button onClick={analyze} disabled={!file || isAnalyzing} className="w-full md:w-auto bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow">
              🔍 {isAnalyzing ? 'Analyzing...' : 'Analyze Video'}
            </button>
            <button onClick={useTigerSample} disabled={isAnalyzing} className="w-full md:w-auto bg-purple-600 disabled:bg-purple-300 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all shadow">
              🐯 Use Tiger Sample
            </button>
            <button onClick={useAbergSample} disabled={isAnalyzing} className="w-full md:w-auto bg-indigo-600 disabled:bg-indigo-300 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow">
              🇸🇪 Use Åberg Sample
            </button>
            <button onClick={useHomaSample} disabled={isAnalyzing} className="w-full md:w-auto bg-rose-600 disabled:bg-rose-300 text-white px-6 py-3 rounded-xl font-semibold hover:bg-rose-700 transition-all shadow">
              🇺🇸 Use Homa Sample
            </button>
            {file && (
              <span className="text-sm text-gray-600 truncate">Selected: {file.name}</span>
            )}
          </div>

          {(isAnalyzing || progress > 0) && (
            <div className="mt-6">
              <ProgressBar progress={progress} step={step} />
              {isAnalyzing && <LoadingSpinner className="mt-3" size="sm" text="Processing in background" />}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <button onClick={() => { setFile(null); reset(); if (inputRef.current) inputRef.current.value = ''; }} className="w-full sm:w-auto bg-gray-100 text-gray-900 px-10 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center min-w-[200px]">
            Reset
          </button>
          <Link 
            href="/" 
            className="w-full sm:w-auto bg-gray-100 text-gray-900 px-10 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center min-w-[200px]"
          >
            ← Back to Home
          </Link>
        </div>

        {result && (
          <div className="mt-12 text-left">
            <div className="flex border-b border-gray-200 mb-6">
              <button
                className={`py-2 px-4 font-medium ${activeTab === 'video' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('video')}
              >
                Video Analysis
              </button>
              <button
                className={`py-2 px-4 font-medium ${activeTab === 'metrics' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('metrics')}
              >
                Swing Metrics
              </button>
              <button
                className={`py-2 px-4 font-medium ${activeTab === 'progress' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('progress')}
              >
                Progress Tracking
              </button>
            </div>

            {activeTab === 'video' && videoUrl && poses && (
              <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Your Swing with Pose Detection</h2>
                <PoseOverlay videoUrl={videoUrl} poseData={poses} className="mb-6" />
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">How to interpret this visualization:</h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Green dots show your body's key positions throughout the swing</li>
                    <li>Blue lines connect related joints to show alignment</li>
                    <li>Look for smooth, connected movement without sudden jerks</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="space-y-8">
                {aiAnalysis ? (
                  <>
                    {aiAnalysis.grade && <GolfGradeCard grade={aiAnalysis.grade} />}
                    <SwingFeedback analysis={aiAnalysis} />
                    <DrillRecommendations metrics={aiAnalysis.swingMetrics} />
                  </>
                ) : (
                  <div className="text-center py-8">
                    <LoadingSpinner size="lg" text="Generating AI analysis..." />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Progress</h2>
                  <p className="text-gray-600">Track your improvement over time</p>
                </div>

                {progressHistory.length > 0 ? (
                  <>
                    {/* Overall Progress */}
                    <div className="bg-white rounded-lg border p-6">
                      <h3 className="text-lg font-semibold mb-4">Overall Progress</h3>
                      <ProgressChart metric="overall" className="mb-6" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {progressHistory.length}
                          </div>
                          <div className="text-sm text-gray-600">Sessions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {ProgressTracker.getAverageScore().toFixed(0)}
                          </div>
                          <div className="text-sm text-gray-600">Average Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {ProgressTracker.getImprovementRate() > 0 ? '+' : ''}{ProgressTracker.getImprovementRate().toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-600">Improvement Rate</div>
                        </div>
                      </div>
                    </div>

                    {/* Individual Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <ProgressChart metric="tempo" />
                      <ProgressChart metric="rotation" />
                      <ProgressChart metric="balance" />
                      <ProgressChart metric="plane" />
                      <ProgressChart metric="power" />
                      <ProgressChart metric="consistency" />
                    </div>

                    {/* Recent Sessions */}
                    <div className="bg-white rounded-lg border p-6">
                      <h3 className="text-lg font-semibold mb-4">Recent Sessions</h3>
                      <div className="space-y-3">
                        {progressHistory.slice(-5).reverse().map((session, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium">
                                Session {progressHistory.length - index}
                              </div>
                              <div className="text-sm text-gray-600">
                                {new Date(session.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                {session.overallScore}/100
                              </div>
                              {session.grade && (
                                <div className="text-sm text-gray-600">
                                  Grade: {session.grade.overall.letter}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📈</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Progress Data Yet</h3>
                    <p className="text-gray-600 mb-6">
                      Complete your first swing analysis to start tracking your progress!
                    </p>
                    <button
                      onClick={() => setActiveTab('video')}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Analyze Your Swing
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}


