import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface FeedbackData {
  emoji: string;
  comment: string | null;
  timestamp: Date;
}

export interface SessionData {
  id: string;
  title: string;
  description: string | null;
  feedbacks: FeedbackData[];
}

export interface AIInsights {
  engagementScore: {
    overall: number;
    trend: 'rising' | 'falling' | 'stable' | 'insufficient data';
    confidence: number;
  };
  confusionHotspots: Array<{
    topic: string;
    severity: 'high' | 'medium' | 'low';
    studentCount: number;
    percentage: number;
    suggestion: string;
    confidence: number;
  }>;
  teachingSuggestions: string[];
  reviewRecommendations: {
    criticalTopics: string[];
    suggestedActivities: string[];
    additionalResources: string[];
  };
  studentSentiment: {
    positive: number;
    neutral: number;
    negative: number;
    overallSentiment: 'positive' | 'neutral' | 'negative';
  };
  detailedAnalysis: string;
  summary: string;
  actionItems: string[];
  confidenceScore: number;
}

export async function generateAIInsights(sessionData: SessionData): Promise<AIInsights> {
  try {
    // Prepare feedback data for AI
    const feedbackSummary = sessionData.feedbacks.map(f => ({
      emoji: f.emoji,
      comment: f.comment || 'No comment',
    }));

    const emojiCount = sessionData.feedbacks.reduce((acc, f) => {
      acc[f.emoji] = (acc[f.emoji] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalFeedbacks = sessionData.feedbacks.length;

    // Build the prompt
    const prompt = `
You are an expert educational analyst with deep expertise in classroom dynamics, student psychology, and teaching methodologies.

## Session Information
- Session Title: ${sessionData.title}
- Session Description: ${sessionData.description || 'No description provided'}
- Total Feedback Received: ${totalFeedbacks}

## Feedback Distribution
${Object.entries(emojiCount).map(([emoji, count]) => `- ${emoji}: ${count} (${Math.round((count / totalFeedbacks) * 100)}%)`).join('\n')}

## Student Comments
${feedbackSummary.filter(f => f.comment !== 'No comment').map(f => `- "${f.comment}"`).join('\n') || 'No comments provided'}

## Your Task
Analyze this classroom feedback data and provide comprehensive, actionable insights for the instructor. 

### Guidelines for Fair Analysis:
1. **Be Objective**: Base your analysis solely on the data provided. Don't make assumptions beyond what the data shows.
2. **Be Specific**: Provide concrete, actionable recommendations, not generic advice.
3. **Be Balanced**: Acknowledge both positive feedback and areas for improvement.
4. **Be Empathetic**: Understand that teaching is challenging. Frame suggestions constructively.
5. **Be Data-Driven**: Use the actual feedback distribution to support your conclusions.
6. **Consider Context**: Acknowledge that a single session may not represent the full picture.
7. **Confidence Levels**: Indicate your confidence in each recommendation based on the amount of data.

### Required Output Format (JSON):
{
  "engagementScore": {
    "overall": number (0-100),
    "trend": "rising" | "falling" | "stable" | "insufficient data",
    "confidence": number (0-100)
  },
  "confusionHotspots": [
    {
      "topic": "string - specific topic or concept",
      "severity": "high" | "medium" | "low",
      "studentCount": number,
      "percentage": number,
      "suggestion": "string - specific action to address this",
      "confidence": number (0-100)
    }
  ],
  "teachingSuggestions": ["string - 3-5 specific, actionable suggestions"],
  "reviewRecommendations": {
    "criticalTopics": ["string - topics needing immediate review"],
    "suggestedActivities": ["string - specific activities to try"],
    "additionalResources": ["string - recommended resources"]
  },
  "studentSentiment": {
    "positive": number (0-100),
    "neutral": number (0-100),
    "negative": number (0-100),
    "overallSentiment": "positive" | "neutral" | "negative"
  },
  "detailedAnalysis": "string - 2-3 paragraph comprehensive analysis",
  "summary": "string - 1-2 sentence summary",
  "actionItems": ["string - 3-5 specific action items"],
  "confidenceScore": number (0-100)
}

Return ONLY valid JSON. No additional text. Make sure all percentages sum to 100.
`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational analyst. You provide fair, balanced, and data-driven insights to help instructors improve their teaching. You always base your analysis on the actual data provided and acknowledge limitations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const insights = JSON.parse(content) as AIInsights;
    return insights;

  } catch (error) {
    console.error('AI Insights Error:', error);
    // Fallback to basic insights if AI fails
    return generateFallbackInsights(sessionData);
  }
}

// Fallback insights generator (when AI is unavailable)
function generateFallbackInsights(sessionData: SessionData): AIInsights {
  const emojiCount = sessionData.feedbacks.reduce((acc, f) => {
    acc[f.emoji] = (acc[f.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = sessionData.feedbacks.length;
  const positive = (emojiCount['AMAZING'] || 0) + (emojiCount['GOT_IT'] || 0);
  const confused = (emojiCount['CONFUSED'] || 0) + (emojiCount['LOST'] || 0);
  const bored = emojiCount['BORED'] || 0;

  return {
    engagementScore: {
      overall: total > 0 ? Math.round((positive / total) * 100) : 0,
      trend: total > 5 ? 'stable' : 'insufficient data',
      confidence: total > 10 ? 85 : 50,
    },
    confusionHotspots: confused > 0 ? [
      {
        topic: sessionData.title || 'Current Topic',
        severity: confused > total * 0.3 ? 'high' : confused > total * 0.15 ? 'medium' : 'low',
        studentCount: confused,
        percentage: Math.round((confused / total) * 100),
        suggestion: confused > total * 0.3 
          ? 'Consider slowing down and explaining this concept again with more examples.'
          : 'Review this topic briefly to ensure all students understand.',
        confidence: total > 10 ? 75 : 50,
      }
    ] : [],
    teachingSuggestions: [
      'Continue monitoring student engagement in future sessions.',
      'Consider varying your teaching methods to reach different learning styles.',
      'Use the session code to collect more feedback from students.'
    ],
    reviewRecommendations: {
      criticalTopics: confused > total * 0.3 ? ['Current Topic - High Confusion'] : ['No critical issues detected'],
      suggestedActivities: ['Regular review sessions', 'Peer discussion groups'],
      additionalResources: ['Recommended textbook chapters', 'Online supplementary materials']
    },
    studentSentiment: {
      positive: total > 0 ? Math.round((positive / total) * 100) : 0,
      neutral: total > 0 ? Math.round((bored / total) * 100) : 0,
      negative: total > 0 ? Math.round((confused / total) * 100) : 0,
      overallSentiment: positive > confused ? 'positive' : confused > positive ? 'negative' : 'neutral',
    },
    detailedAnalysis: 'Based on the feedback received, students have mixed reactions to the session. There is room for improvement in engagement and clarity of concepts.',
    summary: 'Mixed feedback received. Continue monitoring and adjusting teaching approach.',
    actionItems: [
      'Review topics where students reported confusion',
      'Consider collecting more detailed feedback',
      'Plan follow-up session to address unclear concepts'
    ],
    confidenceScore: total > 10 ? 70 : 40,
  };
}