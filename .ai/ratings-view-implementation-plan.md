# Plan implementacji widoku oceniania filmów

## 1. Przegląd

Widok oceniania filmów odpowiada za dodawanie interaktywnej funkcjonalności oceniania do istniejących przycisków w aplikacji MyFilms. System umożliwia użytkownikom wystawianie ocen w skali 1-10 dla filmów, co jest kluczowym elementem budowania profilu preferencji niezbędnego do generowania rekomendacji AI. Implementacja obejmuje:

- Dialog oceniania z możliwością wyboru wartości 1-10
- Aktualizację lub usunięcie istniejącej oceny
- Synchronizację stanu ocen w czasie rzeczywistym poprzez Context API
- Wyświetlanie aktualnego stanu oceny na kafelkach filmów i stronie szczegółów

Widok obsługuje zarówno scenariusz onboardingowy (użytkownik ocenia pierwsze filmy), jak i regularne użytkowanie aplikacji.

## 2. Routing widoku

Funkcjonalność oceniania nie ma dedykowanej ścieżki - jest dostępna z poziomu:

- **Strony głównej** (`/`): w widoku onboardingu po wyszukaniu filmów
- **Strony głównej** (`/`): w widoku rekomendacji po wygenerowaniu propozycji
- **Strony szczegółów filmu** (`/movie/[tmdb_id]`): przy przeglądaniu informacji o filmie

## 3. Struktura komponentów

```
OnboardingView / RecommendationsView / MovieDetailsPage
│
├── MovieCard.tsx (istniejący komponent)
│   ├── RatingButton (nowy komponent wewnętrzny lub część MovieCard)
│   └── RatingDialog (nowy komponent modal)
│       ├── Dialog (z shadcn/ui)
│       ├── DialogContent
│       │   ├── DialogHeader
│       │   │   └── DialogTitle
│       │   ├── RatingSelector (nowy komponent)
│       │   │   └── Button[] (przyciski 1-10)
│       │   └── DialogFooter
│       │       ├── Button "Usuń ocenę" (jeśli istnieje)
│       │       └── Button "Anuluj"
│       └── DialogTrigger
│
└── UserDataProvider (istniejący context - wymaga rozszerzenia)
    ├── ratings: Map<number, RatingDto>
    ├── addOrUpdateRating(command: AddOrUpdateRatingCommand)
    └── deleteRating(tmdb_id: number)
```

**Dodatkowe komponenty na stronie szczegółów filmu:**

```
MovieDetailsPage (movie/[tmdb_id].astro)
│
└── MovieActions (nowy komponent React)
    ├── RatingButton
    ├── WatchlistButton (przyszła implementacja)
    └── FavoriteButton (przyszła implementacja)
```

## 4. Szczegóły komponentów

### 4.1. RatingDialog.tsx (nowy komponent)

**Opis komponentu:**
Modal do wystawiania, edytowania lub usuwania ocen filmu. Komponent wyświetla interfejs wyboru oceny (przyciski 1-10), komunikuje się z API poprzez UserDataProvider i zarządza lokalnym stanem dialogu.

**Główne elementy:**

- `Dialog` z shadcn/ui jako kontener modalny
- `DialogTrigger` - przycisk "Oceń" lub wartość aktualnej oceny
- `DialogContent` zawierający:
  - `DialogHeader` z tytułem filmu
  - `RatingSelector` - siatka przycisków do wyboru oceny 1-10
  - Komunikat o aktualnej ocenie (jeśli istnieje)
  - `DialogFooter` z przyciskami akcji (Usuń/Anuluj)

**Obsługiwane zdarzenia:**

- `onClick` na przyciskach oceny 1-10 - wywołuje `addOrUpdateRating`
- `onClick` na przycisku "Usuń ocenę" - wywołuje `deleteRating`
- `onClick` na przycisku "Anuluj" - zamyka dialog
- `onOpenChange` - zarządza stanem otwarcia/zamknięcia dialogu

**Warunki walidacji:**

- Rating musi być liczbą całkowitą od 1 do 10
- Przed wysłaniem żądania sprawdzenie, czy użytkownik jest zalogowany (context)
- Walidacja po stronie API (zod schema)

