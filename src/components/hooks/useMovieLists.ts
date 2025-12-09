import { useState, useCallback, useEffect } from "react";

interface UseMovieListsProps {
  tmdbId: number;
}

interface UseMovieListsReturn {
  isFavorite: boolean;
  isWatchlisted: boolean;
  isLoading: boolean;
  toggleFavorite: () => Promise<void>;
  toggleWatchlist: () => Promise<void>;
}

/**
 * Custom hook for managing movie lists (favorites and watchlist).
 * Handles optimistic updates and API communication.
 */
export function useMovieLists({ tmdbId }: UseMovieListsProps): UseMovieListsReturn {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial list state
  useEffect(() => {
    const fetchListsState = async () => {
      try {
        const response = await fetch("/api/lists");
        if (!response.ok) return;

        const data = await response.json();
        const { favorite, watchlist } = data.data;

        setIsFavorite(favorite.some((item: { tmdb_id: number }) => item.tmdb_id === tmdbId));
        setIsWatchlisted(watchlist.some((item: { tmdb_id: number }) => item.tmdb_id === tmdbId));
      } catch (error) {
        console.error("Failed to fetch lists state:", error);
      }
    };

    fetchListsState();
  }, [tmdbId]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async () => {
    const previousState = isFavorite;
    setIsLoading(true);

    // Optimistic update
    setIsFavorite(!previousState);

    try {
      if (previousState) {
        // Remove from favorites
        const response = await fetch(`/api/lists/favorite/${tmdbId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to remove from favorites");
        }
      } else {
        // Add to favorites
        const response = await fetch("/api/lists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tmdb_id: tmdbId,
            list_type: "favorite",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          // If already in list, ignore conflict error
          if (response.status !== 409) {
            throw new Error(errorData.message || "Failed to add to favorites");
          }
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Revert on error
      setIsFavorite(previousState);
    } finally {
      setIsLoading(false);
    }
  }, [isFavorite, tmdbId]);

  // Toggle watchlist status
  const toggleWatchlist = useCallback(async () => {
    const previousState = isWatchlisted;
    setIsLoading(true);

    // Optimistic update
    setIsWatchlisted(!previousState);

    try {
      if (previousState) {
        // Remove from watchlist
        const response = await fetch(`/api/lists/watchlist/${tmdbId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to remove from watchlist");
        }
      } else {
        // Add to watchlist
        const response = await fetch("/api/lists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tmdb_id: tmdbId,
            list_type: "watchlist",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          // If already in list, ignore conflict error
          if (response.status !== 409) {
            throw new Error(errorData.message || "Failed to add to watchlist");
          }
        }
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error);
      // Revert on error
      setIsWatchlisted(previousState);
    } finally {
      setIsLoading(false);
    }
  }, [isWatchlisted, tmdbId]);

  return {
    isFavorite,
    isWatchlisted,
    isLoading,
    toggleFavorite,
    toggleWatchlist,
  };
}
