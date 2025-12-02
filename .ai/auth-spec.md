# Specyfikacja Techniczna: Moduł Autentykacji Użytkowników

## 1. Przegląd

Niniejszy dokument opisuje architekturę i implementację modułu rejestracji, logowania, wylogowywania i odzyskiwania hasła dla aplikacji MyFilms. Rozwiązanie opiera się na wymaganiach zdefiniowanych w PRD (US-001, US-002, US-012, US-013) oraz na stosie technologicznym projektu (Astro, React, Supabase).

## 2. Architektura Interfejsu Użytkownika (Frontend)

### 2.1. Nowe Strony (Astro)

Zostaną utworzone następujące strony w katalogu `src/pages/`:

-   `src/pages/login.astro`: Strona publiczna, dostępna dla niezalogowanych użytkowników. Będzie zawierać komponent `LoginForm`. W przypadku, gdy zalogowany użytkownik spróbuje na nią wejść, zostanie przekierowany na stronę główną (`/`).
-   `src/pages/register.astro`: Strona publiczna, zawierająca komponent `RegisterForm`. Działa analogicznie do strony logowania.
-   `src/pages/password-recovery.astro`: Strona publiczna z komponentem `PasswordRecoveryForm`, umożliwiająca zainicjowanie procesu resetowania hasła.
-   `src/pages/auth/callback.astro`: Endpoint po stronie serwera, który będzie obsługiwał callbacki od Supabase (np. po potwierdzeniu rejestracji przez e-mail) w celu sfinalizowania sesji.

### 2.2. Nowe i Zmodyfikowane Komponenty

#### Komponenty React (`src/components/`)

-   `src/components/LoginForm.tsx`:
    -   **Odpowiedzialność**: Formularz z polami "E-mail" i "Hasło". Zarządza stanem pól, walidacją po stronie klienta (np. format e-maila, niepuste pola) i obsługą wysyłki.
    -   **Interakcja**: Po przesłaniu formularza, wysyła żądanie `POST` do endpointu `/api/auth/login`. Obsługuje stany `loading` (blokując przycisk) oraz wyświetla komunikaty o błędach zwrócone przez API.
    -   **Walidacja**: Wyświetla błędy walidacji pod odpowiednimi polami (np. "Adres e-mail jest nieprawidłowy").

-   `src/components/RegisterForm.tsx`:
    -   **Odpowiedzialność**: Formularz z polami "E-mail" i "Hasło". Działa analogicznie do `LoginForm`.
    -   **Interakcja**: Wysyła żądanie `POST` do `/api/auth/register`. Po pomyślnej rejestracji może wyświetlić komunikat (np. "Sprawdź e-mail, aby potwierdzić rejestrację") lub przekierować użytkownika.

-   `src/components/PasswordRecoveryForm.tsx`:
    -   **Odpowiedzialność**: Formularz z polem "E-mail".
    -   **Interakcja**: Wysyła żądanie `POST` do `/api/auth/password-recovery`. Wyświetla komunikat o powodzeniu (np. "Jeśli konto istnieje, wysłaliśmy instrukcje na podany adres") lub o błędzie.

-   `src/components/UserMenu.tsx`:
    -   **Odpowiedzialność**: Komponent wyświetlany w nagłówku, gdy użytkownik jest zalogowany. Pokazuje awatar/inicjały użytkownika.
    -   **Interakcja**: Zawiera przycisk/link do wylogowania, który wykonuje żądanie `POST` do `/api/auth/logout`.

#### Komponenty Astro (`src/layouts/`, `src/components/`)

-   `src/layouts/Layout.astro`:
    -   **Modyfikacja**: Layout zostanie zaktualizowany, aby warunkowo renderować komponenty w zależności od stanu zalogowania użytkownika.
    -   **Logika**: Sprawdzi `Astro.locals.user`. Jeśli użytkownik jest zalogowany, w nagłówku zostanie wyświetlony komponent `UserMenu`. W przeciwnym razie, wyświetlony zostanie przycisk/link "Zaloguj się", prowadzący do `/login`.

### 2.3. Scenariusze Użytkownika

-   **Logowanie**: Użytkownik wchodzi na `/login`, wypełnia formularz, klika "Zaloguj". Komponent `LoginForm` wysyła dane do API. Po pomyślnej odpowiedzi, strona jest przeładowywana i użytkownik jest przekierowywany na stronę główną jako zalogowany.
-   **Błędne Logowanie**: Jeśli API zwróci błąd (np. "Nieprawidłowe dane logowania"), `LoginForm` wyświetli go pod formularzem.
-   **Dostęp do Zasobu Chronionego**: Niezalogowany użytkownik próbuje wejść na `/movie/123`. Middleware Astro przechwytuje żądanie i przekierowuje go na `/login`.
-   **Wylogowanie**: Zalogowany użytkownik klika "Wyloguj" w `UserMenu`. Wykonywane jest żądanie do API wylogowania, sesja jest usuwana, a użytkownik jest przekierowywany na `/login`.

