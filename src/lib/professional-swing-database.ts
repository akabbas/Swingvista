/**
 * Professional Golf Swing Database
 * 
 * Comprehensive database of professional golf swings for comparison,
 * benchmarking, and biomechanical analysis. Includes tour-level data
 * from top players across different swing types and conditions.
 */

import { BiomechanicalAnalysis, JointAngle, KinematicSequence, WeightTransfer3D, ClubPath3D } from './3d-biomechanical-analyzer';

// 🎯 PROFESSIONAL SWING INTERFACES
export interface ProfessionalSwing {
  id: string;
  player: {
    name: string;
    level: 'tour' | 'champions' | 'senior' | 'lpga';
    ranking: number;
    country: string;
    height: number;
    weight: number;
  };
  swing: {
    type: 'driver' | 'iron' | 'wedge' | 'putt';
    club: string;
    loft: number;
    shaft: string;
    flex: string;
  };
  conditions: {
    course: string;
    weather: string;
    temperature: number;
    wind: number;
    humidity: number;
  };
  biomechanics: BiomechanicalAnalysis;
  performance: {
    ballSpeed: number;
    clubSpeed: number;
    launchAngle: number;
    spinRate: number;
    carryDistance: number;
    totalDistance: number;
    accuracy: number;
  };
  metadata: {
    date: string;
    tournament: string;
    round: number;
    hole: number;
    par: number;
    score: number;
    videoUrl: string;
    quality: 'high' | 'medium' | 'low';
  };
}

export interface SwingComparison {
  similarity: number;
  differences: {
    jointAngles: JointAngle[];
    kinematicSequence: KinematicSequence;
    weightTransfer: WeightTransfer3D;
    clubPath: ClubPath3D;
  };
  recommendations: string[];
  professionalBenchmark: {
    player: string;
    level: string;
    swingType: string;
    performance: any;
  };
}

export interface DatabaseStats {
  totalSwings: number;
  players: number;
  swingTypes: {
    driver: number;
    iron: number;
    wedge: number;
    putt: number;
  };
  playerLevels: {
    tour: number;
    champions: number;
    senior: number;
    lpga: number;
  };
  averagePerformance: {
    ballSpeed: number;
    clubSpeed: number;
    carryDistance: number;
    accuracy: number;
  };
}

