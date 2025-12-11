# Architektura UI dla MyFilms (ZAKTUALIZOWANY - 2025-11-28)

> ✅ **STATUS**: Częściowo zaimplementowany z istotnymi zmianami względem pierwotnego planu

## Wprowadzenie do aktualizacji

Ten dokument został zaktualizowany, aby odzwierciedlić rzeczywistą implementację UI, która różni się od pierwotnego planu w kilku kluczowych aspektach:

### Główne zmiany:

1. **Strona główna**: Jeden komponent `MainView.tsx` zamiast dwóch osobnych widoków
2. **Wyszukiwarka**: Zawsze dostępna (nie znika po 10 ocenach)
3. **Ocenianie**: Komponent `MovieRating.tsx` z gwiazdkami zamiast `RatingDialog.tsx`
4. **Integracja**: Bezpośrednie ocenianie z wyników wyszukiwania
5. **GET endpoint**: Dodany `/api/ratings` do pobierania ocen użytkownika

---

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) aplikacji MyFilms została zaprojektowana w oparciu o framework **Astro 5**, z wykorzystaniem komponentów **React 19** do obsługi interaktywności. Centralnym elementem jest podejście "server-first", gdzie strony Astro (`.astro`) odpowiadają za pobieranie danych po stronie serwera (SSR) i renderowanie statycznego szkieletu, a komponenty React (`.tsx`) wzbogacają interfejs o dynamiczne funkcje po stronie klienta.

### Kluczowe założenia:

- **Autentykacja**: Obecnie używany `DEFAULT_USER_ID` z `.env` (do zastąpienia prawdziwym uwierzytelnianiem)
- **Zarządzanie stanem**: Mieszane - server-side (Astro) + client-side (React useState)
- **Interaktywność**: React komponenty z dyrektywą `client:load`
- **Stylowanie**: Tailwind CSS 4 + Shadcn/ui komponenty

---

## 2. Lista widoków

### 1. Strona logowania ⚠️ NIE ZAIMPLEMENTOWANA

- **Nazwa widoku:** Logowanie
- **Ścieżka widoku:** `/login`
- **Status:** Planowana (obecnie używany DEFAULT_USER_ID)
- **Główny cel:** Uwierzytelnienie istniejącego użytkownika
- **Kluczowe komponenty widoku:** `LoginForm.tsx` (do zaimplementowania)

### 2. Strona rejestracji ⚠️ NIE ZAIMPLEMENTOWANA

- **Nazwa widoku:** Rejestracja
- **Ścieżka widoku:** `/register`
- **Status:** Planowana
- **Główny cel:** Utworzenie nowego konta użytkownika
- **Kluczowe komponenty widoku:** `RegisterForm.tsx` (do zaimplementowania)

### 3. Strona główna ✅ ZAIMPLEMENTOWANA (Z MODYFIKACJAMI)

- **Nazwa widoku:** Strona główna
- **Ścieżka widoku:** `/`
- **Plik:** `src/pages/index.astro`
- **Główny cel:** Zapewnienie głównej funkcjonalności aplikacji - wyszukiwanie i ocenianie filmów oraz (po 10 ocenach) generowanie rekomendacji

#### Kluczowe zmiany względem pierwotnego planu:

| Aspekt           | Pierwotny plan                               | Obecna implementacja                    |
| ---------------- | -------------------------------------------- | --------------------------------------- |
| **Struktura**    | 2 osobne widoki (Onboarding/Recommendations) | 1 komponent MainView z sekcjami         |
| **Wyszukiwarka** | Znika po 10 ocenach                          | Zawsze widoczna                         |
| **Rekomendacje** | Zastępują wyszukiwarkę                       | Dodatkowa sekcja pod wyszukiwarką       |
| **Ocenianie**    | Tylko na stronie filmu                       | W wynikach wyszukiwania + stronie filmu |
| **UI ocen**      | RatingDialog z cyframi                       | MovieRating z gwiazdkami                |

#### Kluczowe informacje do wyświetlenia:

**Sekcja Header (dynamiczna):**