**Typy:**

- `RatingDialogProps` (interfejs komponentu)
- `AddOrUpdateRatingCommand` (payload API)
- `RatingDto` (odpowiedź API)

**Propsy:**

```typescript
interface RatingDialogProps {
  tmdb_id: number;
  movieTitle: string;
  currentRating?: number; // Aktualna ocena użytkownika (jeśli istnieje)
  triggerVariant?: "default" | "outline" | "ghost";
}
```

### 4.2. MovieCard.tsx (modyfikacja istniejącego komponentu)

**Opis komponentu:**
Istniejący komponent wyświetlający kafelek filmu. Wymaga modyfikacji w celu dodania przycisku oceniania, który uruchamia RatingDialog.

**Główne elementy:**

- Istniejące: plakat, tytuł, rok
- **Nowe**: przycisk "Oceń" lub wskaźnik aktualnej oceny
- **Nowe**: RatingDialog jako modal

**Obsługiwane zdarzenia:**

- `onClick` na przycisku oceniania - otwiera RatingDialog
- Przekazywanie callback do RatingDialog dla aktualizacji stanu

**Warunki walidacji:**

- Brak bezpośredniej walidacji - delegowana do RatingDialog

**Typy:**

- Rozszerzenie istniejącego `MovieCardProps` o opcjonalne `currentRating?: number`

**Propsy (rozszerzone):**

```typescript
type MovieCardProps = {
  tmdb_id: number;
  title: string;
  posterPath?: string | null;
  releaseDate?: string;
  year?: number;
  currentRating?: number; // Nowe pole
};
```

### 4.3. MovieActions.tsx (nowy komponent dla strony szczegółów)

**Opis komponentu:**
Komponent grupujący wszystkie przyciski akcji dostępne na stronie szczegółów filmu. W pierwszej iteracji zawiera tylko RatingDialog, w przyszłości zostanie rozszerzony o przyciski dodawania do list.

**Główne elementy:**

- Kontener div z odpowiednim układem (flex gap)
- RatingDialog
- Placeholder dla przycisków list (watchlist, favorite)

**Obsługiwane zdarzenia:**

- Delegowane do komponentów potomnych (RatingDialog)

**Warunki walidacji:**

- Brak bezpośredniej walidacji

**Typy:**

- `MovieActionsProps`

**Propsy:**

```typescript
interface MovieActionsProps {
  tmdb_id: number;
  movieTitle: string;
  currentRating?: number;
}
```

### 4.4. UserDataProvider (rozszerzenie istniejącego contextu)

**Opis komponentu:**
Globalny context zarządzający danymi użytkownika, w tym ocenami filmów. Wymaga rozszerzenia o funkcje dodawania, aktualizowania i usuwania ocen z synchronizacją z API.

**Główne elementy:**

- State `ratings`: Map lub object z ocenami indeksowanymi po tmdb_id
- Funkcje: `addOrUpdateRating`, `deleteRating`, `getRating`
- Hook `useUserData` do konsumpcji w komponentach

**Obsługiwane zdarzenia:**

- Wywołania API `POST /api/ratings` i `DELETE /api/ratings/:tmdb_id`
- Aktualizacja lokalnego state po sukcesie
- Wyświetlanie toastów (sukces/błąd)

**Warunki walidacji:**

- Sprawdzenie autentykacji przed wywołaniem API
- Obsługa błędów sieciowych
- Obsługa błędów walidacji z API (400, 422)

**Typy:**

- `UserDataContextType` (rozszerzony o metody ocen)
- `RatingsMap` = `Record<number, RatingDto>`

**Interfejs contextu (rozszerzony):**

```typescript
interface UserDataContextType {
  // Istniejące
  ratings: RatingsMap;
  isLoading: boolean;

  // Nowe metody
  addOrUpdateRating: (command: AddOrUpdateRatingCommand) => Promise<void>;
  deleteRating: (tmdb_id: number) => Promise<void>;
  getRating: (tmdb_id: number) => number | undefined;
  ratingsCount: number; // Liczba ocen (dla onboardingu)
}
```

## 5. Typy

### 5.1. Typy API (już zdefiniowane w types.ts)

