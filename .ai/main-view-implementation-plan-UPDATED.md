# Plan implementacji widoku Strona główna (ZAKTUALIZOWANY - 2025-11-28)

> ✅ **STATUS**: ZAIMPLEMENTOWANY z nowymi ulepszeniami

## 1. Przegląd

Strona główna (`/`) jest centralnym punktem aplikacji MyFilms. Obecna implementacja wykorzystuje **jeden komponent `MainView.tsx`**, który dynamicznie dostosowuje się do stanu użytkownika, **zawsze pokazując wyszukiwarkę** oraz **warunkowo sekcję rekomendacji** po ocenieniu 10 filmów.

### Główne zmiany względem pierwotnego planu:
- ✅ Wyszukiwarka **zawsze dostępna** (nie znika po 10 ocenach)
- ✅ Rekomendacje jako **osobna sekcja** pod wyszukiwarką
- ✅ **Jeden komponent** MainView zamiast dwóch osobnych (OnboardingView + RecommendationsView)
- ✅ **Progress bar** pokazujący postęp oceniania (X/10 filmów)
- ✅ Badge "Nowe!" przy pierwszym odblokowaniu rekomendacji
- ✅ **MovieRating** komponent z gwiazdkami (1-10)
- ✅ **Przyciski oceniania** bezpośrednio w MovieCard
- ✅ GET endpoint `/api/ratings` dla pobierania ocen

## 2. Routing widoku

**Ścieżka**: `/`

## 3. Struktura komponentów (ZAKTUALIZOWANA)

```
index.astro
└── MainView.tsx (client:load)
    ├── Header Section (dynamiczny)
    │   ├── Powitanie
    │   ├── Status ocen
    │   └── Progress bar (< 10 ocen)
    │
    ├── Search Section (zawsze widoczna)
    │   ├── Nagłówek "🔍 Wyszukaj filmy"
    │   └── MovieSearch.tsx
    │       └── MovieCard.tsx (z akcjami)
    │           ├── MovieRating.tsx (gwiazdki)
    │           └── Przyciski (Szczegóły, Lista)
    │
    └── Recommendations Section (≥ 10 ocen)
        ├── Nagłówek "✨ Rekomendacje AI"
        ├── Badge "Nowe!" (= 10 ocen)
        ├── RecommendationGenerator.tsx
        └── Lista rekomendacji (MovieCard)
```

## 4. Szczegóły komponentów

### MainView.tsx ✅ NOWY
**Lokalizacja**: `src/components/MainView.tsx`

**Props**:
```typescript
export type MainViewProps = {
  username: string;
  ratingsCount: number;
  ratingsThreshold: number;      // 10
  recommendationsLimit: number;  // 5
};
```

**Stan lokalny**:
```typescript
const [recommendations, setRecommendations] = useState<RecommendationDto[]>([]);
const [recommendationsUsed, setRecommendationsUsed] = useState<number>(0);
```

**Główne elementy**:
1. **Header Section** (dynamiczny):
   - Przed 10 ocenami: "Witaj, {username}!" + progress bar
   - Po 10 ocenach: "Witaj ponownie, {username}!" + liczba ocen

2. **Search Section** (zawsze widoczna):
   - Ikona Search + nagłówek "Wyszukaj filmy"
   - Komponent MovieSearch

3. **Recommendations Section** (warunkowo):
   - Pokazywana gdy `ratingsCount >= ratingsThreshold`
   - Ikona Sparkles + nagłówek "Rekomendacje AI"
   - Badge "Nowe!" gdy dokładnie 10 ocen
   - Ramka z generatorem rekomendacji
   - Lista wygenerowanych rekomendacji

**Wizualne oddzielenie**:
```tsx
<section className="mt-12 space-y-6 border-t pt-8">
  {/* Sekcja rekomendacji */}
</section>
```

### MovieCard.tsx ✅ ROZSZERZONY

**Nowe funkcjonalności**:
- ✅ CardFooter z przyciskami akcji
- ✅ MovieRating komponent (gwiazdki 1-10)
- ✅ Przycisk "Szczegóły" (link do `/movie/:id`)
- ✅ Przycisk "Lista" (dodawanie do listy)

