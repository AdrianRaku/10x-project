<analiza_projektu>
**1. Kluczowe komponenty projektu:**

- **Frontend (Astro + React):**
  - **Strony (Astro):** `index.astro` (główny widok), `login.astro`, `register.astro`, `movie/[tmdb_id].astro` (szczegóły filmu). Strony wykorzystują Server-Side Rendering (SSR).
  - **Komponenty (React):** `MovieSearch` (wyszukiwanie z debounce), `MovieRating` (modal do oceniania), `RecommendationGenerator` (interfejs AI), `MainView` (logika warunkowa wyświetlania dashboardu), formularze autoryzacji (`LoginForm`, `RegisterForm` itd.).
  - **Stylizacja:** Tailwind CSS z wsparciem dla Dark Mode (`ThemeToggle`).

- **Backend (Astro API Routes):**
  - **Auth:** `/api/auth/*` (logowanie, rejestracja, reset hasła, wylogowanie) - wrapper na metody Supabase Auth.
  - **Movies:** `/api/movies/search` (proxy do TMDb), `/api/ratings` (obsługa ocen użytkowników).
  - **AI/Rekomendacje:** `/api/recommendations` (logika biznesowa sprawdzająca limity i wywołująca OpenRouter) oraz `/api/chat`.
  - **Health:** `/api/health` (monitoring stanu usług).

- **Warstwa Danych i Usług (`src/lib/services`):**
  - `MoviesService`: Integracja z TMDb API (wyszukiwanie, szczegóły).
  - `RatingsService`: Obsługa `upsert` dla ocen w bazie danych.
  - `RecommendationsService`: Skomplikowana logika walidacji limitów, parsowania odpowiedzi AI i obsługi błędów.
  - `OpenRouterService`: Klient do komunikacji z LLM.
  - **Baza Danych:** Supabase (PostgreSQL) - tabele `ratings`, `user_lists`, `ai_recommendation_requests`.

**2. Specyfika stosu technologicznego a strategia testowania:**

- **Astro & SSR:** Testy muszą uwzględniać, że część kodu wykonuje się na serwerze (np. weryfikacja sesji w `middleware/index.ts`), a część na kliencie (interakcje React). Testy E2E są tu kluczowe.
- **Supabase:** Konieczność mockowania klienta Supabase w testach jednostkowych lub użycia lokalnej instancji Supabase do testów integracyjnych. Ważne testowanie RLS (Row Level Security) – czy użytkownik widzi tylko swoje oceny.
- **Integracje zewnętrzne (TMDb, OpenRouter):** Testy nie mogą polegać na stabilności zewnętrznych API. Należy intensywnie stosować mockowanie (np. MSW - Mock Service Worker) oraz testować obsługę błędów (timeouty, limity zapytań, błędne dane z API).
- **AI (LLM):** Testowanie deterministyczne jest trudne. Należy skupić się na testowaniu _formatu_ odpowiedzi (schema validation zaimplementowana w `RecommendationsService`) oraz obsługi błędów, a nie samej "jakości" rekomendacji artystycznych.

**3. Priorytety testowe:**

1.  **Ścieżka Krytyczna (Core Loop):** Rejestracja -> Wyszukanie filmu -> Ocena -> Generowanie Rekomendacji. Bez tego aplikacja nie ma sensu.
2.  **Logika Biznesowa AI:** Mechanizm sprawdzania progu 10 ocen i limitu dziennego (5 zapytań). To kluczowy mechanizm "grywalizacji" i kontroli kosztów.
3.  **Bezpieczeństwo Danych:** Poprawność zapisu ocen (nadpisywanie vs tworzenie nowych - `upsert`) oraz izolacja danych użytkowników.
4.  **Obsługa Błędów Zewnętrznych:** Co się stanie, gdy TMDb padnie lub AI zwróci "śmieci". Kod zawiera mechanizm `findMovieByTitleAndYear` jako fallback – to wymaga dokładnych testów.

**4. Potencjalne obszary ryzyka:**

- **Halucynacje AI:** Kod w `api/recommendations.ts` próbuje naprawiać błędne ID z AI poprzez wyszukiwanie po tytule (`findMovieByTitleAndYear`). To ryzykowne miejsce (możliwość dopasowania złego filmu).
- **Limity API:** Przekroczenie limitów darmowych kluczy TMDb/OpenRouter może wyłożyć aplikację.
- **Stan sesji:** Middleware w `middleware/index.ts` zarządza sesją via cookies. Błędy tutaj odetną dostęp do aplikacji.
- **Race Conditions:** Szybkie klikanie w gwiazdki oceny (`MovieRating`) może prowadzić do niespójności, jeśli `Debounce` lub blokowanie UI nie zadziała poprawnie.

</analiza_projektu>

<plan_testów>

# Plan Testów Projektu "MyFilms"

## 1. Wprowadzenie

