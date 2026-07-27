import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')
  
  try {
    // Create demo instructor only
    console.log('📝 Creating instructor...')
    
    const instructorPassword = await bcrypt.hash('password123', 10)
    const instructor = await prisma.user.upsert({
      where: { email: 'instructor@demo.com' },
      update: {},
      create: {
        email: 'instructor@demo.com',
        name: 'Demo Instructor',
        password: instructorPassword,
        role: 'INSTRUCTOR'
      }
    })
    console.log('✅ Instructor created:', instructor.email)

    // Create demo session
    console.log('📝 Creating demo session...')
    
    const session = await prisma.session.upsert({
      where: { code: 'DEMO123' },
      update: {},
      create: {
        code: 'DEMO123',
        title: 'Demo Session - Try It Out!',
        description: 'This is a demo session. Students can submit feedback and view materials!',
        instructorId: instructor.id,
        isActive: true
      }
    })
    console.log('✅ Session created:', session.code)

    // Create demo content - Materials and Announcements only
    console.log('📝 Creating demo content...')

    // Material 1
    await prisma.content.create({
      data: {
        sessionId: session.id,
        instructorId: instructor.id,
        title: 'Lecture Notes: Introduction to AI',
        type: 'MATERIAL',
        description: 'Comprehensive notes on AI fundamentals.',
        content: `# Introduction to Artificial Intelligence

## What is AI?
Artificial Intelligence is the simulation of human intelligence processes by machines.

## Key Concepts:
1. Machine Learning
2. Deep Learning
3. Natural Language Processing
4. Computer Vision

## Applications:
- Virtual Assistants
- Self-driving Cars
- Healthcare Diagnostics
- Fraud Detection`,
        isActive: true
      }
    })
    console.log('✅ Material 1 created')

    // Material 2
    await prisma.content.create({
      data: {
        sessionId: session.id,
        instructorId: instructor.id,
        title: 'Lecture Notes: Neural Networks',
        type: 'MATERIAL',
        description: 'Comprehensive notes on neural networks.',
        content: `# Neural Networks - Key Concepts

## What is a Neural Network?
A neural network is a series of algorithms that mimics the way the human brain operates.

## Components:
- Input Layer
- Hidden Layers
- Output Layer

## Activation Functions:
- Sigmoid
- ReLU
- Tanh`,
        isActive: true
      }
    })
    console.log('✅ Material 2 created')

    // Announcement 1
    await prisma.content.create({
      data: {
        sessionId: session.id,
        instructorId: instructor.id,
        title: '📢 Welcome to the Course!',
        type: 'ANNOUNCEMENT',
        description: 'Welcome message for all students.',
        content: `Dear Students,

Welcome to this course! I am excited to have you all here.

📅 First Lecture: Tomorrow at 10:00 AM
📍 Location: Room 101

Please make sure to:
1. Bring your laptops
2. Complete the pre-reading material
3. Join the session with code: DEMO123

Looking forward to a great semester!

Best regards,
Instructor`,
        isActive: true
      }
    })
    console.log('✅ Announcement 1 created')

    // Announcement 2
    await prisma.content.create({
      data: {
        sessionId: session.id,
        instructorId: instructor.id,
        title: '📢 Important: Quiz Next Week',
        type: 'ANNOUNCEMENT',
        description: 'Information about the upcoming quiz.',
        content: `Dear Students,

There will be a quiz next week on the following topics:
1. AI Fundamentals
2. Machine Learning Basics
3. Neural Networks

📅 Date: Next Friday
⏰ Time: 11:00 AM

Please prepare well!

Best regards,
Instructor`,
        isActive: true
      }
    })
    console.log('✅ Announcement 2 created')

    // Create demo feedback
    console.log('📝 Creating demo feedback...')

    const feedbackEmojis = ['AMAZING', 'GOT_IT', 'CONFUSED', 'GOT_IT', 'AMAZING']
    const feedbackComments = [
      'This lecture was really helpful!',
      'I understood the concepts well.',
      'Could you explain the gradient descent again?',
      'Great examples!',
      'I loved the interactive session!'
    ]

    for (let i = 0; i < 5; i++) {
      await prisma.feedback.create({
        data: {
          sessionId: session.id,
          emoji: feedbackEmojis[i],
          comment: feedbackComments[i],
          isAnonymous: true
        }
      })
    }
    console.log('✅ Demo feedback created')

    console.log('\n🎉 Database seeded successfully!')
    console.log('====================================')
    console.log('📧 Demo Instructor: instructor@demo.com')
    console.log('🔑 Password: password123')
    console.log('🔗 Session Code: DEMO123')
    console.log('====================================')
    console.log('📚 Content Created:')
    console.log('   - 2 Materials')
    console.log('   - 2 Announcements')
    console.log('====================================')
    console.log('💬 Feedback Created: 5 entries')
    console.log('====================================')
    
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('👋 Database disconnected')
  })