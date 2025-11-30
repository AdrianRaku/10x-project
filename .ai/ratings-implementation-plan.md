# API Endpoint Implementation Plan: POST /api/ratings

## 1. Przegląd punktu końcowego

Endpoint **POST /api/ratings** implementuje funkcjonalność dodawania lub aktualizowania oceny filmu przez zauwierzytelnionego użytkownika. Wykorzystuje wzorzec **upsert** (update-or-insert), który upraszcza operacje po stronie klienta - użytkownik nie musi sprawdzać, czy ocena już istnieje przed jej wysłaniem.

### Kluczowe cechy:
- **Pojedynczy endpoint** obsługujący zarówno tworzenie, jak i aktualizację ocen
- **Automatyczne zarządzanie czasem**: `created_at` ustawiany przy tworzeniu, `updated_at` przy każdej modyfikacji
- **Walidacja biznesowa**: oceny w skali 1-10, zgodnie z wymaganiami produktu
- **Bezpieczeństwo**: Row Level Security (RLS) zapewnia, że użytkownik modyfikuje tylko własne oceny
- **Zwrot odpowiedniego kodu**: 201 dla nowych ocen, 200 dla aktualizacji

---

## 2. Szczegóły żądania

### Metoda HTTP
**POST**

### Struktura URL
```
/api/ratings
```

### Nagłówki żądania
```
Content-Type: application/json
Cookie: sb-access-token=<session_token> (dla uwierzytelniania Supabase)
```

### Parametry

#### Wymagane (w body JSON):
- **`tmdb_id`** (number, integer, positive)
  - Identyfikator filmu z The Movie Database API
  - Musi być dodatnią liczbą całkowitą
  - Przykład: `808`, `550`, `13`

- **`rating`** (number, integer, 1-10)
  - Ocena użytkownika dla filmu
  - Musi być liczbą całkowitą z zakresu 1-10 włącznie
  - Przykład: `8`, `10`, `1`

#### Opcjonalne:
Brak parametrów opcjonalnych.

### Request Body

```json
{
  "tmdb_id": 808,
  "rating": 8
}
```

### Przykłady żądań

**Przykład 1: Nowa ocena**
```http
POST /api/ratings HTTP/1.1
Content-Type: application/json

{
  "tmdb_id": 550,
  "rating": 9
}
```

**Przykład 2: Aktualizacja istniejącej oceny**
```http
POST /api/ratings HTTP/1.1
Content-Type: application/json

{
  "tmdb_id": 550,
  "rating": 10
}
```

---

## 3. Wykorzystywane typy

### Command Model
```typescript
/**
 * Command model dla dodawania lub aktualizowania oceny filmu.
 * Zawiera tylko dane wymagane od klienta.
 */
export type AddOrUpdateRatingCommand = Pick<RatingEntity, 'tmdb_id' | 'rating'>;
```

**Struktura:**
```typescript
{
  tmdb_id: number;  // ID filmu z TMDb
  rating: number;   // Ocena 1-10
}
```

### Response DTO
```typescript
/**
 * DTO dla oceny filmu zwracanego przez API.
 * Pomija pola specyficzne dla bazy danych jak `id` i `user_id`.
 */
export type RatingDto = Omit<RatingEntity, 'id' | 'user_id'>;
```

**Struktura:**
```typescript
{
  tmdb_id: number;           // ID filmu z TMDb
  rating: number;            // Ocena 1-10
  created_at: string;        // ISO 8601 timestamp
  updated_at: string;        // ISO 8601 timestamp
}
```

### Schemat walidacji Zod
```typescript
const addOrUpdateRatingSchema = z.object({
  tmdb_id: z.number().int().positive({
    message: "tmdb_id must be a positive integer",
  }),
  rating: z.number().int().min(1).max(10, {
    message: "rating must be an integer between 1 and 10",
  }),
});
```

### Typ wewnętrzny serwisu
```typescript
interface UpsertRatingResult {
  rating: RatingDto;      // Dane oceny
  wasCreated: boolean;    // true = utworzono (201), false = zaktualizowano (200)
}
```

---

## 4. Szczegóły odpowiedzi

### Odpowiedź sukcesu - Utworzenie nowej oceny

**Status Code:** `201 Created`

**Body:**
```json
{
  "data": {
    "tmdb_id": 808,
    "rating": 8,
    "created_at": "2025-11-28T10:09:41.549719+00:00",
    "updated_at": "2025-11-28T10:09:41.549719+00:00"
  }
}
```

