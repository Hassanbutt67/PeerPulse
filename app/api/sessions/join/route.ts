import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Session code is required' },
        { status: 400 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session code' },
        { status: 404 }
      );
    }

    if (!session.isActive) {
      return NextResponse.json(
        { error: 'Session has ended' },
        { status: 400 }
      );
    }

    return NextResponse.json({ sessionId: session.id });
    
  } catch (error) {
    console.error('Join session error:', error);
    return NextResponse.json(
      { error: 'Failed to join session' },
      { status: 500 }
    );
  }
}