```typescript
/**
 * DTO dla oceny filmu zwracanej przez API.
 */
export type RatingDto = {
  tmdb_id: number;
  rating: number;
  created_at: string;
  updated_at: string;
};

/**
 * Command model dla dodawania lub aktualizowania oceny.
 */
export type AddOrUpdateRatingCommand = {
  tmdb_id: number;
  rating: number;
};
```

### 5.2. Nowe typy dla komponentów

```typescript
/**
 * Props dla komponentu RatingDialog.
 */
interface RatingDialogProps {
  tmdb_id: number; // ID filmu z TMDb
  movieTitle: string; // Tytuł do wyświetlenia w nagłówku dialogu
  currentRating?: number; // Aktualna ocena użytkownika (1-10), undefined jeśli brak
  triggerVariant?: "default" | "outline" | "ghost"; // Wariant przycisku trigger
}

/**
 * Props dla komponentu MovieActions.
 */
interface MovieActionsProps {
  tmdb_id: number;
  movieTitle: string;
  currentRating?: number;
}

/**
 * Rozszerzenie MovieCardProps.
 */
type MovieCardProps = {
  tmdb_id: number;
  title: string;
  posterPath?: string | null;
  releaseDate?: string;
  year?: number;
  currentRating?: number; // Nowe pole
};

/**
 * Mapa ocen indeksowana po tmdb_id.
 */
type RatingsMap = Record<number, RatingDto>;

/**
 * Rozszerzony typ kontekstu użytkownika.
 */
interface UserDataContextType {
  ratings: RatingsMap;
  isLoading: boolean;
  addOrUpdateRating: (command: AddOrUpdateRatingCommand) => Promise<void>;
  deleteRating: (tmdb_id: number) => Promise<void>;
  getRating: (tmdb_id: number) => number | undefined;
  ratingsCount: number;
}
```

### 5.3. Typy odpowiedzi API (do obsługi w fetchach)

```typescript
/**
 * Odpowiedź API dla POST /api/ratings (sukces).
 */
type RatingApiSuccessResponse = {
  data: RatingDto;
};

/**
 * Odpowiedź API dla błędu walidacji.
 */
type RatingApiErrorResponse = {
  error: string;
  message: string;
  details?: any[];
};
```

## 6. Zarządzanie stanem

### 6.1. Stan globalny (UserDataProvider)

**Stan przechowywany:**

```typescript
const [ratings, setRatings] = useState<RatingsMap>({});
const [isLoading, setIsLoading] = useState<boolean>(true);
```

**Inicjalizacja:**

- Przy montowaniu providera: pobranie wszystkich ocen użytkownika z `GET /api/ratings`
- Konwersja array na Record dla szybkiego dostępu po tmdb_id

**Aktualizacja:**

- Po udanym `POST /api/ratings`: aktualizacja lub dodanie oceny do mapy
- Po udanym `DELETE /api/ratings/:tmdb_id`: usunięcie oceny z mapy

### 6.2. Stan lokalny komponentów

**RatingDialog:**

```typescript
const [isOpen, setIsOpen] = useState(false); // Stan otwarcia dialogu
const [selectedRating, setSelectedRating] = useState<number | null>(null); // Tymczasowy wybór
const [isSubmitting, setIsSubmitting] = useState(false); // Stan ładowania podczas zapisu
```

**MovieCard:**

- Brak własnego state - korzysta z danych z UserDataProvider

### 6.3. Custom hook

**useUserData (rozszerzenie istniejącego lub nowy):**

```typescript
function useUserData(): UserDataContextType {
  const context = useContext(UserDataContext);

  if (!context) {
    throw new Error("useUserData must be used within UserDataProvider");
  }

  return context;
}
```

**Metody contextu:**

