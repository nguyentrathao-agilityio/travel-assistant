import { AIMessage, HumanMessage, type BaseMessage } from '@langchain/core/messages';

type AgentGraph = { invoke: (input: any) => Promise<unknown> };

export const runAgent = async (
  agent: AgentGraph,
  humanText: string,
  extraState: Record<string, unknown> = {}
): Promise<BaseMessage[]> => {
  const result = (await agent.invoke({
    messages: [new HumanMessage(humanText)],
    ...extraState,
  })) as { messages: BaseMessage[] };
  return result.messages;
};

export const expectedToolCalls = (toolNames: string[]) => ({
  messages: [
    new AIMessage({
      content: '',
      tool_calls: toolNames.map((name, index) => ({ name, args: {}, id: `ref-${index}` })),
    }),
  ],
});
