# Plan implementacji widoku Strona główna

## 1. Przegląd

Strona główna (`/`) jest centralnym punktem aplikacji MyFilms. Jej wygląd i funkcjonalność dynamicznie dostosowują się do stanu użytkownika. Dla nowych użytkowników (poniżej 10 ocenionych filmów) pełni rolę ekranu onboardingowego, zachęcając do wyszukiwania i oceniania filmów. Dla użytkowników, którzy ocenili wymaganą liczbę filmów, strona przekształca się w narzędzie do generowania spersonalizowanych rekomendacji AI.

## 2. Routing widoku

Widok będzie dostępny pod główną ścieżką aplikacji: `/`.

## 3. Struktura komponentów

Strona główna (`index.astro`) będzie renderować jeden z dwóch głównych komponentów klienckich w zależności od liczby ocen użytkownika.

```
index.astro
└── UserDataProvider (globalny)
    ├── OnboardingView.tsx (jeśli user.ratings < 10)
    │   └── MovieSearch.tsx
    │       └── MovieCard.tsx
    └── RecommendationsView.tsx (jeśli user.ratings >= 10)
        ├── RecommendationGenerator.tsx
        └── MovieCard.tsx
```

## 4. Szczegóły komponentów

### OnboardingView.tsx

-   **Opis komponentu:** Komponent React wyświetlany użytkownikom, którzy nie ocenili jeszcze 10 filmów. Zawiera komunikat powitalny oraz komponent do wyszukiwania filmów.
-   **Główne elementy:** Element `div` zawierający nagłówek `h1` z tekstem powitalnym oraz komponent `<MovieSearch />`.
-   **Obsługiwane interakcje:** Brak bezpośrednich interakcji; deleguje je do komponentu `MovieSearch`.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** `OnboardingViewProps`.
-   **Propsy:**
    -   `username: string`: Nazwa użytkownika do wyświetlenia w powitaniu.

### RecommendationsView.tsx

-   **Opis komponentu:** Komponent React wyświetlany użytkownikom z 10 lub więcej ocenami. Umożliwia generowanie i wyświetlanie rekomendacji filmowych.
-   **Główne elementy:** Element `div` zawierający komponent `<RecommendationGenerator />` oraz listę rekomendacji renderowaną jako siatka komponentów `<MovieCard />`.
-   **Obsługiwane interakcje:** Delegowane do komponentu `RecommendationGenerator`.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** `RecommendationsViewProps`.
-   **Propsy:**
    -   `username: string`: Nazwa użytkownika.
    -   `recommendationsLimit: number`: Dzienny limit zapytań o rekomendacje.

### MovieSearch.tsx

-   **Opis komponentu:** Interaktywny komponent umożliwiający wyszukiwanie filmów w czasie rzeczywistym poprzez API TMDb. Wyświetla wyniki w formie siatki.
-   **Główne elementy:** Pole `input` typu `search`, siatka (`div` z gridem) komponentów `<MovieCard />` dla wyników, komunikat o braku wyników.
-   **Obsługiwane interakcje:**
    -   `onChange` na polu input: Aktualizuje stan zapytania i (z użyciem debouncingu) wywołuje API.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** `MovieSearchResultDto`.
-   **Propsy:** Brak.

### RecommendationGenerator.tsx

-   **Opis komponentu:** Zarządza procesem generowania rekomendacji. Zawiera przycisk do wywołania AI, opcjonalne pole na prompt i obsługuje stany ładowania oraz błędu.
-   **Główne elementy:** Formularz z polem `textarea` (opcjonalny prompt) i przyciskiem `button` ("Zaproponuj coś dla mnie"). Wyświetla szkielety (skeletons) podczas ładowania.
-   **Obsługiwane interakcje:**
    -   `onSubmit` na formularzu: Wywołuje funkcję generującą rekomendacje.
-   **Obsługiwana walidacja:** Sprawdza, czy nie został przekroczony dzienny limit zapytań.
-   **Typy:** `GenerateRecommendationsCommand`, `RecommendationDto`.
-   **Propsy:** Brak.

## 5. Typy

Do implementacji widoku strony głównej, oprócz istniejących typów DTO, potrzebne będą następujące typy dla komponentów:

```typescript
// Propsy dla komponentu OnboardingView
export type OnboardingViewProps = {
  username: string;
};

// Propsy dla komponentu RecommendationsView
export type RecommendationsViewProps = {
  username: string;
  recommendationsLimit: number;
};
```

## 6. Zarządzanie stanem

Stan globalny, taki jak oceny i listy użytkownika, będzie zarządzany przez `UserDataProvider` (React Context).

Komponenty klienckie będą zarządzać swoim stanem lokalnym:
-   **`MovieSearch.tsx`**: Będzie używał `useState` do przechowywania:
    -   `query: string`: Aktualna fraza wyszukiwania.
    -   `results: MovieSearchResultDto[]`: Lista wyników z API.
    -   `isLoading: boolean`: Stan ładowania na potrzeby debouncingu.
    -   Zalecane jest użycie customowego hooka `useDebounce` do opóźnienia zapytań API podczas wpisywania tekstu przez użytkownika.

-   **`RecommendationGenerator.tsx`**: Będzie używał `useState` do zarządzania:
    -   `prompt: string`: Treść opcjonalnego promptu.
    -   `recommendations: RecommendationDto[]`: Wygenerowane rekomendacje.
    -   `isLoading: boolean`: Stan ładowania podczas zapytania do AI.
    -   `error: string | null`: Komunikat o błędzie.

