import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Heart, Bookmark, ListPlus, Loader2 } from "lucide-react";
import { useMovieLists } from "./hooks/useMovieLists";

interface MovieListActionsProps {
  tmdbId: number;
}

export function MovieListActions({ tmdbId }: MovieListActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isFavorite, isWatchlisted, isLoading, toggleFavorite, toggleWatchlist } = useMovieLists({ tmdbId });

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite();
  };

  const handleToggleWatchlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleWatchlist();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={isLoading}
          data-test-id={`movie-list-actions-${tmdbId}`}
        >
          {isLoading ? <Loader2 className="size-4 mr-1 animate-spin" /> : <ListPlus className="size-4 mr-1" />}
          Lista
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end" data-test-id="movie-list-actions-popover">
        <div className="flex flex-col gap-1">
          <Button
            variant={isFavorite ? "default" : "ghost"}
            size="sm"
            className="justify-start"
            onClick={handleToggleFavorite}
            disabled={isLoading}
            data-test-id="toggle-favorite-button"
          >
            <Heart className={`size-4 mr-2 ${isFavorite ? "fill-current" : ""}`} />
            {isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
          </Button>

          <Button
            variant={isWatchlisted ? "default" : "ghost"}
            size="sm"
            className="justify-start"
            onClick={handleToggleWatchlist}
            disabled={isLoading}
            data-test-id="toggle-watchlist-button"
          >
            <Bookmark className={`size-4 mr-2 ${isWatchlisted ? "fill-current" : ""}`} />
            {isWatchlisted ? "Usuń z listy" : "Dodaj do obejrzenia"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