- Przed 10 ocenami: "Witaj, {username}!" + progress bar (X/10)
- Po 10 ocenach: "Witaj ponownie, {username}!" + liczba ocen

**Sekcja Search (zawsze widoczna):**

- Ikona Search + nagłówek "Wyszukaj filmy"
- Komponent `MovieSearch.tsx`
- Wyniki jako siatka `MovieCard` z możliwością oceniania

**Sekcja Recommendations (≥10 ocen):**

- Ikona Sparkles + nagłówek "Rekomendacje AI"
- Badge "Nowe!" (gdy dokładnie 10 ocen)
- `RecommendationGenerator.tsx`
- Lista rekomendacji jako siatka `MovieCard`

#### Kluczowe komponenty widoku:

- `MainView.tsx` ✅ NOWY
- `MovieSearch.tsx` ✅
- `RecommendationGenerator.tsx` ✅
- `MovieCard.tsx` ✅ ROZSZERZONY
- `MovieRating.tsx` ✅ NOWY

#### UX, dostępność i względy bezpieczeństwa:

- **UX:**
  - Natychmiastowa informacja zwrotna podczas wyszukiwania
  - Progress bar pokazuje postęp do odblokowania rekomendacji
  - Szkielety podczas ładowania rekomendacji
  - Komunikat o osiągnięciu dziennego limitu rekomendacji
  - Smooth transitions na progress bar
  - Hover effects na gwiazdkach
  - Badge "Nowe!" przy pierwszym odblokowaniu rekomendacji

- **Dostępność:**
  - Wyszukiwarka z odpowiednimi atrybutami ARIA
  - Rekomendacje przedstawione jako lista
  - Ikony Lucide z opisowymi klasami

- **Bezpieczeństwo:**
  - Logika biznesowa walidowana po stronie serwera
  - RLS w Supabase chroni dane użytkownika
  - GET /api/ratings zwraca tylko oceny zalogowanego użytkownika

### 4. Strona szczegółów filmu ✅ ZAIMPLEMENTOWANA

- **Nazwa widoku:** Szczegóły filmu
- **Ścieżka widoku:** `/movie/[tmdb_id]`
- **Plik:** `src/pages/movie/[tmdb_id].astro`
- **Główny cel:** Wyświetlenie szczegółowych informacji o filmie i umożliwienie interakcji

#### Kluczowe informacje do wyświetlenia:

- Plakat filmu (backdrop lub poster)
- Tytuł, rok produkcji, gatunek
- Opis (overview)
- Ocena użytkownika (jeśli istnieje)
- Przyciski akcji

#### Kluczowe komponenty widoku:

- `MovieRating.tsx` ✅ (zamiast RatingDialog)
- Przyciski "Dodaj do listy" ⚠️ (nieaktywne)

#### Zmiany względem planu:

- Używa `MovieRating.tsx` zamiast `RatingDialog.tsx`
- Ten sam komponent oceniania jak na stronie głównej
- Spójne UX w całej aplikacji

### 5. Moje listy ⚠️ NIE ZAIMPLEMENTOWANA

- **Nazwa widoku:** Moje listy
- **Ścieżka widoku:** `/my-lists`
- **Status:** Planowana
- **Kluczowe komponenty widoku:** `MyListsTabs.tsx` (do zaimplementowania)

---

## 3. Mapa podróży użytkownika (ZAKTUALIZOWANA)

### Scenariusz 1: Nowy użytkownik (< 10 ocen)

1. **Start:** Użytkownik wchodzi na `/` (strona główna)
2. **Widzi:**
   - Header: "Witaj, Użytkowniku!"
   - Progress bar: "0/10"
   - Sekcja Search z wyszukiwarką
3. **Wyszukuje film:** Wpisuje tytuł w `MovieSearch.tsx`
4. **Widzi wyniki:** Siatka `MovieCard` z plakatami
5. **Ocenia film:**
   - Klika przycisk "Oceń film" w `MovieCard`
   - Otwiera się dialog z 10 gwiazdkami
   - Wybiera ocenę (hover pokazuje podgląd)
   - Klika "Zapisz ocenę"
   - Przycisk zmienia się na "Twoja ocena: X/10"
   - Progress bar aktualizuje się: "1/10"
