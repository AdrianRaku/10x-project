import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Star } from "lucide-react";

type MovieRatingProps = {
  tmdbId: number;
  movieTitle: string;
};

export function MovieRating({ tmdbId, movieTitle }: MovieRatingProps) {
  const [open, setOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [currentRating, setCurrentRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current rating when component mounts
  useEffect(() => {
    const fetchCurrentRating = async () => {
      try {
        const response = await fetch("/api/ratings");
        if (response.ok) {
          const { data } = await response.json();
          const existingRating = data.find((r: any) => r.tmdb_id === tmdbId);
          if (existingRating) {
            setCurrentRating(existingRating.rating);
            setSelectedRating(existingRating.rating);
          }
        }
      } catch (err) {
        console.error("Failed to fetch current rating:", err);
      }
    };

    fetchCurrentRating();
  }, [tmdbId]);

  const handleRatingClick = (rating: number) => {
    setSelectedRating(rating);
  };

  const handleSubmit = async () => {
    if (selectedRating === null) {
      setError("Wybierz ocenę przed zapisaniem");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tmdb_id: tmdbId,
          rating: selectedRating,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Nie udało się zapisać oceny");
      }

      const { data } = await response.json();
      setCurrentRating(data.rating);
      setOpen(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas zapisywania oceny");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedRating(currentRating);
    setError(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="flex items-center gap-2">
          <Star className="size-4" />
          {currentRating ? `Twoja ocena: ${currentRating}/10` : "Oceń film"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Oceń film</DialogTitle>
          <DialogDescription>
            Jak oceniasz "{movieTitle}"? Wybierz ocenę od 1 do 10.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => {
              const isSelected = selectedRating !== null && rating <= selectedRating;
              const isHovered = hoveredRating !== null && rating <= hoveredRating;
              const shouldFill = isHovered || (isSelected && hoveredRating === null);

              return (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleRatingClick(rating)}
                  onMouseEnter={() => setHoveredRating(rating)}
                  onMouseLeave={() => setHoveredRating(null)}
                  className="group p-0.5 transition-transform hover:scale-110"
                  aria-label={`Ocena ${rating}`}
                >
                  <Star
                    className={`size-6 transition-all ${
                      shouldFill
                        ? "fill-yellow-500 stroke-yellow-600 text-yellow-500"
                        : "fill-none stroke-muted-foreground text-muted-foreground hover:stroke-yellow-500"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          {selectedRating !== null && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Wybrana ocena: <span className="font-semibold text-foreground">{selectedRating}/10</span>
            </p>
          )}
          {error && (
            <p className="mt-4 text-center text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || selectedRating === null}>
            {isLoading ? "Zapisywanie..." : "Zapisz ocenę"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
