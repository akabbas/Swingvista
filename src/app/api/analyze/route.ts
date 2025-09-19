import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { validateEnv } from '@/lib/env/validate';

export async function POST(req: NextRequest) {
  try {
    const { ok: _envOk } = validateEnv(); // OpenAI is recommended; route can still respond without it
    const { poses: _poses, swingMetrics, recordingQuality } = await req.json();

    const ai = getOpenAI();
    if (!ai) {
      return NextResponse.json({
        success: true,
        analysis: {
          overallAssessment: 'AI unavailable. Heuristic feedback based on metrics.',
          strengths: [swingMetrics?.plane?.consistency ? `Plane consistency ${(swingMetrics.plane.consistency * 100).toFixed(0)}%` : 'Solid rhythm'],
          improvements: ['Work toward 3:1 tempo', 'Increase shoulder turn toward 90-100°'],
          keyTip: 'Film down-the-line in good light',
          recordingTips: recordingQuality?.score < 0.7 ? ['Better lighting', 'Full body in frame'] : []
        }
      });
    }

    const prompt = `Analyze this golf swing comprehensively based on the provided metrics. Provide specific, actionable feedback as a professional golf instructor would.`;
    
    const systemPrompt = `You are a world-class golf instructor with 20+ years of experience teaching professional and amateur golfers. 

Analyze the swing metrics provided and give:
1. An overall assessment of the swing quality
2. Specific strengths to highlight
3. Concrete improvements with actionable advice
4. One key tip that would make the biggest difference
5. Recording quality tips if needed

Be specific, encouraging, and focus on the most impactful changes. Use golf terminology appropriately and provide drills or practice suggestions when relevant.

Format your response as JSON with these fields:
- overallAssessment: string (2-3 sentences about the swing)
- strengths: string[] (2-4 specific strengths)
- improvements: string[] (2-4 specific improvements with advice)
- keyTip: string (one key insight)
- recordingTips: string[] (if recording quality is poor)`;

    const completion = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Swing Metrics: ${JSON.stringify(swingMetrics, null, 2)}\n\nRecording Quality: ${JSON.stringify(recordingQuality, null, 2)}\n\nPlease analyze this swing and provide your professional assessment.` }
      ],
      temperature: 0.6,
      max_tokens: 1000,
    });

    const text = completion.choices[0]?.message?.content || '';
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = { overallAssessment: text }; }

    return NextResponse.json({ success: true, analysis: parsed });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
