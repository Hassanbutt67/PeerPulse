import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    // Check if user is an instructor
    if (session?.user?.role === 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Instructors cannot submit feedback on their own sessions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { sessionId, emoji, comment } = body;

    if (!sessionId || !emoji) {
      return NextResponse.json(
        { error: 'Session ID and emoji are required' },
        { status: 400 }
      );
    }

    // Check if session exists and is active
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (!sessionData.isActive) {
      return NextResponse.json(
        { error: 'Session is no longer active' },
        { status: 400 }
      );
    }

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        sessionId,
        emoji,
        comment: comment || '',
        userId: session?.user?.id || null,
        isAnonymous: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      feedback 
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}