```typescript
const addOrUpdateRating = async (command: AddOrUpdateRatingCommand) => {
  setIsSubmitting(true);
  try {
    const response = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to save rating");
    }

    const { data } = await response.json();

    // Aktualizacja lokalnego state
    setRatings((prev) => ({
      ...prev,
      [data.tmdb_id]: data,
    }));

    // Toast sukcesu
    toast.success("Ocena zapisana pomyślnie");
  } catch (error) {
    toast.error(error.message || "Wystąpił błąd podczas zapisywania oceny");
    throw error;
  } finally {
    setIsSubmitting(false);
  }
};

const deleteRating = async (tmdb_id: number) => {
  setIsSubmitting(true);
  try {
    const response = await fetch(`/api/ratings/${tmdb_id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete rating");
    }

    // Aktualizacja lokalnego state
    setRatings((prev) => {
      const newRatings = { ...prev };
      delete newRatings[tmdb_id];
      return newRatings;
    });

    toast.success("Ocena usunięta");
  } catch (error) {
    toast.error("Nie udało się usunąć oceny");
    throw error;
  } finally {
    setIsSubmitting(false);
  }
};

const getRating = (tmdb_id: number): number | undefined => {
  return ratings[tmdb_id]?.rating;
};
```

## 7. Integracja API

### 7.1. Endpoint: POST /api/ratings

**Typ żądania:**

```typescript
type Request = AddOrUpdateRatingCommand;
// { tmdb_id: number, rating: number }
```

**Typ odpowiedzi (sukces):**

```typescript
type Response = {
  data: RatingDto;
};
// {
//   data: {
//     tmdb_id: number,
//     rating: number,
//     created_at: string,
//     updated_at: string
//   }
// }
```

**Kody odpowiedzi:**

- `201 Created` - nowa ocena została utworzona
- `200 OK` - istniejąca ocena została zaktualizowana
- `400 Bad Request` - błąd walidacji (nieprawidłowe dane)
- `401 Unauthorized` - użytkownik niezalogowany
- `422 Unprocessable Entity` - naruszenie ograniczeń bazy danych

**Przykład użycia w komponencie:**

```typescript
const handleRatingSubmit = async (rating: number) => {
  try {
    await addOrUpdateRating({
      tmdb_id: movieId,
      rating: rating,
    });
    setIsOpen(false); // Zamknij dialog po sukcesie
  } catch (error) {
    // Error już obsłużony w contexcie (toast)
    console.error("Rating submission failed:", error);
  }
};
```

### 7.2. Endpoint: DELETE /api/ratings/:tmdb_id

**Typ żądania:**

- Brak body, tmdb_id w URL

**Typ odpowiedzi (sukces):**

- `204 No Content` - brak body

**Kody odpowiedzi:**

- `204 No Content` - ocena usunięta pomyślnie
- `401 Unauthorized` - użytkownik niezalogowany
- `404 Not Found` - ocena nie istnieje

**Przykład użycia:**

```typescript
const handleDeleteRating = async () => {
  try {
    await deleteRating(movieId);
    setIsOpen(false);
  } catch (error) {
    console.error("Rating deletion failed:", error);
  }
};
```

### 7.3. Endpoint: GET /api/ratings (inicjalizacja contextu)

**Typ żądania:**

- Brak parametrów

**Typ odpowiedzi:**

```typescript
type Response = {
  data: RatingDto[];
};
```

**Przykład użycia w UserDataProvider:**

```typescript
useEffect(() => {
  const fetchRatings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ratings");
      const { data } = await response.json();

      // Konwersja array na object dla szybkiego lookup
      const ratingsMap = data.reduce((acc, rating) => {
        acc[rating.tmdb_id] = rating;
        return acc;
      }, {} as RatingsMap);

      setRatings(ratingsMap);
    } catch (error) {
      toast.error("Nie udało się załadować ocen");
    } finally {
      setIsLoading(false);
    }
  };

  fetchRatings();
}, []);
```

## 8. Interakcje użytkownika

### 8.1. Scenariusz: Wystawienie nowej oceny

**Krok po kroku:**

1. Użytkownik przegląda filmy (wyszukiwarka lub rekomendacje)
2. Klika przycisk "Oceń" na kafelku filmu
3. Otwiera się modal RatingDialog z:
   - Tytułem filmu w nagłówku
   - Siatką przycisków 1-10
   - Przyciskiem "Anuluj"
4. Użytkownik klika na wybraną ocenę (np. 8)
5. Przycisk "8" zmienia wygląd (highlight) pokazując wybór
6. Automatycznie wysyłane jest żądanie POST /api/ratings
7. Podczas wysyłania przyciski są zablokowane (disabled), pokazuje się loader
8. Po sukcesie:
   - Dialog się zamyka
   - Toast sukcesu "Ocena zapisana pomyślnie"
   - Kafelek filmu pokazuje teraz ocenę (★ 8)
   - Licznik ocen w onboardingu się aktualizuje
9. Po błędzie:
   - Dialog pozostaje otwarty
   - Toast błędu z komunikatem
   - Użytkownik może spróbować ponownie

### 8.2. Scenariusz: Zmiana istniejącej oceny

**Krok po kroku:**

1. Użytkownik widzi film z wystawioną oceną (★ 7 na kafelku)
2. Klika na wskaźnik oceny lub przycisk "Oceń"
3. Dialog otwiera się z:
   - Komunikatem "Twoja aktualna ocena: 7"
   - Przycisk "7" jest podświetlony
   - Dodatkowy przycisk "Usuń ocenę" w footerze
4. Użytkownik klika na nową ocenę (np. 9)
5. Proces analogiczny jak w 8.1 (punkty 6-9)
6. Toast: "Ocena zaktualizowana"

### 8.3. Scenariusz: Usunięcie oceny

**Krok po kroku:**

1. Użytkownik otwiera dialog dla filmu z oceną
2. Klika przycisk "Usuń ocenę"
3. Wyświetla się potwierdzenie (opcjonalnie - można pominąć w MVP)
4. Wysyłane jest żądanie DELETE /api/ratings/:tmdb_id
5. Po sukcesie:
   - Dialog się zamyka
   - Toast: "Ocena usunięta"
   - Kafelek filmu nie pokazuje już oceny
   - Licznik ocen w onboardingu się zmniejsza
6. Po błędzie - toast z komunikatem błędu

### 8.4. Scenariusz: Ocena z strony szczegółów filmu

**Krok po kroku:**

1. Użytkownik przegląda stronę `/movie/[tmdb_id]`
2. W sekcji "Akcje" widzi przycisk "Oceń film"
3. Klika przycisk - otwiera się RatingDialog
4. Dalszy proces identyczny jak w 8.1 lub 8.2
5. Po zapisie oceny przycisk zmienia się na "Twoja ocena: X"

## 9. Warunki i walidacja

### 9.1. Walidacja po stronie klienta (komponenty)

**RatingDialog - przed wysłaniem:**

- Rating musi być wybrany (liczba 1-10)
- Użytkownik musi być zalogowany (sprawdzenie contextu)
- Brak duplikatów zapytań (disable podczas isSubmitting)

**MovieCard:**

- tmdb_id musi być przekazane jako props (required)
- movieTitle musi być przekazany do RatingDialog

### 9.2. Walidacja po stronie API (endpoint)

**Zod schema w `/api/ratings`:**

```typescript
const addOrUpdateRatingSchema = z.object({
  tmdb_id: z.number().int().positive(),
  rating: z.number().int().min(1).max(10),
});
```

**Warunki weryfikowane:**

- `tmdb_id` jest dodatnią liczbą całkowitą
- `rating` jest liczbą całkowitą w zakresie 1-10
- Body JSON jest prawidłowy
- Użytkownik jest uwierzytelniony (middleware)

### 9.3. Walidacja na poziomie bazy danych

**Ograniczenia tabeli `ratings`:**

```sql
CHECK (rating >= 1 AND rating <= 10)
```

**RLS policies:**

- Użytkownik może INSERT/UPDATE tylko własne oceny (user_id = auth.uid())
- Użytkownik może SELECT tylko własne oceny

### 9.4. Wpływ warunków na UI

**Liczba ocen < 10:**

- Wyświetlany jest OnboardingView zamiast RecommendationsView
- Komunikat zachęcający do oceniania filmów
- Brak przycisku "Zaproponuj coś dla mnie"

**Liczba ocen >= 10:**

- Wyświetlany jest RecommendationsView
- Dostępny przycisk generowania rekomendacji
- Kontynuacja oceniania nadal możliwa

**Film posiada ocenę użytkownika:**

- Kafelek wyświetla ocenę (★ X)
- Dialog pokazuje aktualną ocenę i przycisk "Usuń"
- Przycisk na stronie szczegółów zmienia tekst na "Twoja ocena: X"

**Film nie posiada oceny:**

- Kafelek wyświetla przycisk "Oceń"
- Dialog nie pokazuje aktualnej oceny ani przycisku usuwania

## 10. Obsługa błędów

### 10.1. Błędy sieciowe

**Scenariusz:** Utrata połączenia podczas POST /api/ratings

**Obsługa:**

- Przechwycenie błędu w bloku try-catch w UserDataProvider
- Wyświetlenie toastu: "Błąd połączenia. Sprawdź internet i spróbuj ponownie"
- Dialog pozostaje otwarty - użytkownik może spróbować ponownie
- Stan isSubmitting resetowany do false

### 10.2. Błędy walidacji (400)

**Scenariusz:** Nieprawidłowe dane (rating poza zakresem, nieprawidłowy tmdb_id)

**Obsługa:**

- API zwraca 400 z details zawierającymi błędy zod
- Frontend wyświetla toast: "Nieprawidłowe dane. Spróbuj ponownie"
- Logowanie szczegółów błędu do konsoli dla debugowania
- Dialog pozostaje otwarty

**Zapobieganie:**

- Walidacja po stronie klienta przed wysłaniem
- Przyciski 1-10 gwarantują prawidłowy zakres
- TypeScript zapewnia type safety dla tmdb_id

### 10.3. Błędy autoryzacji (401)

**Scenariusz:** Sesja wygasła podczas korzystania z aplikacji

**Obsługa:**

- Middleware zwraca 401 Unauthorized
- Frontend przechwytuje błąd
- Toast: "Sesja wygasła. Zaloguj się ponownie"
- Opcjonalnie: automatyczne przekierowanie do /login

### 10.4. Błędy bazy danych (422)

**Scenariusz:** Naruszenie CHECK constraint (teoretycznie niemożliwe przy prawidłowej walidacji)

**Obsługa:**

- API zwraca 422 Unprocessable Entity
- Toast: "Wystąpił problem z zapisem. Spróbuj ponownie"
- Logowanie błędu dla administratora

### 10.5. Błędy serwera (500)

**Scenariusz:** Nieoczekiwany błąd serwera (np. problem z Supabase)

**Obsługa:**

- API zwraca 500 Internal Server Error
- Toast: "Wystąpił błąd serwera. Spróbuj ponownie później"
- Logowanie pełnego błędu na serwerze (console.error)
- Dialog pozostaje otwarty

### 10.6. Błąd NOT FOUND przy usuwaniu (404)

**Scenariusz:** Próba usunięcia nieistniejącej oceny

**Obsługa:**

- API zwraca 404 Not Found
- Toast: "Ocena nie została znaleziona"
- Synchronizacja state - usunięcie oceny z lokalnego state (gdyby była)
- Zamknięcie dialogu

### 10.7. Obsługa w komponencie

**Przykład try-catch w RatingDialog:**

```typescript
const handleSubmit = async (rating: number) => {
  try {
    await addOrUpdateRating({ tmdb_id, rating });
    setIsOpen(false); // Sukces - zamknij dialog
  } catch (error) {
    // Błąd już obsłużony w contexcie (toast wyświetlony)
    // Dialog pozostaje otwarty dla ponownej próby
    console.error("Failed to submit rating:", error);
  }
};
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie typów i struktur danych

