import { isToolPending } from '../toolResult';

import { ToolCallStatus } from '@copilotkit/react-native/headless';

test.each([
  ['in-progress', ToolCallStatus.InProgress, true],
  ['executing', ToolCallStatus.Executing, true],
  ['complete', ToolCallStatus.Complete, false],
])('%s status is pending: %s', (_label, status, expected) => {
  expect(isToolPending(status)).toBe(expected);
});

test('does not treat an unrecognized status as pending', () => {
  expect(isToolPending('idle')).toBe(false);
  expect(isToolPending('')).toBe(false);
});