## 7. Integracja API

Komponenty będą korzystać z następujących endpointów API:

1.  **Wyszukiwanie filmów (`MovieSearch.tsx`)**
    -   **Endpoint:** `GET /api/movies/search`
    -   **Zapytanie:** `?query={string}`
    -   **Typ odpowiedzi:** `MovieSearchResultDto[]`

2.  **Generowanie rekomendacji (`RecommendationGenerator.tsx`)**
    -   **Endpoint:** `POST /api/recommendations`
    -   **Typ zapytania (body):** `GenerateRecommendationsCommand` (`{ prompt?: string }`)
    -   **Typ odpowiedzi:** `RecommendationDto[]`

Interakcje z listami i ocenami (np. z poziomu `MovieCard`) będą obsługiwane przez funkcje z `UserDataProvider`, które komunikują się z `POST /api/ratings` i `POST /api/lists`.

## 8. Interakcje użytkownika

-   **Wpisywanie w polu wyszukiwania:** Aplikacja czeka na krótką przerwę w pisaniu (debouncing), a następnie automatycznie wysyła zapytanie do `GET /api/movies/search` i aktualizuje listę wyników.
-   **Kliknięcie "Zaproponuj coś dla mnie":** Wywołuje zapytanie `POST /api/recommendations`. Na czas oczekiwania na odpowiedź, interfejs wyświetla animację ładowania (szkielety). Po otrzymaniu danych, wyświetla 5 rekomendacji.
-   **Przekroczenie limitu rekomendacji:** Próba wygenerowania rekomendacji po wykorzystaniu dziennego limitu spowoduje zablokowanie przycisku i wyświetlenie komunikatu informacyjnego (np. w formie toasta).

## 9. Warunki i walidacja

-   **Przełączanie widoków (onboarding/rekomendacje):** Logika w `index.astro` sprawdzi po stronie serwera liczbę ocen użytkownika (`ratings.length`) i na tej podstawie renderuje `OnboardingView.tsx` (`< 10`) lub `RecommendationsView.tsx` (`>= 10`).
-   **Limit rekomendacji:** Komponent `RecommendationGenerator.tsx` przed wysłaniem zapytania sprawdzi, czy liczba prób nie przekroczyła dziennego limitu. Jeśli tak, przycisk generowania będzie nieaktywny. Walidacja ta musi być również powtórzona po stronie serwera w endpoincie `/api/recommendations`.

## 10. Obsługa błędów

-   **Błąd API wyszukiwania:** Jeśli `GET /api/movies/search` zwróci błąd, w obszarze wyników należy wyświetlić komunikat, np. "Wystąpił błąd podczas wyszukiwania. Spróbuj ponownie."
-   **Brak wyników wyszukiwania:** Jeśli API zwróci pustą tablicę, należy wyświetlić komunikat: "Nie znaleziono filmów pasujących do Twojego zapytania".
-   **Błąd generowania rekomendacji:** Jeśli `POST /api/recommendations` zwróci błąd, komponent `RecommendationGenerator.tsx` powinien wyświetlić stosowny komunikat (np. "Wystąpił chwilowy błąd. Spróbuj ponownie za chwilę") za pomocą toasta, a stan ładowania powinien zostać zakończony. Nieudane zapytanie nie powinno zmniejszać licznika dziennego limitu.

## 11. Kroki implementacji

1.  **Stworzenie plików komponentów:** Utwórz puste pliki `OnboardingView.tsx`, `RecommendationsView.tsx`, `MovieSearch.tsx` i `RecommendationGenerator.tsx` w katalogu `src/components/`.
2.  **Implementacja `MovieSearch.tsx`:**
    -   Zaimplementuj logikę stanu dla `query`, `results`, `isLoading`.
    -   Dodaj hook `useDebounce` do zarządzania zapytaniami API.
    -   Zintegruj z endpointem `GET /api/movies/search`.
    -   Zbuduj interfejs z polem `input` i siatką wyników, wykorzystując komponent `MovieCard`.
3.  **Implementacja `OnboardingView.tsx`:**
    -   Stwórz prosty layout z komunikatem powitalnym i osadź w nim komponent `MovieSearch.tsx`.
4.  **Implementacja `RecommendationGenerator.tsx`:**
    -   Zaimplementuj logikę stanu dla `prompt`, `recommendations`, `isLoading`, `error`.
    -   Zintegruj z endpointem `POST /api/recommendations`.
    -   Dodaj obsługę stanu ładowania (wyświetlanie szkieletów) i obsługę błędów (wyświetlanie toastów).
5.  **Implementacja `RecommendationsView.tsx`:**
    -   Stwórz layout, który osadza `RecommendationGenerator.tsx` i wyświetla listę zwróconych rekomendacji za pomocą `MovieCard`.
6.  **Aktualizacja `index.astro`:**
    -   Dodaj logikę pobierania danych użytkownika (liczby ocen) po stronie serwera.
    -   Implementuj warunkowe renderowanie komponentów `OnboardingView` lub `RecommendationsView` w zależności od liczby ocen, przekazując do nich wymagane propsy.
7.  **Testowanie i weryfikacja:**
    -   Sprawdź oba stany strony głównej dla użytkowników z różną liczbą ocen.
    -   Zweryfikuj działanie wyszukiwarki, generowania rekomendacji, obsługi stanów ładowania i błędów.
    -   Upewnij się, że limit rekomendacji jest poprawnie obsługiwany po stronie klienta i serwera.

