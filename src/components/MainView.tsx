import { useState } from "react";
import type { RecommendationDto } from "../types";
import { MovieSearch } from "./MovieSearch";
import { RecommendationGenerator } from "./RecommendationGenerator";
import { MovieCard } from "./MovieCard";
import { Search, Sparkles } from "lucide-react";

export interface MainViewProps {
  username: string;
  ratingsCount: number;
  ratingsThreshold: number;
  recommendationsLimit: number;
}

export function MainView({ username, ratingsCount, ratingsThreshold, recommendationsLimit }: MainViewProps) {
  const [recommendations, setRecommendations] = useState<RecommendationDto[]>([]);
  const [recommendationsUsed, setRecommendationsUsed] = useState<number>(0);

  const hasUnlockedRecommendations = ratingsCount >= ratingsThreshold;

  const handleRecommendationsGenerated = (newRecommendations: RecommendationDto[]) => {
    setRecommendations(newRecommendations);
    setRecommendationsUsed((prev) => prev + 1);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      {/* Header Section */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Witaj{hasUnlockedRecommendations ? " ponownie" : ""}, {username}!
        </h1>
        {hasUnlockedRecommendations ? (
          <p className="text-muted-foreground" data-test-id="ratings-count-message">
            Masz już <span className="font-semibold text-foreground" data-test-id="ratings-count">{ratingsCount}</span> ocenionych filmów
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground" data-test-id="recommendations-locked-message">
              Oceń co najmniej <span className="font-semibold text-foreground" data-test-id="ratings-threshold">{ratingsThreshold}</span> filmów, aby
              odblokować spersonalizowane rekomendacje AI
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="h-2 w-64 overflow-hidden rounded-full bg-muted" data-test-id="ratings-progress-bar">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(ratingsCount / ratingsThreshold) * 100}%` }}
                  data-test-id="ratings-progress-fill"
                />
              </div>
              <span className="text-sm font-medium text-muted-foreground" data-test-id="ratings-progress-text">
                {ratingsCount}/{ratingsThreshold}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Search Section - Always visible */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="size-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Wyszukaj filmy</h2>
        </div>
        <MovieSearch />
      </section>

      {/* Recommendations Section - Visible after threshold */}
      {hasUnlockedRecommendations && (
        <section className="mt-12 space-y-6 border-t pt-8" data-test-id="recommendations-section">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-yellow-500" />
            <h2 className="text-xl font-semibold">Rekomendacje AI</h2>
            {ratingsCount === ratingsThreshold && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground" data-test-id="recommendations-new-badge">
                Nowe!
              </span>
            )}
          </div>

          <div className="rounded-lg border bg-card p-6" data-test-id="recommendations-generator-container">
            <p className="mb-4 text-sm text-muted-foreground">
              Wygeneruj spersonalizowane rekomendacje filmowe na podstawie Twoich ocen
            </p>
            <RecommendationGenerator
              onRecommendationsGenerated={handleRecommendationsGenerated}
              recommendationsLimit={recommendationsLimit}
              recommendationsUsed={recommendationsUsed}
            />
          </div>

          {recommendations.length > 0 && (
            <div className="space-y-4" data-test-id="recommendations-results">
              <h3 className="text-lg font-semibold">Twoje rekomendacje</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" data-test-id="recommendations-list">
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
        </section>
      )}
    </div>
  );
}