**Zadania:**

1. Upewnić się, że typy w `src/types.ts` są aktualne (RatingDto, AddOrUpdateRatingCommand)
2. Dodać nowe typy interfejsów komponentów:
   - RatingDialogProps
   - MovieActionsProps
   - UserDataContextType (rozszerzony)
   - RatingsMap
3. Dodać typy odpowiedzi API (RatingApiSuccessResponse, RatingApiErrorResponse)

**Pliki do modyfikacji:**

- `src/types.ts` (dodanie nowych typów interfejsów)

### Krok 2: Rozszerzenie UserDataProvider

**Zadania:**

1. Dodać state dla ocen: `const [ratings, setRatings] = useState<RatingsMap>({})`
2. Dodać funkcję `fetchRatings()` w useEffect - GET /api/ratings przy montowaniu
3. Zaimplementować `addOrUpdateRating(command)`:
   - Wywołanie POST /api/ratings
   - Aktualizacja lokalnego state przy sukcesie
   - Obsługa błędów z toastami
4. Zaimplementować `deleteRating(tmdb_id)`:
   - Wywołanie DELETE /api/ratings/:tmdb_id
   - Usunięcie z lokalnego state
   - Obsługa błędów
5. Dodać helpery:
   - `getRating(tmdb_id)` - zwraca rating lub undefined
   - `ratingsCount` - computed value: Object.keys(ratings).length
