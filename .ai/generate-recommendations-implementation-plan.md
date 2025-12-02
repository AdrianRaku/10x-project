# API Endpoint Implementation Plan: Generate Movie Recommendations

## 1. Przegląd punktu końcowego

Endpoint `/api/recommendations` generuje spersonalizowane rekomendacje filmów dla zalogowanego użytkownika na podstawie jego historii ocen (minimum 10 wymaganych) oraz opcjonalnego promptu tekstowego. System wykorzystuje OpenRouter AI (model Google Gemini Flash 1.5) do analizy preferencji użytkownika i zwraca listę 5 rekomendowanych filmów z danymi z TMDb API. Endpoint implementuje mechanizm kontroli dziennego limitu zapytań AI w celu optymalizacji kosztów i zapobiegania nadużyciom.

**Główne funkcjonalności:**
- Weryfikacja autentykacji użytkownika
- Sprawdzenie minimum 10 ocen w historii
- Kontrola dziennego limitu zapytań AI (domyślnie 10/dzień)
- Pobranie i analiza historii ocen użytkownika
- Generowanie promptu systemowego z danymi użytkownika
- Wywołanie AI przez OpenRouter do generacji rekomendacji
- Logowanie zapytania w tabeli `ai_recommendation_requests`
- Zwrócenie listy 5 filmów w formacie JSON

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/recommendations`
- **Content-Type**: `application/json`

### Parametry:
- **Wymagane**: Brak (użytkownik musi być zalogowany - sprawdzane przez middleware/session)
- **Opcjonalne**: 
  - `prompt` (string, max 500 znaków) - Dodatkowy kontekst lub preferencje użytkownika, np. "Szukam czegoś w klimacie sci-fi z lat 80."

### Request Body Schema (Zod):
```typescript
const GenerateRecommendationsSchema = z.object({
  prompt: z.string().max(500, {
    message: "Prompt cannot exceed 500 characters"
  }).optional(),
});
```

### Przykład Request Body:
```json
{
  "prompt": "I'm in the mood for a mind-bending sci-fi movie."
}
```

Lub puste ciało żądania (brak promptu):
```json
{}
```

## 3. Wykorzystywane typy

### Istniejące typy (z `src/types.ts`):

**Command Model:**
```typescript
export type GenerateRecommendationsCommand = {
  prompt?: string;
};
```

**Response DTO:**
```typescript
export type RecommendationDto = {
  tmdb_id: number;
  title: string;
  year: number;
};
```

### Dodatkowe typy wewnętrzne (dla serwisu):

**Rating Entity (z bazy danych):**
```typescript
type UserRatingHistory = {
  tmdb_id: number;
  rating: number;
}[];
```

**AI Response Schema (Zod - dla walidacji odpowiedzi z OpenRouter):**
```typescript
const RecommendationSchema = z.object({
  tmdb_id: z.number().int().positive(),
  title: z.string().min(1),
  year: z.number().int().min(1888).max(2100), // Rok wynalezienia kina do rozumnego maksimum
});

const RecommendationsResponseSchema = z.object({
  recommendations: z.array(RecommendationSchema).length(5),
});
```

**Struktura Response Wrapper:**
```typescript
type RecommendationsResponse = {
  data: RecommendationDto[];
};
```

## 4. Szczegóły odpowiedzi

### Success Response (200 OK):
```json
{
  "data": [
    { "tmdb_id": 101, "title": "Inception", "year": 2010 },
    { "tmdb_id": 102, "title": "The Matrix", "year": 1999 },
    { "tmdb_id": 103, "title": "Blade Runner 2049", "year": 2017 },
    { "tmdb_id": 104, "title": "Arrival", "year": 2016 },
    { "tmdb_id": 105, "title": "Interstellar", "year": 2014 }
  ]
}
```

### Error Responses:

**400 Bad Request** - Nieprawidłowe dane wejściowe:
```json
{
  "error": "Bad Request",
  "message": "Invalid request data",
  "details": {
    "fieldErrors": {
      "prompt": ["Prompt cannot exceed 500 characters"]
    }
  }
}
```

**401 Unauthorized** - Brak autentykacji:
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**403 Forbidden** - Mniej niż 10 ocen:
```json
{
  "error": "Forbidden",
  "message": "You must have at least 10 rated movies to generate recommendations",
  "details": {
    "currentRatingsCount": 7,
    "requiredRatingsCount": 10
  }
}
```

**429 Too Many Requests** - Przekroczony dzienny limit:
```json
{
  "error": "Too Many Requests",
  "message": "Daily recommendation limit exceeded. Please try again tomorrow.",
  "details": {
    "dailyLimit": 10,
    "requestsToday": 10,
    "resetTime": "2025-12-01T00:00:00Z"
  }
}
```

**500 Internal Server Error** - Błąd AI lub serwera:
```json
{
  "error": "Internal Server Error",
  "message": "Failed to generate recommendations. Please try again later."
}
```

## 5. Przepływ danych

### Diagram przepływu:
```
Client (POST /api/recommendations)
    ↓
