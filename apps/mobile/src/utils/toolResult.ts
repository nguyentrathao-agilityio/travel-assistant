import { ToolCallStatus } from '@copilotkit/react-native/headless';

export const isToolPending = (status: string): boolean =>
  status === ToolCallStatus.InProgress || status === ToolCallStatus.Executing;
