export const INSIGHT_PROMPTS = {
  GENERATE_INSIGHTS: `
You are an expert educational analyst. Analyze the following classroom feedback data and generate comprehensive insights.

Context:
- Session: {sessionTitle}
- Total feedback: {totalFeedbacks}

Feedback Distribution:
{feedbackDistribution}

Student Comments (anonymized):
{comments}

Generate insights in the following JSON structure:
{
  "confusionHotspots": [
    {
      "topic": "Main topic students struggled with",
      "severity": "high/medium/low",
      "studentCount": number,
      "suggestion": "How to address this"
    }
  ],
  "engagementScore": {
    "overall": number (0-100),
    "trend": "rising/falling/stable"
  },
  "reviewRecommendations": {
    "criticalTopics": ["Topic 1", "Topic 2"],
    "suggestedActivities": ["Activity 1", "Activity 2"]
  },
  "teachingSuggestions": [
    "Suggestion 1 with specific reasoning",
    "Suggestion 2 with specific reasoning"
  ],
  "studentSentiment": {
    "positive": percentage,
    "neutral": percentage,
    "negative": percentage
  }
}

Return ONLY valid JSON. No additional text.
`,

  GENERATE_REVIEW: `
You are an expert tutor. Based on student confusion patterns, create a targeted review guide.

Input Data:
- Confusion Topics: {topics}
- Student Comments: {comments}

Generate a comprehensive review guide with:
1. Clear explanations of confusing topics
2. Practice questions (3 per topic) with answers
3. Visual/mnemonic aids
4. "Why students get confused" explanations

Format as clean HTML with sections and bullet points.
`,

  DETECT_CONFUSION: `
Analyze this real-time feedback stream:

Current Emoji Distribution:
{currentDistribution}

Previous 5-minute Distribution:
{previousDistribution}

Threshold: >30% "confused" or "lost" emojis indicates a confusion spike.

Return:
{
  "isSpike": boolean,
  "triggered": boolean,
  "message": "Alert message for instructor",
  "severity": "low/medium/high",
  "suggestedAction": "What instructor should do now"
}
`
};

export const SYSTEM_PROMPTS = {
  ANALYZER: `You are an educational data analyst with expertise in classroom dynamics and student learning patterns.`,
  REVIEWER: `You are an expert tutor who creates clear, engaging, and student-friendly review materials.`
};