6. **Powtarza:** Wyszukuje i ocenia kolejne filmy
7. **Po 10. ocenie:**
   - Progress bar znika
   - Pojawia się sekcja "Rekomendacje AI" z badge "Nowe!"
   - Wyszukiwarka nadal dostępna na górze

### Scenariusz 2: Doświadczony użytkownik (≥ 10 ocen)

1. **Start:** Użytkownik wchodzi na `/`
2. **Widzi:**
   - Header: "Witaj ponownie, Użytkowniku!"
   - "Masz już 15 ocenionych filmów"
   - Sekcja Search (zawsze dostępna)
   - Sekcja Recommendations
3. **Ma dwie opcje:**

   **Opcja A: Wyszukiwanie**
   - Używa wyszukiwarki jak wcześniej
   - Może oceniać nowe filmy
   - Liczba ocen rośnie

   **Opcja B: Rekomendacje**
   - Klika "Zaproponuj coś dla mnie"
   - Opcjonalnie wpisuje prompt tekstowy
   - Widzi szkielety ładowania
   - Otrzymuje 5 rekomendacji AI
   - Może ocenić rekomendowane filmy

### Scenariusz 3: Szczegóły filmu

1. **Z dowolnego miejsca:** Użytkownik klika "Szczegóły" w `MovieCard`
2. **Przechodzi do:** `/movie/[tmdb_id]`
3. **Widzi:** Pełne informacje o filmie
4. **Może:**
   - Ocenić film (ten sam `MovieRating.tsx`)
   - Kliknąć "Dodaj do listy" (planowane)
5. **Wraca:** Na poprzednią stronę

---

## 4. Układ i struktura nawigacji

### Globalny układ (`Layout.astro`)

```astro
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>{title}</title>
    <!-- Meta tags, fonts, etc. -->
  </head>
  <body>
    <ThemeProvider>
      {/* Header, jeśli nie login/register */}
      <main>
        <slot />
      </main>
    </ThemeProvider>
  </body>
</html>
```

### Nawigacja główna (`Header` - planowany)

⚠️ Obecnie brak dedykowanego komponentu nawigacyjnego. Do zaimplementowania:

- Logo aplikacji (link do `/`)
- Link do "Moje listy" (`/my-lists`)
- Przycisk "Wyloguj" (po dodaniu autentykacji)
- `ThemeToggle.tsx` do przełączania dark/light mode

---

## 5. Kluczowe komponenty

### ✅ Zaimplementowane

#### `MainView.tsx` ✅ NOWY

**Lokalizacja:** `src/components/MainView.tsx`

**Props:**

```typescript
export type MainViewProps = {
  username: string;
  ratingsCount: number;
  ratingsThreshold: number; // 10
  recommendationsLimit: number; // 5
};
```

**Funkcjonalność:**

- Renderuje Header z dynamicznym powitaniem
- Progress bar (< 10 ocen)
- Sekcję Search (zawsze widoczna)
- Sekcję Recommendations (≥ 10 ocen)
- Zarządza stanem rekomendacji

**Kluczowy kod:**

```typescript
const hasUnlockedRecommendations = ratingsCount >= ratingsThreshold;

return (
  <div>
    {/* Header z progress bar */}
    {/* Search Section - ZAWSZE */}
    {hasUnlockedRecommendations && (
      {/* Recommendations Section */}
    )}
  </div>
);
```

#### `MovieCard.tsx` ✅ ROZSZERZONY

**Lokalizacja:** `src/components/MovieCard.tsx`

**Nowe elementy:**

- `CardFooter` z akcjami
- `MovieRating.tsx` komponent
- Przycisk "Szczegóły" (link do `/movie/:id`)
- Przycisk "Lista" (nieaktywny)

**Props:**

```typescript
type MovieCardProps = {
  tmdb_id: number;
  title: string;
  posterPath?: string | null;
  releaseDate?: string;
  year?: number;
};
```