**Charakterystyka:**
- `created_at` i `updated_at` są identyczne (wskazuje na nowy rekord)
- Status 201 informuje klienta, że zasób został utworzony

### Odpowiedź sukcesu - Aktualizacja istniejącej oceny

**Status Code:** `200 OK`

**Body:**
```json
{
  "data": {
    "tmdb_id": 808,
    "rating": 9,
    "created_at": "2025-11-28T10:09:41.549719+00:00",
    "updated_at": "2025-11-28T10:15:30.123456+00:00"
  }
}
```

**Charakterystyka:**
- `updated_at` jest późniejszy niż `created_at` (wskazuje na aktualizację)
- Status 200 informuje klienta, że istniejący zasób został zmodyfikowany

### Odpowiedzi błędów

#### 400 Bad Request - Nieprawidłowy JSON
```json
{
  "error": "Bad Request",
  "message": "Invalid JSON in request body"
}
```

#### 400 Bad Request - Nieprawidłowa walidacja
```json
{
  "error": "Bad Request",
  "message": "Invalid request data",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "number",
      "inclusive": true,
      "exact": false,
      "message": "rating must be an integer between 1 and 10",
      "path": ["rating"]
    }
  ]
}
```

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required. Please log in to rate movies."
}
```

#### 422 Unprocessable Entity - Naruszenie ograniczeń bazy danych
```json
{
  "error": "Unprocessable Entity",
  "message": "Rating value does not meet database constraints"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred while processing your request"
}
```

---

## 5. Przepływ danych

### Schemat przepływu

```
┌─────────────┐
│   Klient    │
└──────┬──────┘
       │ 1. POST /api/ratings
       │    { tmdb_id: 808, rating: 8 }
       ▼
┌──────────────────────────────────────────┐
│  Endpoint Handler (ratings.ts)           │
│  ┌────────────────────────────────────┐  │
│  │ 1. Parse JSON body                 │  │
│  └────────────┬───────────────────────┘  │
│               ▼                          │
│  ┌────────────────────────────────────┐  │
│  │ 2. Validate with Zod schema        │  │
│  │    - tmdb_id: positive integer     │  │
│  │    - rating: 1-10                  │  │
│  └────────────┬───────────────────────┘  │
│               ▼                          │
│  ┌────────────────────────────────────┐  │
│  │ 3. Check authentication            │  │
│  │    - Get user from session         │  │
│  │    - Return 401 if not auth        │  │
│  └────────────┬───────────────────────┘  │
│               ▼                          │
│  ┌────────────────────────────────────┐  │
│  │ 4. Call RatingsService             │  │
│  └────────────┬───────────────────────┘  │
└───────────────┼──────────────────────────┘
                ▼
┌──────────────────────────────────────────┐
│  RatingsService.upsertRating()           │
│  ┌────────────────────────────────────┐  │
│  │ 1. Prepare data for upsert         │  │
│  │    {                               │  │
│  │      user_id,                      │  │
│  │      tmdb_id,                      │  │
│  │      rating                        │  │
│  │    }                               │  │
│  └────────────┬───────────────────────┘  │
│               ▼                          │
│  ┌────────────────────────────────────┐  │
│  │ 2. Execute Supabase upsert         │  │
│  │    - onConflict: user_id, tmdb_id  │  │
│  │    - Select: tmdb_id, rating,      │  │
│  │              created_at, updated_at│  │
│  └────────────┬───────────────────────┘  │
│               ▼                          │
│  ┌────────────────────────────────────┐  │
│  │ 3. Determine operation type        │  │
│  │    wasCreated =                    │  │
│  │      (created_at === updated_at)   │  │
│  └────────────┬───────────────────────┘  │
│               ▼                          │
│  ┌────────────────────────────────────┐  │
│  │ 4. Return UpsertRatingResult       │  │
│  │    { rating, wasCreated }          │  │
│  └────────────┬───────────────────────┘  │
└───────────────┼──────────────────────────┘
                ▼
┌──────────────────────────────────────────┐
│         Supabase Database                │
│  ┌────────────────────────────────────┐  │
│  │ ratings table                      │  │
│  │ UNIQUE (user_id, tmdb_id)          │  │
│  │ CHECK (rating >= 1 AND <= 10)      │  │
│  │ RLS: users can modify own ratings  │  │
│  └────────────┬───────────────────────┘  │
└───────────────┼──────────────────────────┘
                ▼
