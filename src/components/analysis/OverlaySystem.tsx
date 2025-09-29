'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import { PoseResult } from '@/lib/mediapipe';
import { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';
import { WeightDistributionAnalyzer, WeightDistribution, CameraAngle, SwingMetrics } from '@/lib/weight-distribution-analysis';
import { SwingFeedbackSystem, DynamicFeedback } from '@/lib/swing-feedback-system';
import { ClubHeadTracer, ClubHeadTrajectory, ClubHeadPosition } from '@/lib/club-head-tracer';
import { useDebugger } from '@/contexts/DebugContext';

export type OverlayMode = 'clean' | 'analysis' | 'technical';

export interface OverlaySystemProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  poses: PoseResult[];
  phases: EnhancedSwingPhase[];
  currentTime: number;
  overlayMode: OverlayMode;
  isPlaying: boolean;
  className?: string;
}

export interface OverlayConfig {
  landmarks: boolean;
  skeleton: boolean;
  phaseIndicators: boolean;
  metrics: boolean;
  swingPath: boolean;
  forceVectors: boolean;
  rotationArcs: boolean;
  keyPoints: boolean;
}

const OVERLAY_PRESETS: Record<OverlayMode, OverlayConfig> = {
  clean: {
    landmarks: false,
    skeleton: false,
    phaseIndicators: false,
    metrics: false,
    swingPath: false,
    forceVectors: false,
    rotationArcs: false,
    keyPoints: false,
  },
  analysis: {
    landmarks: false,
    skeleton: false,
    phaseIndicators: true,
    metrics: true,
    swingPath: true,
    forceVectors: false,
    rotationArcs: false,
    keyPoints: true,
  },
  technical: {
    landmarks: true,
    skeleton: true,
    phaseIndicators: true,
    metrics: true,
    swingPath: true,
    forceVectors: true,
    rotationArcs: true,
    keyPoints: true,
  },
};

