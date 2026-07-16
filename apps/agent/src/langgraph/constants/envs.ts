export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const API_URL = process.env.API_URL;
export const LANGGRAPH_DEPLOYMENT_URL =
  process.env.LANGGRAPH_DEPLOYMENT_URL ?? 'http://localhost:8123';
export const COPILOTKIT_PORT = Number(process.env.COPILOTKIT_PORT ?? 4200);
