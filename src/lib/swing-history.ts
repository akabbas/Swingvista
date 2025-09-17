'use client';

import { PoseResult } from './mediapipe';
import { SwingPhase } from './swing-phases';

export interface SwingHistoryEntry {
  id: string;
  timestamp: number;
  date: string;
  fileName: string;
  fileSize: number;
  duration: number;
  poses: PoseResult[];
  phases: SwingPhase[];
  metrics: {
    tempo: any;
    rotation: any;
    weightTransfer: any;
    swingPlane: any;
    bodyAlignment: any;
    overallScore: number;
    letterGrade: string;
  };
  grade: {
    overall: {
      score: number;
      letter: string;
      description: string;
    };
    categories: {
      tempo: any;
      rotation: any;
      balance: any;
      plane: any;
      power: any;
      consistency: any;
    };
  };
  videoUrl?: string;
  thumbnail?: string;
  notes?: string;
  tags?: string[];
}

export interface SwingComparison {
  current: SwingHistoryEntry;
  previous: SwingHistoryEntry;
  improvements: string[];
  regressions: string[];
  overallChange: number;
  categoryChanges: {
    tempo: number;
    rotation: number;
    balance: number;
    swingPlane: number;
    power: number;
    consistency: number;
  };
}

export class SwingHistoryManager {
  private static readonly STORAGE_KEY = 'swingvista_swing_history';
  private static readonly MAX_ENTRIES = 100; // Limit to prevent storage bloat

  static saveSwing(entry: Omit<SwingHistoryEntry, 'id' | 'timestamp' | 'date'>): string {
    const id = this.generateId();
    const timestamp = Date.now();
    const date = new Date().toISOString().split('T')[0];
    
    const fullEntry: SwingHistoryEntry = {
      id,
      timestamp,
      date,
      ...entry
    };

    const history = this.getHistory();
    
    // Add new entry to the beginning
    history.unshift(fullEntry);
    
    // Limit entries
    if (history.length > this.MAX_ENTRIES) {
      history.splice(this.MAX_ENTRIES);
    }
    
    // Save to localStorage
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
      return id;
    } catch (error) {
      console.error('Failed to save swing history:', error);
      throw new Error('Failed to save swing history. Storage may be full.');
    }
  }

  static getHistory(): SwingHistoryEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load swing history:', error);
      return [];
    }
  }

  static getSwingById(id: string): SwingHistoryEntry | null {
    const history = this.getHistory();
    return history.find(entry => entry.id === id) || null;
  }

  static deleteSwing(id: string): boolean {
    const history = this.getHistory();
    const filtered = history.filter(entry => entry.id !== id);
    
    if (filtered.length === history.length) {
      return false; // Entry not found
    }
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Failed to delete swing:', error);
      return false;
    }
  }

  static updateSwingNotes(id: string, notes: string): boolean {
    const history = this.getHistory();
    const entry = history.find(e => e.id === id);
    
    if (!entry) return false;
    
    entry.notes = notes;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
      return true;
    } catch (error) {
      console.error('Failed to update swing notes:', error);
      return false;
    }
  }

  static addSwingTags(id: string, tags: string[]): boolean {
    const history = this.getHistory();
    const entry = history.find(e => e.id === id);
    
    if (!entry) return false;
    
    entry.tags = [...(entry.tags || []), ...tags];
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
      return true;
    } catch (error) {
      console.error('Failed to add swing tags:', error);
      return false;
    }
  }

  static getRecentSwings(limit: number = 10): SwingHistoryEntry[] {
    const history = this.getHistory();
    return history.slice(0, limit);
  }

  static getSwingsByDateRange(startDate: string, endDate: string): SwingHistoryEntry[] {
    const history = this.getHistory();
    return history.filter(entry => entry.date >= startDate && entry.date <= endDate);
  }

  static getSwingsByGrade(grade: string): SwingHistoryEntry[] {
    const history = this.getHistory();
    return history.filter(entry => entry.grade.overall.letter === grade);
  }

  static compareSwings(currentId: string, previousId: string): SwingComparison | null {
    const current = this.getSwingById(currentId);
    const previous = this.getSwingById(previousId);
    
    if (!current || !previous) return null;
    
    const improvements: string[] = [];
    const regressions: string[] = [];
    
    // Compare overall scores
    const overallChange = current.grade.overall.score - previous.grade.overall.score;
    
    // Compare categories
    const categoryChanges = {
      tempo: current.grade.categories.tempo.score - previous.grade.categories.tempo.score,
      rotation: current.grade.categories.rotation.score - previous.grade.categories.rotation.score,
      balance: current.grade.categories.balance.score - previous.grade.categories.balance.score,
      swingPlane: current.grade.categories.plane.score - previous.grade.categories.plane.score,
      power: current.grade.categories.power.score - previous.grade.categories.power.score,
      consistency: current.grade.categories.consistency.score - previous.grade.categories.consistency.score
    };
    
    // Generate improvement/regression messages
    Object.entries(categoryChanges).forEach(([category, change]) => {
      if (change > 5) {
        improvements.push(`${category.charAt(0).toUpperCase() + category.slice(1)} improved by ${change.toFixed(1)} points`);
      } else if (change < -5) {
        regressions.push(`${category.charAt(0).toUpperCase() + category.slice(1)} decreased by ${Math.abs(change).toFixed(1)} points`);
      }
    });
    
    return {
      current,
      previous,
      improvements,
      regressions,
      overallChange,
      categoryChanges
    };
  }

  static exportToCSV(): string {
    const history = this.getHistory();
    
    const headers = [
      'Date',
      'File Name',
      'Duration (s)',
      'Overall Score',
      'Grade',
      'Tempo Score',
      'Rotation Score',
      'Balance Score',
      'Swing Plane Score',
      'Power Score',
      'Consistency Score',
      'Notes',
      'Tags'
    ];
    
    const rows = history.map(entry => [
      entry.date,
      entry.fileName,
      (entry.duration / 1000).toFixed(2),
      entry.grade.overall.score.toString(),
      entry.grade.overall.letter,
      entry.grade.categories.tempo.score.toString(),
      entry.grade.categories.rotation.score.toString(),
      entry.grade.categories.balance.score.toString(),
      entry.grade.categories.plane.score.toString(),
      entry.grade.categories.power.score.toString(),
      entry.grade.categories.consistency.score.toString(),
      entry.notes || '',
      (entry.tags || []).join('; ')
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  static exportToJSON(): string {
    const history = this.getHistory();
    return JSON.stringify(history, null, 2);
  }

  static clearHistory(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear swing history:', error);
      return false;
    }
  }

  static getStorageSize(): number {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? new Blob([stored]).size : 0;
    } catch (error) {
      return 0;
    }
  }

  static getStorageUsage(): { used: number; available: number; percentage: number } {
    const used = this.getStorageSize();
    const available = 5 * 1024 * 1024; // 5MB typical localStorage limit
    const percentage = (used / available) * 100;
    
    return { used, available, percentage };
  }

  private static generateId(): string {
    return `swing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
