import { useState } from "react";
import type { GenerateRecommendationsCommand, RecommendationDto } from "../types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

interface RecommendationGeneratorProps {
  onRecommendationsGenerated: (recommendations: RecommendationDto[]) => void;
  recommendationsLimit: number;
  recommendationsUsed: number;
}

export function RecommendationGenerator({
  onRecommendationsGenerated,
  recommendationsLimit,
  recommendationsUsed,
}: RecommendationGeneratorProps) {
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isLimitReached = recommendationsUsed >= recommendationsLimit;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLimitReached) {
      setError("Osiągnięto dzienny limit rekomendacji. Spróbuj ponownie jutro.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const command: GenerateRecommendationsCommand = {
        prompt: prompt.trim() || undefined,
      };

      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Wystąpił chwilowy błąd. Spróbuj ponownie za chwilę");
      }

      const { data } = await response.json();
      onRecommendationsGenerated(data);
      setPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił chwilowy błąd. Spróbuj ponownie za chwilę");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4" data-test-id="recommendation-generator">
      <form onSubmit={handleSubmit} className="space-y-4" data-test-id="recommendation-form">
        <div className="space-y-2">
          <label htmlFor="prompt" className="text-sm font-medium">
            Opcjonalny prompt (np. &ldquo;Polecam mi filmy science fiction z lat 80-tych&rdquo;)
          </label>
          <Textarea
            id="prompt"
            placeholder="Opisz, jakiego typu filmy Cię interesują..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading || isLimitReached}
            rows={3}
            data-test-id="recommendation-prompt-input"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground" data-test-id="recommendations-usage-counter">
            Wykorzystano: {recommendationsUsed} / {recommendationsLimit}
          </span>
          <Button type="submit" disabled={isLoading || isLimitReached} data-test-id="generate-recommendations-button">
            {isLoading ? "Generowanie..." : "Zaproponuj coś dla mnie"}
          </Button>
        </div>
      </form>

      {error && (
        <div
          className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
          data-test-id="recommendation-error"
        >
          {error}
        </div>
      )}

      {isLoading && (
        <div className="space-y-4" data-test-id="recommendation-loading">
          <div className="text-sm font-medium">Generowanie rekomendacji...</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[200px] w-full rounded-lg" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