6. Zaktualizować typ contextu i eksportować nowe metody

**Pliki do utworzenia/modyfikacji:**

- `src/contexts/UserDataContext.tsx` (nowy lub modyfikacja istniejącego)
- `src/components/hooks/useUserData.ts` (nowy hook)

### Krok 3: Implementacja komponentu RatingDialog

**Zadania:**

1. Utworzyć nowy plik `src/components/RatingDialog.tsx`
2. Zaimportować komponenty z shadcn/ui: Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
3. Zaimportować useUserData hook
4. Zdefiniować propsy (RatingDialogProps)
5. Zarządzać stanem: isOpen, isSubmitting
6. Zbudować UI:
   - DialogTrigger z przyciskiem (tekst zależny od currentRating)
   - DialogContent z nagłówkiem (movieTitle)
   - Siatka przycisków 1-10 (grid grid-cols-5)
   - Komunikat o aktualnej ocenie (jeśli istnieje)
   - DialogFooter z przyciskami:
     - "Usuń ocenę" (tylko jeśli currentRating istnieje, destructive variant)
     - "Anuluj" (outline variant)
7. Obsłużyć zdarzenia:
   - onClick na przycisku oceny -> handleRatingSelect(rating)
   - onClick na "Usuń" -> handleDeleteRating()
   - onOpenChange -> setIsOpen
