# Architektura UI dla MyFilms

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) aplikacji MyFilms została zaprojektowana w oparciu o framework Astro, z wykorzystaniem komponentów React do obsługi interaktywności. Centralnym elementem jest podejście "server-first", gdzie strony Astro (`.astro`) odpowiadają za pobieranie danych po stronie serwera (SSR) i renderowanie statycznego szkieletu, a komponenty React (`.tsx`) wzbogacają interfejs o dynamiczne funkcje po stronie klienta.

Aplikacja jest chroniona "ścianą uwierzytelniania" – dostęp do większości widoków wymaga zalogowania. Niezalogowani użytkownicy są automatycznie przekierowywani do formularza logowania. Stan aplikacji po stronie klienta, taki jak oceny i listy użytkownika, jest zarządzany globalnie przez `UserDataProvider` (React Context), co zapewnia spójność danych w czasie rzeczywistym bez konieczności przeładowywania strony. Nawigacja jest prosta i scentralizowana w stałym nagłówku, zapewniając łatwy dostęp do kluczowych funkcji.

## 2. Lista widoków

### 1. Strona logowania

- **Nazwa widoku:** Logowanie
- **Ścieżka widoku:** `/login`
- **Główny cel:** Uwierzytelnienie istniejącego użytkownika.
- **Kluczowe informacje do wyświetlenia:** Formularz z polami na e-mail i hasło, link do strony rejestracji.
- **Kluczowe komponenty widoku:** `LoginForm.tsx` (komponent React z logiką walidacji i obsługą stanu formularza).
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Wyraźne komunikaty o błędach (np. "Nieprawidłowy e-mail lub hasło") wyświetlane bez przeładowania strony. Stan ładowania na przycisku po wysłaniu formularza.
  - **Dostępność:** Pola formularza powiązane z etykietami (`<label>`), walidacja `aria-live` dla błędów.
  - **Bezpieczeństwo:** Komunikacja z API przez HTTPS. Endpoint API obsługuje logikę uwierzytelniania.

### 2. Strona rejestracji

- **Nazwa widoku:** Rejestracja
- **Ścieżka widoku:** `/register`
- **Główny cel:** Utworzenie nowego konta użytkownika.
- **Kluczowe informacje do wyświetlenia:** Formularz z polami na e-mail i hasło, link do strony logowania.
- **Kluczowe komponenty widoku:** `RegisterForm.tsx` (komponent React z logiką walidacji).
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Informacja zwrotna o zajętym adresie e-mail. Wymagania dotyczące hasła (jeśli istnieją) powinny być jasno określone.
  - **Dostępność:** Podobne standardy jak w formularzu logowania.
  - **Bezpieczeństwo:** Endpoint API zapobiega tworzeniu duplikatów kont.

### 3. Strona główna

- **Nazwa widoku:** Strona główna
- **Ścieżka widoku:** `/`
- **Główny cel:** Zapewnienie głównej funkcjonalności aplikacji w zależności od stanu użytkownika (onboarding lub generowanie rekomendacji).
- **Kluczowe informacje do wyświetlenia:**
  - **Widok Onboardingu (dla użytkowników z < 10 ocenami):** Komunikat powitalny, wyszukiwarka filmów.
  - **Widok Rekomendacji (dla użytkowników z >= 10 ocenami):** Przycisk do generowania rekomendacji, opcjonalne pole tekstowe (prompt), wyświetlone rekomendacje.
- **Kluczowe komponenty widoku:** `MovieSearch.tsx`, `RecommendationGenerator.tsx`, `MovieCard.tsx`.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Natychmiastowa informacja zwrotna podczas wyszukiwania. Szkielety (skeletons) podczas ładowania rekomendacji. Komunikat o osiągnięciu dziennego limitu rekomendacji.
  - **Dostępność:** Wyszukiwarka z odpowiednimi atrybutami ARIA. Rekomendacje przedstawione jako lista.
  - **Bezpieczeństwo:** Logika biznesowa (sprawdzanie liczby ocen, limitu zapytań) jest walidowana zarówno po stronie klienta (dla UX), jak i serwera (dla bezpieczeństwa).

### 4. Strona szczegółów filmu

- **Nazwa widoku:** Szczegóły filmu
- **Ścieżka widoku:** `/movie/[tmdb_id]`
- **Główny cel:** Wyświetlenie szczegółowych informacji o filmie i umożliwienie użytkownikowi interakcji (ocena, dodanie do list).
- **Kluczowe informacje do wyświetlenia:** Plakat, tytuł, rok produkcji, opis, aktualna ocena użytkownika, przyciski akcji.
- **Kluczowe komponenty widoku:** `RatingDialog.tsx`, `MovieActions.tsx` (zawierający przyciski "Ulubione" i "Do obejrzenia").
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Stan przycisków (np. "Dodaj do ulubionych" vs "Usuń z ulubionych") odzwierciedla aktualny stan z `UserDataProvider`.
  - **Dostępność:** Plakat filmu z tekstem alternatywnym (`alt`). Przyciski akcji z etykietami `aria-label`.
  - **Bezpieczeństwo:** Dane filmu pobierane przez serwerowy endpoint proxy, aby ukryć klucz API TMDb.

### 5. Moje listy

