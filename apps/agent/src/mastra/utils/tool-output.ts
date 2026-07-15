/**
 * Creates a text content block for Mastra's toModelOutput.
 */
export const makeToolOutput = (text: string) => ({
  type: 'content' as const,
  value: [{ type: 'text' as const, text }],
});

export const TOOL_READY_OUTPUT = makeToolOutput(
  'TOOL_SUCCESS. Inform the user the results are ready in one short sentence. Do not list any data.'
);

export const TOOL_NO_RESULTS_OUTPUT = makeToolOutput(
  'No results found. Suggest they try adjusting their search.'
);

export const TOOL_ERROR_OUTPUT = makeToolOutput(
  'An error occurred. Apologize briefly and suggest the user try again.'
);
