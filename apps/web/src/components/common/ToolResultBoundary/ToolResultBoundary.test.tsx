import { render, screen } from '@testing-library/react';
import { z } from 'zod';

import { renderToolResult } from '.';

const resultSchema = z.object({ items: z.array(z.string()) });

const renderBoundary = ({
  status = 'complete',
  result = { items: ['Hoi An'] },
}: {
  status?: string;
  result?: unknown;
} = {}) =>
  render(
    <>
      {renderToolResult({
        status,
        result,
        schema: resultSchema,
        loading: <div>Loading destinations</div>,
        invalidMessage: 'Invalid destination result',
        isEmpty: (data) => data.items.length === 0,
        emptyMessage: 'No destinations found',
        render: (data) => <div>Destination: {data.items[0]}</div>,
      })}
    </>
  );

describe('ToolResultBoundary', () => {
  it('renders the pending state before inspecting the result', () => {
    renderBoundary({ status: 'inProgress', result: { error: 'ignored while pending' } });

    expect(screen.getByText('Loading destinations')).toBeInTheDocument();
    expect(screen.queryByText('ignored while pending')).not.toBeInTheDocument();
  });

  it('renders a structured tool error instead of validating it as success data', () => {
    renderBoundary({ result: { error: 'Provider failed' } });

    expect(screen.getByText('Provider failed')).toBeInTheDocument();
    expect(screen.queryByText('Invalid destination result')).not.toBeInTheDocument();
  });

  it('distinguishes invalid and empty results', () => {
    const { rerender } = render(
      <>
        {renderToolResult({
          status: 'complete',
          result: { unexpected: true },
          schema: resultSchema,
          loading: <div>Loading destinations</div>,
          invalidMessage: 'Invalid destination result',
          isEmpty: (data) => data.items.length === 0,
          emptyMessage: 'No destinations found',
          render: (data) => <div>Destination: {data.items[0]}</div>,
        })}
      </>
    );

    expect(screen.getByText('Invalid destination result')).toBeInTheDocument();

    rerender(
      <>
        {renderToolResult({
          status: 'complete',
          result: { items: [] },
          schema: resultSchema,
          loading: <div>Loading destinations</div>,
          invalidMessage: 'Invalid destination result',
          isEmpty: (data) => data.items.length === 0,
          emptyMessage: 'No destinations found',
          render: (data) => <div>Destination: {data.items[0]}</div>,
        })}
      </>
    );

    expect(screen.getByText('No destinations found')).toBeInTheDocument();
  });

  it('parses persisted JSON before rendering successful data', () => {
    renderBoundary({ result: JSON.stringify({ items: ['Da Nang'] }) });

    expect(screen.getByText('Destination: Da Nang')).toBeInTheDocument();
  });
});