Niniejszy dokument stanowi kompleksowy plan testów dla aplikacji "MyFilms" – platformy służącej do oceniania filmów i generowania spersonalizowanych rekomendacji z wykorzystaniem AI.
Celem procesu testowego jest weryfikacja poprawności działania kluczowych funkcjonalności, stabilności integracji z zewnętrznymi API (TMDb, OpenRouter) oraz bezpieczeństwa danych użytkowników w środowisku Astro/React.

## 2. Zakres Testów

### 2.1 W Zakresie (In-Scope)

- **Moduł Autoryzacji:** Rejestracja, logowanie, odzyskiwanie hasła, zarządzanie sesją (middleware).
- **Moduł Filmów:** Wyszukiwanie (proxy TMDb), wyświetlanie szczegółów, obsługa błędów API.
- **Moduł Ocen:** Dodawanie i aktualizacja ocen (logika upsert), wyświetlanie historii ocen.
- **Moduł Rekomendacji AI:** Walidacja progów (min. 10 ocen), limitów dziennych, generowanie promptów, parsowanie odpowiedzi JSON, fallback dla błędnych ID.
- **Interfejs Użytkownika:** Responsywność (RWD), obsługa motywów (Dark/Light mode), walidacja formularzy.

### 2.2 Poza Zakresem (Out-of-Scope)

- Testy wydajnościowe zewnętrznych API (TMDb, OpenRouter).
- Testy penetracyjne infrastruktury hostingowej.
- Subiektywna ocena jakości artystycznej rekomendacji generowanych przez AI.

## 3. Strategia i Typy Testów

### 3.1 Testy Jednostkowe (Unit Tests)

Skupione na logice biznesowej i usługach backendowych.

- **Cel:** 80% pokrycia kodu dla katalogu `src/lib/services`.
- **Kluczowe obszary:**
  - `RatingsService`: Weryfikacja logiki `upsert` (czy poprawnie rozróżnia insert vs update).
  - `RecommendationsService`: Testowanie wyjątków (`InsufficientRatingsError`, `DailyLimitExceededError`, `AIResponseParsingError`) oraz sanityzacji promptów.
  - `MoviesService`: Parsowanie odpowiedzi z TMDb, obsługa błędów sieciowych.

### 3.2 Testy Integracyjne (Integration Tests)

Weryfikacja komunikacji między komponentami a API Routes oraz bazą danych.

- **Kluczowe obszary:**
  - Endpointy `/api/auth/*`: Poprawność komunikacji z Supabase Auth.
  - Endpoint `/api/recommendations`: Weryfikacja pełnego przepływu: Pobranie ocen -> Zapytanie do AI -> Weryfikacja filmów w TMDb (fallback logic).
  - Komponent `MovieSearch`: Sprawdzenie działania debounce i obsługi pustych wyników.

### 3.3 Testy End-to-End (E2E)

Symulacja zachowań użytkownika w przeglądarce.

- **Scenariusze:** Pełne ścieżki "Happy Path" oraz główne ścieżki błędów.

## 4. Scenariusze Testowe

### 4.1 Moduł Autoryzacji (`src/pages/api/auth/*`)

| ID      | Scenariusz                                                  | Oczekiwany rezultat                                                    | Priorytet |
| ------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- | --------- |
| AUTH-01 | Rejestracja nowego użytkownika z poprawnymi danymi          | Utworzenie konta, wysłanie e-maila weryfikacyjnego, komunikat sukcesu  | Wysoki    |
| AUTH-02 | Próba logowania nieistniejącym e-mailem                     | Błąd "Nieprawidłowe dane logowania" (bez zdradzania istnienia konta)   | Wysoki    |
| AUTH-03 | Reset hasła                                                 | Wysłanie linku, poprawna zmiana hasła w formularzu `PasswordResetForm` | Średni    |
| AUTH-04 | Dostęp do stron chronionych (`/`, `/api/ratings`) bez sesji | Przekierowanie do `/login` przez Middleware                            | Wysoki    |

### 4.2 Moduł Filmów i Ocen (`src/components/Movie*`, `api/ratings.ts`)

| ID     | Scenariusz                               | Oczekiwany rezultat                                       | Priorytet |
| ------ | ---------------------------------------- | --------------------------------------------------------- | --------- |
| MOV-01 | Wyszukiwanie filmu (query < 5 znaków)    | Brak zapytania do API, komunikat walidacji                | Średni    |
| MOV-02 | Wyszukiwanie filmu (brak wyników)        | Wyświetlenie komunikatu "Nie znaleziono filmów"           | Średni    |
| RAT-01 | Dodanie pierwszej oceny dla filmu        | Zapis w bazie, status 201 Created, aktualizacja UI        | Wysoki    |
| RAT-02 | Zmiana istniejącej oceny (np. z 5 na 8)  | Aktualizacja rekordu, status 200 OK, brak duplikatów w DB | Wysoki    |
| RAT-03 | Próba oceny spoza zakresu 1-10 (via API) | Błąd walidacji Zod (400 Bad Request) lub błąd DB (422)    | Średni    |

### 4.3 Moduł Rekomendacji AI (`src/lib/services/recommendations.service.ts`)

