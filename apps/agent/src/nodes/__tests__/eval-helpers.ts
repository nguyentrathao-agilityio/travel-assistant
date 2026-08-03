import { AIMessage, HumanMessage, type BaseMessage } from '@langchain/core/messages';

type Branch = { invoke: (input: any) => Promise<unknown> };

export const runBranch = async (
  branch: Branch,
  humanText: string,
  extraState: Record<string, unknown> = {}
): Promise<BaseMessage[]> => {
  const result = (await branch.invoke({
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
