/**
 * Progress Tracking and Analytics System
 * 
 * Comprehensive progress tracking system that monitors user improvement
 * over time, provides analytics, and generates insights for continued
 * development.
 */

import { ProfessionalGrade, ProgressTracking, Milestone, Goal, TrendAnalysis } from './professional-grading-system';
import { DrillRecommendation } from './drill-recommendation-engine';

// 🎯 PROGRESS TRACKING INTERFACES
export interface UserProgress {
  userId: string;
  profile: {
    name: string;
    level: string;
    joinDate: string;
    totalSessions: number;
    currentStreak: number;
    longestStreak: number;
  };
  analytics: {
    overall: ProgressAnalytics;
    categories: { [key: string]: ProgressAnalytics };
    trends: TrendAnalytics;
    insights: ProgressInsight[];
  };
  milestones: {
    achieved: Milestone[];
    upcoming: Milestone[];
    total: number;
  };
  goals: {
    active: Goal[];
    completed: Goal[];
    overdue: Goal[];
  };
  recommendations: {
    nextSteps: string[];
    focusAreas: string[];
    drillSuggestions: DrillRecommendation[];
  };
}

export interface ProgressAnalytics {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  volatility: number;
  consistency: number;
  best: number;
  worst: number;
  average: number;
  median: number;
  standardDeviation: number;
}

export interface TrendAnalytics {
  shortTerm: TrendData; // Last 7 days
  mediumTerm: TrendData; // Last 30 days
  longTerm: TrendData; // Last 90 days
  prediction: TrendPrediction;
}

export interface TrendData {
  direction: 'up' | 'down' | 'stable';
  rate: number; // Change per period
  confidence: number;
  dataPoints: number;
  startValue: number;
  endValue: number;
}

export interface TrendPrediction {
  nextWeek: number;
  nextMonth: number;
  nextQuarter: number;
  confidence: number;
  factors: string[];
}

export interface ProgressInsight {
  type: 'improvement' | 'decline' | 'plateau' | 'breakthrough' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendations: string[];
  data: any;
}

export interface SessionAnalytics {
  sessionId: string;
  timestamp: string;
  duration: number;
  drills: string[];
  performance: {
    overall: number;
    categories: { [key: string]: number };
  };
  improvements: string[];
  challenges: string[];
  nextSession: string[];
}

export interface ComparativeAnalytics {
  vsSelf: {
    improvement: number;
    consistency: number;
    progress: number;
  };
  vsPeers: {
    percentile: number;
    ranking: number;
    totalUsers: number;
  };
  vsProfessionals: {
    similarity: number;
    gaps: string[];
    strengths: string[];
  };
}

// 🚀 PROGRESS TRACKING ANALYTICS CLASS
export class ProgressTrackingAnalytics {
  private userProgress: Map<string, UserProgress> = new Map();
  private sessionHistory: Map<string, SessionAnalytics[]> = new Map();
  private isInitialized = false;

  constructor() {
    this.userProgress = new Map();
    this.sessionHistory = new Map();
  }