[1] Endpoint (/src/pages/api/recommendations.ts)
    ↓ Walidacja JSON body (Zod)
    ↓ Sprawdzenie autentykacji (Supabase Auth)
    ↓
[2] RecommendationsService.generateRecommendations()
    ↓
[3] Sprawdzenie liczby ocen użytkownika (Supabase query)
    ↓ (< 10) → 403 Forbidden
    ↓ (>= 10) → Kontynuuj
    ↓
[4] Sprawdzenie dziennego limitu (query ai_recommendation_requests)
    ↓ (limit przekroczony) → 429 Too Many Requests
    ↓ (w limicie) → Kontynuuj
    ↓
[5] Pobranie historii ocen użytkownika (Supabase query ratings)
    ↓
[6] Budowa promptu systemowego + user prompt
    ↓
[7] Wywołanie OpenRouterService.generateChatCompletion()
    ↓ Request do OpenRouter API
    ↓ Response z AI (JSON schema enforced)
    ↓
[8] Parsowanie i walidacja odpowiedzi AI (Zod)
    ↓ (błąd parsowania) → 500 Internal Server Error
    ↓ (sukces) → Kontynuuj
    ↓
[9] Zapis logu do ai_recommendation_requests (INSERT)
    ↓
[10] Zwrócenie 200 OK z tablicą RecommendationDto[]
    ↓
Client receives recommendations
```

### Szczegółowe interakcje z bazą danych:

**Krok 3 - Sprawdzenie liczby ocen:**
```sql
SELECT COUNT(*) FROM ratings WHERE user_id = $1;
```

**Krok 4 - Sprawdzenie dziennego limitu:**
```sql
SELECT COUNT(*) 
FROM ai_recommendation_requests 
WHERE user_id = $1 
  AND created_at >= CURRENT_DATE 
  AND created_at < CURRENT_DATE + INTERVAL '1 day';
