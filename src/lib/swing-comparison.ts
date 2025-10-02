import { PoseResult } from './mediapipe';
import { RealGolfAnalysis } from './real-golf-analysis';

export interface ComparisonInput {
	fileLeft: File;
	fileRight: File;
	posesLeft?: PoseResult[];
	posesRight?: PoseResult[];
	analysisLeft?: RealGolfAnalysis;
	analysisRight?: RealGolfAnalysis;
}

export class SwingComparison {
	async createComparisonView(input: ComparisonInput): Promise<HTMLDivElement> {
		const container = document.createElement('div');
		container.style.display = 'grid';
		container.style.gridTemplateColumns = '1fr 1fr';
		container.style.gap = '8px';

		const leftVideo = document.createElement('video');
		leftVideo.src = URL.createObjectURL(input.fileLeft);
		leftVideo.controls = true;
		leftVideo.playsInline = true as any;
		leftVideo.style.width = '100%';

		const rightVideo = document.createElement('video');
		rightVideo.src = URL.createObjectURL(input.fileRight);
		rightVideo.controls = true;
		rightVideo.playsInline = true as any;
		rightVideo.style.width = '100%';

		// Sync playback
		const sync = (from: HTMLVideoElement, to: HTMLVideoElement) => {
			to.currentTime = (from.currentTime / from.duration) * to.duration;
			if (!to.paused && from.paused) to.pause();
			if (to.paused && !from.paused) to.play().catch(() => {});
		};

		leftVideo.addEventListener('timeupdate', () => sync(leftVideo, rightVideo));
		rightVideo.addEventListener('timeupdate', () => sync(rightVideo, leftVideo));

		container.appendChild(leftVideo);
		container.appendChild(rightVideo);
		return container;
	}
}

import type { PoseResult } from './mediapipe';
import type { EnhancedSwingPhase } from './enhanced-swing-phases';
import type { ProfessionalGolfMetrics } from './professional-golf-metrics';

export interface SwingSession {
  id: string;
  timestamp: Date;
  poses: PoseResult[];
  phases: EnhancedSwingPhase[];
  metrics: ProfessionalGolfMetrics;
  tags: string[];
  category: SwingCategory;
  notes: string;
  bestSwing: boolean;
  sessionName: string;
  location?: string;
  weather?: string;
  equipment?: string;
}