| ID    | Scenariusz                                 | Oczekiwany rezultat                                                                     | Priorytet |
| ----- | ------------------------------------------ | --------------------------------------------------------------------------------------- | --------- |
| AI-01 | Próba generowania przy < 10 ocenach        | Zablokowanie requestu, zwrot błędu `InsufficientRatingsError` (403), UI pokazuje postęp | Wysoki    |
| AI-02 | Generowanie rekomendacji (Happy Path)      | Zwrot 5 filmów z plakatami, zapis logu w `ai_recommendation_requests`                   | Wysoki    |
| AI-03 | Przekroczenie dziennego limitu (5 zapytań) | Błąd `DailyLimitExceededError` (429), UI wyświetla komunikat o limicie                  | Wysoki    |
| AI-04 | Błędne ID filmu zwrócone przez AI          | Uruchomienie `findMovieByTitleAndYear`, poprawne dopasowanie filmu po tytule i roku     | Średni    |
| AI-05 | Prompt Injection (HTML/SQL w prompcie)     | Sanityzacja wejścia w serwisie, brak wykonania kodu/zapytania                           | Wysoki    |

## 5. Środowisko Testowe i Dane

- **Środowisko Lokalne:**
  - Baza danych: Lokalna instancja Supabase (Docker) lub projekt deweloperski w chmurze.
  - API Mocking: `MSW` (Mock Service Worker) do symulowania odpowiedzi TMDb i OpenRouter (aby oszczędzać kredyty i wymuszać błędy).
  - Zmienne środowiskowe: `.env.test` z kluczami testowymi.

- **Środowisko Staging:**
  - Wierna kopia produkcji podpięta pod oddzielny projekt Supabase.
  - Rzeczywiste połączenia z API (z limitowanymi kluczami).

## 6. Narzędzia

- **Unit & Integration Testing:** `Vitest` (ze względu na ekosystem Vite/Astro).
- **E2E Testing:** `Playwright` (obsługa wielu kart, łatwe testowanie auth i cookies).
- **API Testing:** `Bruno` lub `Postman` (do manualnej weryfikacji endpointów).
- **Linting/Static Analysis:** `ESLint`, `Prettier`, `TypeScript` (strict mode).

## 7. Harmonogram Testów

1.  **Faza 1: Testy statyczne i jednostkowe (T-0 do T-2 dni)**
    - Konfiguracja CI/CD (Husky, Lint-staged).
    - Pokrycie serwisów (`lib/services`) testami jednostkowymi.
2.  **Faza 2: Testy integracyjne API (T-2 do T-4 dni)**
    - Weryfikacja endpointów Astro.
    - Testy bezpieczeństwa RLS w Supabase.
3.  **Faza 3: Testy E2E i UI (T-4 do T-5 dni)**
    - Implementacja scenariuszy krytycznych w Playwright.
    - Testy responsywności i motywów.
4.  **Faza 4: UAT i Bug Fixing (T-5 do Release)**

## 8. Kryteria Akceptacji (Exit Criteria)

- Brak błędów krytycznych (Critical) i wysokich (High) w Jira/Issue Tracker.
- Pokrycie kodu testami (Code Coverage): min. 80% dla logiki biznesowej (`src/lib`).
- Wszystkie testy E2E dla "Happy Path" przechodzą na środowisku Staging.
- Audyt dostępności (Lighthouse) z wynikiem > 90.
- Brak wycieków kluczy API w kodzie klienckim (weryfikacja `MoviesService` czy nie eksponuje klucza prywatnego - w tym projekcie klucz jest w klasie, która powinna działać po stronie serwera, ale należy upewnić się, że nie jest importowana do komponentów klienckich z `client:load` bez pośrednictwa API).

## 9. Procedura Raportowania Błędów

Zgłoszenia błędów powinny trafiać do systemu śledzenia (np. GitHub Issues) i zawierać:

1.  **Tytuł:** Zwięzły opis problemu (np. "AI zwraca błąd 500 przy prompcie z polskimi znakami").
2.  **Środowisko:** (Local/Staging, Przeglądarka, OS).
3.  **Kroki do reprodukcji:** Dokładna lista czynności.
4.  **Oczekiwany rezultat:** Co powinno się stać.
5.  **Rzeczywisty rezultat:** Co się stało (wraz ze screenshotem/logiem z konsoli).
6.  **Priorytetyzacja:**
    - _P0 (Critical):_ Blokuje główny proces (Logowanie, Ocenianie).
    - _P1 (High):_ Poważny błąd funkcjonalny (Brak zapisu oceny, błąd AI).
    - _P2 (Medium):_ Błąd UI/UX, literówki, błędy brzegowe.

## 10. Role i Odpowiedzialność

- **Inżynier QA:** Tworzenie planu, implementacja testów E2E, manualne testy eksploracyjne, weryfikacja poprawek.
- **Developer:** Pisanie testów jednostkowych dla swojego kodu, utrzymanie testów integracyjnych API, naprawa zgłoszonych błędów.
- **Tech Lead/Architect:** Przegląd strategii testowania, zatwierdzanie Release Candidate.
  </plan_testów>