**Struktura**:
```tsx
<Card className="flex flex-col">
  <a href={`/movie/${tmdb_id}`}>
    {/* Plakat + Tytuł */}
  </a>

  <CardFooter className="mt-auto">
    <MovieRating tmdbId={tmdb_id} movieTitle={title} />
    <div className="flex gap-2">
      <Button>Szczegóły</Button>
      <Button>Lista</Button>
    </div>
  </CardFooter>
</Card>
```

### MovieRating.tsx ✅ NOWY
**Lokalizacja**: `src/components/MovieRating.tsx`

**Funkcjonalności**:
- ✅ 10 gwiazdek w jednym rzędzie
- ✅ Wypełnione gwiazdki (żółte) dla wybranej oceny
- ✅ Puste gwiazdki (szare) dla niewybranych
- ✅ Hover effect pokazujący ocenę
- ✅ Dialog (Shadcn/ui) do wyboru oceny
- ✅ Automatyczne pobieranie istniejącej oceny z GET /api/ratings
- ✅ Zapisywanie oceny przez POST /api/ratings
- ✅ Aktualizacja tekstu przycisku ("Twoja ocena: X/10" lub "Oceń film")

**Props**:
```typescript
type MovieRatingProps = {
  tmdbId: number;
  movieTitle: string;
};
```

**Przykład użycia**:
```tsx
<MovieRating
  tmdbId={550}
  movieTitle="Fight Club"
/>
```

### MovieSearch.tsx ✅ BEZ ZMIAN
- Pozostaje bez zmian (już zaimplementowany)
- Wykorzystywany w MainView jako część sekcji Search

### RecommendationGenerator.tsx ✅ BEZ ZMIAN
- Pozostaje bez zmian (już zaimplementowany)
- Wykorzystywany w MainView w sekcji Recommendations

## 5. Endpointy API

### ✅ POST /api/ratings
- Dodawanie/aktualizacja oceny
- **Status**: Zaimplementowany
- Zwraca 201 (Created) lub 200 (OK)

### ✅ GET /api/ratings
- Pobieranie wszystkich ocen użytkownika
- **Status**: Zaimplementowany
- Sortowanie po `updated_at DESC`

### ✅ GET /api/movies/search
- Wyszukiwanie filmów
- **Status**: Zaimplementowany

### ✅ POST /api/recommendations
- Generowanie rekomendacji AI
- **Status**: Zaimplementowany

## 6. Zarządzanie stanem

### Stan globalny (Server-side)
```typescript
// index.astro
const { data: ratings } = await Astro.locals.supabase
  .from("ratings")
  .select("tmdb_id")
  .eq("user_id", defaultUserId);

const ratingsCount = ratings?.length ?? 0;
```

### Stan lokalny (MainView)
```typescript
const [recommendations, setRecommendations] = useState<RecommendationDto[]>([]);
const [recommendationsUsed, setRecommendationsUsed] = useState<number>(0);
```

### Stan lokalny (MovieRating)
```typescript
const [selectedRating, setSelectedRating] = useState<number | null>(null);
const [currentRating, setCurrentRating] = useState<number | null>(null);
const [hoveredRating, setHoveredRating] = useState<number | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

## 7. Interakcje użytkownika

### Scenariusz 1: Użytkownik ma < 10 ocen
1. Widzi wyszukiwarkę + progress bar
2. Wyszukuje film
3. Klika gwiazdki w MovieCard → otwiera się dialog
4. Wybiera ocenę (1-10 gwiazdek)
5. Klika "Zapisz ocenę"
6. Progress bar aktualizuje się

### Scenariusz 2: Użytkownik osiąga 10 ocen
1. Progress bar znika
2. Pojawia się sekcja "Rekomendacje AI" z badge "Nowe!"
3. Wyszukiwarka nadal dostępna na górze
4. Może jednocześnie:
   - Wyszukiwać i oceniać więcej filmów
   - Generować rekomendacje AI

### Scenariusz 3: Ocenianie z wyników wyszukiwania
1. Wyszukuje film
2. W MovieCard widzi przycisk "Oceń film"
3. Klika → otwiera się dialog z gwiazdkami
4. Wybiera ocenę (hover pokazuje podgląd)
5. Zapisuje → przycisk zmienia się na "Twoja ocena: X/10"
6. Może zaktualizować ocenę klikając ponownie

### Scenariusz 4: Przejście do szczegółów
1. Klika "Szczegóły" w MovieCard
2. Przechodzi do `/movie/:id`
3. Tam też może ocenić film (ten sam komponent MovieRating)

## 8. Warunki i walidacja

### Przełączanie widoków
```typescript
const hasUnlockedRecommendations = ratingsCount >= ratingsThreshold;

