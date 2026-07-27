import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }  // ← Make params a Promise
) {
  try {
    // Await the params
    const { id } = await params;  // ← THIS IS THE KEY FIX!
    
    console.log('🔍 Fetching session:', id);

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        feedbacks: {
          orderBy: { timestamp: 'desc' },
          take: 50
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
    
  } catch (error: any) {
    console.error('Fetch session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch session' },
      { status: 500 }
    );
  }
}