- **Nazwa widoku:** Moje listy
- **Ścieżka widoku:** `/my-lists`
- **Główny cel:** Przeglądanie filmów dodanych przez użytkownika do list "Ocenione", "Do obejrzenia" i "Ulubione".
- **Kluczowe informacje do wyświetlenia:** Siatka kafelków z filmami w obrębie zakładek.
- **Kluczowe komponenty widoku:** `MyListsTabs.tsx` (komponent React z zakładkami z `shadcn/ui`), `MovieCard.tsx`.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Płynne przełączanie między zakładkami bez przeładowania strony. Dane są pobierane raz przy ładowaniu strony i zarządzane przez `UserDataProvider`.
  - **Dostępność:** Zakładki zaimplementowane zgodnie ze standardami WAI-ARIA dla `Tabs`.
  - **Bezpieczeństwo:** Dane pobierane na serwerze w kontekście zalogowanego użytkownika.

## 3. Mapa podróży użytkownika

Główny przepływ użytkownika (odkrywanie i ocena filmu):

1.  **Logowanie:** Użytkownik wchodzi na stronę `/login`, podaje dane i zostaje przekierowany na stronę główną (`/`).
2.  **Onboarding:** Jeśli użytkownik ma mniej niż 10 ocen, widzi na stronie głównej wyszukiwarkę (`MovieSearch.tsx`) z zachętą do oceniania filmów.
3.  **Wyszukiwanie:** Użytkownik wpisuje tytuł filmu. Aplikacja na bieżąco wysyła zapytania do `GET /api/movies/search` i wyświetla wyniki jako siatkę komponentów `MovieCard.tsx`.
4.  **Interakcja z kartą filmu:** Użytkownik najeżdża na kartę filmu, co odsłania przyciski akcji.
5.  **Ocena filmu:** Użytkownik klika przycisk "Oceń". Otwiera się modal (`RatingDialog.tsx`), gdzie wybiera ocenę od 1 do 10. Po zatwierdzeniu, zapytanie `POST /api/ratings` jest wysyłane, a `UserDataProvider` aktualizuje stan. Film pojawia się na liście "Ocenione".
6.  **Przejście do szczegółów:** Alternatywnie, użytkownik klika na kafelek filmu, co przenosi go na stronę `/movie/[tmdb_id]`.
7.  **Interakcja na stronie szczegółów:** Na tej stronie użytkownik może również ocenić film, dodać go do listy "Do obejrzenia" (`POST /api/lists`) lub "Ulubione" (`POST /api/lists`). Każda akcja aktualizuje globalny stan.
8.  **Powrót i kontynuacja:** Użytkownik wraca na stronę główną. Proces powtarza się, aż użytkownik oceni 10 filmów.
9.  **Odblokowanie rekomendacji:** Po 10. ocenie strona główna automatycznie przełącza się na widok `RecommendationGenerator.tsx`.
10. **Generowanie rekomendacji:** Użytkownik klika "Zaproponuj coś dla mnie", co wywołuje `POST /api/recommendations`. Po chwili ładowania (wskazywanej przez szkielety) wyświetla się 5 nowych propozycji filmowych.

## 4. Układ i struktura nawigacji

- **Globalny układ (`Layout.astro`):** Definiuje podstawową strukturę HTML każdej strony, w tym sekcje `<head>`, `<body>` oraz osadza globalne komponenty.
- **Dostawca danych (`UserDataProvider`):** Obejmuje całą aplikację, dostarczając dane o ocenach i listach do wszystkich komponentów React.
- **Dostawca powiadomień (`ToastProvider`):** Również globalny, umożliwia wyświetlanie powiadomień (toastów) z dowolnego miejsca w aplikacji.
- **Nawigacja główna (`Header.astro`):**
  - Jest to stały komponent obecny na wszystkich stronach (poza `/login` i `/register`).
  - Zawiera:
    - Logo aplikacji (link do strony głównej `/`).
    - Link do strony "Moje listy" (`/my-lists`).
    - Przycisk "Wyloguj", który przekierowuje na `GET /api/auth/logout`.

## 5. Kluczowe komponenty

- **`MovieCard.tsx`:** Reużywalny komponent wyświetlający plakat i tytuł filmu. Przyjmuje propsy `isFavorite`, `isWatchlisted`, `rating` do odzwierciedlenia stanu użytkownika. Zawiera przyciski akcji (Oceń, Ulubione, Do obejrzenia), które wywołują odpowiednie funkcje z `UserDataProvider`.
- **`MovieSearch.tsx`:** Komponent z polem `input` do wyszukiwania filmów. Zarządza stanem zapytania, komunikuje się z API (`/api/movies/search`) i wyświetla wyniki w formie siatki `MovieCard`.
- **`RecommendationGenerator.tsx`:** Komponent zarządzający procesem generowania rekomendacji. Obsługuje stany: początkowy (przed generowaniem), ładowania (wyświetla szkielety), sukcesu (wyświetla `MovieCard` z rekomendacjami) i błędu (wyświetla toast).
- **`RatingDialog.tsx`:** Modal (okno dialogowe) do wystawiania i edytowania ocen (1-10). Wywoływany z `MovieCard` lub strony szczegółów filmu.
- **`MyListsTabs.tsx`:** Komponent renderujący zakładki ("Ocenione", "Do obejrzenia", "Ulubione") i wyświetlający odpowiednią listę filmów dla aktywnej zakładki.
- **`Header.astro`:** Statyczny komponent nawigacyjny z linkami i przyciskiem wylogowania.
- **`UserDataProvider.tsx`:** Globalny dostawca kontekstu React, który przechowuje stan list i ocen użytkownika oraz udostępnia metody do ich modyfikacji (np. `addFavorite`, `rateMovie`).
