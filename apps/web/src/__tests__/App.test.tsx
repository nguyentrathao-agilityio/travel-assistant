import { render, screen } from '@testing-library/react';

import { App } from '../App';

let verified = false;

jest.mock('@/stores', () => ({
  useApiKeyStore: (selector: (state: { hasVerifiedApiKey: () => boolean }) => unknown) =>
    selector({ hasVerifiedApiKey: () => verified }),
}));

jest.mock('@/components', () => ({
  ApiKeyOverlay: () => <div>API key overlay</div>,
  Sidebar: () => <div>Sidebar</div>,
  TravelChat: () => <div>Chat box</div>,
}));

jest.mock('../app/providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => children,
}));

describe('App API key gate', () => {
  beforeEach(() => {
    verified = false;
  });

  it('keeps chat hidden for an unverified or legacy key', () => {
    render(<App />);

    expect(screen.getByText('API key overlay')).toBeInTheDocument();
    expect(screen.queryByText('Chat box')).not.toBeInTheDocument();
  });

  it('renders chat only for a currently verified key', () => {
    verified = true;

    render(<App />);

    expect(screen.getByText('Chat box')).toBeInTheDocument();
    expect(screen.queryByText('API key overlay')).not.toBeInTheDocument();
  });
});
