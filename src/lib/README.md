# Nowe moduły po refaktoryzacji

Ten katalog zawiera zrefaktoryzowane moduły zgodnie z wzorcami projektowymi i zasadami SOLID.

## 📁 Struktura katalogów

```
src/lib/
├── commands/              # Command Pattern
│   └── GenerateRecommendationsCommand.ts
├── middleware/            # Middleware Pattern
│   └── validation.middleware.ts
├── repositories/          # Repository Pattern
│   ├── RatingRepository.ts
│   └── RecommendationRequestRepository.ts
├── services/
│   ├── recommendations/   # Strategy + Builder Patterns
│   │   ├── strategies/
│   │   │   ├── RecommendationStrategy.ts
│   │   │   └── AIRecommendationStrategy.ts
│   │   └── PromptBuilder.ts
│   ├── tmdb/             # Facade Pattern
│   │   ├── TMDbClient.ts
│   │   └── MovieClient.ts
│   ├── CacheService.ts
│   ├── HttpClient.ts
│   ├── movies.service.refactored.ts
│   └── recommendations.service.refactored.ts
└── utils/
    └── Result.ts         # Result Pattern
```

## 🎯 Wzorce projektowe

### 1. Repository Pattern
**Pliki:** `repositories/*.ts`

Separacja logiki dostępu do danych od logiki biznesowej.

```typescript
const repository = new RatingRepository(supabase);
const ratings = await repository.getUserRatings(userId);
```

### 2. Builder Pattern
**Plik:** `services/recommendations/PromptBuilder.ts`

Elastyczne budowanie obiektów z wieloma parametrami.

```typescript
const prompt = new PromptBuilder()
  .withRatings(ratings)
  .withUserContext(context)
  .buildSystemPrompt();
```

### 3. Strategy Pattern
**Pliki:** `services/recommendations/strategies/*.ts`

Wymienne algorytmy dla różnych przypadków użycia.

```typescript
const strategy = new AIRecommendationStrategy(supabase, apiKey);
const recommendations = await strategy.generate(userId, prompt);
```

### 4. Facade Pattern
**Pliki:** `services/tmdb/*.ts`

Uproszczony interfejs dla złożonego API.

```typescript
const moviesService = new MoviesServiceRefactored(apiKey, cache);
const movie = await moviesService.findMovieByTitleAndYear("Inception", 2010);
```

### 5. Command Pattern
**Plik:** `commands/GenerateRecommendationsCommand.ts`

Enkapsulacja operacji biznesowej.

```typescript
const command = new GenerateRecommendationsCommand(supabase);
const result = await command.execute(params);
```

### 6. Result Pattern
**Plik:** `utils/Result.ts`

Funkcyjne zarządzanie błędami.

```typescript
const result = await operation();
if (!result.success) {
  return handleError(result.error);
}
```

### 7. Middleware Pattern
**Plik:** `middleware/validation.middleware.ts`

Reużywalna logika pre-processing.

```typescript
const authResult = requireAuth(context);
const validationResult = await validateRequest(schema)(context);
```

## 🧪 Testowanie

Wszystkie moduły są zaprojektowane z myślą o testowaniu:

```typescript
// Przykład testu z mockami
const mockSupabase = { from: vi.fn().mockReturnValue(...) };
const repository = new RatingRepository(mockSupabase);
```

Testy znajdują się w: `src/test/unit/*.test.ts`

## 📖 Dokumentacja

- [REFACTORING.md](../../../REFACTORING.md) - Pełna dokumentacja refaktoryzacji
- [ARCHITECTURE.md](../../../ARCHITECTURE.md) - Diagramy architektury
- [REFACTORING_EXAMPLES.md](../../../REFACTORING_EXAMPLES.md) - Przykłady użycia
- [DEPLOYMENT_PLAN.md](../../../DEPLOYMENT_PLAN.md) - Plan wdrożenia

## 🚀 Quick Start

1. **Import nowych modułów:**
   ```typescript
   import { RatingRepository } from "@/lib/repositories/RatingRepository";
   import { MoviesServiceRefactored } from "@/lib/services/movies.service.refactored";
   ```

2. **Użyj w endpoint:**
   ```typescript
   import { requireAuth, validateRequest } from "@/lib/middleware/validation.middleware";
   
   export const POST: APIRoute = async (context) => {
     const authResult = requireAuth(context);
     if (!authResult.success) return authResult.response;
     // ...
   };
   ```

3. **Napisz testy:**
   ```typescript
   import { describe, it, expect, vi } from "vitest";
   
   describe("MyModule", () => {
     it("should work", async () => {
       // Test logic
     });
   });
   ```

## 🔄 Migracja ze starych modułów

```bash
# Użyj skryptu migracji
./scripts/migrate-refactoring.sh migrate
```

Lub ręcznie:
1. Zamień import ze starego na nowy moduł
2. Dostosuj wywołania API (jeśli potrzebne)
3. Uruchom testy

## ⚠️ Breaking Changes

Nowe moduły mają nieco inny interfejs niż stare:

### RecommendationsService
```typescript
// Stary
await service.generateRecommendations(userId, prompt, supabase, apiKey);

// Nowy (bez zmian - backward compatible)
await service.generateRecommendations(userId, prompt, supabase, apiKey);
```

### MoviesService
```typescript
// Stary
const service = new MoviesService(apiKey);

// Nowy
const service = new MoviesServiceRefactored(apiKey, cache); // cache optional
```

## 🐛 Troubleshooting

### Problem: TypeScript nie znajduje typów
**Rozwiązanie:** Przebuduj projekt
```bash
npm run build
```

### Problem: Testy nie przechodzą
**Rozwiązanie:** Sprawdź mocki i importy
```typescript
import type { SupabaseClient } from "@/db/supabase.client";
```

### Problem: Cache nie działa
**Rozwiązanie:** Upewnij się, że przekazujesz instancję CacheService
```typescript
const cache = new CacheService();
const service = new MoviesServiceRefactored(apiKey, cache);
```

## 📝 Konwencje nazewnictwa

- **Repositories:** `*Repository.ts` (np. `RatingRepository.ts`)
- **Services:** `*.service.refactored.ts` (tymczasowo, później bez `.refactored`)
- **Commands:** `*Command.ts` (np. `GenerateRecommendationsCommand.ts`)
- **Strategies:** `*Strategy.ts` (np. `AIRecommendationStrategy.ts`)
- **Middleware:** `*.middleware.ts` (np. `validation.middleware.ts`)

## 🤝 Contributing

1. Przeczytaj [REFACTORING.md](../../../REFACTORING.md)
2. Napisz testy dla nowych funkcji
3. Zachowaj wzorce projektowe
4. Dodaj dokumentację JSDoc
5. Submit PR

## 📊 Metryki

| Metryka | Wartość |
|---------|---------|
| Średnia LOC na plik | ~95 |
| Pokrycie testami | ~60% (cel: 80%) |
| Złożoność cyklomatyczna | ~6 |
| Duplikacja kodu | ~3% |

---

**Wersja:** 1.0.0  
**Data:** 2025-12-09  
**Autor:** GitHub Copilot

