import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const validTypes = ['QUIZ', 'ASSIGNMENT', 'MATERIAL', 'ANNOUNCEMENT'];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    const contents = await prisma.content.findMany({
      where: { sessionId },
      include: {
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      } as any,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(contents);
  } catch (error) {
    console.error('Fetch content error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// ... rest of the file (POST, DELETE, PUT) remains the same