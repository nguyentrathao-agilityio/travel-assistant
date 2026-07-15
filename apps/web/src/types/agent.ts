export type MastraTextPart = { type: 'text'; text: string };
export type MastraToolInvocationPart = {
  type: 'tool-invocation';
  toolInvocation: {
    state: string;
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    result?: unknown;
  };
};
export type MastraContentPart = MastraTextPart | MastraToolInvocationPart | { type: string };
export type MastraMessageContent = {
  parts?: MastraContentPart[];
  content?: string;
};
export type MastraRawMessage = { id: string; role: string; content: MastraMessageContent | string };
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
