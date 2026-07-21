export type AgUiUserMessage = { id: string; role: 'user'; content: string };
export type AgUiAssistantMessage = {
  id: string;
  role: 'assistant';
  content?: string;
  toolCalls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
};
export type AgUiToolMessage = {
  id: string;
  role: 'tool';
  toolCallId: string;
  content: string;
};
export type AgUiMessage = AgUiUserMessage | AgUiAssistantMessage | AgUiToolMessage;

export type CopilotContentPart = { type: string; text?: string };
export type CopilotUserMessage = { role: 'user'; content: string | CopilotContentPart[] };
