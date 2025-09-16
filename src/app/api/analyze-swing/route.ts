import { NextRequest, NextResponse } from 'next/server';

let openAIClient: any | null = null;
async function getOpenAIClient(): Promise<any | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!openAIClient) {
    const { default: OpenAI } = await import('openai');
    openAIClient = new OpenAI({ apiKey });
  }
  return openAIClient;
}

export async function POST(request: NextRequest) {
  try {
    const { swingData, recordingQuality, swingMetrics } = await request.json();

    if (!swingData || !swingMetrics) {
      return NextResponse.json({ error: 'Missing swing data' }, { status: 400 });
    }

    // Check if OpenAI API key is available
    const client = await getOpenAIClient();
    if (!client) {
      console.warn('OpenAI API key not available, returning fallback analysis');
      return NextResponse.json({
        overallScore: 75,
        strengths: ['Good swing fundamentals detected'],
        improvements: ['Consider working with a golf instructor for detailed feedback'],
        technicalNotes: ['AI analysis unavailable - OpenAI API key not configured'],
        recordingQuality: {
          angle: 'side',
          score: 80,
          recommendations: ['Ensure good lighting and full body visibility']
        }
      });
    }

    // Create a detailed prompt for OpenAI
    const prompt = `
You are a professional golf instructor analyzing a golf swing. Based on the following data, provide detailed, constructive feedback:

SWING METRICS:
- Tempo Ratio: ${swingMetrics.tempo?.ratio || 'N/A'}:1 (ideal: 3:1)
- Shoulder Rotation: ${swingMetrics.rotation?.shoulders || 'N/A'}° (target: 90-100°)
- Hip Rotation: ${swingMetrics.rotation?.hips || 'N/A'}° (target: 40-50°)
- X-Factor: ${swingMetrics.rotation?.xFactor || 'N/A'}° (target: 20-30°)
- Balance Score: ${swingMetrics.balance?.score ? (swingMetrics.balance.score * 100).toFixed(0) : 'N/A'}%
- Swing Plane Consistency: ${swingMetrics.plane?.consistency ? (swingMetrics.plane.consistency * 100).toFixed(0) : 'N/A'}%

RECORDING QUALITY:
- Angle: ${recordingQuality?.angle || 'unknown'}
- Quality Score: ${recordingQuality?.score ? (recordingQuality.score * 100).toFixed(0) : 'N/A'}%

Please provide:
1. A brief overall assessment (2-3 sentences)
2. Top 3 strengths to maintain
3. Top 3 areas for improvement with specific drills
4. One key technical tip for immediate improvement
5. Recording recommendations if quality is poor

Format your response as JSON with these keys: overallAssessment, strengths, improvements, keyTip, recordingTips
`;

    const client = await getOpenAIClient();

    // Fallback: if no API key is configured at build/runtime, return a basic structured response
    if (!client) {
      const fallback = {
        overallAssessment: 'AI analysis unavailable. Providing heuristic feedback based on detected metrics.',
        strengths: [
          swingMetrics.plane?.consistency ? `Plane consistency ${(swingMetrics.plane.consistency * 100).toFixed(0)}%` : 'Solid rhythm'
        ],
        improvements: [
          swingMetrics.tempo?.ratio && swingMetrics.tempo.ratio < 2.7 ? 'Lengthen backswing for closer to 3:1 tempo' : 'Focus on balanced finish',
          swingMetrics.rotation?.shoulders && swingMetrics.rotation.shoulders < 85 ? 'Increase shoulder turn toward 90-100°' : 'Maintain posture through impact'
        ],
        keyTip: 'Work one priority at a time; film from down-the-line in good light.',
        recordingTips: recordingQuality?.score && recordingQuality.score < 0.7 ? ['Record in brighter light', 'Ensure full body in frame'] : []
      };

      return NextResponse.json({ success: true, analysis: fallback, timestamp: new Date().toISOString() });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional golf instructor with 20+ years of experience. Provide constructive, specific feedback that helps golfers improve their swing. Be encouraging but honest about areas needing work."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse JSON response, fallback to text if needed
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch {
      // If not JSON, wrap in a structured format
      parsedResponse = {
        overallAssessment: aiResponse,
        strengths: ["Continue practicing the fundamentals"],
        improvements: ["Focus on consistency"],
        keyTip: "Work on one aspect at a time",
        recordingTips: recordingQuality?.score < 0.7 ? ["Record in better lighting", "Ensure full body visibility"] : []
      };
    }

    return NextResponse.json({
      success: true,
      analysis: parsedResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze swing with AI',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