## 3. Logika Backendowa

### 3.1. Endpointy API (Astro)

Zostaną utworzone nowe endpointy w `src/pages/api/auth/`:

-   `src/pages/api/auth/login.ts`:
    -   **Metoda**: `POST`
    -   **Walidacja**: Użyje `zod` do walidacji ciała żądania (oczekuje `email` i `password`).
    -   **Logika**: Wywoła `supabase.auth.signInWithPassword()`. W przypadku sukcesu, ustawi odpowiednie ciasteczka sesji i zwróci status 200. W przypadku błędu, zwróci odpowiedni status (np. 401) i komunikat błędu.
    -   **Prerender**: `export const prerender = false;`

-   `src/pages/api/auth/register.ts`:
    -   **Metoda**: `POST`
    -   **Walidacja**: `zod` dla `email` i `password`.
    -   **Logika**: Wywoła `supabase.auth.signUp()`. Obsłuży przypadki, gdy użytkownik już istnieje.
    -   **Prerender**: `export const prerender = false;`

-   `src/pages/api/auth/logout.ts`:
    -   **Metoda**: `POST`
    -   **Logika**: Wywoła `supabase.auth.signOut()`. Usunie ciasteczka sesji i przekieruje użytkownika na stronę logowania (`/login`).
    -   **Prerender**: `export const prerender = false;`

-   `src/pages/api/auth/password-recovery.ts`:
    -   **Metoda**: `POST`
    -   **Walidacja**: `zod` dla `email`.
    -   **Logika**: Wywoła `supabase.auth.resetPasswordForEmail()`. Zawsze zwróci odpowiedź 200, aby uniemożliwić enumerację użytkowników.
    -   **Prerender**: `export const prerender = false;`

### 3.2. Middleware

Plik `src/middleware/index.ts` będzie kluczowym elementem systemu:

-   **Logika**:
    1.  Na początku każdego żądania, middleware utworzy serwerowego klienta Supabase.
    2.  Pobierze sesję na podstawie ciasteczek z żądania.
    3.  Jeśli sesja jest ważna, zapisze dane użytkownika i sesję w `context.locals.user` i `context.locals.session`.
    4.  Sprawdzi ścieżkę żądania:
        -   Jeśli użytkownik **nie jest** zalogowany i próbuje uzyskać dostęp do chronionej ścieżki (np. `/`, `/movie/*`), zostanie przekierowany na `/login`.
        -   Jeśli użytkownik **jest** zalogowany i próbuje uzyskać dostęp do stron publicznych (np. `/login`, `/register`), zostanie przekierowany na `/`.
    5.  Przekaże żądanie dalej za pomocą `next()`.

## 4. System Autentykacji (Supabase + Astro)

### 4.1. Konfiguracja Supabase

-   **Klient Supabase**: Klient Supabase (`supabase.client.ts`) będzie skonfigurowany do odczytywania i zapisywania sesji w ciasteczkach. Użyjemy `createServerClient` z `@supabase/ssr` w middleware i endpointach API, aby zapewnić bezpieczną obsługę sesji po stronie serwera.
-   **Szablony E-mail**: W panelu Supabase zostaną skonfigurowane szablony e-mail dla potwierdzenia rejestracji i odzyskiwania hasła, aby zawierały linki zwrotne do naszej aplikacji (np. do `https://<twoja-domena>/auth/callback`).

### 4.2. Przepływ Danych

1.  **Użytkownik -> Formularz React**: Użytkownik wprowadza dane.
2.  **Formularz React -> API Astro**: Komponent wysyła żądanie `fetch` do endpointu API (np. `/api/auth/login`).
3.  **API Astro -> Supabase**: Endpoint API, używając serwerowego klienta Supabase, komunikuje się z Supabase Auth.
4.  **Supabase -> API Astro**: Supabase zwraca wynik operacji.
5.  **API Astro -> Middleware**: Endpoint ustawia ciasteczka sesji w odpowiedzi.
6.  **Middleware -> Strona Astro**: Przy kolejnym żądaniu, middleware odczytuje ciasteczka, weryfikuje sesję i udostępnia dane użytkownika przez `Astro.locals`.
7.  **Strona Astro -> Przeglądarka**: Strona jest renderowana na serwerze z odpowiednimi danymi (np. widocznym `UserMenu`).

