import { render, screen } from '@testing-library/react';
import { ToolLoading } from '.';

describe('ToolLoading', () => {
  it('renders with the correct target', () => {
    render(<ToolLoading target="flights" />);
    expect(screen.getByText('Searching for flights...')).toBeInTheDocument();
  });
});