**Struktura:**

```tsx
<Card>
  <a href={`/movie/${tmdb_id}`}>{/* Plakat + Tytuł */}</a>

  <CardFooter>
    <MovieRating tmdbId={tmdb_id} movieTitle={title} />
    <div className="flex gap-2">
      <Button>Szczegóły</Button>
      <Button>Lista</Button>
    </div>
  </CardFooter>
</Card>
```

#### `MovieRating.tsx` ✅ NOWY (zastępuje RatingDialog)

**Lokalizacja:** `src/components/MovieRating.tsx`

**Kluczowe funkcjonalności:**

- 10 gwiazdek w jednym rzędzie
- Wypełnione gwiazdki (żółte) dla oceny
- Puste gwiazdki (szare) dla niewybranych
- Hover effect pokazujący podgląd
- Dialog (Shadcn/ui) do wyboru oceny
- Automatyczne pobieranie istniejącej oceny (GET /api/ratings)
- Zapisywanie oceny (POST /api/ratings)
- Dynamiczny tekst przycisku

**Props:**

```typescript
type MovieRatingProps = {
  tmdbId: number;
  movieTitle: string;
};
```

**Stan:**

```typescript
const [selectedRating, setSelectedRating] = useState<number | null>(null);
const [currentRating, setCurrentRating] = useState<number | null>(null);
const [hoveredRating, setHoveredRating] = useState<number | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Użycie:**

```tsx
<MovieRating tmdbId={550} movieTitle="Fight Club" />
```

#### `MovieSearch.tsx` ✅

**Lokalizacja:** `src/components/MovieSearch.tsx`

**Funkcjonalność:**

- Pole input z debouncing
- Wywołuje GET `/api/movies/search?query={query}`
- Wyświetla wyniki jako siatkę `MovieCard`
- Szkielety podczas ładowania
- Komunikat "Brak wyników"

**Pozostaje bez zmian względem pierwotnego planu.**

#### `RecommendationGenerator.tsx` ✅

**Lokalizacja:** `src/components/RecommendationGenerator.tsx`

**Funkcjonalność:**

- Przycisk "Zaproponuj coś dla mnie"
- Opcjonalne pole textarea (prompt)
- Wywołuje POST `/api/recommendations`
- Callback `onRecommendationsGenerated`
- Obsługa limitu dziennego

**Pozostaje bez zmian względem pierwotnego planu.**

#### `ThemeToggle.tsx` ✅ NOWY

**Lokalizacja:** `src/components/ThemeToggle.tsx`

**Funkcjonalność:**

- Przełączanie między light/dark mode
- Ikony Sun/Moon z Lucide
- Używa `useTheme` hook

### ⚠️ Planowane (nie zaimplementowane)

#### `LoginForm.tsx` 🔲

- Formularz logowania
- Walidacja po stronie klienta
- Wywołanie POST `/api/auth/login`

#### `RegisterForm.tsx` 🔲

- Formularz rejestracji
- Walidacja hasła
- Wywołanie POST `/api/auth/register`

#### `MyListsTabs.tsx` 🔲

- Zakładki: Ocenione, Do obejrzenia, Ulubione
- Wykorzystanie Shadcn/ui Tabs
- Wyświetlanie filmów z każdej listy

#### `Header.astro` 🔲

- Nawigacja główna
- Logo + linki
- Przycisk wylogowania

#### `UserDataProvider.tsx` 🔲 (z pierwotnego planu)

- Globalny kontekst React
- Zarządzanie stanem ocen i list
- Funkcje: `addFavorite`, `rateMovie`, etc.

**Uwaga:** Obecnie stan jest zarządzany lokalnie w komponentach, nie globalnie.

---

## 6. Endpointy API wykorzystywane przez UI

### ✅ Zaimplementowane

#### GET `/api/movies/search`

- Wyszukiwanie filmów w TMDb
- Query param: `?query=fight+club`
- Zwraca: `{ results: MovieDto[] }`
- Używany przez: `MovieSearch.tsx`

#### POST `/api/ratings`

- Dodawanie/aktualizacja oceny
- Body: `{ tmdb_id: number, rating: number }`
- Zwraca: `{ data: RatingDto }`
- Status: 201 (created) lub 200 (updated)
- Używany przez: `MovieRating.tsx`

#### GET `/api/ratings` ✅ NOWY

- Pobieranie wszystkich ocen użytkownika
- Zwraca: `{ data: RatingDto[], count: number }`
- Sortowanie: `updated_at DESC`
- Używany przez: `MovieRating.tsx` (sprawdzanie istniejącej oceny)

#### POST `/api/recommendations`

- Generowanie rekomendacji AI
- Body: `{ prompt?: string }`
- Zwraca: `{ recommendations: RecommendationDto[] }`
- Używany przez: `RecommendationGenerator.tsx`

### ⚠️ Planowane

#### POST `/api/auth/login` 🔲

- Logowanie użytkownika
- Body: `{ email: string, password: string }`

#### POST `/api/auth/register` 🔲

- Rejestracja użytkownika
- Body: `{ email: string, password: string }`

#### GET `/api/auth/logout` 🔲

- Wylogowanie użytkownika

#### POST `/api/lists` 🔲

- Dodawanie filmu do listy
- Body: `{ tmdb_id: number, list_type: string }`

#### DELETE `/api/lists` 🔲

- Usuwanie filmu z listy
- Body: `{ tmdb_id: number, list_type: string }`

---

## 7. Zarządzanie stanem

### Server-side (Astro pages)

**Strona główna (`index.astro`):**

```typescript
const { data: ratings } = await Astro.locals.supabase.from("ratings").select("tmdb_id").eq("user_id", defaultUserId);