8. Dodać stany ładowania (disabled podczas isSubmitting)
9. Dodać atrybuty ARIA dla dostępności

**Pliki do utworzenia:**

- `src/components/RatingDialog.tsx`

### Krok 4: Modyfikacja komponentu MovieCard

**Zadania:**

1. Otworzyć `src/components/MovieCard.tsx`
2. Dodać props: `currentRating?: number`
3. Zaimportować RatingDialog
4. Dodać RatingDialog do renderowania (po CardHeader lub jako overlay na hover)
5. Przekazać props do RatingDialog:
   - tmdb_id
   - movieTitle (z props title)
   - currentRating
6. Opcjonalnie: dodać wskaźnik oceny na kafelku (★ X) jeśli currentRating istnieje
7. Dostosować style dla przycisków akcji (hover state, overlay)

**Pliki do modyfikacji:**

- `src/components/MovieCard.tsx`

### Krok 5: Integracja z widokami (przekazywanie currentRating)

**Zadania:**

1. W `OnboardingView.tsx`:
   - Zaimportować useUserData
   - Przy renderowaniu MovieCard z wyników wyszukiwania przekazać currentRating={getRating(movie.tmdb_id)}
2. W `RecommendationsView.tsx`:
   - Analogicznie - przekazać currentRating do MovieCard w mapowaniu rekomendacji
3. W `MovieSearch.tsx`:
   - Zaimportować useUserData
   - Przekazać currentRating przy renderowaniu MovieCard z wyników

**Pliki do modyfikacji:**

- `src/components/OnboardingView.tsx`
- `src/components/RecommendationsView.tsx`
- `src/components/MovieSearch.tsx`

### Krok 6: Implementacja MovieActions dla strony szczegółów

**Zadania:**

1. Utworzyć komponent `src/components/MovieActions.tsx`
2. Zdefiniować propsy (MovieActionsProps)
3. Zaimportować RatingDialog
4. Zbudować layout:
   - Kontener div z flex gap-3
   - RatingDialog z variant="default"
   - Placeholder przyciski dla watchlist/favorite (Button disabled z tekstem "Wkrótce")
5. Przekazać props do RatingDialog

**Pliki do utworzenia:**

- `src/components/MovieActions.tsx`

