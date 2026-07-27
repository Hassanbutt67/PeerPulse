import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Unauthorized - Only instructors can generate insights' },
        { status: 401 }
      );
    }

    // Get sessionId from request body
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log('📊 Generating insights for session:', sessionId);

    // Fetch session with feedback
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        feedbacks: true
      }
    });

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (sessionData.feedbacks.length === 0) {
      return NextResponse.json(
        { error: 'No feedback available for this session yet. Ask students to submit feedback first.' },
        { status: 400 }
      );
    }

    console.log(`📊 Found ${sessionData.feedbacks.length} feedback entries`);

    // Analyze feedback
    const emojiCount = sessionData.feedbacks.reduce((acc: any, f: any) => {
      acc[f.emoji] = (acc[f.emoji] || 0) + 1;
      return acc;
    }, {});

    const total = sessionData.feedbacks.length;
    const confused = (emojiCount['CONFUSED'] || 0) + (emojiCount['LOST'] || 0);
    const positive = (emojiCount['AMAZING'] || 0) + (emojiCount['GOT_IT'] || 0);
    const bored = emojiCount['BORED'] || 0;

    console.log('📊 Emoji Distribution:', emojiCount);

    // Generate insights
    const insights = {
      engagementScore: {
        overall: total > 0 ? Math.round((positive / total) * 100) : 0,
        trend: total > 5 ? 'stable' : 'insufficient data',
      },
      confusionHotspots: confused > 0 ? [
        {
          topic: sessionData.title || 'Current Topic',
          severity: confused > total * 0.3 ? 'high' : confused > total * 0.15 ? 'medium' : 'low',
          studentCount: confused,
          suggestion: confused > total * 0.3 
            ? '🚨 High confusion: Consider slowing down and explaining this concept again with more examples and visual aids.'
            : '⚠️ Some confusion detected: Review this topic briefly to ensure all students understand.',
        }
      ] : [],
      teachingSuggestions: [] as string[],
      reviewRecommendations: {
        criticalTopics: [] as string[],
        suggestedActivities: [] as string[],
        additionalResources: [] as string[],
      },
      studentSentiment: {
        positive: total > 0 ? Math.round((positive / total) * 100) : 0,
        neutral: total > 0 ? Math.round((bored / total) * 100) : 0,
        negative: total > 0 ? Math.round((confused / total) * 100) : 0,
      },
      summary: '',
      actionItems: [] as string[],
    };

    // Add recommendations based on data
    if (confused > total * 0.3) {
      insights.teachingSuggestions.push('📚 High confusion detected: Consider using more visual aids, real-world examples, and check for understanding frequently.');
      insights.teachingSuggestions.push('🔄 Try a think-pair-share activity to help students process the material together.');
      insights.reviewRecommendations.criticalTopics.push('Current Topic - High Confusion (Needs immediate attention)');
      insights.actionItems.push('Review the confusing topic in the next session');
      insights.actionItems.push('Prepare additional examples and practice problems');
    }

    if (bored > total * 0.2) {
      insights.teachingSuggestions.push('🎯 Engagement is low: Try incorporating more interactive elements like polls, group discussions, or real-world applications.');
      insights.actionItems.push('Add more interactive elements to increase engagement');
    }

    if (positive > total * 0.5) {
      insights.teachingSuggestions.push('👏 Great job! Students are understanding the material well. Consider moving faster or introducing more challenging concepts.');
      insights.actionItems.push('Continue current teaching approach');
    }

    if (insights.teachingSuggestions.length === 0) {
      insights.teachingSuggestions.push('📊 Continue with your current teaching approach and monitor feedback in future sessions.');
    }

    if (insights.reviewRecommendations.criticalTopics.length === 0) {
      insights.reviewRecommendations.criticalTopics.push('No critical issues detected - Keep up the good work!');
    }

    insights.reviewRecommendations.suggestedActivities.push('🔄 Regular review sessions to reinforce learning');
    insights.reviewRecommendations.suggestedActivities.push('💬 Peer discussion groups for collaborative learning');
    
    if (insights.actionItems.length === 0) {
      insights.actionItems.push('Continue monitoring student engagement');
      insights.actionItems.push('Collect more feedback in future sessions');
    }

    insights.summary = total > 10 
      ? `Based on ${total} feedback responses, students show ${positive > confused ? 'positive' : 'mixed'} engagement. ${confused > total * 0.3 ? 'High confusion detected in the current topic.' : 'No major confusion detected.'}`
      : `Based on ${total} feedback responses, continue collecting more data for better insights.`;

    // Save to database
    await prisma.insight.create({
      data: {
        sessionId: sessionData.id,
        type: 'RECOMMENDATIONS',
        content: JSON.stringify(insights),
        generatedAt: new Date()
      }
    });

    console.log('✅ Insights generated and saved successfully');
    return NextResponse.json(insights);

  } catch (error: any) {
    console.error('❌ Insights generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // Get sessionId from URL query parameter
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const insights = await prisma.insight.findFirst({
      where: {
        sessionId,
        type: 'RECOMMENDATIONS'
      },
      orderBy: { generatedAt: 'desc' }
    });

    if (!insights) {
      return NextResponse.json(
        { error: 'No insights found for this session' },
        { status: 404 }
      );
    }

    return NextResponse.json(JSON.parse(insights.content));

  } catch (error) {
    console.error('Fetch insights error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}