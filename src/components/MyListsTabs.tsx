import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MovieGrid } from "./MovieGrid";
import { Skeleton } from "@/components/ui/skeleton";
import type { MovieSearchResultDto, RatingDto } from "../types";

interface MyListsTabsProps {
  initialRatings: RatingDto[];
  initialWatchlist: { tmdb_id: number; created_at: string }[];
  initialFavorites: { tmdb_id: number; created_at: string }[];
}

interface MovieWithDetails extends MovieSearchResultDto {
  rating?: number;
}

export function MyListsTabs({ initialRatings, initialWatchlist, initialFavorites }: MyListsTabsProps) {
  const [ratedMovies, setRatedMovies] = useState<MovieWithDetails[]>([]);
  const [watchlistMovies, setWatchlistMovies] = useState<MovieWithDetails[]>([]);
  const [favoriteMovies, setFavoriteMovies] = useState<MovieWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch movie details from TMDb API
  useEffect(() => {
    const fetchMovieDetails = async () => {
      setIsLoading(true);

      try {
        // Fetch rated movies details
        const ratedPromises = initialRatings.map(async (rating) => {
          const response = await fetch(`/api/movies/${rating.tmdb_id}`);
          if (!response.ok) return null;
          const data = await response.json();
          return { ...data.data, rating: rating.rating };
        });

        // Fetch watchlist movies details
        const watchlistPromises = initialWatchlist.map(async (item) => {
          const response = await fetch(`/api/movies/${item.tmdb_id}`);
          if (!response.ok) return null;
          const data = await response.json();
          return data.data;
        });

        // Fetch favorites movies details
        const favoritesPromises = initialFavorites.map(async (item) => {
          const response = await fetch(`/api/movies/${item.tmdb_id}`);
          if (!response.ok) return null;
          const data = await response.json();
          return data.data;
        });

        const [rated, watchlist, favorites] = await Promise.all([
          Promise.all(ratedPromises),
          Promise.all(watchlistPromises),
          Promise.all(favoritesPromises),
        ]);

        setRatedMovies(rated.filter(Boolean) as MovieWithDetails[]);
        setWatchlistMovies(watchlist.filter(Boolean) as MovieWithDetails[]);
        setFavoriteMovies(favorites.filter(Boolean) as MovieWithDetails[]);
      } catch (error) {
        console.error("Error fetching movie details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieDetails();
  }, [initialRatings, initialWatchlist, initialFavorites]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="rated" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-3">
        <TabsTrigger value="rated" data-test-id="tab-rated">
          Ocenione ({ratedMovies.length})
        </TabsTrigger>
        <TabsTrigger value="watchlist" data-test-id="tab-watchlist">
          Do obejrzenia ({watchlistMovies.length})
        </TabsTrigger>
        <TabsTrigger value="favorites" data-test-id="tab-favorites">
          Ulubione ({favoriteMovies.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="rated" className="mt-6">
        <MovieGrid movies={ratedMovies} emptyMessage="Nie oceniłeś jeszcze żadnych filmów" />
      </TabsContent>

      <TabsContent value="watchlist" className="mt-6">
        <MovieGrid movies={watchlistMovies} emptyMessage="Twoja lista 'Do obejrzenia' jest pusta" />
      </TabsContent>

      <TabsContent value="favorites" className="mt-6">
        <MovieGrid movies={favoriteMovies} emptyMessage="Nie masz jeszcze ulubionych filmów" />
      </TabsContent>
    </Tabs>
  );
}