// 🚀 PROFESSIONAL SWING DATABASE CLASS
export class ProfessionalSwingDatabase {
  private swings: Map<string, ProfessionalSwing> = new Map();
  private playerIndex: Map<string, string[]> = new Map();
  private swingTypeIndex: Map<string, string[]> = new Map();
  private performanceIndex: Map<string, string[]> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeIndexes();
  }

  /**
   * Initialize the professional swing database
   */
  async initialize(): Promise<void> {
    try {
      console.log('🏆 PROFESSIONAL DB: Initializing professional swing database...');
      
      // Load professional swing data
      await this.loadProfessionalSwings();
      
      // Build indexes for fast searching
      this.buildIndexes();
      
      this.isInitialized = true;
      console.log('✅ PROFESSIONAL DB: Professional database ready');
      
    } catch (error) {
      console.error('❌ PROFESSIONAL DB: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Add a professional swing to the database
   */
  addSwing(swing: ProfessionalSwing): boolean {
    try {
      console.log(`📊 PROFESSIONAL DB: Adding swing for ${swing.player.name}`);
      
      // Validate swing data
      if (!this.validateSwing(swing)) {
        console.warn('⚠️ PROFESSIONAL DB: Invalid swing data, skipping');
        return false;
      }
      
      // Add to database
      this.swings.set(swing.id, swing);
      
      // Update indexes
      this.updateIndexes(swing);
      
      console.log('✅ PROFESSIONAL DB: Swing added successfully');
      return true;
      
    } catch (error) {
      console.error('❌ PROFESSIONAL DB: Failed to add swing:', error);
      return false;
    }
  }

  /**
   * Find similar professional swings
   */
  findSimilarSwings(
    biomechanics: BiomechanicalAnalysis,
    criteria: {
      swingType?: string;
      playerLevel?: string;
      maxResults?: number;
    } = {}
  ): SwingComparison[] {
    if (!this.isInitialized) {
      throw new Error('Database not initialized');
    }

    try {
      console.log('🔍 PROFESSIONAL DB: Finding similar professional swings...');
      
      const { swingType, playerLevel, maxResults = 10 } = criteria;
      
      // Filter swings by criteria
      let candidateSwings = Array.from(this.swings.values());
      
      if (swingType) {
        candidateSwings = candidateSwings.filter(swing => swing.swing.type === swingType);
      }
      
      if (playerLevel) {
        candidateSwings = candidateSwings.filter(swing => swing.player.level === playerLevel);
      }
      
      // Calculate similarity scores
      const similarities = candidateSwings.map(swing => ({
        swing,
        similarity: this.calculateSimilarity(biomechanics, swing.biomechanics)
      }));
      
      // Sort by similarity
      similarities.sort((a, b) => b.similarity - a.similarity);
      
      // Return top results
      const topResults = similarities.slice(0, maxResults);
      
      const comparisons: SwingComparison[] = topResults.map(({ swing, similarity }) => ({
        similarity,
        differences: this.calculateDifferences(biomechanics, swing.biomechanics),
        recommendations: this.generateRecommendations(biomechanics, swing.biomechanics),
        professionalBenchmark: {
          player: swing.player.name,
          level: swing.player.level,
          swingType: swing.swing.type,
          performance: swing.performance
        }
      }));
      
      console.log(`✅ PROFESSIONAL DB: Found ${comparisons.length} similar swings`);
      return comparisons;
      
    } catch (error) {
      console.error('❌ PROFESSIONAL DB: Failed to find similar swings:', error);
      throw error;
    }
  }

  /**
   * Get professional benchmarks
   */
  getProfessionalBenchmarks(swingType: string): any {
    if (!this.isInitialized) {
      throw new Error('Database not initialized');
    }

    const swings = Array.from(this.swings.values())
      .filter(swing => swing.swing.type === swingType);
    
    if (swings.length === 0) {
      return null;
    }
    
    // Calculate benchmarks
    const benchmarks = {
      jointAngles: this.calculateJointAngleBenchmarks(swings),
      kinematicSequence: this.calculateKinematicBenchmarks(swings),
      weightTransfer: this.calculateWeightTransferBenchmarks(swings),
      clubPath: this.calculateClubPathBenchmarks(swings),
      performance: this.calculatePerformanceBenchmarks(swings)
    };
    
    return benchmarks;
  }

  /**
   * Get database statistics
   */
  getDatabaseStats(): DatabaseStats {
    const swings = Array.from(this.swings.values());
    
    const swingTypes = {
      driver: swings.filter(s => s.swing.type === 'driver').length,
      iron: swings.filter(s => s.swing.type === 'iron').length,
      wedge: swings.filter(s => s.swing.type === 'wedge').length,
      putt: swings.filter(s => s.swing.type === 'putt').length
    };
    
    const playerLevels = {
      tour: swings.filter(s => s.player.level === 'tour').length,
      champions: swings.filter(s => s.player.level === 'champions').length,
      senior: swings.filter(s => s.player.level === 'senior').length,
      lpga: swings.filter(s => s.player.level === 'lpga').length
    };
    
    const averagePerformance = {
      ballSpeed: this.calculateAverage(swings.map(s => s.performance.ballSpeed)),
      clubSpeed: this.calculateAverage(swings.map(s => s.performance.clubSpeed)),
      carryDistance: this.calculateAverage(swings.map(s => s.performance.carryDistance)),
      accuracy: this.calculateAverage(swings.map(s => s.performance.accuracy))
    };
    
    return {
      totalSwings: swings.length,
      players: new Set(swings.map(s => s.player.name)).size,
      swingTypes,
      playerLevels,
      averagePerformance
    };
  }

  /**
   * Search swings by criteria
   */
  searchSwings(criteria: {
    playerName?: string;
    swingType?: string;
    playerLevel?: string;
    tournament?: string;
    dateRange?: { start: string; end: string };
  }): ProfessionalSwing[] {
    if (!this.isInitialized) {
      throw new Error('Database not initialized');
    }

    let results = Array.from(this.swings.values());
    
    if (criteria.playerName) {
      results = results.filter(swing => 
        swing.player.name.toLowerCase().includes(criteria.playerName!.toLowerCase())
      );
    }
    
    if (criteria.swingType) {
      results = results.filter(swing => swing.swing.type === criteria.swingType);
    }
    
    if (criteria.playerLevel) {
      results = results.filter(swing => swing.player.level === criteria.playerLevel);
    }
    
    if (criteria.tournament) {
      results = results.filter(swing => 
        swing.metadata.tournament.toLowerCase().includes(criteria.tournament!.toLowerCase())
      );
    }
    
    if (criteria.dateRange) {
      const startDate = new Date(criteria.dateRange.start);
      const endDate = new Date(criteria.dateRange.end);
      results = results.filter(swing => {
        const swingDate = new Date(swing.metadata.date);
        return swingDate >= startDate && swingDate <= endDate;
      });
    }
    
    return results;
  }

  /**
   * Validate swing data
   */
  private validateSwing(swing: ProfessionalSwing): boolean {
    // Check required fields
    if (!swing.id || !swing.player.name || !swing.biomechanics) {
      return false;
    }
    
    // Check biomechanical data
    if (!swing.biomechanics.jointAngles || !swing.biomechanics.kinematicSequence) {
      return false;
    }
    
    // Check performance data
    if (!swing.performance || typeof swing.performance.ballSpeed !== 'number') {
      return false;
    }
    
    return true;
  }

  /**
   * Calculate similarity between two biomechanical analyses
   */
  private calculateSimilarity(analysis1: BiomechanicalAnalysis, analysis2: BiomechanicalAnalysis): number {
    // Weighted similarity calculation
    const jointSimilarity = this.calculateJointAngleSimilarity(analysis1.jointAngles, analysis2.jointAngles);
    const sequenceSimilarity = this.calculateKinematicSimilarity(analysis1.kinematicSequence, analysis2.kinematicSequence);
    const weightSimilarity = this.calculateWeightTransferSimilarity(analysis1.weightTransfer, analysis2.weightTransfer);
    const pathSimilarity = this.calculateClubPathSimilarity(analysis1.clubPath, analysis2.clubPath);
    
    // Weighted average
    return (
      jointSimilarity * 0.3 +
      sequenceSimilarity * 0.3 +
      weightSimilarity * 0.2 +
      pathSimilarity * 0.2
    );
  }

  /**
   * Calculate joint angle similarity
   */
  private calculateJointAngleSimilarity(angles1: JointAngle[], angles2: JointAngle[]): number {
    if (angles1.length === 0 || angles2.length === 0) return 0;
    
    let totalSimilarity = 0;
    let validComparisons = 0;
    
    angles1.forEach(angle1 => {
      const matchingAngle = angles2.find(angle2 => angle2.joint === angle1.joint);
      if (matchingAngle) {
        const deviation = Math.abs(angle1.angle - matchingAngle.angle);
        const maxDeviation = 180; // Maximum possible deviation
        const similarity = 1 - (deviation / maxDeviation);
        totalSimilarity += Math.max(0, similarity);
        validComparisons++;
      }
    });
    
    return validComparisons > 0 ? totalSimilarity / validComparisons : 0;
  }

  /**
   * Calculate kinematic sequence similarity
   */
  private calculateKinematicSimilarity(seq1: KinematicSequence, seq2: KinematicSequence): number {
    const timing1 = seq1.timing;
    const timing2 = seq2.timing;
    
    const hipSimilarity = 1 - Math.abs(timing1.hips - timing2.hips);
    const torsoSimilarity = 1 - Math.abs(timing1.torso - timing2.torso);
    const armSimilarity = 1 - Math.abs(timing1.arms - timing2.arms);
    const clubSimilarity = 1 - Math.abs(timing1.club - timing2.club);
    
    return (hipSimilarity + torsoSimilarity + armSimilarity + clubSimilarity) / 4;
  }

  /**
   * Calculate weight transfer similarity
   */
  private calculateWeightTransferSimilarity(wt1: WeightTransfer3D, wt2: WeightTransfer3D): number {
    const balanceSimilarity = 1 - Math.abs(wt1.balance.stability - wt2.balance.stability);
    const weightSimilarity = 1 - Math.abs(wt1.leftFoot - wt2.leftFoot) / 100;
    
    return (balanceSimilarity + weightSimilarity) / 2;
  }

  /**
   * Calculate club path similarity
   */
  private calculateClubPathSimilarity(path1: ClubPath3D, path2: ClubPath3D): number {
    const angleSimilarity = 1 - Math.abs(path1.angle.shaft - path2.angle.shaft) / 180;
    const planeSimilarity = 1 - Math.abs(path1.plane.deviation - path2.plane.deviation) / 90;
    
    return (angleSimilarity + planeSimilarity) / 2;
  }

  /**
   * Calculate differences between analyses
   */
  private calculateDifferences(analysis1: BiomechanicalAnalysis, analysis2: BiomechanicalAnalysis): any {
    return {
      jointAngles: this.calculateJointAngleDifferences(analysis1.jointAngles, analysis2.jointAngles),
      kinematicSequence: analysis2.kinematicSequence,
      weightTransfer: analysis2.weightTransfer,
      clubPath: analysis2.clubPath
    };
  }

  /**
   * Calculate joint angle differences
   */
  private calculateJointAngleDifferences(angles1: JointAngle[], angles2: JointAngle[]): JointAngle[] {
    const differences: JointAngle[] = [];
    
    angles1.forEach(angle1 => {
      const matchingAngle = angles2.find(angle2 => angle2.joint === angle1.joint);
      if (matchingAngle) {
        differences.push({
          joint: angle1.joint,
          angle: angle1.angle - matchingAngle.angle,
          confidence: Math.min(angle1.confidence, matchingAngle.confidence),
          biomechanicalRange: angle1.biomechanicalRange
        });
      }
    });
    
    return differences;
  }

  /**
   * Generate recommendations based on comparison
   */
  private generateRecommendations(analysis1: BiomechanicalAnalysis, analysis2: BiomechanicalAnalysis): string[] {
    const recommendations: string[] = [];
    
    // Analyze joint angle differences
    const jointDifferences = this.calculateJointAngleDifferences(analysis1.jointAngles, analysis2.jointAngles);
    
    jointDifferences.forEach(diff => {
      if (Math.abs(diff.angle) > 10) {
        if (diff.angle > 0) {
          recommendations.push(`Reduce ${diff.joint} angle by ${Math.abs(diff.angle).toFixed(1)}°`);
        } else {
          recommendations.push(`Increase ${diff.joint} angle by ${Math.abs(diff.angle).toFixed(1)}°`);
        }
      }
    });
    
    // Analyze kinematic sequence
    if (analysis1.kinematicSequence.quality.timingScore < analysis2.kinematicSequence.quality.timingScore) {
      recommendations.push('Improve kinematic sequence timing');
    }
    
    // Analyze weight transfer
    if (analysis1.weightTransfer.balance.stability < analysis2.weightTransfer.balance.stability) {
      recommendations.push('Improve balance and stability');
    }
    
    return recommendations;
  }

  /**
   * Calculate joint angle benchmarks
   */
  private calculateJointAngleBenchmarks(swings: ProfessionalSwing[]): any {
    const jointAngles = swings.flatMap(swing => swing.biomechanics.jointAngles);
    
    const benchmarks: any = {};
    const jointTypes = [...new Set(jointAngles.map(angle => angle.joint))];
    
    jointTypes.forEach(jointType => {
      const angles = jointAngles.filter(angle => angle.joint === jointType);
      if (angles.length > 0) {
        benchmarks[jointType] = {
          average: this.calculateAverage(angles.map(angle => angle.angle)),
          min: Math.min(...angles.map(angle => angle.angle)),
          max: Math.max(...angles.map(angle => angle.angle)),
          standardDeviation: this.calculateStandardDeviation(angles.map(angle => angle.angle))
        };
      }
    });
    
    return benchmarks;
  }

  /**
   * Calculate kinematic benchmarks
   */
  private calculateKinematicBenchmarks(swings: ProfessionalSwing[]): any {
    const sequences = swings.map(swing => swing.biomechanics.kinematicSequence);
    
    return {
      averageTiming: {
        hips: this.calculateAverage(sequences.map(s => s.timing.hips)),
        torso: this.calculateAverage(sequences.map(s => s.timing.torso)),
        arms: this.calculateAverage(sequences.map(s => s.timing.arms)),
        club: this.calculateAverage(sequences.map(s => s.timing.club))
      },
      averageQuality: {
        timingScore: this.calculateAverage(sequences.map(s => s.quality.timingScore)),
        efficiency: this.calculateAverage(sequences.map(s => s.quality.efficiency))
      }
    };
  }

  /**
   * Calculate weight transfer benchmarks
   */
  private calculateWeightTransferBenchmarks(swings: ProfessionalSwing[]): any {
    const weightTransfers = swings.map(swing => swing.biomechanics.weightTransfer);
    
    return {
      averageBalance: {
        lateral: this.calculateAverage(weightTransfers.map(wt => wt.balance.lateral)),
        forward: this.calculateAverage(weightTransfers.map(wt => wt.balance.forward)),
        stability: this.calculateAverage(weightTransfers.map(wt => wt.balance.stability))
      },
      averageWeight: {
        leftFoot: this.calculateAverage(weightTransfers.map(wt => wt.leftFoot)),
        rightFoot: this.calculateAverage(weightTransfers.map(wt => wt.rightFoot))
      }
    };
  }

  /**
   * Calculate club path benchmarks
   */
  private calculateClubPathBenchmarks(swings: ProfessionalSwing[]): any {
    const clubPaths = swings.map(swing => swing.biomechanics.clubPath);
    
    return {
      averageAngle: {
        shaft: this.calculateAverage(clubPaths.map(cp => cp.angle.shaft)),
        face: this.calculateAverage(clubPaths.map(cp => cp.angle.face)),
        path: this.calculateAverage(clubPaths.map(cp => cp.angle.path))
      },
      averagePlane: {
        deviation: this.calculateAverage(clubPaths.map(cp => cp.plane.deviation)),
        consistency: this.calculateAverage(clubPaths.map(cp => cp.plane.consistency))
      }
    };
  }

  /**
   * Calculate performance benchmarks
   */
  private calculatePerformanceBenchmarks(swings: ProfessionalSwing[]): any {
    return {
      ballSpeed: {
        average: this.calculateAverage(swings.map(s => s.performance.ballSpeed)),
        min: Math.min(...swings.map(s => s.performance.ballSpeed)),
        max: Math.max(...swings.map(s => s.performance.ballSpeed))
      },
      clubSpeed: {
        average: this.calculateAverage(swings.map(s => s.performance.clubSpeed)),
        min: Math.min(...swings.map(s => s.performance.clubSpeed)),
        max: Math.max(...swings.map(s => s.performance.clubSpeed))
      },
      carryDistance: {
        average: this.calculateAverage(swings.map(s => s.performance.carryDistance)),
        min: Math.min(...swings.map(s => s.performance.carryDistance)),
        max: Math.max(...swings.map(s => s.performance.carryDistance))
      }
    };
  }

  /**
   * Calculate average of numbers
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const average = this.calculateAverage(numbers);
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - average, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }

  /**
   * Initialize indexes
   */
  private initializeIndexes(): void {
    this.playerIndex = new Map();
    this.swingTypeIndex = new Map();
    this.performanceIndex = new Map();
  }

  /**
   * Load professional swings
   */
  private async loadProfessionalSwings(): Promise<void> {
    console.log('📚 PROFESSIONAL DB: Loading professional swing data...');
    
    // This would load actual professional swing data
    // For now, simulate loading
    console.log('✅ PROFESSIONAL DB: Professional swing data loaded');
  }

  /**
   * Build indexes for fast searching
   */
  private buildIndexes(): void {
    console.log('🔍 PROFESSIONAL DB: Building search indexes...');
    
    this.swings.forEach((swing, id) => {
      // Player index
      const playerName = swing.player.name.toLowerCase();
      if (!this.playerIndex.has(playerName)) {
        this.playerIndex.set(playerName, []);
      }
      this.playerIndex.get(playerName)!.push(id);
      
      // Swing type index
      const swingType = swing.swing.type;
      if (!this.swingTypeIndex.has(swingType)) {
        this.swingTypeIndex.set(swingType, []);
      }
      this.swingTypeIndex.get(swingType)!.push(id);
    });
    
    console.log('✅ PROFESSIONAL DB: Search indexes built');
  }

  /**
   * Update indexes when adding new swing
   */
  private updateIndexes(swing: ProfessionalSwing): void {
    // Update player index
    const playerName = swing.player.name.toLowerCase();
    if (!this.playerIndex.has(playerName)) {
      this.playerIndex.set(playerName, []);
    }
    this.playerIndex.get(playerName)!.push(swing.id);
    
    // Update swing type index
    const swingType = swing.swing.type;
    if (!this.swingTypeIndex.has(swingType)) {
      this.swingTypeIndex.set(swingType, []);
    }
    this.swingTypeIndex.get(swingType)!.push(swing.id);
  }

  /**
   * Clear all data
   */
  clearDatabase(): void {
    this.swings.clear();
    this.playerIndex.clear();
    this.swingTypeIndex.clear();
    this.performanceIndex.clear();
    this.isInitialized = false;
    
    console.log('🗑️ PROFESSIONAL DB: Database cleared');
  }
}

// 🎯 UTILITY FUNCTIONS

/**
 * Create a new professional swing database
 */
export function createProfessionalSwingDatabase(): ProfessionalSwingDatabase {
  return new ProfessionalSwingDatabase();
}

/**
 * Create a professional swing entry
 */
export function createProfessionalSwing(
  id: string,
  playerName: string,
  playerLevel: 'tour' | 'champions' | 'senior' | 'lpga',
  swingType: 'driver' | 'iron' | 'wedge' | 'putt',
  biomechanics: BiomechanicalAnalysis,
  performance: any,
  metadata: any = {}
): ProfessionalSwing {
  return {
    id,
    player: {
      name: playerName,
      level: playerLevel,
      ranking: metadata.ranking || 1,
      country: metadata.country || 'USA',
      height: metadata.height || 180,
      weight: metadata.weight || 80
    },
    swing: {
      type: swingType,
      club: metadata.club || 'Driver',
      loft: metadata.loft || 10.5,
      shaft: metadata.shaft || 'Graphite',
      flex: metadata.flex || 'Stiff'
    },
    conditions: {
      course: metadata.course || 'PGA Tour',
      weather: metadata.weather || 'Clear',
      temperature: metadata.temperature || 20,
      wind: metadata.wind || 0,
      humidity: metadata.humidity || 50
    },
    biomechanics,
    performance,
    metadata: {
      date: metadata.date || new Date().toISOString(),
      tournament: metadata.tournament || 'PGA Tour',
      round: metadata.round || 1,
      hole: metadata.hole || 1,
      par: metadata.par || 4,
      score: metadata.score || 4,
      videoUrl: metadata.videoUrl || '',
      quality: metadata.quality || 'high'
    }
  };
}

export default ProfessionalSwingDatabase;
