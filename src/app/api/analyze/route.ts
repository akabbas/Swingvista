import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { prompt, swingMetrics, recordingQuality } = await req.json();

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

    const completion = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a seasoned golf coach. Be constructive and specific.' },
        { role: 'user', content: prompt || 'Analyze my swing based on provided metrics.' }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const text = completion.choices[0]?.message?.content || '';
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = { overallAssessment: text }; }

    return NextResponse.json({ success: true, analysis: parsed });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
