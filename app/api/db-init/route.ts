import { initializeDatabase } from '@/app/api/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await initializeDatabase();
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    console.error('[v0] DB init error:', error);
    return NextResponse.json(
      { error: 'Database initialization failed', details: error },
      { status: 500 }
    );
  }
}
