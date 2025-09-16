import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { validateEnv } from '@/lib/env/validate';

export async function POST(request: NextRequest) {
  try {
    const { ok, missing } = validateEnv();
    if (!ok) return NextResponse.json({ error: 'Missing environment variables', missing }, { status: 500 });

    const { feedback, timestamp, email } = await request.json();
    if (!feedback || typeof feedback !== 'string') {
      return NextResponse.json({ error: 'Invalid feedback' }, { status: 400 });
    }
    const ts = timestamp || new Date().toISOString();

    const supabase = getSupabaseServer();
    if (supabase) {
      try {
        const payload: any = { feedback, timestamp: ts };
        if (email && typeof email === 'string') payload.email = email;
        await supabase.from('feedback').insert([payload]);
      } catch {
        console.warn('Failed to persist feedback to Supabase, falling back to log.');
        console.log('[Feedback]', { feedback, timestamp: ts });
      }
    } else {
      console.log('[Feedback]', { feedback, timestamp: ts });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseServer();
    if (supabase) {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(200);
      if (error) throw error;
      return NextResponse.json({ items: data || [] });
    }
    return NextResponse.json({ items: [] });
  } catch (error) {
    console.error('Feedback list error:', error);
    return NextResponse.json({ items: [], error: 'Failed to load feedback' }, { status: 500 });
  }
}


