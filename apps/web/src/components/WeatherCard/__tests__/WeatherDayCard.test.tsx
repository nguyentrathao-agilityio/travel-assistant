import React from 'react';
import { render, screen } from '@testing-library/react';
import { WeatherDayCard } from '../WeatherDayCard';
import type { DailyForecast } from '@repo/types';

jest.mock('@/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
  formatDayDate: (dateStr: string) => `Formatted: ${dateStr}`,
  getWeatherIcon: () => ({
    icon: () => <svg data-testid="weather-icon" />,
    color: 'text-blue-500',
  }),
  toFahrenheit: (c: number) => Math.round((c * 9) / 5 + 32),
}));

jest.mock('@/components', () => ({
  Badge: ({ label }: { label: string }) => <span data-testid="best-badge">{label}</span>,
  StepBadge: ({ index }: { index: number }) => <span data-testid="step-badge">{index}</span>,
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

const makeDay = (overrides: Partial<DailyForecast> = {}): DailyForecast => ({
  date: '2026-07-01',
  tempMaxC: 30,
  tempMinC: 24,
  weatherCode: 0,
  description: 'Sunny',
  precipitationProbabilityMax: 10,
  ...overrides,
});

describe('WeatherDayCard', () => {
  it('renders day number', () => {
    render(<WeatherDayCard day={makeDay()} dayNumber={1} />);
    expect(screen.getByTestId('step-badge')).toHaveTextContent('1');
  });

  it('renders formatted date', () => {
    render(<WeatherDayCard day={makeDay()} dayNumber={1} />);
    expect(screen.getByText('Formatted: 2026-07-01')).toBeInTheDocument();
  });

  it('renders high temperature in Fahrenheit', () => {
    render(<WeatherDayCard day={makeDay({ tempMaxC: 30 })} dayNumber={1} />);
    // toFahrenheit(30) = 86
    expect(screen.getByText('86°F')).toBeInTheDocument();
  });

  it('renders low temperature in Fahrenheit', () => {
    render(<WeatherDayCard day={makeDay({ tempMinC: 24 })} dayNumber={1} />);
    // toFahrenheit(24) = 75.2, rounded = 75
    expect(screen.getByText(/75°F/)).toBeInTheDocument();
  });

  it('renders weather description', () => {
    render(<WeatherDayCard day={makeDay({ description: 'Partly Cloudy' })} dayNumber={1} />);
    expect(screen.getByText('Partly Cloudy')).toBeInTheDocument();
  });

  it('renders precipitation probability', () => {
    render(<WeatherDayCard day={makeDay({ precipitationProbabilityMax: 40 })} dayNumber={1} />);
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('shows "Best" badge when isBest is true', () => {
    render(<WeatherDayCard day={makeDay()} dayNumber={1} isBest={true} />);
    expect(screen.getByTestId('best-badge')).toBeInTheDocument();
    expect(screen.getByText('Best')).toBeInTheDocument();
  });

  it('does not show "Best" badge when isBest is false', () => {
    render(<WeatherDayCard day={makeDay()} dayNumber={1} isBest={false} />);
    expect(screen.queryByTestId('best-badge')).not.toBeInTheDocument();
  });

  it('does not show "Best" badge by default', () => {
    render(<WeatherDayCard day={makeDay()} dayNumber={1} />);
    expect(screen.queryByTestId('best-badge')).not.toBeInTheDocument();
  });
});
