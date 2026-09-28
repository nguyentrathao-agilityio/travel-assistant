// Metadata `resourceId` value LangGraph threads are tagged with, so web and mobile
// can each filter `threads.search()` down to this app's threads only.
export const AGENT_NAME = 'travelAgent';

// LangGraph graph id (must match `apps/agent/langgraph.json`'s `graphs` key) used
// when creating a thread via `threads.create()`.
export const GRAPH_ID = 'travel';

// Prefix of the context-summary message the agent inserts; clients use it to hide the summary.
export const SUMMARY_MESSAGE_PREFIX = '[conversation-summary]';
