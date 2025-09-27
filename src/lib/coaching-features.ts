import type { PoseResult } from './mediapipe';
import type { EnhancedSwingPhase } from './enhanced-swing-phases';
import type { ProfessionalGolfMetrics } from './professional-golf-metrics';

export interface SwingAnnotation {
  id: string;
  timestamp: number;
  position: { x: number; y: number };
  type: 'arrow' | 'circle' | 'rectangle' | 'line' | 'text' | 'highlight';
  content: string;
  color: string;
  size: number;
  opacity: number;
  coachId: string;
  studentId: string;
  swingId: string;
  phase?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'technique' | 'timing' | 'posture' | 'grip' | 'stance' | 'follow-through' | 'general';
  createdAt: Date;
  updatedAt: Date;
}

export interface VoiceNote {
  id: string;
  timestamp: number;
  duration: number;
  audioBlob: Blob;
  transcript?: string;
  coachId: string;
  studentId: string;
  swingId: string;
  phase?: string;
  category: 'feedback' | 'instruction' | 'encouragement' | 'correction' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  isProcessed: boolean;
  createdAt: Date;
}

export interface LessonPlan {
  id: string;
  title: string;
  description: string;
  coachId: string;
  studentId: string;
  objectives: string[];
  exercises: LessonExercise[];
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  focusAreas: string[];
  equipment: string[];
  prerequisites: string[];
  expectedOutcomes: string[];
  notes: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  scheduledDate?: Date;
  completedDate?: Date;
}

export interface LessonExercise {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  duration: number; // in minutes
  repetitions: number;
  focusArea: string;
  difficulty: 'easy' | 'medium' | 'hard';
  equipment: string[];
  videoUrl?: string;
  imageUrl?: string;
  notes: string;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface StudentProgress {
  studentId: string;
  coachId: string;
  overallScore: number;
  improvementAreas: string[];
  strengths: string[];
  milestones: ProgressMilestone[];
  sessionHistory: SessionSummary[];
  goals: StudentGoal[];
  lastUpdated: Date;
}

export interface ProgressMilestone {
  id: string;
  title: string;
  description: string;
  achievedAt: Date;
  metric: string;
  value: number;
  category: 'technique' | 'consistency' | 'power' | 'accuracy' | 'mental';
}

export interface SessionSummary {
  id: string;
  date: Date;
  duration: number;
  score: number;
  focusAreas: string[];
  improvements: string[];
  challenges: string[];
  nextSteps: string[];
  annotations: number;
  voiceNotes: number;
  lessonPlanId?: string;
}

export interface StudentGoal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: Date;
  isAchieved: boolean;
  achievedAt?: Date;
  category: 'score' | 'consistency' | 'power' | 'accuracy' | 'technique';
}

export interface CoachingSession {
  id: string;
  coachId: string;
  studentId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  lessonPlanId?: string;
  annotations: SwingAnnotation[];
  voiceNotes: VoiceNote[];
  summary?: string;
  nextSteps?: string[];
  studentFeedback?: string;
  coachNotes?: string;
}

/**
 * Swing annotation tools for coaches
 */
export class SwingAnnotationManager {
  private annotations: Map<string, SwingAnnotation> = new Map();
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isDrawing = false;
  private currentAnnotation: Partial<SwingAnnotation> | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  private handleMouseDown(event: MouseEvent): void {
    this.startAnnotation(event.clientX, event.clientY);
  }

  private handleMouseMove(event: MouseEvent): void {
    this.updateAnnotation(event.clientX, event.clientY);
  }

  private handleMouseUp(event: MouseEvent): void {
    this.finishAnnotation();
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    this.startAnnotation(touch.clientX, touch.clientY);
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    this.updateAnnotation(touch.clientX, touch.clientY);
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    this.finishAnnotation();
  }

  private startAnnotation(x: number, y: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    this.isDrawing = true;
    this.currentAnnotation = {
      position: { x: canvasX, y: canvasY },
      type: 'arrow',
      content: '',
      color: '#ff0000',
      size: 20,
      opacity: 0.8,
      priority: 'medium',
      category: 'general'
    };
  }