const ratingsCount = ratings?.length ?? 0;
```

Przekazywane jako props do `MainView.tsx`.

**Strona filmu (`movie/[tmdb_id].astro`):**

```typescript
const movieResponse = await fetch(`https://api.themoviedb.org/3/movie/${tmdb_id}?api_key=${apiKey}`);
const movie = await movieResponse.json();
```

### Client-side (React components)

**MainView.tsx:**

```typescript
const [recommendations, setRecommendations] = useState<RecommendationDto[]>([]);
const [recommendationsUsed, setRecommendationsUsed] = useState<number>(0);
```

**MovieRating.tsx:**

```typescript
const [selectedRating, setSelectedRating] = useState<number | null>(null);
const [currentRating, setCurrentRating] = useState<number | null>(null);
const [hoveredRating, setHoveredRating] = useState<number | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**MovieSearch.tsx:**

```typescript
const [query, setQuery] = useState("");
const [results, setResults] = useState<MovieDto[]>([]);
const [isLoading, setIsLoading] = useState(false);
```

### Różnice względem pierwotnego planu:

| Aspekt           | Pierwotny plan                   | Obecna implementacja                       |
| ---------------- | -------------------------------- | ------------------------------------------ |
| **Global state** | UserDataProvider (React Context) | Brak - stan lokalny w komponentach         |
| **Oceny**        | Zarządzane globalnie             | Pobierane per-component (GET /api/ratings) |
| **Listy**        | Zarządzane globalnie             | Nie zaimplementowane                       |
| **Toast**        | ToastProvider                    | Nie zaimplementowane                       |

**Zalecenie:** Rozważyć dodanie globalnego stanu dla lepszej synchronizacji między komponentami.

---

## 8. Stylowanie i design system

### Tailwind CSS 4

- Utility-first CSS framework
- Konfiguracja w `tailwind.config.ts`
- Custom kolory, spacing, typography

### Shadcn/ui

**Zainstalowane komponenty:**

- `Button` ✅
- `Card` (+ CardHeader, CardTitle, CardDescription, CardFooter) ✅
- `Dialog` (+ DialogTrigger, DialogContent, DialogHeader, DialogTitle) ✅
- `Textarea` ✅
- `Skeleton` ✅
- `Avatar` ✅

**Planowane:**

