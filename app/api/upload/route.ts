import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';  // ← Make sure this path is correct
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    console.log('📤 Upload API called');
    
    const session = await getServerSession(authOptions);
    console.log('👤 Session:', session?.user?.email || 'No session');
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const contentId = formData.get('contentId') as string;
    const type = formData.get('type') as string || 'material';
    const studentName = formData.get('studentName') as string || 'Anonymous Student';
    const studentEmail = formData.get('studentEmail') as string || `anonymous_${Date.now()}@student.com`;

    console.log('📁 File:', file?.name, 'Type:', type, 'ContentId:', contentId);

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!contentId) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type) && !file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not allowed` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 50MB limit` },
        { status: 400 }
      );
    }

    // Check if content exists
    const content = await prisma.content.findUnique({
      where: { id: contentId }
    });

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Determine upload directory
    let uploadDir;
    if (type === 'submission') {
      uploadDir = path.join(process.cwd(), 'public', 'uploads', 'submissions');
    } else {
      uploadDir = path.join(process.cwd(), 'public', 'uploads', 'materials');
    }
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${safeFileName}`;
    const filePath = path.join(uploadDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const fileUrl = `/${type === 'submission' ? 'uploads/submissions' : 'uploads/materials'}/${fileName}`;

    // Handle submission (student)
    if (type === 'submission') {
      console.log('📝 Creating submission...');
      
      let studentId = session?.user?.id;

      if (!studentId) {
        // Create anonymous user
        console.log('👤 Creating anonymous user...');
        const anonymousUser = await prisma.user.create({
          data: {
            email: studentEmail,
            name: studentName,
            role: 'STUDENT'
          }
        });
        studentId = anonymousUser.id;
        console.log('✅ Anonymous user created:', studentId);
      }

      // Create a submission record
      // Use a type-unsafe access in case the generated Prisma client uses a different model name
      // (avoids TS error if the model accessor differs from expectation)
      const submission = await (prisma as any).studentSubmission.create({
        data: {
          contentId,
          studentId: studentId,
          fileUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        }
      });

      console.log('✅ Submission created:', submission.id);

      return NextResponse.json({
        success: true,
        submission,
        fileUrl,
        message: 'Submission uploaded successfully'
      });
    }

    // Handle material upload (instructor only)
    if (!session || session.user?.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Only instructors can upload materials' },
        { status: 403 }
      );
    }

    const updatedContent = await prisma.content.update({
      where: { id: contentId },
      data: {
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }
    });

    return NextResponse.json({
      success: true,
      content: updatedContent,
      fileUrl,
      message: 'File uploaded successfully'
    });

  } catch (error: any) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}