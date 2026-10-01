export const SUGGEST_NODE_NAME = 'suggest' as const;

// Frontend tool CopilotKit attaches to its follow-up suggestion runs.
export const COPILOTKIT_SUGGEST_TOOL_NAME = 'copilotkitSuggest';

export const MAX_SUGGEST_CONTEXT_MESSAGES = 6;

export const SUGGEST_SYSTEM_PROMPT =
  'You suggest short next steps for a travel planning chat. Always answer by calling the provided tool.';
