import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MovieRating } from "./MovieRating";
import { MovieListActions } from "./MovieListActions";
import { Info } from "lucide-react";

interface MovieCardProps {
  tmdb_id: number;
  title: string;
  posterPath?: string | null;
  releaseDate?: string;
  year?: number;
}

export function MovieCard({ tmdb_id, title, posterPath, releaseDate, year }: MovieCardProps) {
  const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

  // Extract year from releaseDate or use year prop
  const displayYear = year || (releaseDate ? new Date(releaseDate).getFullYear() : null);

  // Construct poster URL or use placeholder
  const posterUrl = posterPath ? `${TMDB_IMAGE_BASE_URL}${posterPath}` : null;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg flex flex-col" data-test-id={`movie-card-${tmdb_id}`}>
      <a href={`/movie/${tmdb_id}`} className="group" data-test-id="movie-card-link">
        <div className="aspect-[2/3] overflow-hidden bg-muted">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={`Plakat filmu ${title}`}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-xs text-muted-foreground">Brak plakatu</span>
            </div>
          )}
        </div>

        <CardHeader className="p-3">
          <CardTitle className="line-clamp-2 text-sm leading-tight">{title}</CardTitle>
          {displayYear && <CardDescription className="text-xs">{displayYear}</CardDescription>}
        </CardHeader>
      </a>

      <CardFooter className="p-3 pt-0 mt-auto flex flex-col gap-2">
        <MovieRating tmdbId={tmdb_id} movieTitle={title} />
        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a href={`/movie/${tmdb_id}`}>
              <Info className="size-4 mr-1" />
              Szczegóły
            </a>
          </Button>
          <MovieListActions tmdbId={tmdb_id} movieTitle={title} />
        </div>
      </CardFooter>
    </Card>
  );
}
