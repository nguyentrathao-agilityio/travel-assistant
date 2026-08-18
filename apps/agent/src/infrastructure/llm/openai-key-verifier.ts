import OpenAI from 'openai';

// Constants
import { OPENAI_CLIENT_MODEL } from '@/constants';

/** Verifies that an OpenAI API key can access the configured model. */
export const verifyOpenAiApiKey = async (apiKey: string): Promise<void> => {
  const client = new OpenAI({ apiKey });

  await client.models.retrieve(OPENAI_CLIENT_MODEL);
};
