import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MainView } from './MainView';
import type { RecommendationDto } from '../types';

// Mock child components
vi.mock('./MovieSearch', () => ({
  MovieSearch: vi.fn(() => <div data-testid="movie-search">MovieSearch Mock</div>),
}));

vi.mock('./RecommendationGenerator', () => ({
  RecommendationGenerator: vi.fn(({ onRecommendationsGenerated, recommendationsLimit, recommendationsUsed }) => (
    <div data-testid="recommendation-generator">
      <button
        onClick={() => {
          const mockRecommendations: RecommendationDto[] = [
            { tmdb_id: 1, title: 'Test Movie 1', year: 2024, posterPath: '/test1.jpg' },
            { tmdb_id: 2, title: 'Test Movie 2', year: 2023, posterPath: '/test2.jpg' },
          ];
          onRecommendationsGenerated(mockRecommendations);
        }}
      >
        Generate
      </button>
      <span data-testid="limit">{recommendationsLimit}</span>
      <span data-testid="used">{recommendationsUsed}</span>
    </div>
  )),
}));

vi.mock('./MovieCard', () => ({
  MovieCard: vi.fn(({ tmdb_id, title, year, posterPath }) => (
    <div data-testid={`movie-card-${tmdb_id}`}>
      {title} ({year}) - {posterPath}
    </div>
  )),
}));

vi.mock('lucide-react', () => ({
  Search: () => <span data-testid="search-icon">SearchIcon</span>,
  Sparkles: () => <span data-testid="sparkles-icon">SparklesIcon</span>,
}));

