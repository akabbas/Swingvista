import { NextRequest, NextResponse } from 'next/server';
import { getSwingById } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const swing = await getSwingById(params.id);
    return NextResponse.json(swing);
  } catch (error) {
    console.error('Error fetching swing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch swing' },
      { status: 500 }
    );
  }
}
