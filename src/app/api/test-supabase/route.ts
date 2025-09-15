import { NextRequest, NextResponse } from 'next/server';
import { testSupabaseConnection } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Supabase connection via API...');
    
    const isConnected = await testSupabaseConnection();
    
    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'Supabase connection successful',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Supabase connection failed',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Supabase test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Supabase test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
