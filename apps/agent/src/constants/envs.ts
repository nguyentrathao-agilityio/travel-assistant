export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const API_URL = process.env.API_URL;
export const POSTGRES_URL = process.env.POSTGRES_URL;
export const OPENAI_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';
export const LANGGRAPH_DEPLOYMENT_URL =
  process.env.LANGGRAPH_DEPLOYMENT_URL ?? 'http://localhost:8123';

export const VOICE_BUCKET_NAME = process.env.VOICE_BUCKET_NAME;
export const VOICE_BUCKET_ENDPOINT = process.env.VOICE_BUCKET_ENDPOINT;
export const VOICE_BUCKET_REGION = process.env.VOICE_BUCKET_REGION ?? 'auto';
export const VOICE_BUCKET_ACCESS_KEY_ID = process.env.VOICE_BUCKET_ACCESS_KEY_ID;
export const VOICE_BUCKET_SECRET_ACCESS_KEY = process.env.VOICE_BUCKET_SECRET_ACCESS_KEY;
export const VOICE_BUCKET_FORCE_PATH_STYLE = process.env.VOICE_BUCKET_FORCE_PATH_STYLE === 'true';