┌──────────────────────────────────────────┐
│  Endpoint Handler (ratings.ts)           │
│  ┌────────────────────────────────────┐  │
│  │ 5. Determine HTTP status           │  │
│  │    - 201 if wasCreated = true      │  │
│  │    - 200 if wasCreated = false     │  │
│  └────────────┬───────────────────────┘  │
│               ▼                          │
│  ┌────────────────────────────────────┐  │
│  │ 6. Format response                 │  │
│  │    { data: RatingDto }             │  │
│  └────────────┬───────────────────────┘  │
└───────────────┼──────────────────────────┘
                ▼
       ┌─────────────┐
       │   Klient    │
       │ 201 Created │
       │ or 200 OK   │
       └─────────────┘
```

### Kluczowe interakcje

1. **Parsowanie i walidacja (Endpoint)**
   - Próba parsowania body jako JSON
   - Walidacja struktury i wartości przez Zod
   - Early return w przypadku błędów

2. **Uwierzytelnienie (Middleware → Endpoint)**
   - Middleware Astro dodaje `supabase` do `locals`
   - Endpoint sprawdza sesję użytkownika
   - W development: używany `DEFAULT_USER_ID` z env
   - W production: pobierany user ID z sesji Supabase

3. **Logika biznesowa (Service)**
   - Enkapsulacja logiki upsert w serwisie
   - Separacja od logiki HTTP endpointu
   - Możliwość reużycia w innych kontekstach

4. **Operacja bazodanowa (Supabase)**
   - Upsert oparty na unique constraint `(user_id, tmdb_id)`
   - Automatyczne zarządzanie `updated_at` przez trigger bazodanowy
   - RLS zapewnia izolację danych użytkowników

5. **Formatowanie odpowiedzi (Endpoint)**
   - Konwersja wyniku serwisu na HTTP response
   - Różne kody statusu zależnie od operacji
   - Spójny format JSON dla wszystkich odpowiedzi

---

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnienie

**Mechanizm:**
- Wykorzystanie sesji Supabase przechowywanych w cookies
- Middleware Astro inicjalizuje klienta Supabase z sesją użytkownika
- Endpoint sprawdza obecność zalogowanego użytkownika

**Implementacja:**
```typescript
// W endpoint handler
const { data: { user }, error } = await locals.supabase.auth.getUser();

if (error || !user) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Authentication required. Please log in to rate movies."
    }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}

const userId = user.id;
```

**Development mode:**
- Wykorzystanie `DEFAULT_USER_ID` z zmiennych środowiskowych
- Możliwość testowania bez pełnego flow uwierzytelniania
- **UWAGA:** To obejście musi być usunięte przed produkcją!

### 6.2 Autoryzacja

**Row Level Security (RLS):**
```sql
-- Polityka dla INSERT
CREATE POLICY "Users can insert their own ratings"
ON ratings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Polityka dla UPDATE
CREATE POLICY "Users can update their own ratings"
ON ratings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Polityka dla SELECT
CREATE POLICY "Users can view their own ratings"
ON ratings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

**Zabezpieczenia:**
- Użytkownik może modyfikować tylko swoje oceny
- Baza danych weryfikuje to na poziomie SQL
- Nawet jeśli endpoint byłby skompromitowany, RLS chroni dane

### 6.3 Walidacja danych wejściowych

**Poziom 1: JSON parsing**
```typescript
try {
  body = await request.json();
} catch {
  return new Response(/* 400 Bad Request */);
}
```

**Poziom 2: Zod schema validation**
```typescript
const validationResult = addOrUpdateRatingSchema.safeParse(body);
if (!validationResult.success) {
  return new Response(/* 400 Bad Request with details */);
}
```

**Poziom 3: Database constraints**
```sql
CHECK (rating >= 1 AND rating <= 10)
```

**Zabezpieczenia:**
- Wielowarstwowa walidacja (defense in depth)
- Wszystkie nieprawidłowe dane odrzucane przed operacją bazodanową
- Szczegółowe komunikaty błędów dla klienta

### 6.4 Ochrona przed atakami

**SQL Injection:**
- Supabase JS Client używa prepared statements
- Brak bezpośredniego składania SQL queries
- Parametryzowane zapytania dla wszystkich operacji

