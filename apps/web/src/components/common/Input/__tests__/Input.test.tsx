import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/common/Input';

describe('Input', () => {
  it('renders with the given value', () => {
    render(<Input value="hello" onChange={jest.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('hello');
  });

  it('calls onChange with the new value when typed', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Input value="" onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('renders label when provided', () => {
    render(<Input value="" onChange={jest.fn()} label="Search" />);
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('associates label with input via htmlFor', () => {
    render(<Input value="" onChange={jest.fn()} label="Destination" />);
    const label = screen.getByText('Destination');
    const input = screen.getByRole('textbox');
    expect(label).toHaveAttribute('for', input.id);
  });

  it('renders hint text when provided', () => {
    render(<Input value="" onChange={jest.fn()} hint="Enter city name" />);
    expect(screen.getByText('Enter city name')).toBeInTheDocument();
  });

  it('renders hint with error styling when isError=true', () => {
    const { container } = render(
      <Input value="" onChange={jest.fn()} hint="Required" isError={true} />
    );
    const hint = container.querySelector('p');
    expect(hint).toHaveClass('text-red-500');
  });

  it('is disabled when disabled=true', () => {
    render(<Input value="" onChange={jest.fn()} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('renders placeholder text', () => {
    render(<Input value="" onChange={jest.fn()} placeholder="Type here…" />);
    expect(screen.getByPlaceholderText('Type here…')).toBeInTheDocument();
  });

  it('renders a right slot node', () => {
    render(<Input value="" onChange={jest.fn()} rightSlot={<button>X</button>} />);
    expect(screen.getByRole('button', { name: 'X' })).toBeInTheDocument();
  });
});
