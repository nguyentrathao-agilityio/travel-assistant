import { render, screen } from '@testing-library/react';

import { ToolEmptyCard, ToolErrorCard } from '../index';
import { getToolError } from '@/utils/toolResult';

describe('tool result feedback', () => {
  it('distinguishes an empty result from an error', () => {
    render(<ToolEmptyCard message="No hotels matched these dates." />);
    expect(screen.getByText('No hotels matched these dates.')).toBeInTheDocument();
    expect(screen.queryByText('You can try again.')).not.toBeInTheDocument();
  });

  it('renders retry guidance only for retryable errors', () => {
    render(
      <ToolErrorCard
        result={{ error: 'Provider unavailable', code: 'PROVIDER_UNAVAILABLE', retryable: true }}
      />
    );
    expect(screen.getByText('The provider is temporarily unavailable.')).toBeInTheDocument();
    expect(screen.getByText('You can try again.')).toBeInTheDocument();
  });

  it('parses persisted JSON errors and ignores ordinary successful results', () => {
    expect(getToolError(JSON.stringify({ error: 'Timed out', retryable: true }))).toEqual({
      error: 'Timed out',
      retryable: true,
    });
    expect(getToolError({ results: [] })).toBeUndefined();
  });
});