**NoSQL Injection:**
- Nie dotyczy (PostgreSQL)

**Mass Assignment:**
- Command model zawiera tylko `tmdb_id` i `rating`
- Niemożliwe ustawienie `user_id`, `id`, `created_at` przez klienta
- Service layer jawnie mapuje dozwolone pola

**Rate Limiting:**
- Obecnie brak implementacji
- Rozważyć w przyszłości (np. 100 ocen/godzinę na użytkownika)
- Można dodać middleware lub wykorzystać Supabase Edge Functions

**CSRF (Cross-Site Request Forgery):**
- Obecnie: Supabase cookies są `SameSite=Lax` (domyślnie)
- Rozważyć: Dodanie CSRF tokens dla większego bezpieczeństwa
- API nie zmienia stanu na GET, więc ryzyko ograniczone

### 6.5 Bezpieczeństwo informacji

**Ukrywanie szczegółów błędów:**
```typescript
// Development: szczegółowe błędy
console.error("Error upserting rating:", error);

// Production: ogólne komunikaty
return new Response(
  JSON.stringify({
    error: "Internal Server Error",
    message: "An unexpected error occurred while processing your request"
    // NIE zwracamy stack trace w production!
  }),
  { status: 500 }
);
```

**Logowanie bezpieczne:**
- Nie logować wrażliwych danych (hasła, tokeny)
- Logować tylko business events i błędy techniczne
- Rozważyć strukturalne logowanie (np. Winston, Pino)

---

## 7. Obsługa błędów

### Scenariusze błędów i odpowiedzi

| Kod | Scenariusz | Przyczyna | Odpowiedź | Akcja klienta |
|-----|-----------|-----------|-----------|---------------|
| **400** | Nieprawidłowy JSON | Malformed JSON body | `{ error: "Bad Request", message: "Invalid JSON in request body" }` | Poprawić format JSON |
| **400** | Nieprawidłowy tmdb_id | tmdb_id < 0 lub nie integer | `{ error: "Bad Request", message: "Invalid request data", details: [...] }` | Wysłać dodatnią liczbę całkowitą |
| **400** | Nieprawidłowy rating | rating < 1 lub > 10 | `{ error: "Bad Request", message: "Invalid request data", details: [...] }` | Wysłać wartość z zakresu 1-10 |
| **400** | Brakujące pole | Brak tmdb_id lub rating | `{ error: "Bad Request", message: "Invalid request data", details: [...] }` | Uzupełnić wymagane pola |
| **401** | Brak uwierzytelnienia | Nie zalogowany użytkownik | `{ error: "Unauthorized", message: "Authentication required..." }` | Zalogować się |
| **401** | Wygasła sesja | Token wygasł | `{ error: "Unauthorized", message: "Session expired..." }` | Odświeżyć token lub zalogować ponownie |
| **422** | Naruszenie ograniczeń DB | Check constraint violation | `{ error: "Unprocessable Entity", message: "Rating value does not meet database constraints" }` | Sprawdzić dane (nie powinno się zdarzyć po walidacji Zod) |
| **500** | Błąd Supabase | Problem z połączeniem DB | `{ error: "Internal Server Error", message: "An unexpected error occurred..." }` | Spróbować ponownie później |
| **500** | Brak DEFAULT_USER_ID | Zmienna env nie ustawiona (dev) | `{ error: "Internal Server Error", message: "DEFAULT_USER_ID environment variable is not set" }` | Skonfigurować środowisko |
| **500** | Nieoczekiwany błąd | Błąd aplikacji | `{ error: "Internal Server Error", message: "An unexpected error occurred..." }` | Zgłosić problem |

### Implementacja obsługi błędów

#### 1. Błędy parsowania JSON (400)
```typescript
let body;
try {
  body = await request.json();
} catch {
  return new Response(
    JSON.stringify({
      error: "Bad Request",
      message: "Invalid JSON in request body",
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

**Kiedy występuje:** Klient wysyła nieprawidłowy JSON (np. niezamknięte nawiasy, przecinki, etc.)

#### 2. Błędy walidacji Zod (400)
```typescript
const validationResult = addOrUpdateRatingSchema.safeParse(body);