export default function OverlaySystem({
  canvasRef,
  videoRef,
  poses,
  phases,
  currentTime,
  overlayMode,
  isPlaying,
  className = ''
}: OverlaySystemProps) {
	// Debug system
	const debuggerInstance = useDebugger();
  const config = OVERLAY_PRESETS[overlayMode];
  const lastRenderTime = useRef<number>(0);
  const renderThrottle = 16; // ~60fps

	// =====================
	// Club path state/cache
	// =====================
	const trajectoryRef = useRef<{ x: number; y: number; frame: number; t: number }[]>([]);
	const cameraAngleRef = useRef<'down-the-line' | 'face-on' | 'side-view' | 'unknown'>('unknown');
	
	// Weight distribution analysis
	// ===========================
	const weightAnalyzerRef = useRef<WeightDistributionAnalyzer | null>(null);
	const feedbackSystemRef = useRef<SwingFeedbackSystem | null>(null);
	const currentWeightDistRef = useRef<WeightDistribution | null>(null);
	const swingMetricsRef = useRef<SwingMetrics | null>(null);
	const currentFeedbackRef = useRef<DynamicFeedback | null>(null);
	
	// Club head tracer
	// ===============
	const clubHeadTracerRef = useRef<ClubHeadTracer | null>(null);
	const clubHeadTrajectoryRef = useRef<ClubHeadTrajectory | null>(null);
	const currentClubHeadRef = useRef<ClubHeadPosition | null>(null);

	// Try to detect actual club head in video frame using computer vision
	const detectClubHeadInFrame = useCallback((videoElement: HTMLVideoElement, landmarks: any[] | undefined) => {
		if (!videoElement || !landmarks) return null;
		
		// This would require canvas manipulation and edge detection
		// For now, return null to use the fallback method
		return null;
	}, []);

	// Precise frame-by-frame club head detection
	const detectExactClubHeadPosition = useCallback((landmarks: any[] | undefined, frameIndex: number = 0) => {
		if (!landmarks) return null;
		
		const rightWrist = landmarks[16];
		const leftWrist = landmarks[15];
		const rightElbow = landmarks[14];
		const leftElbow = landmarks[13];
		const rightShoulder = landmarks[12];
		const leftShoulder = landmarks[11];
		
		if (!rightWrist || !leftWrist || !rightElbow || !leftElbow) return null;
		
		// Determine if right-handed or left-handed swing
		const isRightHanded = rightWrist.x < leftWrist.x; // Right wrist typically on left side of screen
		
		// Calculate arm angle for the dominant hand
		const dominantWrist = isRightHanded ? rightWrist : leftWrist;
		const dominantElbow = isRightHanded ? rightElbow : leftElbow;
		
		// Calculate arm angle (angle from elbow to wrist)
		const armAngle = Math.atan2(
			dominantWrist.y - dominantElbow.y,
			dominantWrist.x - dominantElbow.x
		);
		
		// Calculate club length based on arm span and body proportions
		const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
		const armLength = Math.sqrt(
			Math.pow(dominantWrist.x - dominantElbow.x, 2) + 
			Math.pow(dominantWrist.y - dominantElbow.y, 2)
		);
		
		// Club length is typically 2.2-2.5x arm length for driver
		const clubLength = armLength * 2.3;
		
		// Calculate club head position based on swing mechanics
		// The club head extends from the wrist in the direction perpendicular to the arm
		const clubHeadAngle = armAngle + (isRightHanded ? Math.PI/2 : -Math.PI/2);
		
		// Adjust for swing plane - club head is typically below the grip
		const swingPlaneOffset = 0.15; // 15% below grip level
		
		const clubHead = {
			x: dominantWrist.x + Math.cos(clubHeadAngle) * clubLength,
			y: dominantWrist.y + Math.sin(clubHeadAngle) * clubLength + swingPlaneOffset,
			z: dominantWrist.z || 0
		};
		
		// Apply confidence based on landmark visibility
		const confidence = Math.min(
			(dominantWrist.visibility || 1) * 0.9,
			(dominantElbow.visibility || 1) * 0.8
		);
		
		// Apply bounds checking
		return {
			x: Math.max(0, Math.min(1, clubHead.x)),
			y: Math.max(0, Math.min(1, clubHead.y)),
			z: clubHead.z,
			confidence: confidence,
			frame: frameIndex,
			handedness: isRightHanded ? 'right' : 'left'
		};
	}, []);

	// Adaptive smoothing to eliminate squiggles while preserving actual motion
	const applyAdaptiveSmoothing = useCallback((trajectory: { x: number; y: number; frame: number; confidence?: number }[], options: { maxSmoothing: number; velocityThreshold: number; confidenceWeighted: boolean } = { maxSmoothing: 0.3, velocityThreshold: 0.1, confidenceWeighted: true }) => {
		if (trajectory.length < 3) return trajectory;
		
		const smoothed = [...trajectory];
		const { maxSmoothing, velocityThreshold, confidenceWeighted } = options;
		
		// Calculate velocities for each point
		const velocities = [];
		for (let i = 1; i < trajectory.length; i++) {
			const prev = trajectory[i - 1];
			const curr = trajectory[i];
			const velocity = Math.sqrt(
				Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
			);
			velocities.push(velocity);
		}
		
		// Apply adaptive smoothing
		for (let i = 1; i < trajectory.length - 1; i++) {
			const prev = trajectory[i - 1];
			const curr = trajectory[i];
			const next = trajectory[i + 1];
			const velocity = velocities[i - 1];
			
			// Calculate smoothing factor based on velocity and confidence
			let smoothingFactor = maxSmoothing;
			
			// Smooth more during fast movements (to reduce squiggles)
			if (velocity > velocityThreshold) {
				smoothingFactor = Math.min(maxSmoothing * 1.5, 0.5);
			}
			
			// Weight by confidence if enabled
			if (confidenceWeighted && curr.confidence) {
				smoothingFactor *= (1 - curr.confidence);
			}
			
			// Apply smoothing
			smoothed[i] = {
				...curr,
				x: curr.x * (1 - smoothingFactor) + (prev.x + next.x) / 2 * smoothingFactor,
				y: curr.y * (1 - smoothingFactor) + (prev.y + next.y) / 2 * smoothingFactor
			};
		}
		
		// Detect and fix remaining squiggles
		return detectAndFixSquiggles(smoothed);
	}, []);

	// Detect and fix squiggles (sudden direction changes)
	const detectAndFixSquiggles = useCallback((trajectory: { x: number; y: number; frame: number }[]) => {
		const fixed = [...trajectory];
		const issues = [];
		
		// Check for sudden direction changes (squiggles)
		for (let i = 2; i < trajectory.length - 2; i++) {
			const prev = trajectory[i - 1];
			const curr = trajectory[i];
			const next = trajectory[i + 1];
			
			// Calculate angle change
			const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
			const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
			let angleChange = Math.abs(angle2 - angle1);
			
			// Normalize angle change to 0-180 degrees
			if (angleChange > Math.PI) angleChange = 2 * Math.PI - angleChange;
			angleChange = angleChange * 180 / Math.PI;
			
			// If angle change is too sharp (>60 degrees), smooth it
			if (angleChange > 60) {
				issues.push({ frame: i, angleChange });
				
				// Smooth the abrupt change using surrounding points
				const window = 3;
				const start = Math.max(0, i - window);
				const end = Math.min(trajectory.length - 1, i + window);
				
				let avgX = 0, avgY = 0, count = 0;
				for (let j = start; j <= end; j++) {
					if (j !== i) {
						avgX += trajectory[j].x;
						avgY += trajectory[j].y;
						count++;
					}
				}
				
				fixed[i] = {
					...curr,
					x: (curr.x + avgX / count) / 2,
					y: (curr.y + avgY / count) / 2
				};
			}
		}
		
		if (issues.length > 0) {
			console.log('🔧 Squiggles detected and fixed:', issues.length);
		}
		
		return fixed;
	}, []);

	// Legacy function for compatibility
	const detectClubHead = detectExactClubHeadPosition;

	// Initialize weight distribution analysis
	useEffect(() => {
		if (!weightAnalyzerRef.current) {
			weightAnalyzerRef.current = new WeightDistributionAnalyzer();
			feedbackSystemRef.current = new SwingFeedbackSystem(weightAnalyzerRef.current);
		}
	}, []);

	// Initialize club head tracer
	useEffect(() => {
		if (!clubHeadTracerRef.current) {
			clubHeadTracerRef.current = new ClubHeadTracer({
				minConfidence: 0.3,
				smoothingFactor: 0.15,
				interpolationFrames: 3,
				maxGapFrames: 5,
				clubLengthMultiplier: 2.5
			});
		}
	}, []);

	// Build club head trajectory
	const buildClubHeadTrajectory = useCallback(() => {
		if (!clubHeadTracerRef.current || !poses || poses.length === 0) return;
		
		console.log('🏌️ Building club head trajectory from', poses.length, 'poses...');
		const trajectory = clubHeadTracerRef.current.buildTrajectory(poses);
		clubHeadTrajectoryRef.current = trajectory;
		
		console.log('🏌️ Club head trajectory built:', {
			positions: trajectory.positions.length,
			handedness: trajectory.handedness,
			confidence: trajectory.averageConfidence.toFixed(2),
			smoothness: trajectory.smoothness.toFixed(2),
			completeness: trajectory.completeness.toFixed(2)
		});
	}, [poses]);

	// Get current club head position
	const getCurrentClubHeadPosition = useCallback((frameIndex: number) => {
		if (!clubHeadTrajectoryRef.current) return null;
		
		const position = clubHeadTracerRef.current?.getPositionAtFrame(frameIndex);
		currentClubHeadRef.current = position || null;
		
		if (position) {
			console.log('🏌️ Current club head position:', {
				x: position.x.toFixed(3),
				y: position.y.toFixed(3),
				confidence: position.confidence.toFixed(2),
				phase: position.swingPhase,
				handedness: position.handedness
			});
		}
		
		return position;
	}, []);

	// Analyze weight distribution for current pose
	const analyzeCurrentWeightDistribution = useCallback((landmarks: any[], frameIndex: number) => {
		if (!weightAnalyzerRef.current || !landmarks) return null;
		
		const weightDist = weightAnalyzerRef.current.analyzeWeightDistribution(landmarks, frameIndex, poses.length);
		currentWeightDistRef.current = weightDist;
		
		console.log('⚖️ Weight Distribution:', {
			leftFoot: weightDist.leftFoot.toFixed(1) + '%',
			rightFoot: weightDist.rightFoot.toFixed(1) + '%',
			balance: {
				forward: weightDist.balance.forward.toFixed(1),
				lateral: weightDist.balance.lateral.toFixed(1),
				stability: weightDist.balance.stability.toFixed(1)
			},
			phase: weightDist.phase,
			confidence: weightDist.confidence.toFixed(2)
		});
		
		return weightDist;
	}, [poses.length]);

	// Generate swing feedback
	const generateSwingFeedback = useCallback((weightDist: WeightDistribution, cameraAngle: CameraAngle) => {
		if (!feedbackSystemRef.current || !swingMetricsRef.current) return null;
		
		const feedback = feedbackSystemRef.current.generateFeedback(
			weightDist,
			swingMetricsRef.current,
			cameraAngle,
			weightDist.phase
		);
		
		currentFeedbackRef.current = feedback;
		
		console.log('💬 Swing Feedback:', {
			realTime: feedback.realTime.length,
			phaseSpecific: Object.keys(feedback.phaseSpecific).reduce((acc, phase) => {
				acc[phase] = feedback.phaseSpecific[phase].length;
				return acc;
			}, {} as any),
			overall: feedback.overall.length,
			recommendations: feedback.recommendations.length
		});
		
		return feedback;
	}, []);

	// Analyze complete swing metrics
	const analyzeSwingMetrics = useCallback(() => {
		if (!weightAnalyzerRef.current || !poses || poses.length === 0) return;
		
		const metrics = weightAnalyzerRef.current.analyzeSwingMetrics(poses);
		swingMetricsRef.current = metrics;
		
		// Debug monitoring for metrics calculation
		const tempoCalculated = !!metrics.tempo;
		const balanceCalculated = !!metrics.balance;
		const metricsRange = (metrics.tempo.ratio > 0 && metrics.tempo.ratio < 10) ? 'valid' : 'invalid';
		
		debuggerInstance.updateComponentStatus('metricsCalculation',
			tempoCalculated && balanceCalculated ? 'ok' : 'warning',
			{ tempoCalculated, balanceCalculated, metricsRange },
			{ tempoCalculated, balanceCalculated, metricsRange }
		);
		
		console.log('📊 Swing Metrics:', {
			weightTransfer: {
				address: `${metrics.weightTransfer.address.leftFoot.toFixed(1)}%/${metrics.weightTransfer.address.rightFoot.toFixed(1)}%`,
				top: `${metrics.weightTransfer.top.leftFoot.toFixed(1)}%/${metrics.weightTransfer.top.rightFoot.toFixed(1)}%`,
				impact: `${metrics.weightTransfer.impact.leftFoot.toFixed(1)}%/${metrics.weightTransfer.impact.rightFoot.toFixed(1)}%`,
				finish: `${metrics.weightTransfer.finish.leftFoot.toFixed(1)}%/${metrics.weightTransfer.finish.rightFoot.toFixed(1)}%`
			},
			tempo: {
				backswing: metrics.tempo.backswingTime.toFixed(2) + 's',
				downswing: metrics.tempo.downswingTime.toFixed(2) + 's',
				ratio: metrics.tempo.ratio.toFixed(2) + ':1'
			},
			balance: {
				stability: metrics.balance.averageStability.toFixed(1) + '%',
				maxLateral: metrics.balance.maxLateralShift.toFixed(1),
				maxForward: metrics.balance.maxForwardShift.toFixed(1)
			}
		});
	}, [poses]);

	// Simple camera angle detection heuristic
	const detectCameraAngle = useCallback((posesIn: PoseResult[]): 'down-the-line' | 'face-on' | 'side-view' | 'unknown' => {
		if (!posesIn || posesIn.length === 0) return 'unknown';
		const sample = posesIn[Math.floor(posesIn.length / 3)] || posesIn[0];
		const L = sample?.landmarks;
		if (!L) return 'unknown';
		const ls = L[11], rs = L[12], lh = L[23], rh = L[24];
		if (ls && rs && lh && rh) {
			const shoulderWidth = Math.abs(rs.x - ls.x);
			const hipWidth = Math.abs(rh.x - lh.x);
			const verticalSpan = Math.abs(((rs.y + ls.y) / 2) - ((rh.y + lh.y) / 2));
			// Very rough heuristics
			if (shoulderWidth > verticalSpan * 1.2) return 'face-on';
			if (verticalSpan > shoulderWidth * 1.1) return 'down-the-line';
			return 'side-view';
		}
		return 'unknown';
	}, []);

	// Angle-specific adjustment (no-op placeholders for now)
	const adaptToCameraAngle = useCallback((trajectory: { x: number; y: number; frame: number; t: number }[], cameraAngle: string) => {
		switch (cameraAngle) {
			case 'down-the-line':
				return trajectory; // Future: emphasize plane width/depth
			case 'face-on':
				return trajectory; // Future: emphasize rotation/depth
			case 'side-view':
				return trajectory; // Future: emphasize height/tempo
			default:
				return trajectory;
		}
	}, []);

	// Validate trajectory quality and log issues
	const validateTrajectoryQuality = useCallback((trajectory: { x: number; y: number; frame: number; confidence?: number }[]) => {
		if (trajectory.length < 10) {
			console.warn('⚠️ Insufficient trajectory data:', trajectory.length, 'points');
			return;
		}
		
		// Check for gaps in trajectory
		const gaps = [];
		for (let i = 1; i < trajectory.length; i++) {
			if (trajectory[i].frame - trajectory[i-1].frame > 1) {
				gaps.push({ from: trajectory[i-1].frame, to: trajectory[i].frame });
			}
		}
		
		if (gaps.length > 0) {
			console.warn('⚠️ Trajectory gaps detected:', gaps);
		}
		
		// Check confidence levels
		const avgConfidence = trajectory.reduce((sum, p) => sum + (p.confidence || 0), 0) / trajectory.length;
		if (avgConfidence < 0.5) {
			console.warn('⚠️ Low average confidence:', avgConfidence.toFixed(2));
		}
		
		// Check for extreme movements (potential squiggles)
		let extremeMovements = 0;
		for (let i = 1; i < trajectory.length; i++) {
			const prev = trajectory[i - 1];
			const curr = trajectory[i];
			const distance = Math.sqrt(
				Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
			);
			if (distance > 0.3) { // More than 30% of screen width
				extremeMovements++;
			}
		}
		
		if (extremeMovements > trajectory.length * 0.1) {
			console.warn('⚠️ Many extreme movements detected:', extremeMovements);
		}
		
		console.log('✅ Trajectory quality check complete:', {
			points: trajectory.length,
			gaps: gaps.length,
			avgConfidence: avgConfidence.toFixed(2),
			extremeMovements
		});
	}, []);

	// Validate path against video content
	const validatePathAgainstVideo = useCallback((trajectory: { x: number; y: number; frame: number }[], phases: EnhancedSwingPhase[]) => {
		console.log('🎯 CLUB PATH VALIDATION:');
		
		// Sample key frames and compare with expected positions
		const validationFrames = [
			{ frame: 0, expected: 'address position', phase: 'address' },
			{ frame: phases.find(p => p.name === 'backswing')?.endFrame || 0, expected: 'top of backswing', phase: 'backswing' },
			{ frame: phases.find(p => p.name === 'impact')?.startFrame || 0, expected: 'impact', phase: 'impact' },
			{ frame: phases.find(p => p.name === 'follow-through')?.endFrame || trajectory.length - 1, expected: 'finish', phase: 'follow-through' }
		];
		
		validationFrames.forEach(({ frame, expected, phase }) => {
			if (frame >= 0 && frame < trajectory.length) {
				const position = trajectory[frame];
				console.log(`Frame ${frame} (${expected}):`, {
					x: position.x.toFixed(3),
					y: position.y.toFixed(3),
					phase: phase
				});
			}
		});
		
		// Check for realistic swing path characteristics
		const startY = trajectory[0]?.y || 0;
		const endY = trajectory[trajectory.length - 1]?.y || 0;
		const maxY = Math.max(...trajectory.map(p => p.y));
		const minY = Math.min(...trajectory.map(p => p.y));
		
		console.log('Swing path characteristics:', {
			startHeight: startY.toFixed(3),
			endHeight: endY.toFixed(3),
			maxHeight: maxY.toFixed(3),
			minHeight: minY.toFixed(3),
			heightRange: (maxY - minY).toFixed(3)
		});
		
		// Validate phase transitions
		const phaseTransitions = [];
		for (let i = 1; i < trajectory.length; i++) {
			const prev = trajectory[i - 1];
			const curr = trajectory[i];
			const distance = Math.sqrt(
				Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
			);
			if (distance > 0.1) { // Significant movement
				phaseTransitions.push({ frame: i, distance: distance.toFixed(3) });
			}
		}
		
		console.log('Phase transitions detected:', phaseTransitions.length);
	}, []);

	// Calculate smooth club trajectory with precise frame-by-frame detection
	const calculateSmoothClubTrajectory = useCallback((poses: PoseResult[]) => {
		console.log('🎯 Building precise club trajectory from', poses.length, 'poses...');
		
		// Debug monitoring for club path
		const startTime = performance.now();
		
		const rawTrajectory: { x: number; y: number; frame: number; t: number; confidence?: number; handedness?: string }[] = [];
		
		// Build raw trajectory with precise detection
		for (let i = 0; i < poses.length; i++) {
			const pose = poses[i];
			const clubHead = detectExactClubHeadPosition(pose.landmarks, i);
			
			if (clubHead && clubHead.confidence && clubHead.confidence > 0.3) {
				rawTrajectory.push({
					x: clubHead.x,
					y: clubHead.y,
					frame: i,
					t: pose.timestamp ?? i * 33.33,
					confidence: clubHead.confidence,
					handedness: clubHead.handedness
				});
			}
		}
		
		console.log('🎯 Raw trajectory points:', rawTrajectory.length);
		
		// Apply adaptive smoothing to eliminate squiggles
		const smoothedTrajectory = applyAdaptiveSmoothing(rawTrajectory, {
			maxSmoothing: 0.2,        // Conservative smoothing
			velocityThreshold: 0.05,   // Smooth more during fast movements
			confidenceWeighted: true   // Weight by landmark confidence
		});
		
		console.log('🎯 Smoothed trajectory points:', smoothedTrajectory.length);
		
		// Validate trajectory quality
		validateTrajectoryQuality(smoothedTrajectory);
		
		// Validate against video content
		validatePathAgainstVideo(smoothedTrajectory, phases);
		
		// Analyze swing metrics
		analyzeSwingMetrics();
		
		// Build club head trajectory
		buildClubHeadTrajectory();
		
		// Debug monitoring for club path
		const endTime = performance.now();
		const processingTime = endTime - startTime;
		const pointsTracked = smoothedTrajectory.length;
		const smoothness = calculatePathSmoothness(smoothedTrajectory);
		const accuracy = calculatePathAccuracy(smoothedTrajectory);
		
		debuggerInstance.updateComponentStatus('clubPath',
			pointsTracked > 10 && smoothness > 0.7 ? 'ok' : 'warning',
			{ pointsTracked, smoothness, accuracy, processingTime },
			{ pointsTracked, smoothness, accuracy, processingTime }
		);
		
		return smoothedTrajectory;
	}, [detectExactClubHeadPosition, applyAdaptiveSmoothing, validateTrajectoryQuality, validatePathAgainstVideo, phases]);

	// Calculate path smoothness (0-1, higher is smoother)
	const calculatePathSmoothness = useCallback((trajectory: { x: number; y: number; frame: number }[]) => {
		if (trajectory.length < 3) return 0;
		
		let totalAngleChange = 0;
		for (let i = 1; i < trajectory.length - 1; i++) {
			const prev = trajectory[i - 1];
			const curr = trajectory[i];
			const next = trajectory[i + 1];
			
			const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
			const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
			
			let angleChange = Math.abs(angle2 - angle1);
			if (angleChange > Math.PI) angleChange = 2 * Math.PI - angleChange;
			
			totalAngleChange += angleChange;
		}
		
		const averageAngleChange = totalAngleChange / (trajectory.length - 2);
		return Math.max(0, 1 - (averageAngleChange / Math.PI));
	}, []);

	// Calculate path accuracy (0-1, higher is more accurate)
	const calculatePathAccuracy = useCallback((trajectory: { x: number; y: number; frame: number }[]) => {
		if (trajectory.length < 2) return 0;
		
		// Simple accuracy metric based on confidence and consistency
		const confidenceScores = trajectory.map(p => p.confidence || 0);
		const avgConfidence = confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length;
		
		// Check for reasonable path characteristics
		const xRange = Math.max(...trajectory.map(p => p.x)) - Math.min(...trajectory.map(p => p.x));
		const yRange = Math.max(...trajectory.map(p => p.y)) - Math.min(...trajectory.map(p => p.y));
		
		// Path should have reasonable movement
		const hasMovement = xRange > 0.1 || yRange > 0.1;
		
		return hasMovement ? avgConfidence : 0;
	}, []);


	// Build full trajectory once when poses change
	useEffect(() => {
		if (!poses || poses.length === 0) {
			trajectoryRef.current = [];
			cameraAngleRef.current = 'unknown';
			return;
		}
		
		// Use the new precise trajectory calculation
		const preciseTrajectory = calculateSmoothClubTrajectory(poses);
		
		const angle = detectCameraAngle(poses);
		cameraAngleRef.current = angle;
		trajectoryRef.current = adaptToCameraAngle(preciseTrajectory, angle);
		
		console.log('🎯 Final precise trajectory ready with camera angle:', angle);
		console.log('🎯 Trajectory summary:', {
			totalPoints: preciseTrajectory.length,
			handedness: preciseTrajectory[0]?.handedness || 'unknown',
			avgConfidence: preciseTrajectory.reduce((sum, p) => sum + (p.confidence || 0), 0) / preciseTrajectory.length
		});
		
		// Debug monitoring for phase detection
		const phasesDetected = phases.length;
		const phaseSequence = phases.length >= 4 ? 'valid' : 'invalid';
		const currentPhase = phases.find(p => p.startFrame <= Math.floor((currentTime / 1000) * 30) && p.endFrame >= Math.floor((currentTime / 1000) * 30))?.name || 'unknown';
		const phaseTiming = phases.length > 0 ? phases.reduce((sum, phase) => sum + (phase.endFrame - phase.startFrame), 0) / phases.length : 0;
		
		debuggerInstance.updateComponentStatus('phaseDetection',
			phasesDetected >= 4 ? 'ok' : 'warning',
			{ phasesDetected, phaseSequence, currentPhase, phaseTiming },
			{ phasesDetected, phaseSequence, currentPhase, phaseTiming }
		);
	}, [poses, calculateSmoothClubTrajectory, detectCameraAngle, adaptToCameraAngle]);

  // Comprehensive debugging
  console.log('=== OVERLAY SYSTEM DEBUG ===');
  console.log('Pose data received:', {
    hasPoses: !!poses,
    posesCount: poses?.length || 0,
    firstPose: poses?.[0] ? 'exists' : 'missing',
    hasLandmarks: poses?.[0]?.landmarks ? poses[0].landmarks.length + ' landmarks' : 'no landmarks',
    firstLandmark: poses?.[0]?.landmarks?.[0] || 'none'
  });
  console.log('Canvas ref:', canvasRef.current ? 'exists' : 'missing');
  console.log('Video ref:', videoRef.current ? 'exists' : 'missing');
  console.log('Overlay mode:', overlayMode);
  console.log('Current time:', currentTime);
  console.log('Is playing:', isPlaying);

  // Throttle overlay updates during playback for performance
  const shouldRender = useCallback(() => {
    const now = Date.now();
    if (isPlaying && now - lastRenderTime.current < renderThrottle) {
      return false;
    }
    lastRenderTime.current = now;
    return true;
  }, [isPlaying]);

  // Create phase-accurate path segmentation
  const createPhaseAccuratePath = useCallback((trajectory: { x: number; y: number; frame: number }[], phases: EnhancedSwingPhase[]) => {
    const phaseSegments: Record<string, { points: any[]; color: string; width: number; opacity: number; showMarkers: boolean; markerInterval: number }> = {};
    
    const phaseConfig = {
      address: { color: '#00FF00', width: 2, opacity: 0.8 },
      backswing: { color: '#FFFF00', width: 3, opacity: 0.8 },
      downswing: { color: '#FF0000', width: 4, opacity: 0.9 },
      impact: { color: '#FF00FF', width: 6, opacity: 1.0 },
      'follow-through': { color: '#0000FF', width: 3, opacity: 0.8 }
    };
    
    Object.keys(phaseConfig).forEach(phaseKey => {
      const phase = phases.find(p => p.name === phaseKey);
      if (!phase) return;
      
      const start = Math.max(0, Math.min(phase.startFrame, trajectory.length - 1));
      const end = Math.max(0, Math.min(phase.endFrame, trajectory.length - 1));
      
      if (end > start) {
        const segment = trajectory.slice(start, end + 1);
        const config = phaseConfig[phaseKey as keyof typeof phaseConfig];
        
        phaseSegments[phaseKey] = {
          points: segment,
          color: config.color,
          width: config.width,
          opacity: config.opacity,
          showMarkers: true,
          markerInterval: Math.max(1, Math.floor(segment.length / 10))
        };
      }
    });
    
    return phaseSegments;
  }, []);

  // Draw position markers for key swing positions
  const drawPositionMarkers = useCallback((ctx: CanvasRenderingContext2D, trajectory: { x: number; y: number; frame: number }[], phaseList: EnhancedSwingPhase[]) => {
    if (!trajectory || trajectory.length === 0 || !phaseList || phaseList.length === 0) return;
    const videoWidth = ctx.canvas.width;
    const videoHeight = ctx.canvas.height;
    const byName = (name: EnhancedSwingPhase['name']) => phaseList.find(p => p.name === name);
    const address = byName('address');
    const backswing = byName('backswing');
    const top = byName('top');
    const impact = byName('impact');
    const followThrough = byName('follow-through');

    const clampIndex = (idx: number | undefined) => Math.max(0, Math.min((idx ?? 0), trajectory.length - 1));

    const keyPoints: { label: string; idx: number; color: string; size: number }[] = [];
    if (address) keyPoints.push({ label: 'ADDRESS', idx: clampIndex(address.startFrame), color: '#00FF00', size: 8 });
    if (top) keyPoints.push({ label: 'TOP', idx: clampIndex(Math.floor((top.startFrame + top.endFrame) / 2)), color: '#FFFF00', size: 12 });
    if (impact) keyPoints.push({ label: 'IMPACT', idx: clampIndex(impact.startFrame), color: '#FF00FF', size: 15 });
    if (followThrough) keyPoints.push({ label: 'FINISH', idx: clampIndex(followThrough.endFrame), color: '#0000FF', size: 10 });

    keyPoints.forEach((kp) => {
      const pt = trajectory[kp.idx];
      const x = pt.x * videoWidth;
      const y = pt.y * videoHeight;
      ctx.beginPath();
      ctx.arc(x, y, kp.size, 0, Math.PI * 2);
      ctx.fillStyle = kp.color;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(kp.label, x + 20, y - 8);
    });
  }, []);

  // Draw complete club path with phase segmentation
  const drawCompleteClubPath = useCallback((ctx: CanvasRenderingContext2D, trajectory: { x: number; y: number; frame: number }[], phaseList: EnhancedSwingPhase[]) => {
    if (!trajectory || trajectory.length === 0 || !phaseList || phaseList.length === 0) return;
    const videoWidth = ctx.canvas.width;
    const videoHeight = ctx.canvas.height;

    console.log('🎯 Drawing precise club path with', trajectory.length, 'points');

    // Create phase-accurate path segments
    const phaseSegments = createPhaseAccuratePath(trajectory, phaseList);

    // Draw the complete club path as a continuous line with varying thickness
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; // Base white path (lighter)
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw the main path
    for (let i = 0; i < trajectory.length; i++) {
      const pt = trajectory[i];
      const x = pt.x * videoWidth;
      const y = pt.y * videoHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw phase-specific segments with enhanced visualization
    Object.entries(phaseSegments).forEach(([phaseKey, segment]) => {
      if (!segment.points.length) return;
      
      ctx.beginPath();
      ctx.strokeStyle = segment.color + Math.floor(segment.opacity * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = segment.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Different line styles for different phases
      if (phaseKey === 'address') {
        ctx.setLineDash([8, 4]); // Dashed for address
      } else if (phaseKey === 'impact') {
        ctx.setLineDash([]); // Solid for impact
      } else {
        ctx.setLineDash([2, 2]); // Slightly dashed for other phases
      }
      
      // Draw the phase segment
      for (let i = 0; i < segment.points.length; i++) {
        const pt = segment.points[i];
        const x = pt.x * videoWidth;
        const y = pt.y * videoHeight;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      // Add phase markers at intervals
      if (segment.showMarkers) {
        for (let i = 0; i < segment.points.length; i += segment.markerInterval) {
          const pt = segment.points[i];
          const x = pt.x * videoWidth;
          const y = pt.y * videoHeight;
          
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fillStyle = segment.color;
          ctx.fill();
        }
      }
    });
    
    // Reset line dash
    ctx.setLineDash([]);
    
    // Add club head direction indicators (small arrows) - less frequent for cleaner look
    for (let i = 0; i < trajectory.length - 1; i += Math.max(1, Math.floor(trajectory.length / 15))) {
      const current = trajectory[i];
      const next = trajectory[i + 1];
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const angle = Math.atan2(dy, dx);
      
      const x = current.x * videoWidth;
      const y = current.y * videoHeight;
      const arrowLength = 6;
      
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + Math.cos(angle) * arrowLength,
        y + Math.sin(angle) * arrowLength
      );
      ctx.stroke();
    }
  }, [createPhaseAccuratePath]);

  // Draw skeleton connections
  const drawSkeleton = useCallback((ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    console.log('=== DRAWING SKELETON ===');
    console.log('Landmarks count:', landmarks?.length || 0);
    
    // Debug monitoring for stick figure
    const landmarksDetected = landmarks?.length || 0;
    const confidenceScore = landmarks ? landmarks.reduce((sum, landmark) => sum + (landmark.visibility || 0), 0) / landmarks.length : 0;
    const renderingStatus = ctx ? 'ok' : 'error';
    
    debuggerInstance.updateComponentStatus('stickFigure', 
      landmarksDetected > 0 && confidenceScore > 0.6 ? 'ok' : 'warning',
      { landmarksDetected, confidenceScore, renderingStatus },
      { landmarksDetected, confidenceScore, renderingStatus }
    );
    
    if (!landmarks || landmarks.length === 0) {
      console.error('No landmarks to draw skeleton');
      return;
    }
    
    const { width, height } = ctx.canvas;
    console.log('Canvas dimensions for skeleton:', { width, height });
    
    const connections = [
      // Head
      [0, 1], [1, 2], [2, 3], [3, 7],
      [0, 4], [4, 5], [5, 6], [6, 8],
      // Torso
      [11, 12], [11, 23], [12, 24], [23, 24],
      // Arms
      [11, 13], [13, 15], [12, 14], [14, 16],
      // Legs
      [23, 25], [25, 27], [24, 26], [26, 28]
    ];

    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.lineWidth = 3;
    
    let connectionsDrawn = 0;
    connections.forEach(([a, b]) => {
      const pa = landmarks[a];
      const pb = landmarks[b];
      if (pa && pb && pa.visibility && pa.visibility > 0.5 && pb.visibility && pb.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(pa.x * width, pa.y * height);
        ctx.lineTo(pb.x * width, pb.y * height);
        ctx.stroke();
        connectionsDrawn++;
      }
    });
    
    console.log('Skeleton connections drawn:', connectionsDrawn);
  }, []);

  // Helper function to find closest pose
  const findClosestPose = useCallback((time: number): PoseResult | null => {
    if (!poses || poses.length === 0) return null;
    
    const firstPose = poses[0];
    if (!firstPose || firstPose.timestamp === undefined) return null;
    
    let closest = firstPose;
    let minDiff = Math.abs(firstPose.timestamp - time);
    
    for (const pose of poses) {
      if (pose.timestamp === undefined) continue;
      const diff = Math.abs(pose.timestamp - time);
      if (diff < minDiff) {
        minDiff = diff;
        closest = pose;
      }
    }
    
    return closest;
  }, [poses]);

  // Draw minimal overlays for Analysis View
  const drawMinimalOverlays = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    
    // Phase indicators (top and bottom bars)
    if (config.phaseIndicators) {
      const currentPhase = phases.find(phase => 
        currentTime >= phase.startTime && currentTime <= phase.endTime
      );
      
      if (currentPhase) {
        // Top phase bar
        ctx.fillStyle = `${currentPhase.color}80`;
        ctx.fillRect(0, 0, width, 8);
        
        // Bottom phase bar
        ctx.fillRect(0, height - 8, width, 8);
        
        // Phase name in corner
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(10, 10, 200, 40);
        ctx.fillStyle = currentPhase.color;
        ctx.font = 'bold 20px Arial';
        ctx.fillText(currentPhase.name.toUpperCase(), 20, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.fillText(`Grade: ${currentPhase.grade}`, 20, 45);
      }
    }

    // Key position markers
    if (config.keyPoints) {
      const closestPose = findClosestPose(currentTime);
      if (closestPose?.landmarks) {
        const keyLandmarks = [0, 11, 12, 23, 24]; // Head, shoulders, hips
        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
        keyLandmarks.forEach(index => {
          const landmark = closestPose.landmarks[index];
          if (landmark && landmark.visibility && landmark.visibility > 0.5) {
            ctx.beginPath();
            ctx.arc(landmark.x * width, landmark.y * height, 6, 0, 2 * Math.PI);
            ctx.fill();
          }
        });
      }
    }

		// Swing path + markers + plane
    if (config.swingPath) {
			try {
				// Debugging logs
				console.log('🎯 CLUB PATH DEBUG:');
				console.log('Trajectory points:', trajectoryRef.current.length);
				console.log('Phase frames:', phases.map(p => ({ name: p.name, start: p.startFrame, end: p.endFrame })));
				console.log('Camera angle detected:', cameraAngleRef.current);
				console.log('Drawing functions available:', {
					drawCompleteClubPath: typeof drawCompleteClubPath,
					drawPositionMarkers: typeof drawPositionMarkers,
					drawSwingPlaneFromTrajectory: typeof drawSwingPlaneFromTrajectory,
					drawRealtimeClubHeadMarker: typeof drawRealtimeClubHeadMarker
				});

				// Draw complete club path by phases
				if (typeof drawCompleteClubPath === 'function') {
					drawCompleteClubPath(ctx, trajectoryRef.current, phases);
				} else {
					console.error('drawCompleteClubPath function not available');
				}
				
				// Key position markers
				if (typeof drawPositionMarkers === 'function') {
					drawPositionMarkers(ctx, trajectoryRef.current, phases);
				} else {
					console.error('drawPositionMarkers function not available');
				}
				
				// Swing plane visualization
				if (typeof drawSwingPlaneFromTrajectory === 'function') {
					drawSwingPlaneFromTrajectory(ctx, trajectoryRef.current, phases);
				} else {
					console.error('drawSwingPlaneFromTrajectory function not available');
				}
				
				// Real-time club head marker
				if (typeof drawRealtimeClubHeadMarker === 'function') {
					drawRealtimeClubHeadMarker(ctx, trajectoryRef.current);
				} else {
					console.error('drawRealtimeClubHeadMarker function not available');
				}
				
				// Draw impact zone marker
				const impactIndex = detectImpactZone(trajectoryRef.current, phases);
				if (impactIndex !== null && impactIndex < trajectoryRef.current.length) {
					const impactPoint = trajectoryRef.current[impactIndex];
					const x = impactPoint.x * ctx.canvas.width;
					const y = impactPoint.y * ctx.canvas.height;
					
					// Draw impact zone circle
					ctx.beginPath();
					ctx.arc(x, y, 12, 0, 2 * Math.PI);
					ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
					ctx.fill();
					ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
					ctx.lineWidth = 3;
					ctx.stroke();
					
					// Draw impact label
					ctx.fillStyle = '#FFFFFF';
					ctx.font = 'bold 14px Arial';
					ctx.fillText('IMPACT', x + 15, y - 10);
				}

				// Validate
				if (typeof validateClubPath === 'function') {
					const errors = validateClubPath(trajectoryRef.current, phases);
					if (errors.length) console.warn('Club path validation:', errors);
				}
			} catch (e) {
				console.error('Error drawing club path overlays:', e);
				// Fallback: draw simple club path
				console.log('Attempting fallback club path drawing...');
				drawFallbackClubPath(ctx, trajectoryRef.current);
			}
		}

    // Draw skeleton in analysis mode
    if (config.skeleton) {
      console.log('Drawing skeleton in analysis mode...');
      const closestPose = findClosestPose(currentTime);
      if (closestPose?.landmarks) {
        drawSkeleton(ctx, closestPose.landmarks);
        
        // Analyze and draw weight distribution
        const frameIndex = Math.floor((currentTime / 1000) * 30);
        const weightDist = analyzeCurrentWeightDistribution(closestPose.landmarks, frameIndex);
        
        if (weightDist && weightDist.confidence > 0.5) {
          drawWeightDistribution(ctx, weightDist);
          drawBalanceIndicators(ctx, weightDist);
        }
      } else {
        console.warn('No landmarks found for skeleton in analysis mode');
      }
    }

    // Basic metrics display
    if (config.metrics) {
      drawBasicMetrics(ctx);
    }

    // Draw swing feedback if available
    if (currentFeedbackRef.current) {
      drawSwingFeedback(ctx, currentFeedbackRef.current);
    }

    // Draw club head tracer if available
    if (clubHeadTrajectoryRef.current) {
      drawClubHeadTracer(ctx, clubHeadTrajectoryRef.current, currentTime);
    }

    // Draw real-time club head marker
    if (trajectoryRef.current) {
      drawRealtimeClubHeadMarker(ctx, trajectoryRef.current);
    }
  }, [config, phases, currentTime, poses, findClosestPose, drawSkeleton, drawCompleteClubPath, drawPositionMarkers, drawSwingPlaneFromTrajectory, drawRealtimeClubHeadMarker, validateClubPath, drawFallbackClubPath, detectImpactZone, drawWeightDistribution, drawBalanceIndicators, drawSwingFeedback, analyzeCurrentWeightDistribution, generateSwingFeedback, analyzeSwingMetrics, drawClubHeadTracer, drawClubHeadPhaseMarkers, buildClubHeadTrajectory, getCurrentClubHeadPosition]);


	// Create phase-accurate path segmentation

	// --- COMPLETE CLUB PATH DRAWING ---

	// Calculate swing plane angle
	const calculateSwingPlaneAngle = useCallback((trajectory: { x: number; y: number; frame: number }[]) => {
		if (trajectory.length < 3) return 0;
		
		const start = trajectory[0];
		const mid = trajectory[Math.floor(trajectory.length / 2)];
		const end = trajectory[trajectory.length - 1];
		
		const angle1 = Math.atan2(mid.y - start.y, mid.x - start.x);
		const angle2 = Math.atan2(end.y - mid.y, end.x - mid.x);
		
		return Math.abs(angle2 - angle1) * 180 / Math.PI;
	}, []);

	// Calculate swing plane consistency
	const calculateSwingPlaneConsistency = useCallback((trajectory: { x: number; y: number; frame: number }[]) => {
		if (trajectory.length < 5) return 0;
		
		// Calculate how consistent the swing plane is
		let totalDeviation = 0;
		for (let i = 2; i < trajectory.length - 2; i++) {
			const prev = trajectory[i - 1];
			const curr = trajectory[i];
			const next = trajectory[i + 1];
			
			const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
			const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
			
			const deviation = Math.abs(angle2 - angle1);
			totalDeviation += deviation;
		}
		
		const avgDeviation = totalDeviation / (trajectory.length - 4);
		return Math.max(0, 1 - (avgDeviation / Math.PI));
	}, []);

	// Calculate swing plane deviation
	const calculateSwingPlaneDeviation = useCallback((trajectory: { x: number; y: number; frame: number }[]) => {
		if (trajectory.length < 3) return 0;
		
		// Calculate the standard deviation of the swing plane
		const angles = [];
		for (let i = 1; i < trajectory.length; i++) {
			const prev = trajectory[i - 1];
			const curr = trajectory[i];
			const angle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
			angles.push(angle);
		}
		
		const mean = angles.reduce((sum, angle) => sum + angle, 0) / angles.length;
		const variance = angles.reduce((sum, angle) => sum + Math.pow(angle - mean, 2), 0) / angles.length;
		
		return Math.sqrt(variance);
	}, []);

	// Draw club head tracer
	const drawClubHeadTracer = useCallback((ctx: CanvasRenderingContext2D, trajectory: ClubHeadTrajectory, currentTime: number) => {
		if (!trajectory || trajectory.positions.length === 0) return;
		
		const videoWidth = ctx.canvas.width;
		const videoHeight = ctx.canvas.height;
		const currentFrame = Math.floor((currentTime / 1000) * 30); // Assuming 30fps
		
		// Draw complete trajectory up to current frame
		ctx.beginPath();
		ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)'; // Bright yellow for club head path
		ctx.lineWidth = 4;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		
		let hasStarted = false;
		for (let i = 0; i < trajectory.positions.length && trajectory.positions[i].frame <= currentFrame; i++) {
			const position = trajectory.positions[i];
			const x = position.x * videoWidth;
			const y = position.y * videoHeight;
			
			if (!hasStarted) {
				ctx.moveTo(x, y);
				hasStarted = true;
			} else {
				ctx.lineTo(x, y);
			}
		}
		
		if (hasStarted) {
			ctx.stroke();
		}
		
		// Draw current club head position
		const currentPosition = trajectory.positions.find(p => p.frame === currentFrame);
		if (currentPosition) {
			const x = currentPosition.x * videoWidth;
			const y = currentPosition.y * videoHeight;
			
			// Draw club head circle
			ctx.beginPath();
			ctx.arc(x, y, 12, 0, 2 * Math.PI);
			ctx.fillStyle = 'rgba(255, 0, 0, 0.9)'; // Red for current position
			ctx.fill();
			ctx.strokeStyle = '#FFFFFF';
			ctx.lineWidth = 3;
			ctx.stroke();
			
			// Draw club head info
			ctx.fillStyle = '#FFFFFF';
			ctx.font = 'bold 14px Arial';
			ctx.textAlign = 'left';
			ctx.fillText(`Club Head`, x + 20, y - 10);
			ctx.font = '12px Arial';
			ctx.fillText(`Frame: ${currentPosition.frame}`, x + 20, y + 5);
			ctx.fillText(`Phase: ${currentPosition.swingPhase}`, x + 20, y + 20);
			ctx.fillText(`Conf: ${(currentPosition.confidence * 100).toFixed(0)}%`, x + 20, y + 35);
		}
		
		// Draw phase markers
		drawClubHeadPhaseMarkers(ctx, trajectory, videoWidth, videoHeight);
	}, [drawClubHeadPhaseMarkers]);

	// Draw club head phase markers
	const drawClubHeadPhaseMarkers = useCallback((ctx: CanvasRenderingContext2D, trajectory: ClubHeadTrajectory, videoWidth: number, videoHeight: number) => {
		const phases = ['address', 'top', 'impact', 'follow-through'];
		const colors = ['#00FF00', '#FFFF00', '#FF0000', '#0000FF'];
		
		phases.forEach((phase, index) => {
			const position = trajectory.positions.find(p => p.swingPhase === phase);
			if (position) {
				const x = position.x * videoWidth;
				const y = position.y * videoHeight;
				
				// Draw phase marker
				ctx.beginPath();
				ctx.arc(x, y, 8, 0, 2 * Math.PI);
				ctx.fillStyle = colors[index] + '80';
				ctx.fill();
				ctx.strokeStyle = colors[index];
				ctx.lineWidth = 2;
				ctx.stroke();
    
				// Draw phase label
				ctx.fillStyle = colors[index];
				ctx.font = 'bold 12px Arial';
				ctx.textAlign = 'center';
				ctx.fillText(phase.toUpperCase(), x, y - 15);
			}
		});
	}, []);


	// Draw weight distribution visualization
	const drawWeightDistribution = useCallback((ctx: CanvasRenderingContext2D, weightDist: WeightDistribution) => {
		const videoWidth = ctx.canvas.width;
		const videoHeight = ctx.canvas.height;
		
		// Draw weight distribution bars at the bottom
		const barWidth = videoWidth * 0.3;
		const barHeight = 20;
		const barY = videoHeight - 60;
		const barX = (videoWidth - barWidth) / 2;
		
		// Left foot bar
		const leftBarWidth = (weightDist.leftFoot / 100) * barWidth;
		ctx.fillStyle = `rgba(0, 255, 0, ${weightDist.leftFoot / 100})`;
		ctx.fillRect(barX, barY, leftBarWidth, barHeight);
		
		// Right foot bar
		const rightBarWidth = (weightDist.rightFoot / 100) * barWidth;
		ctx.fillStyle = `rgba(255, 0, 0, ${weightDist.rightFoot / 100})`;
		ctx.fillRect(barX + leftBarWidth, barY, rightBarWidth, barHeight);
		
		// Bar border
		ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
		ctx.strokeRect(barX, barY, barWidth, barHeight);
		
		// Labels
		ctx.fillStyle = '#FFFFFF';
		ctx.font = 'bold 14px Arial';
		ctx.textAlign = 'center';
		ctx.fillText('L', barX + leftBarWidth / 2, barY + 15);
		ctx.fillText('R', barX + leftBarWidth + rightBarWidth / 2, barY + 15);
		
		// Weight percentages
		ctx.font = '12px Arial';
		ctx.fillText(`${weightDist.leftFoot.toFixed(0)}%`, barX + leftBarWidth / 2, barY - 5);
		ctx.fillText(`${weightDist.rightFoot.toFixed(0)}%`, barX + leftBarWidth + rightBarWidth / 2, barY - 5);
		
		// Phase indicator
		ctx.fillStyle = '#FFFFFF';
		ctx.font = 'bold 16px Arial';
		ctx.textAlign = 'left';
		ctx.fillText(`Phase: ${weightDist.phase.toUpperCase()}`, 10, barY - 10);
		
		// Confidence indicator
		const confidenceColor = weightDist.confidence > 0.7 ? '#00FF00' : weightDist.confidence > 0.4 ? '#FFAA00' : '#FF0000';
		ctx.fillStyle = confidenceColor;
		ctx.fillText(`Confidence: ${(weightDist.confidence * 100).toFixed(0)}%`, 10, barY + 10);
	}, []);

	// Draw balance indicators
	const drawBalanceIndicators = useCallback((ctx: CanvasRenderingContext2D, weightDist: WeightDistribution) => {
		const videoWidth = ctx.canvas.width;
		const videoHeight = ctx.canvas.height;
		
		// Draw center of gravity indicator
		const cogX = weightDist.centerOfGravity.x * videoWidth;
		const cogY = weightDist.centerOfGravity.y * videoHeight;
		
		// Center of gravity circle
      ctx.beginPath();
		ctx.arc(cogX, cogY, 8, 0, 2 * Math.PI);
		ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
		ctx.fill();
		ctx.strokeStyle = '#FFFFFF';
		ctx.lineWidth = 2;
		ctx.stroke();
		
		// Balance arrows
		const arrowLength = 30;
		const centerX = videoWidth / 2;
		const centerY = videoHeight / 2;
		
		// Forward/back balance arrow
		if (Math.abs(weightDist.balance.forward) > 5) {
			const forwardArrowY = centerY + (weightDist.balance.forward / 100) * arrowLength;
			ctx.beginPath();
			ctx.moveTo(centerX - 10, forwardArrowY);
			ctx.lineTo(centerX + 10, forwardArrowY);
			ctx.lineTo(centerX, forwardArrowY + (weightDist.balance.forward > 0 ? 10 : -10));
			ctx.strokeStyle = weightDist.balance.forward > 0 ? '#FF4444' : '#4444FF';
			ctx.lineWidth = 3;
			ctx.stroke();
		}
		
		// Lateral balance arrow
		if (Math.abs(weightDist.balance.lateral) > 5) {
			const lateralArrowX = centerX + (weightDist.balance.lateral / 100) * arrowLength;
			ctx.beginPath();
			ctx.moveTo(lateralArrowX, centerY - 10);
			ctx.lineTo(lateralArrowX, centerY + 10);
			ctx.lineTo(lateralArrowX + (weightDist.balance.lateral > 0 ? 10 : -10), centerY);
			ctx.strokeStyle = weightDist.balance.lateral > 0 ? '#FF4444' : '#4444FF';
			ctx.lineWidth = 3;
      ctx.stroke();
    }
		
		// Stability indicator
		const stabilityColor = weightDist.balance.stability > 80 ? '#00FF00' : 
		                     weightDist.balance.stability > 60 ? '#FFAA00' : '#FF0000';
		ctx.fillStyle = stabilityColor;
		ctx.font = 'bold 14px Arial';
		ctx.textAlign = 'right';
		ctx.fillText(`Stability: ${weightDist.balance.stability.toFixed(0)}%`, videoWidth - 10, 30);
	}, []);

	// Draw swing feedback
	const drawSwingFeedback = useCallback((ctx: CanvasRenderingContext2D, feedback: DynamicFeedback) => {
		const videoWidth = ctx.canvas.width;
		const videoHeight = ctx.canvas.height;
		
		// Draw real-time feedback
		feedback.realTime.forEach((item, index) => {
			const x = item.visualIndicator.position.x * videoWidth;
			const y = item.visualIndicator.position.y * videoHeight;
			
			// Draw feedback indicator
			if (item.visualIndicator.type === 'circle') {
				ctx.beginPath();
				ctx.arc(x, y, item.visualIndicator.size, 0, 2 * Math.PI);
				ctx.fillStyle = item.visualIndicator.color + '40';
				ctx.fill();
				ctx.strokeStyle = item.visualIndicator.color;
				ctx.lineWidth = 2;
				ctx.stroke();
			} else if (item.visualIndicator.type === 'arrow') {
				ctx.strokeStyle = item.visualIndicator.color;
				ctx.lineWidth = 3;
				ctx.beginPath();
				ctx.moveTo(x - item.visualIndicator.size / 2, y);
				ctx.lineTo(x + item.visualIndicator.size / 2, y);
				ctx.lineTo(x + item.visualIndicator.size / 4, y - item.visualIndicator.size / 4);
				ctx.moveTo(x + item.visualIndicator.size / 2, y);
				ctx.lineTo(x + item.visualIndicator.size / 4, y + item.visualIndicator.size / 4);
				ctx.stroke();
			}
			
			// Draw feedback text
			ctx.fillStyle = item.visualIndicator.color;
			ctx.font = 'bold 12px Arial';
			ctx.textAlign = 'left';
			ctx.fillText(item.message, x + item.visualIndicator.size + 5, y + 5);
		});
		
		// Draw recommendations
		if (feedback.recommendations.length > 0) {
			ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
			ctx.fillRect(10, 10, 300, feedback.recommendations.length * 20 + 30);
			
			ctx.fillStyle = '#FFFFFF';
			ctx.font = 'bold 14px Arial';
			ctx.fillText('Recommendations:', 20, 30);
			
			ctx.font = '12px Arial';
			feedback.recommendations.forEach((rec, index) => {
				ctx.fillText(`• ${rec}`, 20, 50 + index * 20);
			});
		}
	}, []);


	const drawSwingPlaneFromTrajectory = useCallback((ctx: CanvasRenderingContext2D, trajectory: { x: number; y: number; frame: number }[], phaseList: EnhancedSwingPhase[]) => {
		if (!trajectory || trajectory.length < 10) return;
		
		// Debug monitoring for swing plane
		const planeCalculated = trajectory.length >= 10;
		const angle = calculateSwingPlaneAngle(trajectory);
		const consistency = calculateSwingPlaneConsistency(trajectory);
		const deviation = calculateSwingPlaneDeviation(trajectory);
		
		debuggerInstance.updateComponentStatus('swingPlane',
			planeCalculated && consistency > 0.7 ? 'ok' : 'warning',
			{ planeCalculated, angle, consistency, deviation },
			{ planeCalculated, angle, consistency, deviation }
		);
		
		const videoWidth = ctx.canvas.width;
		const videoHeight = ctx.canvas.height;
		const startIdx = 0;
		const topPhase = phaseList.find(p => p.name === 'top');
		const impactPhase = phaseList.find(p => p.name === 'impact');
		const topIdx = topPhase ? Math.floor((topPhase.startFrame + topPhase.endFrame) / 2) : Math.floor(trajectory.length * 0.3);
		const impactIdx = impactPhase ? impactPhase.startFrame : Math.floor(trajectory.length * 0.7);
		const s = trajectory[Math.max(0, Math.min(startIdx, trajectory.length - 1))];
		const t = trajectory[Math.max(0, Math.min(topIdx, trajectory.length - 1))];
		const i = trajectory[Math.max(0, Math.min(impactIdx, trajectory.length - 1))];
      ctx.beginPath();
		ctx.strokeStyle = 'rgba(255, 165, 0, 0.7)';
		ctx.lineWidth = 3;
		ctx.setLineDash([5, 3]);
		ctx.moveTo(s.x * videoWidth, s.y * videoHeight);
		ctx.lineTo(t.x * videoWidth, t.y * videoHeight);
		ctx.lineTo(i.x * videoWidth, i.y * videoHeight);
		ctx.stroke();
		ctx.setLineDash([]);
	}, []);

	const drawRealtimeClubHeadMarker = useCallback((ctx: CanvasRenderingContext2D, trajectory: { x: number; y: number; frame: number; t?: number }[]) => {
		if (!trajectory || trajectory.length === 0) return;
		
		// Find closest pose index to currentTime
		let closestIndex = 0;
		let minDiff = Number.POSITIVE_INFINITY;
		for (let i = 0; i < poses.length; i++) {
			const ts = poses[i]?.timestamp;
			if (ts === undefined) continue;
			const d = Math.abs(ts - currentTime);
			if (d < minDiff) { minDiff = d; closestIndex = i; }
		}
		
		const idx = Math.max(0, Math.min(closestIndex, trajectory.length - 1));
		const pt = trajectory[idx];
		const videoWidth = ctx.canvas.width;
		const videoHeight = ctx.canvas.height;
		
		// Get current pose for grip visualization
		const currentPose = poses[closestIndex];
		if (currentPose?.landmarks) {
			const leftWrist = currentPose.landmarks[15];
			const rightWrist = currentPose.landmarks[16];
			
			if (leftWrist && rightWrist) {
				// Draw grip position (where hands hold the club)
				const gripX = ((leftWrist.x + rightWrist.x) / 2) * videoWidth;
				const gripY = ((leftWrist.y + rightWrist.y) / 2) * videoHeight;
    
				// Draw grip marker
				ctx.beginPath();
				ctx.arc(gripX, gripY, 6, 0, 2 * Math.PI);
				ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
				ctx.fill();
				ctx.strokeStyle = '#FFFFFF';
				ctx.lineWidth = 2;
      ctx.stroke();
				
				// Draw line from grip to club head
				const clubX = pt.x * videoWidth;
				const clubY = pt.y * videoHeight;
				ctx.beginPath();
				ctx.moveTo(gripX, gripY);
				ctx.lineTo(clubX, clubY);
				ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
				ctx.lineWidth = 3;
				ctx.stroke();
    
				// Draw grip label
				ctx.fillStyle = '#FFFFFF';
				ctx.font = 'bold 12px Arial';
				ctx.fillText('GRIP', gripX + 10, gripY - 10);
			}
		}
		
		// Draw club head marker
		const x = pt.x * videoWidth;
		const y = pt.y * videoHeight;
		ctx.beginPath();
		ctx.arc(x, y, 8, 0, Math.PI * 2);
		ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
		ctx.fill();
		ctx.strokeStyle = '#FFFFFF';
		ctx.lineWidth = 2;
		ctx.stroke();
		
		// Draw club head label
		ctx.fillStyle = '#FFFFFF';
		ctx.font = 'bold 12px Arial';
		ctx.fillText('CLUB HEAD', x + 10, y - 10);
	}, [poses, currentTime]);

	// Fallback club path drawing for when main functions fail
	const drawFallbackClubPath = useCallback((ctx: CanvasRenderingContext2D, trajectory: { x: number; y: number; frame: number }[]) => {
		if (!trajectory || trajectory.length === 0) {
			console.warn('No trajectory data for fallback drawing');
			return;
		}
		
		console.log('Drawing fallback club path with', trajectory.length, 'points');
		const videoWidth = ctx.canvas.width;
		const videoHeight = ctx.canvas.height;
		
		// Draw simple white line for club path
		ctx.beginPath();
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
		ctx.lineWidth = 4;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		
		for (let i = 0; i < trajectory.length; i++) {
			const pt = trajectory[i];
			const x = pt.x * videoWidth;
			const y = pt.y * videoHeight;
			
			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		}
		ctx.stroke();
		
		// Draw start and end markers
		if (trajectory.length > 0) {
			const start = trajectory[0];
			const end = trajectory[trajectory.length - 1];
			
			// Start marker (green)
			ctx.beginPath();
			ctx.arc(start.x * videoWidth, start.y * videoHeight, 8, 0, 2 * Math.PI);
			ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
			ctx.fill();
			ctx.strokeStyle = '#FFFFFF';
			ctx.lineWidth = 2;
			ctx.stroke();
			
			// End marker (red)
			ctx.beginPath();
			ctx.arc(end.x * videoWidth, end.y * videoHeight, 8, 0, 2 * Math.PI);
			ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
			ctx.fill();
			ctx.strokeStyle = '#FFFFFF';
			ctx.lineWidth = 2;
			ctx.stroke();
		}
	}, []);

	// Video-synchronized rendering with frame accuracy
	const renderFrameAccurateClubPath = useCallback((ctx: CanvasRenderingContext2D, trajectory: { x: number; y: number; frame: number }[], currentTime: number) => {
		if (!trajectory || trajectory.length === 0) return;
		
		const videoWidth = ctx.canvas.width;
		const videoHeight = ctx.canvas.height;
		
		// Calculate current frame index from video time
		const currentFrame = Math.floor((currentTime / 1000) * 30); // Assuming 30fps
		const currentIndex = Math.min(currentFrame, trajectory.length - 1);
		
		// Draw complete path up to current frame
		ctx.beginPath();
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
		ctx.lineWidth = 3;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		
		for (let i = 0; i <= currentIndex; i++) {
			const pt = trajectory[i];
			const x = pt.x * videoWidth;
			const y = pt.y * videoHeight;
			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		}
		ctx.stroke();
		
		// Highlight current club position
		if (currentIndex >= 0 && currentIndex < trajectory.length) {
			const currentPt = trajectory[currentIndex];
			const x = currentPt.x * videoWidth;
			const y = currentPt.y * videoHeight;
			
			// Draw current club head marker
			ctx.beginPath();
			ctx.arc(x, y, 8, 0, 2 * Math.PI);
			ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
			ctx.fill();
			ctx.strokeStyle = '#FFFFFF';
			ctx.lineWidth = 2;
			ctx.stroke();
			
			// Draw frame info for debugging
			ctx.fillStyle = '#FFFFFF';
			ctx.font = 'bold 12px Arial';
			ctx.fillText(`Frame: ${currentIndex}`, x + 15, y - 15);
			ctx.fillText(`Time: ${(currentTime / 1000).toFixed(2)}s`, x + 15, y);
		}
	}, []);


	// Improved impact zone detection
	const detectImpactZone = useCallback((trajectory: { x: number; y: number; frame: number }[], phases: EnhancedSwingPhase[]) => {
		if (!trajectory || trajectory.length < 10) return null;
		
		// Method 1: Find lowest point in trajectory (club head closest to ground)
		let lowestPoint = 0;
		let lowestY = trajectory[0].y;
		
		for (let i = 1; i < trajectory.length; i++) {
			if (trajectory[i].y > lowestY) {
				lowestY = trajectory[i].y;
				lowestPoint = i;
			}
		}
		
		// Method 2: Find point with maximum horizontal velocity (fastest swing)
		let maxVelocityPoint = 0;
		let maxVelocity = 0;
		
		for (let i = 1; i < trajectory.length - 1; i++) {
			const prev = trajectory[i - 1];
			const curr = trajectory[i];
			const next = trajectory[i + 1];
			
			const velocityX = Math.abs(next.x - prev.x);
			const velocityY = Math.abs(next.y - prev.y);
			const totalVelocity = velocityX + velocityY;
			
			if (totalVelocity > maxVelocity) {
				maxVelocity = totalVelocity;
				maxVelocityPoint = i;
			}
		}
		
		// Method 3: Use phase-based detection
		const impactPhase = phases.find(p => p.name === 'impact');
		const impactFrame = impactPhase ? impactPhase.startFrame : null;
		
		// Take consensus of methods
		const candidates = [lowestPoint, maxVelocityPoint];
		if (impactFrame !== null) candidates.push(impactFrame);
		
		// Return median of valid candidates
		candidates.sort((a, b) => a - b);
		const impactIndex = candidates[Math.floor(candidates.length / 2)];
		
		console.log('🎯 Impact detection:', {
			lowestPoint,
			maxVelocityPoint,
			impactFrame,
			finalImpact: impactIndex
		});
		
		return impactIndex;
	}, []);

	const validateClubPath = useCallback((trajectory: { x: number; y: number }[], phaseList: EnhancedSwingPhase[]) => {
		const errors: string[] = [];
		if (!trajectory || trajectory.length < 50) errors.push('Insufficient trajectory data');
		const get = (n: EnhancedSwingPhase['name']) => phaseList.find(p => p.name === n);
		const backswing = get('backswing');
		const downswing = get('downswing');
		const impact = get('impact');
		if (downswing && backswing && downswing.startFrame < backswing.endFrame) {
			errors.push('Invalid phase sequence: downswing before backswing completion');
		}
		if (impact && downswing && impact.startFrame < downswing.startFrame) {
			errors.push('Impact occurs before downswing start');
		}
		return errors;
	}, []);

  // Draw force vectors
  const drawForceVectors = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    const closestPose = findClosestPose(currentTime);
    
    if (closestPose?.landmarks) {
      // Draw simplified force vectors from key points
      const keyPoints = [11, 12, 23, 24]; // Shoulders and hips
      
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.lineWidth = 2;
      
      keyPoints.forEach(index => {
        const landmark = closestPose.landmarks[index];
        if (landmark && landmark.visibility && landmark.visibility > 0.5) {
          // Draw a small arrow indicating movement direction
          const x = landmark.x * width;
          const y = landmark.y * height;
          const length = 20;
          
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + length, y - length);
          ctx.moveTo(x, y);
          ctx.lineTo(x - length, y - length);
          ctx.stroke();
        }
      });
    }
  }, [currentTime, poses, findClosestPose]);

  // Draw rotation arcs
  const drawRotationArcs = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    const closestPose = findClosestPose(currentTime);
    
    if (closestPose?.landmarks) {
      // Draw rotation arcs for shoulders and hips
      const shoulderCenter = {
        x: (closestPose.landmarks[11].x + closestPose.landmarks[12].x) / 2 * width,
        y: (closestPose.landmarks[11].y + closestPose.landmarks[12].y) / 2 * height
      };
      
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(shoulderCenter.x, shoulderCenter.y, 30, 0, Math.PI);
      ctx.stroke();
    }
  }, [currentTime, poses, findClosestPose]);

  // Draw basic metrics
  const drawBasicMetrics = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    
    // Position metrics in bottom right
    const metricsX = width - 200;
    const metricsY = height - 100;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(metricsX, metricsY, 190, 90);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Swing Metrics', metricsX + 10, metricsY + 20);
    
    ctx.font = '16px Arial';
    ctx.fillText(`Poses: ${poses.length}`, metricsX + 10, metricsY + 40);
    ctx.fillText(`Phases: ${phases.length}`, metricsX + 10, metricsY + 55);
    ctx.fillText(`Time: ${(currentTime / 1000).toFixed(1)}s`, metricsX + 10, metricsY + 70);
  }, [poses.length, phases.length, currentTime]);

  // Draw technical overlays for Technical View
  const drawTechnicalOverlays = useCallback((ctx: CanvasRenderingContext2D) => {
    console.log('=== DRAWING TECHNICAL OVERLAYS ===');
    const { width, height } = ctx.canvas;
    console.log('Canvas dimensions for technical overlays:', { width, height });
    
    // Draw all landmarks
    if (config.landmarks) {
      console.log('Drawing landmarks...');
      const closestPose = findClosestPose(currentTime);
      console.log('Closest pose for technical overlays:', closestPose);
      
      if (closestPose?.landmarks) {
        console.log('Drawing', closestPose.landmarks.length, 'landmarks');
        ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
        
        let landmarksDrawn = 0;
        closestPose.landmarks.forEach((landmark, index) => {
          if (landmark && landmark.visibility && landmark.visibility > 0.5) {
            const x = landmark.x * width;
            const y = landmark.y * height;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
            landmarksDrawn++;
            
            // Landmark numbers for debugging
            if (overlayMode === 'technical') {
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 14px Arial';
              ctx.fillText(index.toString(), x + 5, y - 5);
              ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
            }
          }
        });
        
        console.log('Landmarks drawn:', landmarksDrawn);
      } else {
        console.warn('No landmarks found in closest pose');
      }
    }

    // Draw skeleton
    if (config.skeleton) {
      console.log('Drawing skeleton...');
      const closestPose = findClosestPose(currentTime);
      if (closestPose?.landmarks) {
        drawSkeleton(ctx, closestPose.landmarks);
      } else {
        console.warn('No landmarks found for skeleton');
      }
    }

    // Draw force vectors
    if (config.forceVectors) {
      console.log('Drawing force vectors...');
      drawForceVectors(ctx);
    }

    // Draw rotation arcs
    if (config.rotationArcs) {
      console.log('Drawing rotation arcs...');
      drawRotationArcs(ctx);
    }

    // Include minimal overlays too
    console.log('Drawing minimal overlays...');
    drawMinimalOverlays(ctx);
    
    console.log('Technical overlays drawing completed');
  }, [config, currentTime, poses, phases, overlayMode, drawMinimalOverlays, findClosestPose, drawSkeleton, drawForceVectors, drawRotationArcs]);


  // Main render function
  const renderOverlays = useCallback(() => {
    console.log('=== RENDER OVERLAYS CALLED ===');
    console.log('Canvas ref:', canvasRef.current ? 'exists' : 'missing');
    console.log('Video ref:', videoRef.current ? 'exists' : 'missing');
    console.log('Overlay mode:', overlayMode);
    console.log('Config:', config);
    console.log('Poses available:', poses?.length || 0);
    console.log('Phases available:', phases?.length || 0);
    console.log('Trajectory points:', trajectoryRef.current?.length || 0);
    
    if (!canvasRef.current || !videoRef.current) {
      console.error('Missing canvas or video ref');
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Canvas context not available');
      return;
    }

    const { videoWidth, videoHeight } = videoRef.current;
    console.log('Video dimensions:', { videoWidth, videoHeight });
    
    if (videoWidth === 0 || videoHeight === 0) {
      console.warn('Video dimensions are 0, skipping render');
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    console.log('Canvas set to video dimensions:', { width: canvas.width, height: canvas.height });

    // Only render if we should (throttling)
    if (!shouldRender()) {
      console.log('Skipping render due to throttling');
      return;
    }

    console.log('Rendering overlays for mode:', overlayMode);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render based on overlay mode
    if (overlayMode === 'clean') {
      console.log('Clean mode - no overlays');
      return; // No overlays
    } else if (overlayMode === 'analysis') {
      console.log('Analysis mode - drawing minimal overlays');
      drawMinimalOverlays(ctx);
    } else if (overlayMode === 'technical') {
      console.log('Technical mode - drawing technical overlays');
      drawTechnicalOverlays(ctx);
    }
    
    console.log('Overlay rendering completed');
  }, [canvasRef, videoRef, overlayMode, shouldRender, drawMinimalOverlays, drawTechnicalOverlays]);

  // Test canvas drawing function
  const testCanvasDrawing = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    console.log('=== TESTING CANVAS DRAWING ===');
    
    // Draw a simple red square to test canvas
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 10, 50, 50);
    console.log('Test red square drawn');
    
    // Draw a simple green circle
    ctx.fillStyle = 'green';
    ctx.beginPath();
    ctx.arc(100, 100, 25, 0, 2 * Math.PI);
    ctx.fill();
    console.log('Test green circle drawn');
  }, []);

  // Continuous rendering loop
  useEffect(() => {
    console.log('=== STARTING CONTINUOUS RENDERING LOOP ===');
    
    let animationFrameId: number;
    
    const renderLoop = () => {
      renderOverlays();
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    
    // Start the render loop
    animationFrameId = requestAnimationFrame(renderLoop);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        console.log('=== RENDER LOOP CANCELLED ===');
      }
    };
  }, [renderOverlays]);

  // Test canvas on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      testCanvasDrawing();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [testCanvasDrawing]);

  return null; // This component only handles rendering, no UI
}

export { OVERLAY_PRESETS };