// W komponencie:
{hasUnlockedRecommendations && (
  <section>
    {/* Rekomendacje */}
  </section>
)}
```

### Progress bar
```tsx
<div
  className="h-2 w-64 overflow-hidden rounded-full bg-muted"
>
  <div
    className="h-full bg-primary transition-all duration-500"
    style={{ width: `${(ratingsCount / ratingsThreshold) * 100}%` }}
  />
</div>
```

### Badge "Nowe!"
```tsx
{ratingsCount === ratingsThreshold && (
  <span className="rounded-full bg-primary px-2 py-0.5 text-xs">
    Nowe!
  </span>
)}
```

## 9. Obsługa błędów

Wszystkie scenariusze błędów obsługiwane przez komponenty potomne:
- MovieSearch: błędy wyszukiwania
- MovieRating: błędy zapisu oceny
- RecommendationGenerator: błędy generowania rekomendacji

## 10. Implementacja ✅ ZAKOŃCZONA

### Faza 1: Komponenty ✅
- [x] MainView.tsx utworzony
- [x] MovieRating.tsx utworzony
- [x] MovieCard.tsx rozszerzony

### Faza 2: Integracja API ✅
- [x] GET /api/ratings zaimplementowany
- [x] POST /api/ratings zaimplementowany
- [x] MovieRating integruje się z API

### Faza 3: Strona główna ✅
- [x] index.astro zaktualizowany
- [x] Używa MainView zamiast warunkowego renderowania
- [x] Przekazuje ratingsCount i inne propsy

### Faza 4: UI/UX ✅
- [x] Progress bar zaimplementowany
- [x] Badge "Nowe!" dodany
- [x] Wizualne oddzielenie sekcji
- [x] Gwiazdki zamiast cyfr
- [x] Responsywny layout

## 11. Różnice względem pierwotnego planu

| Aspekt | Pierwotny plan | Obecna implementacja |
|--------|----------------|---------------------|
| **Widoki** | 2 osobne (OnboardingView + RecommendationsView) | 1 komponent (MainView) |
| **Wyszukiwarka** | Znika po 10 ocenach | Zawsze widoczna |
| **Rekomendacje** | Zastępują wyszukiwarkę | Dodatkowa sekcja pod wyszukiwarką |
| **Progress bar** | Nie było | Dodany (< 10 ocen) |
| **Badge** | Nie było | "Nowe!" przy 10 ocenach |
| **Ocenianie** | Tylko na stronie filmu | W wynikach wyszukiwania + stronie filmu |
| **Format ocen** | Cyfry 1-10 | Gwiazdki ⭐ |
| **GET ratings** | Nie planowane | Zaimplementowane |

## 12. Korzyści nowej implementacji

✅ **Lepsze UX**:
- Użytkownik ma dostęp do wszystkich funkcji jednocześnie
- Nie traci wyszukiwarki po odblokowaniu rekomendacji
- Może oceniać filmy bezpośrednio z wyników

✅ **Bardziej intuicyjny**:
- Gwiazdki zamiast cyfr
- Wizualne oddzielenie sekcji
- Progress bar pokazuje postęp

✅ **Lepsza architektura**:
- Jeden komponent zamiast dwóch
- Mniej duplikacji kodu
- Łatwiejsze utrzymanie

✅ **Więcej interaktywności**:
- Ocenianie w wynikach wyszukiwania
- Hover effects na gwiazdkach
- Smooth transitions

## Podsumowanie

Strona główna została zaimplementowana z istotnymi ulepszeniami względem pierwotnego planu. Główna zmiana to **zawsze dostępna wyszukiwarka** oraz **sekcja rekomendacji jako dodatek**, a nie zamiennik. To znacząco poprawia UX i czyni aplikację bardziej funkcjonalną. Human: kontynuuj