export interface ProGolferSwing {
  id: string;
  golferName: string;
  golferInfo: {
    name: string;
    ranking: number;
    specialty: string;
    achievements: string[];
  };
  swingData: {
    poses: PoseResult[];
    phases: EnhancedSwingPhase[];
    metrics: ProfessionalGolfMetrics;
  };
  swingType: 'driver' | 'iron' | 'wedge' | 'putter';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  description: string;
  keyPoints: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface SwingComparisonData {
  userSwing: SwingSession;
  proSwing: ProGolferSwing;
  comparisonMetrics: {
    clubPathDifference: number;
    swingPlaneDifference: number;
    weightTransferDifference: number;
    spineAngleDifference: number;
    headStabilityDifference: number;
    overallDifference: number;
  };
  recommendations: string[];
  similarityScore: number;
  improvementAreas: string[];
}

export interface ProgressTracking {
  userId: string;
  sessions: SwingSession[];
  progressMetrics: {
    overallScore: number[];
    clubPathEfficiency: number[];
    swingPlaneEfficiency: number[];
    weightTransferEfficiency: number[];
    spineAngleConsistency: number[];
    headStability: number[];
  };
  improvementTrends: {
    metric: string;
    trend: 'improving' | 'declining' | 'stable';
    change: number;
    period: string;
  }[];
  milestones: {
    date: Date;
    achievement: string;
    metric: string;
    value: number;
  }[];
}

export interface SwingLibrary {
  sessions: SwingSession[];
  categories: SwingCategory[];
  tags: string[];
  filters: {
    dateRange?: { start: Date; end: Date };
    category?: SwingCategory;
    tags?: string[];
    bestSwings?: boolean;
    scoreRange?: { min: number; max: number };
  };
}

export type SwingCategory = 
  | 'practice' 
  | 'lesson' 
  | 'tournament' 
  | 'warmup' 
  | 'drill' 
  | 'analysis' 
  | 'comparison' 
  | 'improvement';

export interface SwingComparisonResult {
  userSwing: SwingSession;
  proSwing: ProGolferSwing;
  sideBySideData: {
    userPoses: PoseResult[];
    proPoses: PoseResult[];
    userPhases: EnhancedSwingPhase[];
    proPhases: EnhancedSwingPhase[];
    userMetrics: ProfessionalGolfMetrics;
    proMetrics: ProfessionalGolfMetrics;
  };
  comparisonAnalysis: {
    timingComparison: {
      userTiming: number[];
      proTiming: number[];
      timingDifference: number;
    };
    positionComparison: {
      userPositions: { [key: string]: { x: number; y: number } }[];
      proPositions: { [key: string]: { x: number; y: number } }[];
      positionDifferences: number[];
    };
    efficiencyComparison: {
      userEfficiency: number;
      proEfficiency: number;
      efficiencyGap: number;
    };
  };
  recommendations: string[];
  similarityScore: number;
}

/**
 * Compare user swing with professional golfer swing
 */
export function compareSwingWithPro(
  userSwing: SwingSession,
  proSwing: ProGolferSwing
): SwingComparisonResult {
  // Extract comparison data
  const sideBySideData = {
    userPoses: userSwing.poses,
    proPoses: proSwing.swingData.poses,
    userPhases: userSwing.phases,
    proPhases: proSwing.swingData.phases,
    userMetrics: userSwing.metrics,
    proMetrics: proSwing.swingData.metrics
  };

  // Perform timing comparison
  const timingComparison = compareSwingTiming(userSwing, proSwing);
  
  // Perform position comparison
  const positionComparison = compareSwingPositions(userSwing, proSwing);
  
  // Perform efficiency comparison
  const efficiencyComparison = compareSwingEfficiency(userSwing, proSwing);
  
  // Calculate similarity score
  const similarityScore = calculateSimilarityScore(
    timingComparison,
    positionComparison,
    efficiencyComparison
  );
  
  // Generate recommendations
  const recommendations = generateComparisonRecommendations(
    timingComparison,
    positionComparison,
    efficiencyComparison
  );

  return {
    userSwing,
    proSwing,
    sideBySideData,
    comparisonAnalysis: {
      timingComparison,
      positionComparison,
      efficiencyComparison
    },
    recommendations,
    similarityScore
  };
}

/**
 * Track progress over multiple sessions
 */
export function trackSwingProgress(sessions: SwingSession[]): ProgressTracking {
  if (sessions.length === 0) {
    return {
      userId: '',
      sessions: [],
      progressMetrics: {
        overallScore: [],
        clubPathEfficiency: [],
        swingPlaneEfficiency: [],
        weightTransferEfficiency: [],
        spineAngleConsistency: [],
        headStability: []
      },
      improvementTrends: [],
      milestones: []
    };
  }

  // Extract progress metrics
  const progressMetrics = {
    overallScore: sessions.map(s => s.metrics.overallProfessionalScore),
    clubPathEfficiency: sessions.map(s => s.metrics.clubPath.pathEfficiency),
    swingPlaneEfficiency: sessions.map(s => s.metrics.swingPlane.efficiencyScore),
    weightTransferEfficiency: sessions.map(s => s.metrics.weightTransfer.transferEfficiency),
    spineAngleConsistency: sessions.map(s => s.metrics.spineAngle.consistencyScore),
    headStability: sessions.map(s => s.metrics.headStability.stabilityScore)
  };

  // Calculate improvement trends
  const improvementTrends = calculateImprovementTrends(progressMetrics, sessions);
  
  // Identify milestones
  const milestones = identifyMilestones(progressMetrics, sessions);

  return {
    userId: sessions[0]?.id || '',
    sessions,
    progressMetrics,
    improvementTrends,
    milestones
  };
}

/**
 * Manage swing library with tagging and categorization
 */
export function manageSwingLibrary(
  sessions: SwingSession[],
  filters: SwingLibrary['filters'] = {}
): SwingLibrary {
  // Apply filters
  let filteredSessions = sessions;

  if (filters.dateRange) {
    filteredSessions = filteredSessions.filter(session => 
      session.timestamp >= filters.dateRange!.start && 
      session.timestamp <= filters.dateRange!.end
    );
  }

  if (filters.category) {
    filteredSessions = filteredSessions.filter(session => 
      session.category === filters.category
    );
  }

  if (filters.tags && filters.tags.length > 0) {
    filteredSessions = filteredSessions.filter(session => 
      filters.tags!.some(tag => session.tags.includes(tag))
    );
  }

  if (filters.bestSwings) {
    filteredSessions = filteredSessions.filter(session => session.bestSwing);
  }

  if (filters.scoreRange) {
    filteredSessions = filteredSessions.filter(session => 
      session.metrics.overallProfessionalScore >= filters.scoreRange!.min &&
      session.metrics.overallProfessionalScore <= filters.scoreRange!.max
    );
  }

  // Extract categories and tags
  const categories = Array.from(new Set(sessions.map(s => s.category)));
  const tags = Array.from(new Set(sessions.flatMap(s => s.tags)));

  return {
    sessions: filteredSessions,
    categories: categories as SwingCategory[],
    tags,
    filters
  };
}

/**
 * Find best swing of the session
 */
export function findBestSwingOfSession(sessions: SwingSession[]): SwingSession | null {
  if (sessions.length === 0) return null;

  // Find session with highest overall score
  const bestSession = sessions.reduce((best, current) => 
    current.metrics.overallProfessionalScore > best.metrics.overallProfessionalScore 
      ? current 
      : best
  );

  return bestSession;
}

/**
 * Highlight best swing characteristics
 */
export function highlightBestSwingCharacteristics(bestSwing: SwingSession): {
  strengths: string[];
  metrics: { [key: string]: number };
  recommendations: string[];
} {
  const strengths: string[] = [];
  const metrics = {
    overallScore: bestSwing.metrics.overallProfessionalScore,
    clubPathEfficiency: bestSwing.metrics.clubPath.pathEfficiency,
    swingPlaneEfficiency: bestSwing.metrics.swingPlane.efficiencyScore,
    weightTransferEfficiency: bestSwing.metrics.weightTransfer.transferEfficiency,
    spineAngleConsistency: bestSwing.metrics.spineAngle.consistencyScore,
    headStability: bestSwing.metrics.headStability.stabilityScore
  };

  // Identify strengths
  if (bestSwing.metrics.clubPath.pathEfficiency > 0.8) {
    strengths.push('Excellent club path efficiency');
  }
  if (bestSwing.metrics.swingPlane.efficiencyScore > 0.8) {
    strengths.push('Outstanding swing plane consistency');
  }
  if (bestSwing.metrics.weightTransfer.transferEfficiency > 0.8) {
    strengths.push('Perfect weight transfer timing');
  }
  if (bestSwing.metrics.spineAngle.consistencyScore > 0.8) {
    strengths.push('Consistent spine angle throughout swing');
  }
  if (bestSwing.metrics.headStability.stabilityScore > 0.8) {
    strengths.push('Excellent head stability');
  }

  // Generate recommendations for maintaining strengths
  const recommendations = generateMaintenanceRecommendations(bestSwing.metrics);

  return {
    strengths,
    metrics,
    recommendations
  };
}

// Helper functions

function compareSwingTiming(userSwing: SwingSession, proSwing: ProGolferSwing): {
  userTiming: number[];
  proTiming: number[];
  timingDifference: number;
} {
  // Calculate timing for each phase
  const userTiming = userSwing.phases.map(phase => phase.endTime - phase.startTime);
  const proTiming = proSwing.swingData.phases.map(phase => phase.endTime - phase.startTime);
  
  // Calculate timing difference
  const timingDifference = userTiming.reduce((sum, time, index) => 
    sum + Math.abs(time - (proTiming[index] || 0)), 0
  ) / userTiming.length;

  return {
    userTiming,
    proTiming,
    timingDifference
  };
}

function compareSwingPositions(userSwing: SwingSession, proSwing: ProGolferSwing): {
  userPositions: { [key: string]: { x: number; y: number } }[];
  proPositions: { [key: string]: { x: number; y: number } }[];
  positionDifferences: number[];
} {
  const userPositions = userSwing.poses.map(pose => {
    if (!pose.landmarks) return {};
    return pose.landmarks.reduce((acc, landmark, index) => {
      acc[`landmark_${index}`] = { x: landmark.x, y: landmark.y };
      return acc;
    }, {} as { [key: string]: { x: number; y: number } });
  });

  const proPositions = proSwing.swingData.poses.map(pose => {
    if (!pose.landmarks) return {};
    return pose.landmarks.reduce((acc, landmark, index) => {
      acc[`landmark_${index}`] = { x: landmark.x, y: landmark.y };
      return acc;
    }, {} as { [key: string]: { x: number; y: number } });
  });

  // Calculate position differences
  const positionDifferences = userPositions.map((userPos, index) => {
    const proPos = proPositions[index];
    if (!proPos) return 0;
    
    return Object.keys(userPos).reduce((sum, key) => {
      const userPoint = userPos[key];
      const proPoint = proPos[key];
      if (!proPoint) return sum;
      
      const distance = Math.sqrt(
        Math.pow(userPoint.x - proPoint.x, 2) + 
        Math.pow(userPoint.y - proPoint.y, 2)
      );
      return sum + distance;
    }, 0) / Object.keys(userPos).length;
  });

  return {
    userPositions,
    proPositions,
    positionDifferences
  };
}

function compareSwingEfficiency(userSwing: SwingSession, proSwing: ProGolferSwing): {
  userEfficiency: number;
  proEfficiency: number;
  efficiencyGap: number;
} {
  const userEfficiency = userSwing.metrics.overallProfessionalScore;
  const proEfficiency = proSwing.swingData.metrics.overallProfessionalScore;
  const efficiencyGap = Math.abs(userEfficiency - proEfficiency);

  return {
    userEfficiency,
    proEfficiency,
    efficiencyGap
  };
}

function calculateSimilarityScore(
  timingComparison: any,
  positionComparison: any,
  efficiencyComparison: any
): number {
  // Weight different aspects of comparison
  const timingScore = Math.max(0, 1 - (timingComparison.timingDifference / 2));
  const positionScore = Math.max(0, 1 - (positionComparison.positionDifferences.reduce((sum: number, diff: number) => sum + diff, 0) / positionComparison.positionDifferences.length));
  const efficiencyScore = Math.max(0, 1 - efficiencyComparison.efficiencyGap);

  // Weighted average
  return (timingScore * 0.3 + positionScore * 0.4 + efficiencyScore * 0.3);
}

function generateComparisonRecommendations(
  timingComparison: any,
  positionComparison: any,
  efficiencyComparison: any
): string[] {
  const recommendations: string[] = [];

  if (timingComparison.timingDifference > 0.5) {
    recommendations.push('Work on swing timing to match professional tempo');
  }

  if (positionComparison.positionDifferences.some((diff: number) => diff > 0.1)) {
    recommendations.push('Focus on body positioning to match professional form');
  }

  if (efficiencyComparison.efficiencyGap > 0.2) {
    recommendations.push('Improve overall swing efficiency to reach professional level');
  }

  if (recommendations.length === 0) {
    recommendations.push('Excellent swing! Very close to professional standard');
  }

  return recommendations;
}

function calculateImprovementTrends(
  progressMetrics: any,
  sessions: SwingSession[]
): { metric: string; trend: 'improving' | 'declining' | 'stable'; change: number; period: string }[] {
  const trends: { metric: string; trend: 'improving' | 'declining' | 'stable'; change: number; period: string }[] = [];
  
  const metrics = ['overallScore', 'clubPathEfficiency', 'swingPlaneEfficiency', 'weightTransferEfficiency', 'spineAngleConsistency', 'headStability'];
  
  metrics.forEach(metric => {
    const values = progressMetrics[metric];
    if (values.length < 2) return;
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const change = secondAvg - firstAvg;
    const trend = change > 0.05 ? 'improving' : change < -0.05 ? 'declining' : 'stable';
    
    trends.push({
      metric,
      trend,
      change,
      period: `${sessions.length} sessions`
    });
  });
  
  return trends;
}

function identifyMilestones(
  progressMetrics: any,
  sessions: SwingSession[]
): { date: Date; achievement: string; metric: string; value: number }[] {
  const milestones: { date: Date; achievement: string; metric: string; value: number }[] = [];
  
  // Find best scores for each metric
  const metrics = ['overallScore', 'clubPathEfficiency', 'swingPlaneEfficiency', 'weightTransferEfficiency', 'spineAngleConsistency', 'headStability'];
  
  metrics.forEach(metric => {
    const values = progressMetrics[metric];
    if (values.length === 0) return;
    
    const maxValue = Math.max(...values);
    const maxIndex = values.indexOf(maxValue);
    const session = sessions[maxIndex];
    
    if (maxValue > 0.8) {
      milestones.push({
        date: session.timestamp,
        achievement: `Best ${metric} score achieved`,
        metric,
        value: maxValue
      });
    }
  });
  
  return milestones;
}

function generateMaintenanceRecommendations(metrics: ProfessionalGolfMetrics): string[] {
  const recommendations: string[] = [];
  
  if (metrics.clubPath.pathEfficiency > 0.8) {
    recommendations.push('Maintain your excellent club path efficiency');
  }
  
  if (metrics.swingPlane.efficiencyScore > 0.8) {
    recommendations.push('Keep up your consistent swing plane');
  }
  
  if (metrics.weightTransfer.transferEfficiency > 0.8) {
    recommendations.push('Continue your smooth weight transfer');
  }
  
  if (metrics.spineAngle.consistencyScore > 0.8) {
    recommendations.push('Maintain your stable spine angle');
  }
  
  if (metrics.headStability.stabilityScore > 0.8) {
    recommendations.push('Keep your head stable throughout the swing');
  }
  
  return recommendations;
}
