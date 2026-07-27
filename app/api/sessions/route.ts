import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function generateSessionCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Session title is required' },
        { status: 400 }
      );
    }

    // Get or create instructor
    let instructor = await prisma.user.findFirst({
      where: { role: 'INSTRUCTOR' }
    });

    if (!instructor) {
      instructor = await prisma.user.create({
        data: {
          email: 'instructor@demo.com',
          name: 'Demo Instructor',
          role: 'INSTRUCTOR'
        }
      });
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        title,
        description: description || '',
        code: generateSessionCode(),
        instructorId: instructor.id,
        isActive: true
      }
    });

    return NextResponse.json(session, { status: 201 });
    
  } catch (error: any) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      where: { isActive: true },
      include: {
        feedbacks: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(sessions);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}