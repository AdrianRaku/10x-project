import { MovieSearch } from "./MovieSearch";

export interface OnboardingViewProps {
  username: string;
}

export function OnboardingView({ username }: OnboardingViewProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Witaj, {username}!</h1>
        <p className="text-muted-foreground">
          Zacznij od wyszukania i oceny co najmniej 10 filmów, aby otrzymać spersonalizowane rekomendacje AI
        </p>
      </div>

      <MovieSearch />
    </div>
  );
}
