import OpenAI from 'openai';
import { INSIGHT_PROMPTS, SYSTEM_PROMPTS } from './prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateInsights(sessionData: any) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.ANALYZER },
        { role: 'user', content: INSIGHT_PROMPTS.GENERATE_INSIGHTS }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('AI Insights Error:', error);
    throw new Error('Failed to generate insights');
  }
}

export async function generateReviewMaterial(topics: string[], comments: string[]) {
  try {
    const prompt = INSIGHT_PROMPTS.GENERATE_REVIEW
      .replace('{topics}', topics.join(', '))
      .replace('{comments}', comments.join('\n'));

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.REVIEWER },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Review Generation Error:', error);
    throw new Error('Failed to generate review material');
  }
}

export async function detectConfusionSpike(currentData: any, previousData: any) {
  try {
    const prompt = INSIGHT_PROMPTS.DETECT_CONFUSION
      .replace('{currentDistribution}', JSON.stringify(currentData))
      .replace('{previousDistribution}', JSON.stringify(previousData));

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an alert system for classroom confusion detection.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Confusion Detection Error:', error);
    return { isSpike: false, triggered: false };
  }
}