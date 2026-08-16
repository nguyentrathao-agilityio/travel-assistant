import { render, screen } from '@testing-library/react';
import { WeatherCard } from '../index';
import type { WeatherResult } from '@repo/types';

jest.mock('../WeatherDayCard', () => ({
  WeatherDayCard: ({ day, isBest }: { day: { date: string }; isBest: boolean }) => (
    <div data-testid="weather-day-card" data-best={isBest ? 'true' : 'false'}>
      {day.date}
    </div>
  ),
}));

const makeWeatherData = (overrides: Partial<WeatherResult> = {}): WeatherResult => ({
  location: { name: 'Da Nang', country: 'Vietnam', latitude: 16.05, longitude: 108.2 },
  current: {
    time: '2026-06-04T10:00',
    temperatureC: 32,
    apparentTemperatureC: 35,
    relativeHumidity: 70,
    windSpeedKmh: 15,
    description: 'Sunny',
  },
  daily: [
    {
      date: '2026-06-04',
      tempMinC: 25,
      tempMaxC: 33,
      precipitationProbabilityMax: 10,
      description: 'Sunny',
    },
    {
      date: '2026-06-05',
      tempMinC: 24,
      tempMaxC: 31,
      precipitationProbabilityMax: 80,
      description: 'Rainy',
    },
    {
      date: '2026-06-06',
      tempMinC: 25,
      tempMaxC: 32,
      precipitationProbabilityMax: 20,
      description: 'Partly cloudy',
    },
  ],
  travelTip: 'Bring sunscreen.',
  ...overrides,
});

describe('WeatherCard', () => {
  describe('loading state', () => {
    it('renders without crashing when data is provided', () => {
      const { container } = render(<WeatherCard data={makeWeatherData()} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders weather content when data is defined', () => {
      const { container } = render(<WeatherCard data={makeWeatherData()} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('with data', () => {
    it('uses the 14px card typography scale', () => {
      const { container } = render(<WeatherCard data={makeWeatherData()} />);
      expect(container.firstChild).toHaveClass('card-typography');
    });

    it('renders the location name in the header', () => {
      render(<WeatherCard data={makeWeatherData()} />);
      expect(screen.getByText('Da Nang Weather')).toBeInTheDocument();
    });

    it('renders the forecast day count', () => {
      render(<WeatherCard data={makeWeatherData()} />);
      expect(screen.getByText('3-days forecast')).toBeInTheDocument();
    });

    it('renders a WeatherDayCard for each day', () => {
      render(<WeatherCard data={makeWeatherData()} />);
      expect(screen.getAllByTestId('weather-day-card')).toHaveLength(3);
    });

    it('renders the best-day banner', () => {
      render(<WeatherCard data={makeWeatherData()} />);
      expect(screen.getByText(/Best days for outdoor activities/i)).toBeInTheDocument();
    });

    it('marks day 1 as best when it has lowest precipitation', () => {
      render(<WeatherCard data={makeWeatherData()} />);
      const cards = screen.getAllByTestId('weather-day-card');
      expect(cards[0]).toHaveAttribute('data-best', 'true');
    });

    it('renders the travel tip when provided', () => {
      render(<WeatherCard data={makeWeatherData()} />);
      expect(screen.getByText(/Bring sunscreen/i)).toBeInTheDocument();
    });

    it('does not render the travel tip when absent', () => {
      render(<WeatherCard data={makeWeatherData({ travelTip: '' })} />);
      expect(screen.queryByText(/Bring sunscreen/i)).not.toBeInTheDocument();
    });

    it('applies additional className', () => {
      const { container } = render(<WeatherCard data={makeWeatherData()} className="custom" />);
      expect(container.querySelector('.custom')).toBeInTheDocument();
    });
  });
});