  private updateAnnotation(x: number, y: number): void {
    if (!this.isDrawing || !this.currentAnnotation) return;

    const rect = this.canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    this.currentAnnotation.position = { x: canvasX, y: canvasY };
    this.renderAnnotation(this.currentAnnotation);
  }

  private finishAnnotation(): void {
    if (!this.isDrawing || !this.currentAnnotation) return;

    this.isDrawing = false;
    
    // Create annotation
    const annotation: SwingAnnotation = {
      id: this.generateId(),
      timestamp: Date.now(),
      position: this.currentAnnotation.position!,
      type: this.currentAnnotation.type!,
      content: this.currentAnnotation.content || '',
      color: this.currentAnnotation.color!,
      size: this.currentAnnotation.size!,
      opacity: this.currentAnnotation.opacity!,
      coachId: 'current-coach',
      studentId: 'current-student',
      swingId: 'current-swing',
      phase: this.currentAnnotation.phase,
      priority: this.currentAnnotation.priority!,
      category: this.currentAnnotation.category!,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.annotations.set(annotation.id, annotation);
    this.currentAnnotation = null;
  }

  private renderAnnotation(annotation: Partial<SwingAnnotation>): void {
    if (!annotation.position) return;

    this.ctx.save();
    this.ctx.globalAlpha = annotation.opacity || 0.8;
    this.ctx.strokeStyle = annotation.color || '#ff0000';
    this.ctx.fillStyle = annotation.color || '#ff0000';
    this.ctx.lineWidth = 2;

    switch (annotation.type) {
      case 'arrow':
        this.drawArrow(annotation.position, annotation.size || 20);
        break;
      case 'circle':
        this.drawCircle(annotation.position, annotation.size || 20);
        break;
      case 'rectangle':
        this.drawRectangle(annotation.position, annotation.size || 20);
        break;
      case 'line':
        this.drawLine(annotation.position, annotation.size || 20);
        break;
      case 'text':
        this.drawText(annotation.position, annotation.content || '', annotation.size || 14);
        break;
      case 'highlight':
        this.drawHighlight(annotation.position, annotation.size || 20);
        break;
    }

    this.ctx.restore();
  }

  private drawArrow(position: { x: number; y: number }, size: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(position.x, position.y);
    this.ctx.lineTo(position.x + size, position.y - size);
    this.ctx.lineTo(position.x + size - 5, position.y - size + 5);
    this.ctx.moveTo(position.x + size, position.y - size);
    this.ctx.lineTo(position.x + size - 5, position.y - size - 5);
    this.ctx.stroke();
  }

  private drawCircle(position: { x: number; y: number }, size: number): void {
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, size / 2, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private drawRectangle(position: { x: number; y: number }, size: number): void {
    this.ctx.strokeRect(position.x - size / 2, position.y - size / 2, size, size);
  }

  private drawLine(position: { x: number; y: number }, size: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(position.x - size / 2, position.y);
    this.ctx.lineTo(position.x + size / 2, position.y);
    this.ctx.stroke();
  }

  private drawText(position: { x: number; y: number }, text: string, fontSize: number): void {
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.fillText(text, position.x, position.y);
  }

  private drawHighlight(position: { x: number; y: number }, size: number): void {
    this.ctx.globalAlpha = 0.3;
    this.ctx.fillStyle = '#ffff00';
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, size / 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private generateId(): string {
    return `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add annotation
   */
  addAnnotation(annotation: Omit<SwingAnnotation, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this.generateId();
    const newAnnotation: SwingAnnotation = {
      ...annotation,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.annotations.set(id, newAnnotation);
    return id;
  }

  /**
   * Update annotation
   */
  updateAnnotation(id: string, updates: Partial<SwingAnnotation>): boolean {
    const annotation = this.annotations.get(id);
    if (!annotation) return false;

    const updatedAnnotation = {
      ...annotation,
      ...updates,
      updatedAt: new Date()
    };

    this.annotations.set(id, updatedAnnotation);
    return true;
  }

  /**
   * Delete annotation
   */
  deleteAnnotation(id: string): boolean {
    return this.annotations.delete(id);
  }

  /**
   * Get annotation
   */
  getAnnotation(id: string): SwingAnnotation | null {
    return this.annotations.get(id) || null;
  }

  /**
   * Get all annotations
   */
  getAllAnnotations(): SwingAnnotation[] {
    return Array.from(this.annotations.values());
  }

  /**
   * Get annotations by category
   */
  getAnnotationsByCategory(category: string): SwingAnnotation[] {
    return this.getAllAnnotations().filter(a => a.category === category);
  }

  /**
   * Get annotations by priority
   */
  getAnnotationsByPriority(priority: string): SwingAnnotation[] {
    return this.getAllAnnotations().filter(a => a.priority === priority);
  }

  /**
   * Clear all annotations
   */
  clearAnnotations(): void {
    this.annotations.clear();
  }

  /**
   * Render all annotations
   */
  renderAllAnnotations(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.getAllAnnotations().forEach(annotation => {
      this.renderAnnotation(annotation);
    });
  }
}

/**
 * Voice note recording for feedback
 */
export class VoiceNoteManager {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private currentVoiceNote: Partial<VoiceNote> | null = null;

  /**
   * Start recording voice note
   */
  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.currentVoiceNote = {
          audioBlob,
          duration: Date.now() - (this.currentVoiceNote?.timestamp || Date.now()),
          isProcessed: false
        };
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.currentVoiceNote = {
        timestamp: Date.now(),
        coachId: 'current-coach',
        studentId: 'current-student',
        swingId: 'current-swing',
        category: 'feedback',
        priority: 'medium'
      };

    } catch (error) {
      throw new Error(`Failed to start recording: ${error}`);
    }
  }

  /**
   * Stop recording voice note
   */
  async stopRecording(): Promise<VoiceNote> {
    if (!this.mediaRecorder || !this.isRecording) {
      throw new Error('No active recording');
    }

    return new Promise((resolve, reject) => {
      this.mediaRecorder!.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const voiceNote: VoiceNote = {
          id: this.generateId(),
          timestamp: this.currentVoiceNote!.timestamp!,
          duration: Date.now() - this.currentVoiceNote!.timestamp!,
          audioBlob,
          coachId: this.currentVoiceNote!.coachId!,
          studentId: this.currentVoiceNote!.studentId!,
          swingId: this.currentVoiceNote!.swingId!,
          phase: this.currentVoiceNote!.phase,
          category: this.currentVoiceNote!.category!,
          priority: this.currentVoiceNote!.priority!,
          isProcessed: false,
          createdAt: new Date()
        };

        this.isRecording = false;
        this.currentVoiceNote = null;
        resolve(voiceNote);
      };

      this.mediaRecorder!.stop();
      this.mediaRecorder!.stream.getTracks().forEach(track => track.stop());
    });
  }

  /**
   * Play voice note
   */
  playVoiceNote(voiceNote: VoiceNote): void {
    const audioUrl = URL.createObjectURL(voiceNote.audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  }

  /**
   * Transcribe voice note
   */
  async transcribeVoiceNote(voiceNote: VoiceNote): Promise<string> {
    // This would integrate with a speech-to-text service
    // For now, return a placeholder
    return 'Transcription not available';
  }

  private generateId(): string {
    return `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Lesson plan integration
 */
export class LessonPlanManager {
  private lessonPlans: Map<string, LessonPlan> = new Map();

  /**
   * Create lesson plan
   */
  createLessonPlan(plan: Omit<LessonPlan, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this.generateId();
    const lessonPlan: LessonPlan = {
      ...plan,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.lessonPlans.set(id, lessonPlan);
    return id;
  }

  /**
   * Update lesson plan
   */
  updateLessonPlan(id: string, updates: Partial<LessonPlan>): boolean {
    const plan = this.lessonPlans.get(id);
    if (!plan) return false;

    const updatedPlan = {
      ...plan,
      ...updates,
      updatedAt: new Date()
    };

    this.lessonPlans.set(id, updatedPlan);
    return true;
  }

  /**
   * Get lesson plan
   */
  getLessonPlan(id: string): LessonPlan | null {
    return this.lessonPlans.get(id) || null;
  }

  /**
   * Get all lesson plans
   */
  getAllLessonPlans(): LessonPlan[] {
    return Array.from(this.lessonPlans.values());
  }

  /**
   * Get lesson plans by student
   */
  getLessonPlansByStudent(studentId: string): LessonPlan[] {
    return this.getAllLessonPlans().filter(plan => plan.studentId === studentId);
  }

  /**
   * Get lesson plans by coach
   */
  getLessonPlansByCoach(coachId: string): LessonPlan[] {
    return this.getAllLessonPlans().filter(plan => plan.coachId === coachId);
  }

  /**
   * Delete lesson plan
   */
  deleteLessonPlan(id: string): boolean {
    return this.lessonPlans.delete(id);
  }

  /**
   * Complete lesson plan
   */
  completeLessonPlan(id: string): boolean {
    const plan = this.lessonPlans.get(id);
    if (!plan) return false;

    plan.completedDate = new Date();
    plan.isActive = false;
    plan.updatedAt = new Date();

    this.lessonPlans.set(id, plan);
    return true;
  }

  private generateId(): string {
    return `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Student progress dashboards
 */
export class StudentProgressManager {
  private progressData: Map<string, StudentProgress> = new Map();

  /**
   * Update student progress
   */
  updateProgress(studentId: string, updates: Partial<StudentProgress>): void {
    const existing = this.progressData.get(studentId);
    const progress: StudentProgress = {
      studentId,
      coachId: 'current-coach',
      overallScore: 0,
      improvementAreas: [],
      strengths: [],
      milestones: [],
      sessionHistory: [],
      goals: [],
      lastUpdated: new Date(),
      ...existing,
      ...updates,
      lastUpdated: new Date()
    };

    this.progressData.set(studentId, progress);
  }

  /**
   * Add milestone
   */
  addMilestone(studentId: string, milestone: Omit<ProgressMilestone, 'id'>): string {
    const progress = this.progressData.get(studentId);
    if (!progress) return '';

    const id = this.generateId();
    const newMilestone: ProgressMilestone = {
      ...milestone,
      id
    };

    progress.milestones.push(newMilestone);
    this.progressData.set(studentId, progress);
    return id;
  }

  /**
   * Add session summary
   */
  addSessionSummary(studentId: string, summary: Omit<SessionSummary, 'id'>): string {
    const progress = this.progressData.get(studentId);
    if (!progress) return '';

    const id = this.generateId();
    const newSummary: SessionSummary = {
      ...summary,
      id
    };

    progress.sessionHistory.push(newSummary);
    this.progressData.set(studentId, progress);
    return id;
  }

  /**
   * Add student goal
   */
  addGoal(studentId: string, goal: Omit<StudentGoal, 'id'>): string {
    const progress = this.progressData.get(studentId);
    if (!progress) return '';

    const id = this.generateId();
    const newGoal: StudentGoal = {
      ...goal,
      id
    };

    progress.goals.push(newGoal);
    this.progressData.set(studentId, progress);
    return id;
  }

  /**
   * Get student progress
   */
  getStudentProgress(studentId: string): StudentProgress | null {
    return this.progressData.get(studentId) || null;
  }

  /**
   * Get all students progress
   */
  getAllStudentsProgress(): StudentProgress[] {
    return Array.from(this.progressData.values());
  }

  /**
   * Calculate progress trends
   */
  calculateProgressTrends(studentId: string): {
    overallTrend: 'improving' | 'declining' | 'stable';
    scoreChange: number;
    milestoneCount: number;
    goalProgress: number;
  } {
    const progress = this.progressData.get(studentId);
    if (!progress) {
      return {
        overallTrend: 'stable',
        scoreChange: 0,
        milestoneCount: 0,
        goalProgress: 0
      };
    }

    const recentSessions = progress.sessionHistory.slice(-5);
    const olderSessions = progress.sessionHistory.slice(-10, -5);
    
    const recentAvg = recentSessions.reduce((sum, s) => sum + s.score, 0) / recentSessions.length;
    const olderAvg = olderSessions.reduce((sum, s) => sum + s.score, 0) / olderSessions.length;
    
    const scoreChange = recentAvg - olderAvg;
    const overallTrend = scoreChange > 0.1 ? 'improving' : scoreChange < -0.1 ? 'declining' : 'stable';
    
    const milestoneCount = progress.milestones.length;
    const goalProgress = progress.goals.filter(g => g.isAchieved).length / progress.goals.length;

    return {
      overallTrend,
      scoreChange,
      milestoneCount,
      goalProgress
    };
  }

  private generateId(): string {
    return `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