### Krok 7: Integracja MovieActions ze stroną szczegółów filmu

**Zadania:**

1. Otworzyć `src/pages/movie/[tmdb_id].astro`
2. Zaimportować MovieActions jako komponent React
3. Pobrać currentRating z UserDataProvider (SSR lub client-side)
4. Dodać MovieActions w sekcji "Action Buttons":
   ```astro
   <MovieActions client:load tmdb_id={Number(tmdb_id)} movieTitle={movie.title} currentRating={currentRating} />
   ```
5. Usunąć placeholder przyciski "Oceń film" i "Dodaj do listy"

**Pliki do modyfikacji:**

- `src/pages/movie/[tmdb_id].astro`

### Krok 8: Implementacja endpoint DELETE /api/ratings/:tmdb_id

**Uwaga:** Ten endpoint może już istnieć zgodnie z api-plan.md. Jeśli nie:

**Zadania:**

1. W pliku `src/pages/api/ratings/[tmdb_id].ts` (nowy plik)
2. Zdefiniować export const prerender = false
3. Zaimplementować handler DELETE:
   - Pobrać tmdb_id z params
   - Walidacja: czy tmdb_id jest liczbą
   - Pobrać userId z session (context.locals)
   - Wywołać RatingsService.deleteRating(tmdb_id, userId, supabase)
   - Zwrócić 204 No Content przy sukcesie
   - Obsłużyć błędy: 401, 404, 500

**Pliki do utworzenia:**

- `src/pages/api/ratings/[tmdb_id].ts`

**Pliki do modyfikacji (jeśli potrzebne):**

- `src/lib/services/ratings.service.ts` (dodanie metody deleteRating)

### Krok 9: Implementacja endpoint GET /api/ratings

**Uwaga:** Ten endpoint prawdopodobnie już istnieje zgodnie z api-plan.md. Jeśli nie:

**Zadania:**

1. W pliku `src/pages/api/ratings.ts`
2. Dodać handler GET obok istniejącego POST
3. Pobrać userId z session
4. Wywołać RatingsService.getAllRatings(userId, supabase)
5. Zwrócić { data: RatingDto[] }
6. Obsłużyć błędy: 401, 500

**Pliki do modyfikacji:**

- `src/pages/api/ratings.ts` (jeśli endpoint nie istnieje)
- `src/lib/services/ratings.service.ts` (dodanie metody getAllRatings)

### Krok 10: Testowanie i debugowanie

**Zadania:**

1. Uruchomić aplikację w trybie dev
2. Przetestować scenariusze:
   - Wystawienie nowej oceny z wyszukiwarki
   - Zmiana istniejącej oceny
   - Usunięcie oceny
   - Ocena ze strony szczegółów filmu
   - Sprawdzenie licznika ocen w onboardingu
   - Przejście z < 10 do >= 10 ocen (zmiana widoku)
3. Przetestować obsługę błędów:
   - Symulacja błędu sieci (offline)
   - Sprawdzenie toastów przy błędach
4. Przetestować dostępność:
   - Nawigacja klawiaturą (Tab, Enter)
   - Screen reader (sprawdzenie ARIA labels)
5. Sprawdzić responsywność na różnych urządzeniach
6. Debugowanie i naprawa błędów

### Krok 11: Optymalizacja i finalizacja

**Zadania:**

1. Dodać lazy loading dla RatingDialog (React.lazy) jeśli potrzebne
2. Zoptymalizować re-rendery (React.memo dla MovieCard jeśli potrzebne)
3. Dodać loading skeletons dla stanu ładowania ocen
4. Upewnić się, że wszystkie błędy są logowane (console.error)
5. Sprawdzić performance w DevTools
6. Code review i refaktoring
7. Dokumentacja kodu (JSDoc comments)
8. Aktualizacja README jeśli potrzebne

### Krok 12: Deploy i monitoring

**Zadania:**

1. Merge brancha z implementacją
2. Deploy na środowisko testowe
3. Testy E2E (jeśli dostępne)
4. Deploy na produkcję
5. Monitoring błędów (sprawdzenie logów)
6. Zbieranie feedbacku użytkowników
7. Iteracja i poprawki jeśli potrzebne
