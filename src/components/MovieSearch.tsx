import { useState, useEffect } from "react";
import type { MovieSearchResultDto } from "../types";
import { useDebounce } from "./hooks/useDebounce";
import { MovieCard } from "./MovieCard";

export function MovieSearch() {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<MovieSearchResultDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();

    if (!trimmedQuery) {
      setResults([]);
      setError(null);
      return;
    }

    if (trimmedQuery.length < 5) {
      setResults([]);
      setError(null);
      return;
    }

    const searchMovies = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/movies/search?query=${encodeURIComponent(trimmedQuery)}`);

        if (!response.ok) {
          throw new Error("Wystąpił błąd podczas wyszukiwania. Spróbuj ponownie.");
        }

        const { data } = await response.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił błąd podczas wyszukiwania. Spróbuj ponownie.");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchMovies();
  }, [debouncedQuery]);

  return (
    <div className="w-full space-y-6">
      <div className="relative mx-auto max-w-md">
        <input
          type="search"
          placeholder="Wyszukaj film..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={50}
          className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          aria-label="Wyszukaj film"
        />
        {query.trim().length > 0 && query.trim().length < 5 && (
          <p className="mt-1 text-xs text-muted-foreground">Wpisz co najmniej 5 znaków, aby wyszukać</p>
        )}
      </div>

      {isLoading && <div className="text-center text-sm text-muted-foreground">Wyszukiwanie...</div>}

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!isLoading && !error && results.length === 0 && debouncedQuery.trim().length >= 5 && (
        <div className="text-center text-sm text-muted-foreground">
          Nie znaleziono filmów pasujących do Twojego zapytania
        </div>
      )}

      {!isLoading && !error && results.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {results.map((movie) => (
            <MovieCard
              key={movie.tmdb_id}
              tmdb_id={movie.tmdb_id}
              title={movie.title}
              posterPath={movie.posterPath}
              releaseDate={movie.releaseDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
