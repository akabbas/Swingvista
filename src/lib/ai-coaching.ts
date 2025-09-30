import { RealGolfAnalysis } from './real-golf-analysis';

export interface CoachingInput {
	metrics: any;
	userHistory?: {
		bestTempo?: number;
		avgXFactor?: number;
		recentSessions?: number;
	};
	goals?: {
		tempoTarget?: number;
		xFactorTarget?: number;
		planeDeviationMax?: number;
		weightTransferTarget?: number; // 0..1
	};
}

export interface CoachingOutput {
	summary: string[];
	recommendations: string[];
	drills: Array<{ title: string; description: string; link?: string }>; 
	focusAreas: string[];
}

export function generateIntelligentFeedback(input: CoachingInput): CoachingOutput {
	const m: any = input.metrics || {};
	const out: CoachingOutput = {
		summary: [],
		recommendations: [],
		drills: [],
		focusAreas: []
	};

	const tempoRatio = m.tempo?.ratio ?? m.tempo?.tempoRatio;
	const xFactor = m.rotation?.xFactor;
	const planeDev = m.swingPlane?.deviation ?? m.swingPlane?.planeDeviation;
	const transfer = m.weightTransfer?.transfer;

	if (tempoRatio) {
		if (tempoRatio < 2.2) {
			out.summary.push(`Tempo a bit quick (${tempoRatio.toFixed(2)}).`);
			out.recommendations.push('Smooth the transition at the top; add a brief pause.');
			out.drills.push({
				title: '1-2 Tempo Drill',
				description: 'Count 1 to top, 2 through impact to slow the transition.',
				link: 'https://www.youtube.com/results?search_query=golf+tempo+drill'
			});
			out.focusAreas.push('Tempo control');
		} else if (tempoRatio > 3.2) {
			out.summary.push(`Tempo on the slow side (${tempoRatio.toFixed(2)}).`);
			out.recommendations.push('Increase downswing speed slightly while staying balanced.');
			out.drills.push({
				title: 'Metronome Tempo',
				description: 'Swing to a metronome for a consistent 3:1 feel.',
				link: 'https://www.youtube.com/results?search_query=metronome+golf+tempo'
			});
			out.focusAreas.push('Downswing acceleration');
		} else {
			out.summary.push(`Tempo in a solid range (${tempoRatio.toFixed(2)}).`);
		}
	}

	if (typeof xFactor === 'number') {
		if (xFactor < 35) {
			out.summary.push(`Limited X-Factor (${xFactor.toFixed(0)}°).`);
			out.recommendations.push('Increase hip-shoulder separation at the top.');
			out.drills.push({ title: 'X-Factor Stretch', description: 'Cross your arms and rotate shoulders against stable hips.' });
			out.focusAreas.push('Rotation separation');
		} else if (xFactor > 55) {
			out.summary.push(`High X-Factor (${xFactor.toFixed(0)}°).`);
			out.recommendations.push('Ensure you can stabilize and sequence properly.');
			out.drills.push({ title: 'Step-Through Sequence', description: 'Step-through swings to feel proper kinetic chain.' });
			out.focusAreas.push('Sequencing');
		} else {
			out.summary.push(`X-Factor looks good (${xFactor.toFixed(0)}°).`);
		}
	}

	if (typeof planeDev === 'number') {
		if (planeDev > 12) {
			out.summary.push(`Swing plane variation high (${planeDev.toFixed(1)}°).`);
			out.recommendations.push('Shallower path in transition; avoid over-the-top move.');
			out.drills.push({ title: 'Headcover Under Trail Arm', description: 'Keeps the trail elbow connected for shallower plane.' });
			out.focusAreas.push('Plane consistency');
		} else {
			out.summary.push(`Swing plane consistency acceptable (${planeDev.toFixed(1)}°).`);
		}
	}

	if (typeof transfer === 'number') {
		const pct = Math.round(transfer * 100);
		if (pct < 55) {
			out.summary.push(`Weight transfer is light (${pct}%).`);
			out.recommendations.push('Shift pressure to lead side earlier in downswing.');
			out.drills.push({ title: 'Pump Drill', description: 'Pump to lead side before releasing the club.' });
			out.focusAreas.push('Pressure shift');
		} else {
			out.summary.push(`Weight transfer looks solid (${pct}%).`);
		}
	}

	// Personalization hooks
	if (input.goals?.tempoTarget && tempoRatio) {
		const diff = (tempoRatio - input.goals.tempoTarget).toFixed(2);
		out.recommendations.push(`Tempo vs target: ${diff}. Practice to align with goal.`);
	}

	return out;
}


