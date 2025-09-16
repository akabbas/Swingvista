import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { swingData, recordingQuality, swingMetrics } = await request.json();

    if (!swingData || !swingMetrics) {
      return NextResponse.json({ error: 'Missing swing data' }, { status: 400 });
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

    const completion = await openai.chat.completions.create({
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
