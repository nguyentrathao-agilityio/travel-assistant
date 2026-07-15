import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmBanner } from '@/components/common/ConfirmBanner';

jest.mock('@/constants', () => ({}));

const defaultProps = {
  title: 'Flight booked',
  description: 'HAN → SGN, Jun 15',
  onChangeClick: jest.fn(),
  onConfirmClick: jest.fn(),
};

describe('ConfirmBanner', () => {
  it('renders the title', () => {
    render(<ConfirmBanner {...defaultProps} />);
    expect(screen.getByText('Flight booked')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<ConfirmBanner {...defaultProps} />);
    expect(screen.getByText('HAN → SGN, Jun 15')).toBeInTheDocument();
  });

  it('renders the price when provided', () => {
    render(<ConfirmBanner {...defaultProps} price="$199" />);
    expect(screen.getByText('$199')).toBeInTheDocument();
  });

  it('does not render price when omitted', () => {
    render(<ConfirmBanner {...defaultProps} />);
    expect(screen.queryByText('$')).not.toBeInTheDocument();
  });

  it('calls onChangeClick when Change button is clicked', async () => {
    const user = userEvent.setup();
    const onChangeClick = jest.fn();
    render(<ConfirmBanner {...defaultProps} onChangeClick={onChangeClick} />);
    await user.click(screen.getByRole('button', { name: 'Change' }));
    expect(onChangeClick).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirmClick when Confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirmClick = jest.fn();
    render(<ConfirmBanner {...defaultProps} onConfirmClick={onConfirmClick} />);
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirmClick).toHaveBeenCalledTimes(1);
  });
});
