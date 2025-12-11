# API Endpoint Implementation Plan: Upsert Movie Rating

## 1. Przegląd punktu końcowego

Ten punkt końcowy `POST /api/ratings` umożliwia uwierzytelnionym użytkownikom tworzenie nowej oceny dla filmu lub aktualizację istniejącej. Implementuje logikę "upsert", co upraszcza operacje po stronie klienta, eliminując potrzebę sprawdzania, czy ocena już istnieje.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/ratings`
- **Request Body**: Obiekt JSON zgodny z typem `AddOrUpdateRatingCommand`.
  ```json
  {
    "tmdb_id": integer,
    "rating": integer
  }
  ```
- **Walidacja**:
  - `tmdb_id`: Musi być dodatnią liczbą całkowitą.
  - `rating`: Musi być liczbą całkowitą w zakresie od 1 do 10.

## 3. Wykorzystywane typy

- **Command Model**: `AddOrUpdateRatingCommand` (`{ tmdb_id: number; rating: number; }`) do obsługi danych przychodzących.
- **Data Transfer Object (DTO)**: `RatingDto` (`{ tmdb_id: number; rating: number; created_at: string; updated_at: string; }`) do formatowania danych w odpowiedzi.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu**: Obiekt JSON zawierający zaktualizowaną lub utworzoną ocenę w polu `data`.
  - **Kod `201 Created`**: Zwracany, gdy tworzona jest nowa ocena.
  - **Kod `200 OK`**: Zwracany, gdy istniejąca ocena jest aktualizowana.
  ```json
  {
    "data": {
      "tmdb_id": 123,
      "rating": 8,
      "created_at": "2025-11-21T10:00:00Z",
      "updated_at": "2025-11-21T10:05:00Z"
    }
  }
  ```
- **Odpowiedź błędu**: Obiekt JSON z komunikatem o błędzie.
  - **Kody**: `400`, `401`, `422`, `500`.

## 5. Przepływ danych

1.  Klient wysyła żądanie `POST` na adres `/api/ratings` z danymi oceny.
2.  Middleware Astro weryfikuje token JWT użytkownika. Jeśli jest nieprawidłowy, zwraca `401 Unauthorized`. Jeśli jest prawidłowy, dołącza sesję użytkownika i klienta Supabase do `context.locals`.
3.  Handler API w `src/pages/api/ratings.ts` odbiera żądanie.
4.  Dane wejściowe z ciała żądania są walidowane przy użyciu schematu `zod`. W przypadku błędu walidacji zwracany jest kod `400 Bad Request`.
5.  Handler wywołuje metodę `upsertRating` z `RatingsService`, przekazując zweryfikowane dane oraz klienta Supabase z `context.locals`.
6.  `RatingsService` wykonuje operację `supabase.from('ratings').upsert(...)`, używając `user_id` z sesji. Supabase na podstawie unikalnego klucza `(user_id, tmdb_id)` decyduje, czy wykonać `INSERT`, czy `UPDATE`.
7.  Baza danych zwraca dane (wraz z `created_at` i `updated_at`). `RatingsService` sprawdza, czy `created_at` jest równe `updated_at`, aby określić, czy rekord został utworzony, czy zaktualizowany.
8.  Serwis zwraca dane i status (`created` lub `updated`) do handlera API.
9.  Handler API formatuje odpowiedź jako `RatingDto`, ustawia odpowiedni kod statusu (`201` lub `200`) i wysyła ją do klienta.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do punktu końcowego jest ograniczony do uwierzytelnionych użytkowników. Middleware Astro będzie odpowiedzialne za weryfikację tokena sesji Supabase.
- **Autoryzacja**: Zasady bezpieczeństwa na poziomie wiersza (RLS) w bazie danych Supabase zapewniają, że użytkownicy mogą modyfikować (`INSERT`, `UPDATE`) wyłącznie własne oceny. Logika `upsert` będzie działać w kontekście `auth.uid()`.
- **Walidacja danych**: Użycie `zod` do walidacji schematu na serwerze chroni przed nieprawidłowymi lub złośliwymi danymi, zanim dotrą one do logiki biznesowej lub bazy danych.

## 7. Obsługa błędów

- **`400 Bad Request`**: Zwracany, gdy dane wejściowe nie przejdą walidacji `zod` (np. brak `tmdb_id`, `rating` poza zakresem). Odpowiedź będzie zawierać szczegóły błędu walidacji.
- **`401 Unauthorized`**: Zwracany przez middleware, jeśli użytkownik nie jest zalogowany.
- **`422 Unprocessable Entity`**: Zwracany, jeśli operacja na bazie danych nie powiedzie się z powodu naruszenia ograniczeń (np. `CHECK`), które nie zostały przechwycone przez walidację `zod`.
- **`500 Internal Server Error`**: Zwracany w przypadku nieoczekiwanych błędów serwera, takich jak problemy z połączeniem z bazą danych. Błąd zostanie zalogowany na serwerze.

## 9. Etapy wdrożenia

1.  **Utworzenie pliku serwisu**: Stwórz nowy plik `src/lib/services/ratings.service.ts`.
2.  **Implementacja `RatingsService`**: W nowym pliku zdefiniuj klasę `RatingsService` z metodą `upsertRating(command: AddOrUpdateRatingCommand, supabase: SupabaseClient)`. Metoda ta będzie zawierać logikę operacji `upsert` na tabeli `ratings` i zwracać wynik wraz ze statusem operacji (utworzono/zaktualizowano).
3.  **Utworzenie pliku endpointu API**: Stwórz plik `src/pages/api/ratings.ts`.
4.  **Zdefiniowanie schematu walidacji**: W pliku `ratings.ts` zdefiniuj schemat `zod` dla `AddOrUpdateRatingCommand`.
5.  **Implementacja handlera `POST`**: W pliku `ratings.ts` zaimplementuj handler `POST`, który:
    - Pobiera sesję użytkownika i klienta Supabase z `Astro.locals`.
    - Waliduje ciało żądania przy użyciu `zod`.
    - Wywołuje `RatingsService.upsertRating`.
    - Obsługuje błędy i zwraca odpowiednie kody statusu.
    - Formatuje i zwraca pomyślną odpowiedź (`RatingDto`) z kodem `200` lub `201`.
6.  **Aktualizacja middleware**: Upewnij się, że middleware w `src/middleware/index.ts` poprawnie obsługuje sesje dla ścieżek `/api/*` i dołącza `supabase` do `context.locals`.