- `Tabs` (dla MyListsTabs)
- `Toast` (dla powiadomień)
- `Input` (dla formularzy)
- `Label` (dla formularzy)

### Ikony

- **Lucide React** ✅
- Używane: `Search`, `Sparkles`, `Star`, `Info`, `ListPlus`, `Sun`, `Moon`

### Responsywność

- Mobile-first approach
- Breakpoints: `sm:`, `md:`, `lg:`
- Siatki: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5`

---

## 9. Dostępność (a11y)

### Zaimplementowane praktyki:

- Semantyczny HTML (`<main>`, `<section>`, `<header>`)
- Alt text na obrazkach plakatów
- Aria labels na interaktywnych elementach
- Keyboard navigation w dialogach (Shadcn/ui)
- Focus states na przyciskach i linkach

### Do poprawy:

- Dodać `aria-live` dla dynamicznych aktualizacji
- Lepsze zarządzanie focusem po zamknięciu dialogu
- Skip links dla nawigacji klawiszowej
- Screen reader announcements dla powiadomień

---

## 10. Wydajność

### Obecne optymalizacje:

- Server-side rendering (Astro)
- Client-side hydration tylko dla interaktywnych komponentów (`client:load`)
- Lazy loading obrazków (`loading="lazy"`)
- Debouncing w wyszukiwarce

### Do dodania:

- Image optimization (Astro Image)
- Code splitting (automatic z Astro)
- Caching (GET /api/ratings)
- Virtualizacja dla długich list

---

## 11. Podsumowanie zmian

### Co się zmieniło względem pierwotnego planu:

✅ **Pozytywne zmiany:**

1. **MainView zamiast dwóch widoków** - lepsza architektura, mniej kodu
2. **Wyszukiwarka zawsze dostępna** - lepszy UX
3. **MovieRating w wynikach** - szybsze ocenianie
4. **Gwiazdki zamiast cyfr** - bardziej intuicyjne
5. **Progress bar** - gamifikacja, motywacja
6. **GET /api/ratings** - spójność danych

⚠️ **Brakujące elementy:**

1. Autentykacja (login/register)
2. Nawigacja (Header)
3. Moje listy (MyListsTabs)
4. Globalny stan (UserDataProvider)
5. Powiadomienia (ToastProvider)
6. Funkcjonalność list (dodawanie/usuwanie)

### Następne kroki:

1. **Priorytet 1 (Krytyczne):**
   - Implementacja autentykacji
   - Zastąpienie DEFAULT_USER_ID prawdziwym user ID

2. **Priorytet 2 (Ważne):**
   - Header z nawigacją
   - Strona "Moje listy"
   - Funkcjonalność przycisku "Lista"

3. **Priorytet 3 (Nice to have):**
   - GlobalUserDataProvider
   - Toast notifications
   - Optymalizacje wydajności
   - Testy E2E

---

## 12. Zgodność z PRD

| Wymaganie                           | Status | Uwagi                             |
| ----------------------------------- | ------ | --------------------------------- |
| **US-001:** Wyszukiwanie filmów     | ✅     | MovieSearch.tsx zaimplementowany  |
| **US-002:** Wyświetlanie szczegółów | ✅     | /movie/[tmdb_id] zaimplementowany |
| **US-003:** Tworzenie list          | ⚠️     | Brak implementacji                |
| **US-004:** Ocenianie filmów        | ✅     | MovieRating.tsx z gwiazdkami      |
| **US-005:** Rekomendacje AI         | ✅     | RecommendationGenerator.tsx       |
| **US-006:** Onboarding              | ✅     | MainView z progress bar           |

---

## Wnioski

Obecna implementacja UI znacząco odbiega od pierwotnego planu, ale w większości przypadków zmiany są **pozytywne** i poprawiają UX. Kluczowe elementy (wyszukiwarka, ocenianie, rekomendacje) działają zgodnie z wymaganiami, choć brakuje autentykacji i zarządzania listami.

Architektura jest **elastyczna** i pozwala na łatwe dodanie brakujących elementów bez konieczności refaktoringu istniejącego kodu.
