import { NextRequest, NextResponse } from 'next/server';
import { saveSwing, getSwings, getClubStats } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const swingData = await request.json();
    
    // In a real app, you'd get the user ID from authentication
    const userId = 'demo-user'; // Placeholder for demo
    
    const swing = await saveSwing({
      ...swingData,
      user_id: userId
    });
    
    return NextResponse.json(swing);
  } catch (error) {
    console.error('Error saving swing:', error);
    return NextResponse.json(
      { error: 'Failed to save swing' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const userId = 'demo-user'; // Placeholder for demo
    
    if (type === 'stats') {
      const stats = await getClubStats(userId);
      return NextResponse.json(stats);
    } else {
      const swings = await getSwings(userId);
      return NextResponse.json(swings);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
