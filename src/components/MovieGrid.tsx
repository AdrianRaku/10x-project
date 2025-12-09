import { MovieCard } from "./MovieCard";

interface Movie {
  tmdb_id: number;
  title: string;
  posterPath?: string | null;
  releaseDate?: string;
  year?: number;
}

interface MovieGridProps {
  movies: Movie[];
  emptyMessage?: string;
}

export function MovieGrid({ movies, emptyMessage = "Brak filmów do wyświetlenia" }: MovieGridProps) {
  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" data-test-id="movie-grid">
      {movies.map((movie) => (
        <MovieCard
          key={movie.tmdb_id}
          tmdb_id={movie.tmdb_id}
          title={movie.title}
          posterPath={movie.posterPath}
          releaseDate={movie.releaseDate}
          year={movie.year}
        />
      ))}
    </div>
  );
}
