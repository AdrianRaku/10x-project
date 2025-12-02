import { useState } from "react";
import type { RecommendationDto } from "../types";
import { RecommendationGenerator } from "./RecommendationGenerator";
import { MovieCard } from "./MovieCard";

export type RecommendationsViewProps = {
  username: string;
  recommendationsLimit: number;
};

export function RecommendationsView({
  username,
  recommendationsLimit
}: RecommendationsViewProps) {
  const [recommendations, setRecommendations] = useState<RecommendationDto[]>([]);
  const [recommendationsUsed, setRecommendationsUsed] = useState<number>(0);

  const handleRecommendationsGenerated = (newRecommendations: RecommendationDto[]) => {
    setRecommendations(newRecommendations);
    setRecommendationsUsed(prev => prev + 1);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Witaj ponownie, {username}!
        </h1>
        <p className="text-muted-foreground">
          Wygeneruj spersonalizowane rekomendacje filmowe na podstawie Twoich ocen
        </p>
      </div>

      <RecommendationGenerator
        onRecommendationsGenerated={handleRecommendationsGenerated}
        recommendationsLimit={recommendationsLimit}
        recommendationsUsed={recommendationsUsed}
      />

      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Twoje rekomendacje</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {recommendations.map((movie) => (
              <MovieCard
                key={movie.tmdb_id}
                tmdb_id={movie.tmdb_id}
                title={movie.title}
                year={movie.year}
                posterPath={movie.posterPath}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