if (!validationResult.success) {
  return new Response(
    JSON.stringify({
      error: "Bad Request",
      message: "Invalid request data",
      details: validationResult.error.errors,
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

**Kiedy występuje:** Dane są w poprawnym JSON, ale nie spełniają wymagań schema (typ, zakres wartości)

**Format details:**
```json
{
  "error": "Bad Request",
  "message": "Invalid request data",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "number",
      "inclusive": true,
      "exact": false,
      "message": "rating must be an integer between 1 and 10",
      "path": ["rating"]
    }
  ]
}
```

#### 3. Błędy uwierzytelnienia (401)
```typescript
const { data: { user }, error } = await locals.supabase.auth.getUser();

if (error || !user) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Authentication required. Please log in to rate movies.",
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

**Kiedy występuje:** 
- Brak cookie z sesją
- Wygasły token
- Nieprawidłowy token

#### 4. Błędy ograniczeń bazy danych (422)
```typescript
catch (error) {
  if (error && typeof error === "object" && "code" in error) {
    const pgError = error as { code: string; message: string };

    // PostgreSQL check constraint violation
    if (pgError.code === "23514") {
      return new Response(
        JSON.stringify({
          error: "Unprocessable Entity",
          message: "Rating value does not meet database constraints",
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
  // ...
}
```

**Kiedy występuje:** 
- Rating poza zakresem 1-10 (nie powinno się zdarzyć po walidacji Zod)
- Inne naruszenia constraint

**Kody błędów PostgreSQL:**
- `23505`: Unique violation
- `23514`: Check constraint violation
- `23503`: Foreign key violation

#### 5. Błędy serwera (500)
```typescript
catch (error) {
  // ... specific error handling ...
  
  // Log unexpected errors
  console.error("Error upserting rating:", error);

  return new Response(
    JSON.stringify({
      error: "Internal Server Error",
      message: "An unexpected error occurred while processing your request",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

**Kiedy występuje:**
- Błędy połączenia z Supabase
- Timeouty
- Błędy aplikacji (bug)

### Strategia logowania błędów

**Development:**
```typescript
console.error("Error upserting rating:", {
  error,
  userId,
  command: validationResult.data,
  timestamp: new Date().toISOString(),
});
```

**Production (przyszłość):**
- Integracja z systemem logowania (np. Sentry, LogRocket)
- Strukturalne logowanie z kontekstem
- Monitoring i alerty dla 500 errors
- Error tracking z user ID (dla supportu)

---

## 8. Rozważania dotyczące wydajności

### 8.1 Optymalizacje bazy danych

**Indeksy:**
```sql
-- Automatyczny indeks na PRIMARY KEY (id)
-- Automatyczny indeks na UNIQUE constraint (user_id, tmdb_id)
CREATE UNIQUE INDEX ratings_user_id_tmdb_id_key 
ON ratings(user_id, tmdb_id);
```

**Korzyści:**
- Szybkie lookup dla operacji upsert
- Wydajne sprawdzanie unikalności
- Indeks composite (user_id, tmdb_id) idealny dla naszego use case

**Monitoring:**
- Sprawdzać plany zapytań: `EXPLAIN ANALYZE`
- Monitorować długość zapytań w Supabase Dashboard

### 8.2 Wydajność Supabase Client

**Connection pooling:**
- Supabase automatycznie zarządza pool połączeń
- Nie tworzyć nowego klienta dla każdego requestu (używać `locals.supabase`)

**Single vs Batch:**
- Endpoint obsługuje jedną ocenę na raz
- Dla batch operations: rozważyć osobny endpoint `/api/ratings/batch`

### 8.3 Optymalizacje serializacji

**JSON response:**
- Używać `JSON.stringify()` dla spójności
- Unikać serializacji dużych obiektów (problem nieistotny dla tego endpointu)

**Gzip compression:**
- Astro/serwer powinien automatycznie kompresować odpowiedzi > 1KB
- Sprawdzić konfigurację serwera produkcyjnego

### 8.4 Caching

**Brak cache dla POST:**
- POST nie powinien być cache'owany (per HTTP spec)
- Odpowiedzi zawsze świeże

**Cache dla powiązanych GET:**
- Rozważyć cache dla `GET /api/ratings` (lista ocen użytkownika)
- Invalidacja cache po POST do `/api/ratings`

### 8.5 Rate Limiting

**Obecny stan:**
- Brak rate limiting

**Zalecenia na przyszłość:**
```typescript
// Przykładowa implementacja w middleware
const rateLimit = new Map<string, { count: number; resetAt: number }>();

export async function rateLimitMiddleware(userId: string, limit = 100, windowMs = 60000) {
  const now = Date.now();
  const userLimit = rateLimit.get(userId);
  
  if (!userLimit || now > userLimit.resetAt) {
    rateLimit.set(userId, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  
  if (userLimit.count >= limit) {
    return { allowed: false, retryAfter: userLimit.resetAt - now };
  }
  
  userLimit.count++;
  return { allowed: true };
}
```

**Limity sugerowane:**
- 100 requestów/minutę na użytkownika (dla POST /api/ratings)
- 1000 requestów/minutę na użytkownika (dla GET endpoints)

### 8.6 Monitoring wydajności

**Metryki do śledzenia:**
- Średni czas odpowiedzi (target: < 200ms)
- P95, P99 latency
- Error rate (target: < 0.1%)
- Throughput (requests/second)

**Narzędzia:**
- Supabase Dashboard (database metrics)
- Application Performance Monitoring (APM) - np. New Relic, DataDog
- Custom logging z timing information

**Przykład timing log:**
```typescript
const startTime = performance.now();
// ... operacja ...
const endTime = performance.now();
console.log(`Rating upsert took ${endTime - startTime}ms`);
```

---

## 9. Etapy wdrożenia

### Faza 1: Przygotowanie środowiska ✅ (Już zrobione)

**Krok 1.1:** Utworzenie/weryfikacja schematu bazy danych
- [x] Tabela `ratings` z kolumnami: id, user_id, tmdb_id, rating, created_at, updated_at
- [x] UNIQUE constraint na (user_id, tmdb_id)
- [x] CHECK constraint na rating (1-10)
- [x] Trigger dla automatycznej aktualizacji `updated_at`

**Krok 1.2:** Konfiguracja Row Level Security (RLS)
- [x] Włączenie RLS na tabeli `ratings`
- [x] Polityka INSERT dla authenticated users
- [x] Polityka UPDATE dla authenticated users
- [x] Polityka SELECT dla authenticated users

**Krok 1.3:** Definicja typów TypeScript
- [x] `RatingDto` w `src/types.ts`
- [x] `AddOrUpdateRatingCommand` w `src/types.ts`
- [x] Wygenerowanie `database.types.ts` przez Supabase CLI

### Faza 2: Implementacja serwisu ✅ (Już zrobione)

**Krok 2.1:** Utworzenie RatingsService
- [x] Plik: `src/lib/services/ratings.service.ts`
- [x] Metoda: `upsertRating(command, userId, supabase)`
- [x] Zwracanie `UpsertRatingResult` z flagą `wasCreated`

**Krok 2.2:** Implementacja logiki upsert
```typescript
const { data, error } = await supabase
  .from("ratings")
  .upsert(
    {
      user_id: userId,
      tmdb_id: command.tmdb_id,
      rating: command.rating,
    },
    {
      onConflict: "user_id,tmdb_id",
    }
  )
  .select("tmdb_id, rating, created_at, updated_at")
  .single();
```

**Krok 2.3:** Określenie typu operacji
```typescript
const wasCreated = data.created_at === data.updated_at;
```

### Faza 3: Implementacja endpointu API ⚠️ (Częściowo zrobione - wymaga uwierzytelnienia)

**Krok 3.1:** Utworzenie pliku endpointu
- [x] Plik: `src/pages/api/ratings.ts`
- [x] Export `prerender = false`

**Krok 3.2:** Implementacja walidacji Zod
- [x] Schema: `addOrUpdateRatingSchema`
- [x] Walidacja `tmdb_id` (positive integer)
- [x] Walidacja `rating` (1-10)

**Krok 3.3:** Implementacja POST handler
- [x] Parsowanie JSON body
- [x] Walidacja przez Zod
- [ ] **TODO:** Uwierzytelnienie użytkownika (zastąpić DEFAULT_USER_ID)
- [x] Wywołanie `RatingsService.upsertRating()`
- [x] Zwracanie odpowiedniego kodu statusu (201/200)
- [x] Formatowanie odpowiedzi JSON

**Krok 3.4:** Obsługa błędów
- [x] 400 dla nieprawidłowego JSON
- [x] 400 dla nieprawidłowej walidacji
- [ ] **TODO:** 401 dla nieuwierzytelnionego użytkownika
- [x] 422 dla naruszenia constraints
- [x] 500 dla nieoczekiwanych błędów

### Faza 4: Integracja uwierzytelniania 🔲 (Do zrobienia)

**Krok 4.1:** Implementacja pobierania użytkownika z sesji
```typescript
const { data: { user }, error } = await locals.supabase.auth.getUser();

if (error || !user) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Authentication required. Please log in to rate movies.",
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}

const userId = user.id;
```

**Krok 4.2:** Usunięcie DEFAULT_USER_ID
- Usunąć fallback do zmiennej środowiskowej
- Wymagać prawdziwej sesji użytkownika

**Krok 4.3:** Testowanie uwierzytelnienia
- Test: Request bez sesji → 401
- Test: Request z wygasłą sesją → 401
- Test: Request z prawidłową sesją → 200/201

### Faza 5: Testowanie 🔲 (Do zrobienia)

**Krok 5.1:** Testy jednostkowe serwisu
```typescript
// Przykładowy test dla RatingsService
describe('RatingsService.upsertRating', () => {
  it('should create a new rating and return wasCreated=true', async () => {
    // Mock Supabase client
    const mockSupabase = createMockSupabase();
    const service = new RatingsService();
    
    const result = await service.upsertRating(
      { tmdb_id: 808, rating: 8 },
      'user-123',
      mockSupabase
    );
    
    expect(result.wasCreated).toBe(true);
    expect(result.rating.tmdb_id).toBe(808);
  });
});
```

**Krok 5.2:** Testy integracyjne endpointu
- Test: POST z prawidłowymi danymi → 201 (new)
- Test: POST z tym samym tmdb_id → 200 (update)
- Test: POST z nieprawidłowym JSON → 400
- Test: POST z rating=0 → 400
- Test: POST z rating=11 → 400
- Test: POST z tmdb_id=-1 → 400
- Test: POST bez tmdb_id → 400
- Test: POST bez uwierzytelnienia → 401

**Krok 5.3:** Testy manualne przez Postman/Insomnia
- Przygotować kolekcję requestów
- Testować różne scenariusze
- Weryfikować kody statusu i formaty odpowiedzi

### Faza 6: Dokumentacja 🔲 (Do zrobienia)

**Krok 6.1:** Aktualizacja komentarzy JSDoc
- Upewnić się, że wszystkie publiczne metody są udokumentowane
- Dodać przykłady użycia

**Krok 6.2:** Utworzenie dokumentacji API
- Dokumentacja w formacie OpenAPI/Swagger (opcjonalnie)
- Lub plik README z przykładami użycia

**Krok 6.3:** Dokumentacja dla frontend developers
- Przykłady wywołań z JavaScript/TypeScript
- Obsługa błędów po stronie klienta
- Best practices

### Faza 7: Deployment 🔲 (Do zrobienia)

**Krok 7.1:** Weryfikacja zmiennych środowiskowych
- Upewnić się, że Supabase credentials są ustawione
- Usunąć DEFAULT_USER_ID z production env

**Krok 7.2:** Migracje bazy danych
- Upewnić się, że schema jest zsynchronizowany z production
- Uruchomić migracje jeśli potrzebne

**Krok 7.3:** Deploy do środowiska staging
- Przetestować na staging environment
- Weryfikacja integracji z Supabase production

**Krok 7.4:** Deploy do produkcji
- Monitoring po deployment
- Sprawdzenie metryk wydajności
- Gotowość do rollback w razie problemów

### Faza 8: Monitoring i utrzymanie 🔲 (Do zrobienia)

**Krok 8.1:** Konfiguracja monitoringu
- Error tracking (np. Sentry)
- Performance monitoring (APM)
- Database monitoring (Supabase Dashboard)

**Krok 8.2:** Alerty
- Alert dla error rate > 1%
- Alert dla response time > 1s
- Alert dla database issues

**Krok 8.3:** Regularne przeglądy
- Weekly: Sprawdzenie metryk wydajności
- Monthly: Analiza błędów i optymalizacja
- Quarterly: Refactoring i improvements

---

## 10. Checklisty implementacyjne

### ✅ Pre-implementation Checklist
- [x] Schemat bazy danych utworzony
- [x] RLS policies skonfigurowane
- [x] TypeScript types zdefiniowane
- [x] Projekt zgodny ze strukturą katalogów
- [x] Zrozumienie flow danych

### ⚠️ Implementation Checklist
- [x] RatingsService utworzony
- [x] Metoda upsertRating zaimplementowana
- [x] Endpoint /api/ratings utworzony
- [x] Walidacja Zod zaimplementowana
- [x] Obsługa błędów JSON parsing
- [x] Obsługa błędów walidacji
- [ ] **TODO:** Obsługa błędów uwierzytelnienia (401)
- [x] Obsługa błędów database constraints
- [x] Obsługa błędów nieoczekiwanych (500)
- [x] Różne kody statusu dla create vs update
- [x] Formatowanie odpowiedzi JSON

### 🔲 Testing Checklist
- [ ] Unit tests dla RatingsService
- [ ] Integration tests dla endpointu
- [ ] Manual testing (Postman/Insomnia)
- [ ] Edge cases testing
- [ ] Error scenarios testing
- [ ] Authentication testing
- [ ] RLS testing

### 🔲 Documentation Checklist
- [x] JSDoc comments w kodzie
- [ ] API documentation (OpenAPI/README)
- [ ] Frontend integration guide
- [ ] Error handling guide dla klientów
- [ ] Plan wdrożenia (ten dokument)

### 🔲 Deployment Checklist
- [ ] Environment variables skonfigurowane
- [ ] Database migrations uruchomione
- [ ] Staging deployment i testy
- [ ] Production deployment
- [ ] Smoke tests po deployment
- [ ] Monitoring skonfigurowany
- [ ] Alerty skonfigurowane

---

## 11. Dodatkowe uwagi

### Przyszłe ulepszenia (poza MVP)

1. **Batch rating endpoint**
   ```typescript
   POST /api/ratings/batch
   {
     "ratings": [
       { "tmdb_id": 808, "rating": 8 },
       { "tmdb_id": 550, "rating": 9 }
     ]
   }
   ```

2. **Soft delete zamiast hard delete**
   - Dodanie kolumny `deleted_at`
   - Możliwość "unrate" filmu

3. **Rating history**
   - Tabela `rating_history` do śledzenia zmian
   - Audyt zmian ocen

4. **Walidacja TMDb ID**
   - Sprawdzanie czy film istnieje w TMDb
   - Cachowanie metadanych filmu

5. **Webhooks/Events**
   - Emitowanie eventu po dodaniu/aktualizacji oceny
   - Integracja z systemem rekomendacji AI

### Znane ograniczenia MVP

1. **Brak paginacji** - obecnie nie dotyczy tego endpointu (single item)
2. **Brak rate limiting** - może być problematyczne przy dużej liczbie użytkowników
3. **Brak cache** - każdy request idzie do bazy danych
4. **DEFAULT_USER_ID w development** - musi być zastąpione prawdziwym uwierzytelnieniem

### Zgodność z wymaganiami PRD

| Wymaganie | Status | Uwagi |
|-----------|--------|-------|
| US-004: Ocenianie filmu w skali 1-10 | ✅ | Pełna implementacja |
| Zapis oceny do bazy danych | ✅ | Via RatingsService |
| Możliwość zmiany oceny | ✅ | Upsert logic |
| Możliwość usunięcia oceny | ⚠️ | DELETE endpoint (osobny) |
| Ocenienie = "obejrzany" | ✅ | Logika biznesowa spełniona |

---

## Podsumowanie

Endpoint **POST /api/ratings** jest kluczowym elementem aplikacji MyFilms, umożliwiającym użytkownikom ocenianie filmów w skali 1-10. Implementacja wykorzystuje wzorzec **upsert** dla uproszczenia operacji, **Zod** dla walidacji, **RLS** dla bezpieczeństwa, oraz **RatingsService** dla separacji logiki biznesowej.

**Aktualny stan implementacji:** ~80% gotowe
- ✅ Database schema
- ✅ Service layer
- ⚠️ API endpoint (brakuje prawdziwego uwierzytelniania)
- 🔲 Testing
- 🔲 Documentation
- 🔲 Deployment

**Następne kroki:**
1. Implementacja uwierzytelnienia użytkownika (zastąpienie DEFAULT_USER_ID)
2. Napisanie testów jednostkowych i integracyjnych
3. Deployment na staging i produkcję
4. Konfiguracja monitoringu

Ten plan implementacji zapewnia kompleksowe wskazówki dla zespołu programistów do skutecznego wdrożenia endpointu zgodnie z najlepszymi praktykami i wymaganiami projektu MyFilms.