describe('MainView Component', () => {
  const defaultProps = {
    username: 'TestUser',
    ratingsCount: 5,
    ratingsThreshold: 10,
    recommendationsLimit: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Header rendering', () => {
    it('renders welcome message without "ponownie" when ratings below threshold', () => {
      render(<MainView {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Witaj, TestUser!');
      expect(heading).not.toHaveTextContent('ponownie');
    });

    it('renders welcome message with "ponownie" when ratings meet threshold', () => {
      render(<MainView {...defaultProps} ratingsCount={10} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Witaj ponownie, TestUser!');
    });

    it('renders welcome message with "ponownie" when ratings exceed threshold', () => {
      render(<MainView {...defaultProps} ratingsCount={15} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Witaj ponownie, TestUser!');
    });
  });

  describe('Progress bar and ratings information', () => {
    it('displays progress bar when ratings below threshold', () => {
      render(<MainView {...defaultProps} ratingsCount={5} ratingsThreshold={10} />);

      expect(screen.getByText(/Oceń co najmniej/i)).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('5/10')).toBeInTheDocument();
    });

    it('calculates correct progress bar width', () => {
      const { container } = render(<MainView {...defaultProps} ratingsCount={3} ratingsThreshold={10} />);

      // Find the progress bar inner div
      const progressBar = container.querySelector('.bg-primary');
      expect(progressBar).toHaveStyle({ width: '30%' });
    });

    it('shows 100% progress when threshold is met', () => {
      const { container } = render(<MainView {...defaultProps} ratingsCount={10} ratingsThreshold={10} />);

      // Progress bar should not be visible when threshold is met
      expect(screen.queryByText(/Oceń co najmniej/i)).not.toBeInTheDocument();
    });

    it('displays current ratings count when threshold is met', () => {
      render(<MainView {...defaultProps} ratingsCount={12} />);

      expect(screen.getByText(/Masz już/i)).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });
  });

  describe('Search section', () => {
    it('always renders search section regardless of ratings', () => {
      const { rerender } = render(<MainView {...defaultProps} ratingsCount={0} />);
      expect(screen.getByTestId('movie-search')).toBeInTheDocument();
      expect(screen.getByText('Wyszukaj filmy')).toBeInTheDocument();

      rerender(<MainView {...defaultProps} ratingsCount={15} />);
      expect(screen.getByTestId('movie-search')).toBeInTheDocument();
    });

    it('renders search icon', () => {
      render(<MainView {...defaultProps} />);
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });
  });

  describe('Recommendations section visibility', () => {
    it('does not render recommendations section when ratings below threshold', () => {
      render(<MainView {...defaultProps} ratingsCount={9} ratingsThreshold={10} />);

      expect(screen.queryByText('Rekomendacje AI')).not.toBeInTheDocument();
      expect(screen.queryByTestId('recommendation-generator')).not.toBeInTheDocument();
    });

    it('renders recommendations section when ratings meet threshold', () => {
      render(<MainView {...defaultProps} ratingsCount={10} ratingsThreshold={10} />);

      expect(screen.getByText('Rekomendacje AI')).toBeInTheDocument();
      expect(screen.getByTestId('recommendation-generator')).toBeInTheDocument();
    });

    it('renders recommendations section when ratings exceed threshold', () => {
      render(<MainView {...defaultProps} ratingsCount={20} ratingsThreshold={10} />);

      expect(screen.getByText('Rekomendacje AI')).toBeInTheDocument();
      expect(screen.getByTestId('recommendation-generator')).toBeInTheDocument();
    });

    it('renders sparkles icon in recommendations section', () => {
      render(<MainView {...defaultProps} ratingsCount={10} />);

      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
    });
  });

  describe('"Nowe!" badge visibility', () => {
    it('displays "Nowe!" badge when ratings exactly match threshold', () => {
      render(<MainView {...defaultProps} ratingsCount={10} ratingsThreshold={10} />);

      expect(screen.getByText('Nowe!')).toBeInTheDocument();
    });

    it('does not display "Nowe!" badge when ratings exceed threshold', () => {
      render(<MainView {...defaultProps} ratingsCount={11} ratingsThreshold={10} />);

      expect(screen.queryByText('Nowe!')).not.toBeInTheDocument();
    });

    it('does not display "Nowe!" badge when ratings below threshold', () => {
      render(<MainView {...defaultProps} ratingsCount={9} ratingsThreshold={10} />);

      expect(screen.queryByText('Nowe!')).not.toBeInTheDocument();
    });
  });

  describe('RecommendationGenerator integration', () => {
    it('passes correct props to RecommendationGenerator', () => {
      render(<MainView {...defaultProps} ratingsCount={10} recommendationsLimit={5} />);

      const generator = screen.getByTestId('recommendation-generator');
      expect(within(generator).getByTestId('limit')).toHaveTextContent('5');
      expect(within(generator).getByTestId('used')).toHaveTextContent('0');
    });

    it('updates recommendationsUsed when recommendations are generated', async () => {
      const user = userEvent.setup();
      render(<MainView {...defaultProps} ratingsCount={10} />);

      const generateButton = screen.getByRole('button', { name: /generate/i });

      expect(screen.getByTestId('used')).toHaveTextContent('0');

      await user.click(generateButton);

      expect(screen.getByTestId('used')).toHaveTextContent('1');
    });

    it('increments recommendationsUsed on multiple generations', async () => {
      const user = userEvent.setup();
      render(<MainView {...defaultProps} ratingsCount={10} />);

      const generateButton = screen.getByRole('button', { name: /generate/i });

      await user.click(generateButton);
      expect(screen.getByTestId('used')).toHaveTextContent('1');

      await user.click(generateButton);
      expect(screen.getByTestId('used')).toHaveTextContent('2');

      await user.click(generateButton);
      expect(screen.getByTestId('used')).toHaveTextContent('3');
    });
  });

  describe('Recommendations display', () => {
    it('does not display recommendations initially', () => {
      render(<MainView {...defaultProps} ratingsCount={10} />);

      expect(screen.queryByText('Twoje rekomendacje')).not.toBeInTheDocument();
      expect(screen.queryByTestId('movie-card-1')).not.toBeInTheDocument();
    });

    it('displays recommendations after generation', async () => {
      const user = userEvent.setup();
      render(<MainView {...defaultProps} ratingsCount={10} />);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      expect(screen.getByText('Twoje rekomendacje')).toBeInTheDocument();
      expect(screen.getByTestId('movie-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('movie-card-2')).toBeInTheDocument();
    });

    it('renders MovieCard components with correct props', async () => {
      const user = userEvent.setup();
      render(<MainView {...defaultProps} ratingsCount={10} />);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      const movieCard1 = screen.getByTestId('movie-card-1');
      expect(movieCard1).toHaveTextContent('Test Movie 1 (2024) - /test1.jpg');

      const movieCard2 = screen.getByTestId('movie-card-2');
      expect(movieCard2).toHaveTextContent('Test Movie 2 (2023) - /test2.jpg');
    });

    it('replaces previous recommendations with new ones', async () => {
      const user = userEvent.setup();
      render(<MainView {...defaultProps} ratingsCount={10} />);

      const generateButton = screen.getByRole('button', { name: /generate/i });

      // First generation
      await user.click(generateButton);
      expect(screen.getByTestId('movie-card-1')).toBeInTheDocument();

      // Second generation (should replace, not append)
      await user.click(generateButton);
      const movieCards = screen.getAllByTestId(/^movie-card-/);
      expect(movieCards).toHaveLength(2); // Still 2, not 4
    });
  });

  describe('Edge cases', () => {
    it('handles zero ratings count', () => {
      render(<MainView {...defaultProps} ratingsCount={0} ratingsThreshold={10} />);

      expect(screen.getByText('0/10')).toBeInTheDocument();
      const { container } = render(<MainView {...defaultProps} ratingsCount={0} ratingsThreshold={10} />);
      const progressBar = container.querySelector('.bg-primary');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });

    it('handles threshold of 1', () => {
      render(<MainView {...defaultProps} ratingsCount={1} ratingsThreshold={1} />);

      expect(screen.getByText('Rekomendacje AI')).toBeInTheDocument();
      expect(screen.getByText('Nowe!')).toBeInTheDocument();
    });

    it('handles username with special characters', () => {
      render(<MainView {...defaultProps} username="Test User-123!" />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test User-123!');
    });

    it('handles empty recommendations array', async () => {
      const user = userEvent.setup();

      // Override mock to return empty array
      const { RecommendationGenerator } = await import('./RecommendationGenerator');
      vi.mocked(RecommendationGenerator).mockImplementation(({ onRecommendationsGenerated }) => (
        <button onClick={() => onRecommendationsGenerated([])}>Generate Empty</button>
      ));

      render(<MainView {...defaultProps} ratingsCount={10} />);

      const generateButton = screen.getByRole('button', { name: /generate empty/i });
      await user.click(generateButton);

      // Should not show "Twoje rekomendacje" section for empty array
      expect(screen.queryByText('Twoje rekomendacje')).not.toBeInTheDocument();
    });
  });
});
