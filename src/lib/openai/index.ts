import OpenAI from 'openai';

let openAIClient: OpenAI | null = null;

export function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (!openAIClient) {
    openAIClient = new OpenAI({ apiKey: key });
  }
  return openAIClient;
}
