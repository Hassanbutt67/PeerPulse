import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('🔍 Fetching session:', id);

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        feedbacks: {
          orderBy: { timestamp: 'desc' },
          take: 50,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        },
        contents: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        },
        instructor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        insights: {
          orderBy: { generatedAt: 'desc' },
          take: 5
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const totalFeedbacks = await prisma.feedback.count({
      where: { sessionId: id }
    });

    const feedbackStats = await prisma.feedback.groupBy({
      by: ['emoji'],
      where: { sessionId: id },
      _count: true
    });

    const response = {
      ...session,
      stats: {
        totalFeedbacks,
        emojiDistribution: feedbackStats.reduce((acc: any, curr: any) => {
          acc[curr.emoji] = curr._count;
          return acc;
        }, {})
      }
    };

    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ Fetch session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Unauthorized - Only instructors can update sessions' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { title, description, isActive } = body;

    const existingSession = await prisma.session.findFirst({
      where: {
        id,
        instructorId: session.user.id
      }
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found or you do not have permission' },
        { status: 404 }
      );
    }

    const updatedSession = await prisma.session.update({
      where: { id },
      data: {
        title: title || existingSession.title,
        description: description !== undefined ? description : existingSession.description,
        isActive: isActive !== undefined ? isActive : existingSession.isActive,
        endedAt: isActive === false ? new Date() : existingSession.endedAt
      },
      include: {
        feedbacks: {
          orderBy: { timestamp: 'desc' },
          take: 50
        },
        contents: {
          where: { isActive: true }
        }
      }
    });

    return NextResponse.json(updatedSession);
    
  } catch (error: any) {
    console.error('❌ Update session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Unauthorized - Only instructors can end sessions' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existingSession = await prisma.session.findFirst({
      where: {
        id,
        instructorId: session.user.id
      }
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found or you do not have permission' },
        { status: 404 }
      );
    }

    const endedSession = await prisma.session.update({
      where: { id },
      data: {
        isActive: false,
        endedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Session ended successfully',
      session: endedSession
    });
    
  } catch (error: any) {
    console.error('❌ End session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to end session' },
      { status: 500 }
    );
  }
}