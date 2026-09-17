import { z } from 'zod';

import { render, screen } from '@testing-library/react-native';

import { renderToolResult } from '../renderToolResult';
import { Typography } from '../Typography';
import { ThemeProvider } from '../../../theme';

const schema = z.object({ name: z.string() });

interface HostProps {
  status: string;
  result: unknown;
  isEmpty?: (data: z.infer<typeof schema>) => boolean;
  emptyMessage?: string;
}

const Host = ({ status, result, isEmpty, emptyMessage }: HostProps) =>
  renderToolResult({
    status,
    result,
    schema,
    invalidMessage: 'Invalid tool result',
    emptyMessage,
    isEmpty,
    render: (data) => <Typography>{data.name}</Typography>,
  });

const renderHost = async (props: HostProps) =>
  render(
    <ThemeProvider>
      <Host {...props} />
    </ThemeProvider>
  );

test('renders a loading state while the tool is pending', async () => {
  await renderHost({ status: 'inProgress', result: undefined });

  expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
});

test('renders an error state when the result carries a tool error', async () => {
  await renderHost({ status: 'complete', result: { error: 'Boom' } });

  expect(screen.getByText('Boom')).toBeOnTheScreen();
});

test('renders an error state when the result fails schema validation', async () => {
  await renderHost({ status: 'complete', result: { wrong: 1 } });

  expect(screen.getByText('Invalid tool result')).toBeOnTheScreen();
});

test('renders an empty state when the parsed data is empty', async () => {
  await renderHost({
    status: 'complete',
    result: { name: '' },
    isEmpty: (data) => data.name === '',
    emptyMessage: 'Nothing to show',
  });

  expect(screen.getByText('Nothing to show')).toBeOnTheScreen();
});

test('renders the provided render function with the parsed data', async () => {
  await renderHost({ status: 'complete', result: { name: 'Alice' } });

  expect(screen.getByText('Alice')).toBeOnTheScreen();
});