  /**
   * Initialize the progress tracking analytics system
   */
  async initialize(): Promise<void> {
    try {
      console.log('📊 PROGRESS ANALYTICS: Initializing progress tracking analytics...');
      
      // Initialize analytics system
      await this.initializeAnalytics();
      
      this.isInitialized = true;
      console.log('✅ PROGRESS ANALYTICS: Progress tracking analytics ready');
      
    } catch (error) {
      console.error('❌ PROGRESS ANALYTICS: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Track user progress
   */
  async trackProgress(
    userId: string,
    professionalGrade: ProfessionalGrade,
    sessionData: any = {}
  ): Promise<UserProgress> {
    if (!this.isInitialized) {
      throw new Error('Progress tracking analytics not initialized');
    }

    try {
      console.log(`📈 PROGRESS TRACKING: Tracking progress for user ${userId}...`);
      
      // Get or create user progress
      let userProgress = this.userProgress.get(userId);
      if (!userProgress) {
        userProgress = await this.createUserProgress(userId);
      }
      
      // Update progress with new grade
      await this.updateUserProgress(userProgress, professionalGrade, sessionData);
      
      // Generate analytics
      const analytics = await this.generateAnalytics(userProgress);
      userProgress.analytics = analytics;
      
      // Check milestones
      const milestones = await this.checkMilestones(userProgress);
      userProgress.milestones = milestones;
      
      // Update goals
      const goals = await this.updateGoals(userProgress);
      userProgress.goals = goals;
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(userProgress);
      userProgress.recommendations = recommendations;
      
      // Store updated progress
      this.userProgress.set(userId, userProgress);
      
      console.log('✅ PROGRESS TRACKING: Progress tracked successfully');
      return userProgress;
      
    } catch (error) {
      console.error('❌ PROGRESS TRACKING: Failed to track progress:', error);
      throw error;
    }
  }

  /**
   * Get user progress analytics
   */
  async getUserProgress(userId: string): Promise<UserProgress | null> {
    if (!this.isInitialized) {
      throw new Error('Progress tracking analytics not initialized');
    }

    return this.userProgress.get(userId) || null;
  }

  /**
   * Get comparative analytics
   */
  async getComparativeAnalytics(userId: string): Promise<ComparativeAnalytics> {
    if (!this.isInitialized) {
      throw new Error('Progress tracking analytics not initialized');
    }

    const userProgress = this.userProgress.get(userId);
    if (!userProgress) {
      throw new Error('User progress not found');
    }

    try {
      console.log(`📊 COMPARATIVE ANALYTICS: Generating comparative analytics for user ${userId}...`);
      
      const comparativeAnalytics: ComparativeAnalytics = {
        vsSelf: await this.calculateSelfComparison(userProgress),
        vsPeers: await this.calculatePeerComparison(userProgress),
        vsProfessionals: await this.calculateProfessionalComparison(userProgress)
      };
      
      console.log('✅ COMPARATIVE ANALYTICS: Comparative analytics generated');
      return comparativeAnalytics;
      
    } catch (error) {
      console.error('❌ COMPARATIVE ANALYTICS: Failed to generate comparative analytics:', error);
      throw error;
    }
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(userId: string, sessionId: string): Promise<SessionAnalytics | null> {
    if (!this.isInitialized) {
      throw new Error('Progress tracking analytics not initialized');
    }

    const userSessions = this.sessionHistory.get(userId) || [];
    return userSessions.find(session => session.sessionId === sessionId) || null;
  }

  /**
   * Get progress insights
   */
  async getProgressInsights(userId: string): Promise<ProgressInsight[]> {
    if (!this.isInitialized) {
      throw new Error('Progress tracking analytics not initialized');
    }

    const userProgress = this.userProgress.get(userId);
    if (!userProgress) {
      return [];
    }

    try {
      console.log(`🔍 PROGRESS INSIGHTS: Generating progress insights for user ${userId}...`);
      
      const insights: ProgressInsight[] = [];
      
      // Analyze overall progress
      const overallInsights = this.analyzeOverallProgress(userProgress);
      insights.push(...overallInsights);
      
      // Analyze category progress
      const categoryInsights = this.analyzeCategoryProgress(userProgress);
      insights.push(...categoryInsights);
      
      // Analyze trends
      const trendInsights = this.analyzeTrends(userProgress);
      insights.push(...trendInsights);
      
      // Analyze milestones
      const milestoneInsights = this.analyzeMilestones(userProgress);
      insights.push(...milestoneInsights);
      
      console.log(`✅ PROGRESS INSIGHTS: Generated ${insights.length} insights`);
      return insights;
      
    } catch (error) {
      console.error('❌ PROGRESS INSIGHTS: Failed to generate insights:', error);
      throw error;
    }
  }

  /**
   * Create user progress
   */
  private async createUserProgress(userId: string): Promise<UserProgress> {
    const userProgress: UserProgress = {
      userId,
      profile: {
        name: `User ${userId}`,
        level: 'beginner',
        joinDate: new Date().toISOString(),
        totalSessions: 0,
        currentStreak: 0,
        longestStreak: 0
      },
      analytics: {
        overall: this.createEmptyAnalytics(),
        categories: {},
        trends: this.createEmptyTrends(),
        insights: []
      },
      milestones: {
        achieved: [],
        upcoming: [],
        total: 0
      },
      goals: {
        active: [],
        completed: [],
        overdue: []
      },
      recommendations: {
        nextSteps: [],
        focusAreas: [],
        drillSuggestions: []
      }
    };
    
    return userProgress;
  }

  /**
   * Update user progress
   */
  private async updateUserProgress(
    userProgress: UserProgress,
    professionalGrade: ProfessionalGrade,
    sessionData: any
  ): Promise<void> {
    // Update profile
    userProgress.profile.totalSessions++;
    userProgress.profile.currentStreak++;
    userProgress.profile.longestStreak = Math.max(
      userProgress.profile.longestStreak,
      userProgress.profile.currentStreak
    );
    
    // Update level based on overall grade
    userProgress.profile.level = professionalGrade.overall.level;
    
    // Store session data
    const sessionAnalytics: SessionAnalytics = {
      sessionId: `session_${Date.now()}`,
      timestamp: new Date().toISOString(),
      duration: sessionData.duration || 30,
      drills: sessionData.drills || [],
      performance: {
        overall: professionalGrade.overall.score,
        categories: Object.fromEntries(
          Object.entries(professionalGrade.categories).map(([key, value]) => [key, value.score])
        )
      },
      improvements: sessionData.improvements || [],
      challenges: sessionData.challenges || [],
      nextSession: sessionData.nextSession || []
    };
    
    const userSessions = this.sessionHistory.get(userProgress.userId) || [];
    userSessions.push(sessionAnalytics);
    this.sessionHistory.set(userProgress.userId, userSessions);
  }

  /**
   * Generate analytics
   */
  private async generateAnalytics(userProgress: UserProgress): Promise<any> {
    const sessions = this.sessionHistory.get(userProgress.userId) || [];
    
    if (sessions.length === 0) {
      return {
        overall: this.createEmptyAnalytics(),
        categories: {},
        trends: this.createEmptyTrends(),
        insights: []
      };
    }
    
    // Calculate overall analytics
    const overallScores = sessions.map(s => s.performance.overall);
    const overallAnalytics = this.calculateAnalytics(overallScores);
    
    // Calculate category analytics
    const categoryAnalytics: { [key: string]: ProgressAnalytics } = {};
    const categories = ['biomechanics', 'timing', 'power', 'accuracy', 'consistency'];
    
    categories.forEach(category => {
      const categoryScores = sessions.map(s => s.performance.categories[category] || 0);
      categoryAnalytics[category] = this.calculateAnalytics(categoryScores);
    });
    
    // Calculate trends
    const trends = this.calculateTrends(sessions);
    
    // Generate insights
    const insights = this.generateInsights(overallAnalytics, categoryAnalytics, trends);
    
    return {
      overall: overallAnalytics,
      categories: categoryAnalytics,
      trends,
      insights
    };
  }

  /**
   * Calculate analytics from scores
   */
  private calculateAnalytics(scores: number[]): ProgressAnalytics {
    if (scores.length === 0) {
      return this.createEmptyAnalytics();
    }
    
    const current = scores[scores.length - 1];
    const previous = scores.length > 1 ? scores[scores.length - 2] : current;
    const change = current - previous;
    const changePercent = previous !== 0 ? (change / previous) * 100 : 0;
    
    const trend = change > 2 ? 'up' : change < -2 ? 'down' : 'stable';
    const volatility = this.calculateVolatility(scores);
    const consistency = this.calculateConsistency(scores);
    
    return {
      current,
      previous,
      change,
      changePercent,
      trend,
      volatility,
      consistency,
      best: Math.max(...scores),
      worst: Math.min(...scores),
      average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      median: this.calculateMedian(scores),
      standardDeviation: this.calculateStandardDeviation(scores)
    };
  }

  /**
   * Calculate trends
   */
  private calculateTrends(sessions: SessionAnalytics[]): TrendAnalytics {
    const scores = sessions.map(s => s.performance.overall);
    
    // Short-term trend (last 7 days)
    const shortTermScores = scores.slice(-7);
    const shortTerm = this.calculateTrendData(shortTermScores);
    
    // Medium-term trend (last 30 days)
    const mediumTermScores = scores.slice(-30);
    const mediumTerm = this.calculateTrendData(mediumTermScores);
    
    // Long-term trend (last 90 days)
    const longTermScores = scores.slice(-90);
    const longTerm = this.calculateTrendData(longTermScores);
    
    // Prediction
    const prediction = this.calculatePrediction(scores);
    
    return {
      shortTerm,
      mediumTerm,
      longTerm,
      prediction
    };
  }

  /**
   * Calculate trend data
   */
  private calculateTrendData(scores: number[]): TrendData {
    if (scores.length < 2) {
      return {
        direction: 'stable',
        rate: 0,
        confidence: 0,
        dataPoints: scores.length,
        startValue: scores[0] || 0,
        endValue: scores[scores.length - 1] || 0
      };
    }
    
    const startValue = scores[0];
    const endValue = scores[scores.length - 1];
    const rate = (endValue - startValue) / scores.length;
    const direction = rate > 0.5 ? 'up' : rate < -0.5 ? 'down' : 'stable';
    const confidence = Math.min(1, scores.length / 10);
    
    return {
      direction,
      rate,
      confidence,
      dataPoints: scores.length,
      startValue,
      endValue
    };
  }

  /**
   * Calculate prediction
   */
  private calculatePrediction(scores: number[]): TrendPrediction {
    if (scores.length < 3) {
      return {
        nextWeek: scores[scores.length - 1] || 0,
        nextMonth: scores[scores.length - 1] || 0,
        nextQuarter: scores[scores.length - 1] || 0,
        confidence: 0,
        factors: ['Insufficient data']
      };
    }
    
    // Simple linear regression for prediction
    const recentScores = scores.slice(-10);
    const trend = this.calculateTrendData(recentScores);
    
    const nextWeek = Math.max(0, Math.min(100, recentScores[recentScores.length - 1] + trend.rate * 7));
    const nextMonth = Math.max(0, Math.min(100, recentScores[recentScores.length - 1] + trend.rate * 30));
    const nextQuarter = Math.max(0, Math.min(100, recentScores[recentScores.length - 1] + trend.rate * 90));
    
    return {
      nextWeek,
      nextMonth,
      nextQuarter,
      confidence: trend.confidence,
      factors: ['Recent performance', 'Trend analysis', 'Consistency']
    };
  }

  /**
   * Check milestones
   */
  private async checkMilestones(userProgress: UserProgress): Promise<any> {
    const sessions = this.sessionHistory.get(userProgress.userId) || [];
    const milestones: Milestone[] = [];
    
    // Define milestone criteria
    const milestoneCriteria = [
      {
        id: 'first-session',
        name: 'First Session',
        description: 'Complete your first practice session',
        achieved: sessions.length >= 1,
        score: 0
      },
      {
        id: 'week-streak',
        name: 'Week Streak',
        description: 'Practice for 7 consecutive days',
        achieved: userProgress.profile.currentStreak >= 7,
        score: 0
      },
      {
        id: 'month-streak',
        name: 'Month Streak',
        description: 'Practice for 30 consecutive days',
        achieved: userProgress.profile.currentStreak >= 30,
        score: 0
      },
      {
        id: 'score-80',
        name: 'Score 80+',
        description: 'Achieve an overall score of 80 or higher',
        achieved: sessions.some(s => s.performance.overall >= 80),
        score: 80
      },
      {
        id: 'score-90',
        name: 'Score 90+',
        description: 'Achieve an overall score of 90 or higher',
        achieved: sessions.some(s => s.performance.overall >= 90),
        score: 90
      }
    ];
    
    const achieved = milestoneCriteria.filter(m => m.achieved);
    const upcoming = milestoneCriteria.filter(m => !m.achieved);
    
    return {
      achieved,
      upcoming,
      total: milestoneCriteria.length
    };
  }

  /**
   * Update goals
   */
  private async updateGoals(userProgress: UserProgress): Promise<any> {
    // This would update user goals based on progress
    // For now, return empty goals
    return {
      active: [],
      completed: [],
      overdue: []
    };
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(userProgress: UserProgress): Promise<any> {
    const sessions = this.sessionHistory.get(userProgress.userId) || [];
    
    if (sessions.length === 0) {
      return {
        nextSteps: ['Start your first practice session'],
        focusAreas: ['Fundamentals'],
        drillSuggestions: []
      };
    }
    
    const nextSteps: string[] = [];
    const focusAreas: string[] = [];
    
    // Analyze recent performance
    const recentScores = sessions.slice(-5).map(s => s.performance.overall);
    const averageScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    
    if (averageScore < 70) {
      nextSteps.push('Focus on fundamentals');
      focusAreas.push('Basic technique');
    } else if (averageScore < 85) {
      nextSteps.push('Improve consistency');
      focusAreas.push('Timing and rhythm');
    } else {
      nextSteps.push('Refine advanced techniques');
      focusAreas.push('Power and accuracy');
    }
    
    return {
      nextSteps,
      focusAreas,
      drillSuggestions: []
    };
  }

  /**
   * Calculate self comparison
   */
  private async calculateSelfComparison(userProgress: UserProgress): Promise<any> {
    const sessions = this.sessionHistory.get(userProgress.userId) || [];
    
    if (sessions.length < 2) {
      return {
        improvement: 0,
        consistency: 0,
        progress: 0
      };
    }
    
    const scores = sessions.map(s => s.performance.overall);
    const improvement = scores[scores.length - 1] - scores[0];
    const consistency = this.calculateConsistency(scores);
    const progress = improvement / scores.length;
    
    return {
      improvement,
      consistency,
      progress
    };
  }

  /**
   * Calculate peer comparison
   */
  private async calculatePeerComparison(userProgress: UserProgress): Promise<any> {
    // This would compare with other users
    // For now, return simulated data
    return {
      percentile: 75,
      ranking: 250,
      totalUsers: 1000
    };
  }

  /**
   * Calculate professional comparison
   */
  private async calculateProfessionalComparison(userProgress: UserProgress): Promise<any> {
    // This would compare with professional standards
    // For now, return simulated data
    return {
      similarity: 0.65,
      gaps: ['Power generation', 'Consistency'],
      strengths: ['Balance', 'Timing']
    };
  }

  /**
   * Generate insights
   */
  private generateInsights(
    overallAnalytics: ProgressAnalytics,
    categoryAnalytics: { [key: string]: ProgressAnalytics },
    trends: TrendAnalytics
  ): ProgressInsight[] {
    const insights: ProgressInsight[] = [];
    
    // Overall progress insight
    if (overallAnalytics.trend === 'up' && overallAnalytics.change > 5) {
      insights.push({
        type: 'improvement',
        title: 'Significant Improvement',
        description: `Your overall score has improved by ${overallAnalytics.change.toFixed(1)} points`,
        impact: 'high',
        actionable: true,
        recommendations: ['Continue current practice routine', 'Focus on maintaining consistency'],
        data: overallAnalytics
      });
    }
    
    // Category insights
    Object.entries(categoryAnalytics).forEach(([category, analytics]) => {
      if (analytics.trend === 'down' && analytics.change < -3) {
        insights.push({
          type: 'decline',
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Decline`,
          description: `Your ${category} score has decreased by ${Math.abs(analytics.change).toFixed(1)} points`,
          impact: 'medium',
          actionable: true,
          recommendations: [`Focus on ${category} drills`, 'Review technique'],
          data: analytics
        });
      }
    });
    
    return insights;
  }

  /**
   * Create empty analytics
   */
  private createEmptyAnalytics(): ProgressAnalytics {
    return {
      current: 0,
      previous: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      volatility: 0,
      consistency: 0,
      best: 0,
      worst: 0,
      average: 0,
      median: 0,
      standardDeviation: 0
    };
  }

  /**
   * Create empty trends
   */
  private createEmptyTrends(): TrendAnalytics {
    return {
      shortTerm: { direction: 'stable', rate: 0, confidence: 0, dataPoints: 0, startValue: 0, endValue: 0 },
      mediumTerm: { direction: 'stable', rate: 0, confidence: 0, dataPoints: 0, startValue: 0, endValue: 0 },
      longTerm: { direction: 'stable', rate: 0, confidence: 0, dataPoints: 0, startValue: 0, endValue: 0 },
      prediction: { nextWeek: 0, nextMonth: 0, nextQuarter: 0, confidence: 0, factors: [] }
    };
  }

  /**
   * Calculate volatility
   */
  private calculateVolatility(scores: number[]): number {
    if (scores.length < 2) return 0;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate consistency
   */
  private calculateConsistency(scores: number[]): number {
    if (scores.length < 2) return 1;
    
    const volatility = this.calculateVolatility(scores);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.max(0, 1 - (volatility / mean));
  }

  /**
   * Calculate median
   */
  private calculateMedian(scores: number[]): number {
    const sorted = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(scores: number[]): number {
    if (scores.length < 2) return 0;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    return Math.sqrt(variance);
  }

  /**
   * Analyze overall progress
   */
  private analyzeOverallProgress(userProgress: UserProgress): ProgressInsight[] {
    // This would analyze overall progress
    return [];
  }

  /**
   * Analyze category progress
   */
  private analyzeCategoryProgress(userProgress: UserProgress): ProgressInsight[] {
    // This would analyze category progress
    return [];
  }

  /**
   * Analyze trends
   */
  private analyzeTrends(userProgress: UserProgress): ProgressInsight[] {
    // This would analyze trends
    return [];
  }

  /**
   * Analyze milestones
   */
  private analyzeMilestones(userProgress: UserProgress): ProgressInsight[] {
    // This would analyze milestones
    return [];
  }

  /**
   * Initialize analytics
   */
  private async initializeAnalytics(): Promise<void> {
    console.log('📊 ANALYTICS: Initializing analytics system...');
    
    // This would initialize the analytics system
    // For now, simulate initialization
    console.log('✅ ANALYTICS: Analytics system initialized');
  }

  /**
   * Get analytics statistics
   */
  getAnalyticsStats(): any {
    return {
      isInitialized: this.isInitialized,
      usersTracked: this.userProgress.size,
      totalSessions: Array.from(this.sessionHistory.values()).flat().length,
      averageSessionsPerUser: this.calculateAverageSessionsPerUser()
    };
  }

  /**
   * Calculate average sessions per user
   */
  private calculateAverageSessionsPerUser(): number {
    const totalSessions = Array.from(this.sessionHistory.values()).flat().length;
    const totalUsers = this.userProgress.size;
    return totalUsers > 0 ? totalSessions / totalUsers : 0;
  }

  /**
   * Clear all data
   */
  clearData(): void {
    this.userProgress.clear();
    this.sessionHistory.clear();
    this.isInitialized = false;
  }
}

// 🎯 UTILITY FUNCTIONS

/**
 * Create a new progress tracking analytics system
 */
export function createProgressTrackingAnalytics(): ProgressTrackingAnalytics {
  return new ProgressTrackingAnalytics();
}

/**
 * Quick progress tracking
 */
export async function trackUserProgress(
  userId: string,
  professionalGrade: ProfessionalGrade,
  sessionData: any = {}
): Promise<UserProgress> {
  const analytics = createProgressTrackingAnalytics();
  await analytics.initialize();
  
  try {
    const progress = await analytics.trackProgress(userId, professionalGrade, sessionData);
    return progress;
  } finally {
    analytics.clearData();
  }
}

export default ProgressTrackingAnalytics;
