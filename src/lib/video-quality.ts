// Lightweight video quality checks and analysis transparency helpers

export interface VideoQuality {
	fullBodyVisible: boolean;
	tooShort: boolean;
	poorLighting: boolean;
	angledView: boolean; // angled/incorrect viewpoint
	durationSec?: number;
	width?: number;
	height?: number;
	brightness?: number;
}

export interface QualityResult {
	isOk: boolean;
	issues: string[];
	message: string;
	quality: VideoQuality;
}

// Estimate brightness by sampling a small grid of pixels
async function estimateBrightness(video: HTMLVideoElement): Promise<number> {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	const width = Math.max(1, Math.min(160, video.videoWidth));
	const height = Math.max(1, Math.min(90, video.videoHeight));
	canvas.width = width;
	canvas.height = height;
	ctx?.drawImage(video, 0, 0, width, height);
	const img = ctx?.getImageData(0, 0, width, height);
	if (!img) return 0.5;
	let sum = 0;
	for (let i = 0; i < img.data.length; i += 4) {
		const r = img.data[i];
		const g = img.data[i + 1];
		const b = img.data[i + 2];
		// perceived luminance
		sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
	}
	const avg = sum / (img.data.length / 4) / 255;
	return Math.max(0, Math.min(1, avg));
}

export async function validateVideoQualityElement(video: HTMLVideoElement): Promise<QualityResult> {
	const duration = video.duration || 0;
	const width = video.videoWidth || 0;
	const height = video.videoHeight || 0;
	const brightness = await estimateBrightness(video).catch(() => 0.5);

	const fullBodyVisible = width >= 320 && height >= 320; // proxy for framing
	const tooShort = duration > 22; // max 22 seconds, no minimum
	const poorLighting = brightness < 0.25; // dark frame
	// Proxy for angled view: aspect ratio far from 16:9 or 9:16 implies potential odd angle
	const aspect = width && height ? width / height : 16 / 9;
	const tangledView = aspect < 1.2 && aspect > 0.9 ? false : false; // placeholder heuristic (disabled)

	const issues: string[] = [];
	if (!fullBodyVisible) issues.push('⚠️ Please ensure your entire body is visible in the frame');
	if (tooShort) issues.push('📹 Video should be no longer than 22 seconds for optimal analysis');
	if (poorLighting) issues.push('💡 Improve lighting for better pose detection');
	// We avoid strong-arming angle until we have heading detection
	// if (tangledView) issues.push('📐 Record from side view for optimal swing analysis');

	return {
		isOk: issues.length === 0,
		issues,
		message: issues.length === 0 ? '✅ Video quality looks good' : issues[0],
		quality: {
			fullBodyVisible,
			tooShort,
			poorLighting,
			tangledView,
			durationSec: duration,
			width,
			height,
			brightness
		}
	};
}

export function getAnalysisSource(posesQuality: { poseCount: number; avgVisible: number; }): {
	source: 'SIMULATED_DATA' | 'VIDEO_ANALYSIS';
	confidence: 'LOW' | 'MEDIUM' | 'HIGH';
	message: string;
} {
	const { poseCount, avgVisible } = posesQuality;
	if (poseCount < 10 || avgVisible < 8) {
		return {
			source: 'SIMULATED_DATA',
			confidence: 'LOW',
			message: '⚠️ Using enhanced simulation data - ensure clear video for accurate metrics'
		};
	}
	const confidence = avgVisible > 18 ? 'HIGH' : avgVisible > 12 ? 'MEDIUM' as const : 'LOW';
	return {
		source: 'VIDEO_ANALYSIS',
		confidence,
		message: '✅ Analysis based on your swing video'
	};
}

export function formatQualityGuidance(result: QualityResult): string[] {
	if (result.isOk) {
		return [];
	}
	return result.issues;
}


