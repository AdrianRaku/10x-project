# Plan Wdrożenia Punktu Końcowego API: Wyszukiwanie Filmów

## 1. Przegląd Punktu Końcowego

Celem tego punktu końcowego jest zapewnienie bezpiecznego interfejsu do wyszukiwania filmów za pośrednictwem zewnętrznego API The Movie Database (TMDb). Działa on jako serwer proxy, ukrywając klucz API TMDb przed klientem i dostarczając ustandaryzowaną strukturę odpowiedzi.

## 2. Szczegóły Żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/movies/search`
- **Parametry**:
  - **Wymagane**: `query` (string) - Fraza do wyszukania filmów.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak (N/A).

## 3. Wykorzystywane Typy

Do implementacji tego punktu końcowego wykorzystane zostaną następujące typy zdefiniowane w `src/types.ts`:

- `MovieSearchResultDto`: Używany do strukturyzacji danych wyjściowych dla każdego znalezionego filmu.
  ```typescript
  export type MovieSearchResultDto = {
    tmdb_id: number;
    title: string;
    posterPath: string | null;
    releaseDate: string;
  };
  ```

## 4. Szczegóły Odpowiedzi

- **Odpowiedź sukcesu (200 OK)**: Zwraca obiekt JSON z polem `data`, które zawiera tablicę obiektów `MovieSearchResultDto`.
  ```json
  {
    "data": [
      {
        "tmdb_id": 278,
        "title": "The Shawshank Redemption",
        "poster_path": "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
        "release_date": "1994-09-23"
      }
    ]
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Gdy parametr `query` jest brakujący lub pusty.
  - `500 Internal Server Error`: Gdy wystąpi błąd podczas komunikacji z API TMDb lub inny błąd serwera.

## 5. Przepływ Danych

1.  Klient wysyła żądanie `GET` na adres `/api/movies/search?query={fraza}`.
2.  Handler trasy w `src/pages/api/movies/search.ts` odbiera żądanie.
3.  Parametr `query` jest walidowany przy użyciu `zod` w celu upewnienia się, że jest to niepusty ciąg znaków.
4.  Handler wywołuje metodę `searchMovies(query)` z nowego serwisu `MoviesService` (`src/lib/services/movies.service.ts`).
5.  `MoviesService` konstruuje pełny adres URL zapytania do API TMDb, dołączając klucz API pobrany ze zmiennych środowiskowych serwera.
6.  Serwis wysyła żądanie `fetch` do API TMDb.
7.  Po otrzymaniu odpowiedzi, serwis mapuje wyniki na tablicę obiektów `MovieSearchResultDto`, wybierając tylko wymagane pola (`id`, `title`, `poster_path`, `release_date`).
8.  Serwis zwraca przekształconą tablicę do handlera trasy.
9.  Handler trasy tworzy obiekt odpowiedzi w formacie `{ data: [...] }` i wysyła go do klienta ze statusem `200 OK`.

## 6. Względy Bezpieczeństwa

- **Ochrona Klucza API**: Klucz API do TMDb musi być przechowywany jako zmienna środowiskowa (`TMDB_API_KEY`) i dostępny wyłącznie po stronie serwera. Nie może być w żadnym wypadku ujawniony w kodzie klienta.
- **Walidacja Danych Wejściowych**: Wszystkie dane wejściowe od użytkownika (`query`) muszą być walidowane, aby zapobiec potencjalnym atakom (np. injection, chociaż w tym przypadku ryzyko jest niskie) i zapewnić poprawne działanie serwisu.

## 7. Rozważania dotyczące Wydajności

- **Zależność od Zewnętrznego API**: Wydajność punktu końcowego jest bezpośrednio związana z czasem odpowiedzi API TMDb.
- **Caching (Opcjonalnie w przyszłości)**: W celu optymalizacji można rozważyć wdrożenie mechanizmu buforowania (caching) po stronie serwera dla popularnych zapytań, aby zmniejszyć liczbę żądań do API TMDb. Na obecnym etapie nie jest to wymagane.

## 8. Etapy Wdrożenia

1.  **Utworzenie serwisu**: Stwórz nowy plik `src/lib/services/movies.service.ts`.
2.  **Implementacja logiki serwisu**: W `movies.service.ts` zaimplementuj funkcję `searchMovies(query: string)`, która będzie:
    - Pobierać klucz API TMDb ze zmiennych środowiskowych (`import.meta.env.TMDB_API_KEY`).
    - Wysyłać żądanie `fetch` do punktu końcowego `https://api.themoviedb.org/3/search/movie`.
    - Obsługiwać błędy komunikacji z API.
    - Mapować odpowiedź na tablicę obiektów `MovieSearchResultDto`.
3.  **Utworzenie pliku trasy API**: Stwórz nowy plik `src/pages/api/movies/search.ts`.
4.  **Implementacja handlera trasy**: W `search.ts` zaimplementuj handler `GET`, który:
    - Eksportuje stałą `export const prerender = false;`.
    - Pobiera parametr `query` z `Astro.url.searchParams`.
    - Używa `zod` do walidacji parametru `query`. Zwraca `400 Bad Request` w przypadku błędu.
    - Wywołuje `moviesService.searchMovies(query)`.
    - Obsługuje błędy z serwisu, zwracając `500 Internal Server Error`.
    - Zwraca pomyślną odpowiedź w formacie JSON ze statusem `200 OK`.
5.  **Dodanie zmiennej środowiskowej**: Upewnij się, że zmienna `TMDB_API_KEY` jest zdefiniowana w pliku `.env` i dostępna dla aplikacji.
6.  **Testowanie**: Napisz testy (lub przeprowadź testy manualne), aby zweryfikować:
    - Poprawne działanie dla prawidłowego zapytania.
    - Zwracanie błędu `400` dla brakującego `query`.
    - Symulację błędu API TMDb i weryfikację zwracania błędu `500`.