```

**Krok 5 - Pobranie historii ocen:**
```sql
SELECT tmdb_id, rating 
FROM ratings 
WHERE user_id = $1 
ORDER BY created_at DESC;
```

**Krok 9 - Logowanie zapytania:**
```sql
INSERT INTO ai_recommendation_requests (user_id, created_at) 
VALUES ($1, NOW());
```

### Interakcja z OpenRouter API:

**Request do OpenRouter:**
```json
{
  "model": "google/gemini-flash-1.5",
  "messages": [
    {
      "role": "system",
      "content": "You are a movie recommendation expert. Based on user's rating history, suggest 5 movies they would enjoy. Respond ONLY with valid JSON matching the schema. Consider rating values: 8-10 = loved, 5-7 = liked, 1-4 = disliked.\n\nUser's rating history:\n- Movie ID 808 (Rating: 9)\n- Movie ID 550 (Rating: 10)\n..."
    },
    {
      "role": "user",
      "content": "I'm in the mood for a mind-bending sci-fi movie."
    }
  ],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "movie_recommendations",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "recommendations": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "tmdb_id": { "type": "number" },
                "title": { "type": "string" },
                "year": { "type": "number" }
              },
              "required": ["tmdb_id", "title", "year"]
            },
            "minItems": 5,
            "maxItems": 5
          }
        },
        "required": ["recommendations"]
      }
    }
  },
  "temperature": 0.7,
  "max_tokens": 1000
}
```

## 6. Względy bezpieczeństwa

### Autentykacja i Autoryzacja:
1. **Weryfikacja sesji użytkownika**:
   ```typescript
   const session = await locals.supabase.auth.getSession();
   if (!session.data.session) {
     return new Response(
       JSON.stringify({ error: "Unauthorized", message: "Authentication required" }),
       { status: 401 }
     );
   }
   const userId = session.data.session.user.id;
   ```

2. **Row Level Security (RLS)**:
   - Wszystkie zapytania do `ratings` i `ai_recommendation_requests` automatycznie filtrowane przez RLS
   - Użytkownik ma dostęp tylko do swoich danych

### Walidacja danych wejściowych:
1. **Schemat Zod dla promptu**:
   - Maksymalna długość: 500 znaków (ochrona przed nadmiernym zużyciem tokenów AI)
   - Opcjonalność: prompt może być pominięty
   
2. **Sanityzacja promptu** (w RecommendationsService):
   ```typescript
   private sanitizePrompt(prompt?: string): string | undefined {
     if (!prompt) return undefined;
     // Usuń potencjalnie niebezpieczne znaki/sekwencje
     return prompt
       .replace(/[<>]/g, '') // usuń HTML tags
       .trim();
   }
   ```

### Rate Limiting:
1. **Dzienny limit zapytań AI**:
   - Domyślnie: 10 zapytań na użytkownika dziennie
   - Konfigurowalny przez zmienną środowiskową: `DAILY_RECOMMENDATION_LIMIT`
   - Reset o północy UTC

2. **Implementacja**:
   ```typescript
   const DAILY_LIMIT = parseInt(import.meta.env.DAILY_RECOMMENDATION_LIMIT || '10');
   
   const { count } = await supabase
     .from('ai_recommendation_requests')
     .select('*', { count: 'exact', head: true })
     .gte('created_at', new Date().setHours(0, 0, 0, 0));
   
   if (count >= DAILY_LIMIT) {
     throw new TooManyRequestsError();
   }
   ```

### Ochrona przed Prompt Injection:
1. **Struktura promptu systemowego**:
   - Wyraźne oddzielenie danych użytkownika od instrukcji systemowych
   - Użycie JSON Schema dla wymuszonego formatu odpowiedzi

2. **Walidacja odpowiedzi AI**:
   - Rygorystyczna walidacja Zod dla parsowania odpowiedzi
   - Odrzucenie odpowiedzi niezgodnych ze schematem

### Ochrona kluczy API:
1. **Przechowywanie w zmiennych środowiskowych**:
   ```typescript
   const apiKey = import.meta.env.OPENROUTER_API_KEY;
   if (!apiKey) {
     throw new Error('OPENROUTER_API_KEY not configured');
   }
   ```

2. **Nigdy nie eksponować klucza API na frontend**:
   - OpenRouterService używany tylko po stronie serwera
   - Endpoint API działa wyłącznie server-side (SSR)

### Logowanie i Monitoring:
1. **Logowanie błędów**:
   ```typescript
   console.error('[recommendations] Error details:', {
     userId,
     error: error instanceof Error ? error.message : 'Unknown error',
     timestamp: new Date().toISOString()
   });
   ```

2. **Nie logować wrażliwych danych**:
   - Nie logować pełnej historii ocen w production
   - Nie logować pełnych odpowiedzi AI (tylko metadane)

## 7. Obsługa błędów

### Hierarchia błędów:

#### 1. Błędy walidacji (400 Bad Request):
**Scenariusz**: Nieprawidłowy format JSON lub niezgodność ze schematem Zod
```typescript
try {
  const body = await request.json();
} catch {
  return new Response(
    JSON.stringify({ 
      error: "Bad Request", 
      message: "Invalid JSON in request body" 
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}

const validation = GenerateRecommendationsSchema.safeParse(body);
if (!validation.success) {
  return new Response(
    JSON.stringify({
      error: "Bad Request",
      message: "Invalid request data",
      details: validation.error.flatten()
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}
```

#### 2. Błędy autentykacji (401 Unauthorized):
**Scenariusz**: Brak sesji użytkownika
```typescript
const session = await locals.supabase.auth.getSession();
if (!session.data.session) {
  return new Response(
    JSON.stringify({ 
      error: "Unauthorized", 
      message: "Authentication required" 
    }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

#### 3. Błędy biznesowe (403 Forbidden):
**Scenariusz**: Użytkownik ma mniej niż 10 ocen

W RecommendationsService:
```typescript
class InsufficientRatingsError extends Error {
  constructor(public currentCount: number, public requiredCount: number = 10) {
    super(`User has only ${currentCount} ratings, minimum ${requiredCount} required`);
    this.name = 'InsufficientRatingsError';
  }
}

// W metodzie serwisu:
const ratingsCount = await this.getRatingsCount(userId, supabase);
if (ratingsCount < 10) {
  throw new InsufficientRatingsError(ratingsCount);
}
```

W endpoincie:
```typescript
catch (error) {
  if (error instanceof InsufficientRatingsError) {
    return new Response(
      JSON.stringify({
        error: "Forbidden",
        message: "You must have at least 10 rated movies to generate recommendations",
        details: {
          currentRatingsCount: error.currentCount,
          requiredRatingsCount: error.requiredCount
        }
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

#### 4. Błędy rate limiting (429 Too Many Requests):
**Scenariusz**: Przekroczony dzienny limit zapytań

W RecommendationsService:
```typescript
class DailyLimitExceededError extends Error {
  constructor(
    public dailyLimit: number,
    public requestsToday: number,
    public resetTime: Date
  ) {
    super(`Daily limit of ${dailyLimit} requests exceeded`);
    this.name = 'DailyLimitExceededError';
  }
}

// W metodzie serwisu:
const requestsToday = await this.getRequestsCountToday(userId, supabase);
if (requestsToday >= dailyLimit) {
  const resetTime = new Date();
  resetTime.setUTCHours(24, 0, 0, 0); // Następna północ UTC
  throw new DailyLimitExceededError(dailyLimit, requestsToday, resetTime);
}
```

W endpoincie:
```typescript
catch (error) {
  if (error instanceof DailyLimitExceededError) {
    return new Response(
      JSON.stringify({
        error: "Too Many Requests",
        message: "Daily recommendation limit exceeded. Please try again tomorrow.",
        details: {
          dailyLimit: error.dailyLimit,
          requestsToday: error.requestsToday,
          resetTime: error.resetTime.toISOString()
        }
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

#### 5. Błędy zewnętrznych serwisów (500 Internal Server Error):
**Scenariusz A**: Błąd komunikacji z OpenRouter API
```typescript
class OpenRouterError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

// W OpenRouterService (już obsłużone):
if (!response.ok) {
  throw new OpenRouterError(
    `OpenRouter API error: ${response.status}`,
    response.status
  );
}
```

**Scenariusz B**: Błąd parsowania odpowiedzi AI
```typescript
class AIResponseParsingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIResponseParsingError';
  }
}

// W RecommendationsService:
const content = aiResponse.choices[0]?.message?.content;
if (!content) {
  throw new AIResponseParsingError('Empty response from AI');
}

let parsedContent;
try {
  parsedContent = JSON.parse(content);
} catch {
  throw new AIResponseParsingError('Invalid JSON in AI response');
}

const validation = RecommendationsResponseSchema.safeParse(parsedContent);
if (!validation.success) {
  throw new AIResponseParsingError('AI response does not match expected schema');
}
```

**Scenariusz C**: Błędy bazy danych
```typescript
// Supabase automatycznie rzuca błędy, łapiemy je w endpoincie:
catch (error) {
  console.error('[recommendations] Database error:', error);
  return new Response(
    JSON.stringify({
      error: "Internal Server Error",
      message: "Database operation failed"
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

#### 6. Obsługa wszystkich nieoczekiwanych błędów:
```typescript
catch (error) {
  // Logowanie szczegółowe dla debugowania
  console.error('[recommendations] Unexpected error:', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    userId,
    timestamp: new Date().toISOString()
  });

  // Zwrócenie generycznego komunikatu użytkownikowi
  return new Response(
    JSON.stringify({
      error: "Internal Server Error",
      message: "Failed to generate recommendations. Please try again later."
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

### Strategia obsługi błędów w serwisie:
- **Rzucanie typowanych błędów**: Własne klasy błędów dla różnych scenariuszy
- **Early returns**: Sprawdzanie warunków na początku metod
- **Propagacja błędów**: Pozwalanie błędom wypłynąć do endpointu dla scentralizowanej obsługi
- **Szczegółowe logowanie**: Logowanie kontekstu błędów dla ułatwienia debugowania

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła:

#### 1. Zapytania do bazy danych:
**Problem**: Trzy oddzielne zapytania do Supabase (liczba ocen, limit dzienny, historia ocen)

**Optymalizacja**:
```typescript
// Zamiast 3 osobnych zapytań, użyj jednego zapytania z wieloma operacjami
const [ratingsData, requestsCount] = await Promise.all([
  supabase
    .from('ratings')
    .select('tmdb_id, rating')
    .eq('user_id', userId),
  
  supabase
    .from('ai_recommendation_requests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', new Date().setHours(0, 0, 0, 0))
]);

// Liczba ocen to po prostu długość tablicy
const ratingsCount = ratingsData.data?.length || 0;
```

**Oczekiwany czas odpowiedzi**: 50-150ms (przy dobrym połączeniu z Supabase)

#### 2. Wywołanie OpenRouter API:
**Problem**: Największe opóźnienie (2-10 sekund w zależności od modelu i obciążenia)

**Optymalizacje**:
- Użycie szybkiego modelu: `google/gemini-flash-1.5` (już uwzględnione)
- Ograniczenie `max_tokens` do rozsądnej wartości (1000)
- Timeout dla zapytania AI:
  ```typescript
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
  
  try {
    const aiResponse = await openRouterService.generateChatCompletion(request, {
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutId);
  }
  ```

**Oczekiwany czas odpowiedzi**: 2-8 sekund

#### 3. Parsowanie i walidacja JSON:
**Problem**: Walidacja Zod może być kosztowna dla dużych obiektów

**Optymalizacja**:
- Schemat Zod jest prosty (tylko 5 obiektów w tablicy)
- Używamy `.safeParse()` zamiast `.parse()` dla lepszej kontroli błędów

**Oczekiwany czas**: < 5ms

### Całkowity oczekiwany czas odpowiedzi:
- **Optimistic case**: 2-3 sekundy
- **Typical case**: 3-6 sekund
- **Worst case**: 8-15 sekund (z timeoutem)

### Strategie cache'owania:
**Nie zalecane** dla tego endpointu, ponieważ:
- Rekomendacje mają być świeże i mogą się zmieniać
- Użytkownik może użyć różnych promptów
- Historia ocen może się zmieniać między zapytaniami

### Monitoring wydajności:
```typescript
const startTime = Date.now();

try {
  // ... implementacja endpointu
  
  const duration = Date.now() - startTime;
  console.log(`[recommendations] Request completed in ${duration}ms`);
  
  // Opcjonalnie: wysyłanie metryk do systemu monitoringu
  if (duration > 10000) {
    console.warn(`[recommendations] Slow request detected: ${duration}ms`);
  }
} catch (error) {
  const duration = Date.now() - startTime;
  console.error(`[recommendations] Request failed after ${duration}ms:`, error);
}
```

### Optymalizacja kosztów AI:
1. **Dzienny limit**: Zapobiega nadmiernemu zużyciu API (10 zapytań/użytkownik/dzień)
2. **Ograniczenie długości promptu**: Max 500 znaków
3. **Ograniczenie max_tokens**: 1000 tokenów (wystarczające dla 5 rekomendacji)
4. **Użycie taniego modelu**: Gemini Flash 1.5 jest znacznie tańszy niż GPT-4

### Database indexing:
Już zaimplementowane w migracjach:
- `ai_recommendation_requests_user_id_created_at_idx` - dla sprawdzania dziennego limitu
- `ratings_user_id_idx` - dla pobierania historii ocen

## 9. Etapy wdrożenia

### Krok 1: Utworzenie klas błędów dla serwisu
**Plik**: `src/lib/services/recommendations.service.ts` (nowy plik)

Zdefiniuj własne klasy błędów:
```typescript
// Custom error classes
export class InsufficientRatingsError extends Error {
  constructor(public currentCount: number, public requiredCount: number = 10) {
    super(`User has only ${currentCount} ratings, minimum ${requiredCount} required`);
    this.name = 'InsufficientRatingsError';
  }
}

export class DailyLimitExceededError extends Error {
  constructor(
    public dailyLimit: number,
    public requestsToday: number,
    public resetTime: Date
  ) {
    super(`Daily limit of ${dailyLimit} requests exceeded`);
    this.name = 'DailyLimitExceededError';
  }
}

export class AIResponseParsingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIResponseParsingError';
  }
}
```

### Krok 2: Implementacja RecommendationsService
**Plik**: `src/lib/services/recommendations.service.ts`

Utwórz klasę serwisu z następującymi metodami:

```typescript
import { z } from 'zod';
import type { SupabaseClient } from '../../db/supabase.client';
import type { RecommendationDto } from '../../types';
import { OpenRouterService } from './openrouter.service';

// Schematy walidacji
const RecommendationSchema = z.object({
  tmdb_id: z.number().int().positive(),
  title: z.string().min(1),
  year: z.number().int().min(1888).max(2100),
});

const RecommendationsResponseSchema = z.object({
  recommendations: z.array(RecommendationSchema).length(5),
});

type UserRating = {
  tmdb_id: number;
  rating: number;
};

export class RecommendationsService {
  private readonly MINIMUM_RATINGS = 10;
  private readonly DAILY_LIMIT: number;

  constructor(dailyLimit?: number) {
    this.DAILY_LIMIT = dailyLimit || 10;
  }

  /**
   * Główna metoda generowania rekomendacji
   */
  async generateRecommendations(
    userId: string,
    prompt: string | undefined,
    supabase: SupabaseClient,
    openRouterApiKey: string
  ): Promise<RecommendationDto[]> {
    // 1. Pobierz dane użytkownika (oceny + sprawdź limit)
    const [ratingsData, requestsCount] = await Promise.all([
      this.getUserRatings(userId, supabase),
      this.getRequestsCountToday(userId, supabase),
    ]);

    // 2. Sprawdź minimum ocen
    if (ratingsData.length < this.MINIMUM_RATINGS) {
      throw new InsufficientRatingsError(ratingsData.length, this.MINIMUM_RATINGS);
    }

    // 3. Sprawdź dzienny limit
    if (requestsCount >= this.DAILY_LIMIT) {
      const resetTime = new Date();
      resetTime.setUTCHours(24, 0, 0, 0);
      throw new DailyLimitExceededError(this.DAILY_LIMIT, requestsCount, resetTime);
    }

    // 4. Generuj rekomendacje przez AI
    const recommendations = await this.callAIForRecommendations(
      ratingsData,
      prompt,
      openRouterApiKey
    );

    // 5. Zaloguj zapytanie
    await this.logRecommendationRequest(userId, supabase);

    return recommendations;
  }

  /**
   * Pobiera historię ocen użytkownika
   */
  private async getUserRatings(
    userId: string,
    supabase: SupabaseClient
  ): Promise<UserRating[]> {
    const { data, error } = await supabase
      .from('ratings')
      .select('tmdb_id, rating')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Sprawdza liczbę zapytań dzisiaj
   */
  private async getRequestsCountToday(
    userId: string,
    supabase: SupabaseClient
  ): Promise<number> {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('ai_recommendation_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString());

    if (error) {
      throw error;
    }

    return count || 0;
  }

  /**
   * Wywołuje AI do generowania rekomendacji
   */
  private async callAIForRecommendations(
    ratings: UserRating[],
    userPrompt: string | undefined,
    apiKey: string
  ): Promise<RecommendationDto[]> {
    const openRouterService = new OpenRouterService(apiKey);

    // Budowa promptu systemowego
    const systemPrompt = this.buildSystemPrompt(ratings);

    // Schemat JSON dla odpowiedzi
    const responseSchema = {
      type: 'object',
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tmdb_id: { type: 'number', description: 'TMDb movie ID' },
              title: { type: 'string', description: 'Movie title' },
              year: { type: 'number', description: 'Release year' },
            },
            required: ['tmdb_id', 'title', 'year'],
          },
          minItems: 5,
          maxItems: 5,
        },
      },
      required: ['recommendations'],
    };

    // Wywołanie OpenRouter
    const aiResponse = await openRouterService.generateChatCompletion({
      model: 'google/gemini-flash-1.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt || 'Suggest 5 great movies for me.' },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'movie_recommendations',
          strict: true,
          schema: responseSchema,
        },
      },
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Parsowanie odpowiedzi
    const content = aiResponse.choices[0]?.message?.content;
    if (!content) {
      throw new AIResponseParsingError('Empty response from AI');
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch {
      throw new AIResponseParsingError('Invalid JSON in AI response');
    }

    const validation = RecommendationsResponseSchema.safeParse(parsedContent);
    if (!validation.success) {
      throw new AIResponseParsingError(
        `AI response validation failed: ${validation.error.message}`
      );
    }

    return validation.data.recommendations;
  }

  /**
   * Buduje prompt systemowy z historią ocen
   */
  private buildSystemPrompt(ratings: UserRating[]): string {
    const ratingsText = ratings
      .map((r) => `- TMDb ID ${r.tmdb_id}: Rating ${r.rating}/10`)
      .join('\n');

    return `You are an expert movie recommendation system. Based on the user's rating history below, suggest 5 movies they would love. 

Rating interpretation:
- 8-10: User loved these movies
- 5-7: User liked these movies  
- 1-4: User disliked these movies

User's rating history:
${ratingsText}

Provide 5 diverse movie recommendations with valid TMDb IDs, titles, and release years. Ensure variety in genres and eras while matching user preferences.`;
  }

  /**
   * Loguje zapytanie do bazy danych
   */
  private async logRecommendationRequest(
    userId: string,
    supabase: SupabaseClient
  ): Promise<void> {
    const { error } = await supabase
      .from('ai_recommendation_requests')
      .insert({ user_id: userId });

    if (error) {
      // Loguj błąd, ale nie rzucaj - nie chcemy psuć response jeśli logowanie się nie powiodło
      console.error('[recommendations] Failed to log request:', error);
    }
  }

  /**
   * Sanityzuje prompt użytkownika
   */
  private sanitizePrompt(prompt?: string): string | undefined {
    if (!prompt) return undefined;
    return prompt.replace(/[<>]/g, '').trim();
  }
}
```

### Krok 3: Utworzenie endpointu API
**Plik**: `src/pages/api/recommendations.ts` (nowy plik)

```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { RecommendationDto } from '../../types';
import {
  RecommendationsService,
  InsufficientRatingsError,
  DailyLimitExceededError,
  AIResponseParsingError,
} from '../../lib/services/recommendations.service';

export const prerender = false;

/**
 * Schemat walidacji dla request body
 */
const GenerateRecommendationsSchema = z.object({
  prompt: z
    .string()
    .max(500, {
      message: 'Prompt cannot exceed 500 characters',
    })
    .optional(),
});

/**
 * POST /api/recommendations
 * Generuje rekomendacje filmów dla zalogowanego użytkownika
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = Date.now();

  try {
    // 1. Walidacja JSON body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid JSON in request body',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Walidacja schematu
    const validation = GenerateRecommendationsSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid request data',
          details: validation.error.flatten(),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Sprawdzenie autentykacji
    const session = await locals.supabase.auth.getSession();
    if (!session.data.session) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = session.data.session.user.id;

    // 4. Sprawdzenie konfiguracji API key
    const openRouterApiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      console.error('[recommendations] OPENROUTER_API_KEY not configured');
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'Service temporarily unavailable',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 5. Generowanie rekomendacji przez serwis
    const dailyLimit = parseInt(import.meta.env.DAILY_RECOMMENDATION_LIMIT || '10');
    const recommendationsService = new RecommendationsService(dailyLimit);

    const recommendations: RecommendationDto[] =
      await recommendationsService.generateRecommendations(
        userId,
        validation.data.prompt,
        locals.supabase,
        openRouterApiKey
      );

    // 6. Sukces - zwróć rekomendacje
    const duration = Date.now() - startTime;
    console.log(`[recommendations] Request completed in ${duration}ms for user ${userId}`);

    return new Response(
      JSON.stringify({
        data: recommendations,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    // Obsługa znanych błędów biznesowych
    if (error instanceof InsufficientRatingsError) {
      console.log(`[recommendations] Insufficient ratings after ${duration}ms`);
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          message: 'You must have at least 10 rated movies to generate recommendations',
          details: {
            currentRatingsCount: error.currentCount,
            requiredRatingsCount: error.requiredCount,
          },
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (error instanceof DailyLimitExceededError) {
      console.log(`[recommendations] Daily limit exceeded after ${duration}ms`);
      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Daily recommendation limit exceeded. Please try again tomorrow.',
          details: {
            dailyLimit: error.dailyLimit,
            requestsToday: error.requestsToday,
            resetTime: error.resetTime.toISOString(),
          },
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (error instanceof AIResponseParsingError) {
      console.error(`[recommendations] AI parsing error after ${duration}ms:`, error.message);
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to process AI response. Please try again.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Obsługa nieznanych błędów
    console.error(`[recommendations] Unexpected error after ${duration}ms:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to generate recommendations. Please try again later.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
```

### Krok 4: Dodanie zmiennych środowiskowych
**Plik**: `.env` (dodaj jeśli nie istnieje)

```bash
# Klucz API OpenRouter (wymagany)
OPENROUTER_API_KEY=sk-or-v1-...

# Dzienny limit rekomendacji na użytkownika (opcjonalny, domyślnie 10)
DAILY_RECOMMENDATION_LIMIT=10
```

**Plik**: `.env.example` (dodaj dla dokumentacji)
```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
DAILY_RECOMMENDATION_LIMIT=10
```

### Krok 5: Walidacja TypeScript
Uruchom TypeScript compiler w trybie sprawdzania:
```bash
npx tsc --noEmit
```

Upewnij się, że nie ma błędów typowania.

### Krok 6: Testowanie endpointu

**Test 1: Sukces (użytkownik z 10+ ocenami)**
```bash
curl -X POST http://localhost:4321/api/recommendations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
  -d '{"prompt": "I love sci-fi and thrillers"}'
```

Oczekiwany wynik: 200 OK z listą 5 rekomendacji

**Test 2: Brak autentykacji**
```bash
curl -X POST http://localhost:4321/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{}'
```

Oczekiwany wynik: 401 Unauthorized

**Test 3: Za mało ocen**
(Użyj użytkownika z < 10 ocenami)

Oczekiwany wynik: 403 Forbidden z informacją o braku wystarczającej liczby ocen

**Test 4: Przekroczony limit dzienny**
(Wywołaj 11 razy tego samego dnia)

Oczekiwany wynik: 429 Too Many Requests

**Test 5: Nieprawidłowy prompt**
```bash
curl -X POST http://localhost:4321/api/recommendations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
  -d '{"prompt": "'"$(python3 -c 'print("a" * 501)')"'"}'
```

Oczekiwany wynik: 400 Bad Request (prompt za długi)

### Krok 7: Monitorowanie i logowanie
Dodaj opcjonalne logowanie do zewnętrznego systemu monitoringu (np. Sentry, LogRocket) w późniejszej fazie.

### Krok 8: Dokumentacja API
Zaktualizuj dokumentację API (README.md lub dedykowany plik docs) z:
- Przykładami użycia
- Kodami błędów
- Limitami i ograniczeniami
- Wymaganiami autentykacji

### Krok 9: Testy integracyjne (opcjonalne, ale zalecane)
Utwórz testy integracyjne w frameworku jak Vitest lub Jest:

**Plik**: `src/lib/services/recommendations.service.test.ts`
```typescript
import { describe, it, expect, vi } from 'vitest';
import { RecommendationsService, InsufficientRatingsError } from './recommendations.service';

describe('RecommendationsService', () => {
  it('should throw InsufficientRatingsError when user has less than 10 ratings', async () => {
    // Mock Supabase client
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: Array(5).fill({ tmdb_id: 1, rating: 8 }),
            error: null,
          }),
        }),
      }),
    };

    const service = new RecommendationsService(10);

    await expect(
      service.generateRecommendations(
        'user-id',
        undefined,
        mockSupabase as any,
        'api-key'
      )
    ).rejects.toThrow(InsufficientRatingsError);
  });

  // Więcej testów...
});
```

### Krok 10: Deployment
1. Upewnij się, że zmienne środowiskowe są ustawione w środowisku produkcyjnym (DigitalOcean)
2. Deploy przez GitHub Actions
3. Zweryfikuj działanie na produkcji przez wywołanie endpointu

---

## Podsumowanie

Ten plan implementacji zapewnia:
- ✅ Pełną walidację danych wejściowych i wyjściowych
- ✅ Solidną obsługę błędów z czytelnymi komunikatami
- ✅ Bezpieczeństwo przez autentykację, RLS i rate limiting
- ✅ Optymalizację wydajności (równoległe zapytania, timeout AI)
- ✅ Separację logiki biznesowej (service layer)
- ✅ Zgodność z architekturą projektu i tech stackiem
- ✅ Możliwość testowania i monitorowania
- ✅ Dokumentację i przykłady użycia

Endpoint jest gotowy do implementacji zgodnie z najlepszymi praktykami dla aplikacji produkcyjnych.

