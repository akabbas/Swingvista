import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI with server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { swingMetrics, swingCharacteristics } = await request.json();
    
    console.log('🤖 AI FEEDBACK API: Generating feedback for swing metrics');
    
    const prompt = createFeedbackPrompt(swingMetrics, swingCharacteristics);
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use cheaper model for API calls
      messages: [
        {
          role: "system",
          content: `You are a professional golf instructor with 20+ years of experience teaching players of all levels. Provide specific, actionable feedback that helps golfers improve their swing based on the metrics provided.

Format your response as a JSON object with these exact fields:
{
  "overallAssessment": "Professional evaluation of the swing overall",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "drills": ["drill1", "drill2", "drill3"],
  "keyTip": "One key insight for biggest impact",
  "professionalInsight": "Advanced insight about the swing",
  "nextSteps": ["step1", "step2", "step3"],
  "confidence": 0.95
}`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse JSON response
    try {
      const aiFeedback = JSON.parse(content);
      console.log('✅ AI FEEDBACK API: Generated successfully');
      return NextResponse.json({ 
        success: true,
        feedback: aiFeedback 
      });
    } catch (parseError) {
      console.warn('⚠️ AI FEEDBACK API: JSON parse error, using fallback');
      return NextResponse.json({ 
        success: false,
        error: 'Failed to parse AI response',
        fallback: generateFallbackFeedback(swingMetrics, swingCharacteristics)
      });
    }

  } catch (error) {
    console.error("❌ AI FEEDBACK API ERROR:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to generate AI feedback",
        fallback: generateFallbackFeedback(swingMetrics, swingCharacteristics)
      },
      { status: 500 }
    );
  }
}

function createFeedbackPrompt(metrics: any, characteristics: any): string {
  return `
As a professional golf instructor, analyze this golf swing and provide specific feedback:

SWING METRICS:
- Tempo Ratio: ${metrics.tempo?.ratio || 'N/A'} (Ideal: 3.0)
- Weight Transfer: ${metrics.weightTransfer?.transfer ? (metrics.weightTransfer.transfer * 100).toFixed(1) : 'N/A'}% (Ideal: 80-90%)
- Shoulder Rotation: ${metrics.rotation?.shoulderRotation || 'N/A'}°
- Hip Rotation: ${metrics.rotation?.hipRotation || 'N/A'}°
- X-Factor (Shoulder-Hip Separation): ${metrics.rotation?.xFactor || 'N/A'}°
- Swing Plane Deviation: ${metrics.swingPlane?.deviation || 'N/A'}°
- Club Path: ${metrics.clubPath?.insideOut || 'N/A'}° (Positive = inside-out)
- Impact Hands Position: ${metrics.impact?.handPosition || 'N/A'} inches ahead of ball
- Body Alignment: ${metrics.bodyAlignment?.headMovement || 'N/A'} inches head movement
- Follow-Through Extension: ${metrics.followThrough?.extension ? (metrics.followThrough.extension * 100).toFixed(1) : 'N/A'}%

SWING CHARACTERISTICS:
- Backswing Length: ${characteristics.backswingLength || 'N/A'}
- Downswing Timing: ${characteristics.downswingTiming || 'N/A'}ms
- Impact Consistency: ${characteristics.impactConsistency || 'N/A'}%
- Finish Balance: ${characteristics.finishBalance || 'N/A'}
- Swing Speed: ${characteristics.swingSpeed || 'N/A'} mph
- Club Path Consistency: ${characteristics.clubPathConsistency || 'N/A'}%
- Tempo Consistency: ${characteristics.tempoConsistency || 'N/A'}%

Please provide professional analysis focusing on:
1. What the golfer is doing well (specific strengths)
2. The most important areas for improvement
3. Specific drills and exercises for each improvement area
4. One key tip that will make the biggest difference
5. Professional insight about their swing mechanics
6. Next steps for continued improvement

Be encouraging but honest, specific but not overwhelming, and always provide actionable advice.
`;
}

function generateFallbackFeedback(metrics: any, characteristics: any): any {
  console.log('🔄 AI FEEDBACK API: Using fallback feedback system');
  
  const tempo = metrics.tempo?.ratio || 3.0;
  const weightTransfer = metrics.weightTransfer?.transfer ? metrics.weightTransfer.transfer * 100 : 85;
  const xFactor = metrics.rotation?.xFactor || 45;
  
  const strengths = [];
  const improvements = [];
  const drills = [];
  
  // Analyze strengths
  if (tempo >= 2.8 && tempo <= 3.2) {
    strengths.push("Excellent tempo ratio - your timing is on point");
  }
  if (weightTransfer >= 80) {
    strengths.push("Good weight transfer - you're getting to your front foot");
  }
  if (xFactor >= 40) {
    strengths.push("Solid shoulder-hip separation - great for power generation");
  }
  
  // Analyze improvements
  if (tempo < 2.5) {
    improvements.push("Tempo is too quick - slow down your backswing");
    drills.push("Practice with a metronome: 3 beats back, 1 beat down");
  }
  if (weightTransfer < 75) {
    improvements.push("Need more weight transfer to front foot at impact");
    drills.push("Try the 'step-through' drill to feel proper weight shift");
  }
  if (xFactor < 35) {
    improvements.push("Increase shoulder-hip separation for more power");
    drills.push("Focus on turning shoulders more while keeping hips stable");
  }
  
  // Default feedback if no specific issues
  if (strengths.length === 0) {
    strengths.push("Good athletic ability and swing foundation");
  }
  if (improvements.length === 0) {
    improvements.push("Continue practicing to maintain consistency");
    drills.push("Focus on tempo and rhythm in your practice sessions");
  }
  
  return {
    overallAssessment: "Your swing shows good fundamentals with room for improvement. Focus on the key areas identified to take your game to the next level.",
    strengths,
    improvements,
    drills,
    keyTip: "Focus on tempo - a 3:1 backswing to downswing ratio is the foundation of a great swing",
    professionalInsight: "Consistency comes from proper tempo and weight transfer. These are the building blocks of a repeatable swing.",
    nextSteps: [
      "Practice the recommended drills daily",
      "Focus on one improvement area at a time",
      "Record your swing regularly to track progress"
    ],
    confidence: 0.7
  };
}
