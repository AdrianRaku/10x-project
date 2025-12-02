# Przewodnik Implementacji Usługi OpenRouter

## 1. Opis usługi

`OpenRouterService` to klasa TypeScript zaprojektowana do interakcji z API OpenRouter w celu generowania uzupełnień czatu przy użyciu różnych modeli językowych (LLM). Usługa ta hermetyzuje logikę związaną z tworzeniem żądań, obsługą odpowiedzi, zarządzaniem błędami i konfigurowaniem parametrów modelu. Została stworzona z myślą o modułowości i łatwej integracji w ramach aplikacji opartej na Astro i TypeScript.

## 2. Opis konstruktora

Konstruktor inicjalizuje usługę, ustawiając klucz API OpenRouter, który jest niezbędny do autoryzacji żądań.

```typescript
import { z } from 'zod';

// Definicje schematów Zod dla walidacji
const OpenRouterRequestSchema = z.object({
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
  })),
  response_format: z.optional(z.object({
    type: z.literal('json_schema'),
    json_schema: z.object({
      name: z.string(),
      strict: z.boolean().optional(),
      schema: z.record(z.unknown()),
    }),
  })),
  // Inne opcjonalne parametry modelu
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
});

const OpenRouterResponseSchema = z.object({
  id: z.string(),
  choices: z.array(z.object({
    message: z.object({
      role: z.string(),
      content: z.string(),
    }),
  })),
});

export class OpenRouterService {
  private apiKey: string;
  private readonly openRouterApiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  /**
   * Tworzy instancję OpenRouterService.
   * @param apiKey - Klucz API OpenRouter. Zaleca się przekazywanie go ze zmiennych środowiskowych.
   */
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenRouter API key is required.');
    }
    this.apiKey = apiKey;
  }

  // ... reszta metod
}
```

## 3. Publiczne metody i pola

### `generateChatCompletion`

Główna metoda publiczna, która wysyła żądanie do API OpenRouter i zwraca odpowiedź modelu.

-   **Parametry:**
    -   `request`: Obiekt zgodny z `OpenRouterRequestSchema`, zawierający `model`, `messages` i opcjonalne parametry.
-   **Zwraca:** `Promise<z.infer<typeof OpenRouterResponseSchema>>` - Obiekt odpowiedzi z API.
-   **Rzuca:** `Error` w przypadku niepowodzenia żądania lub walidacji.

```typescript
// Wewnątrz klasy OpenRouterService

public async generateChatCompletion(request: z.infer<typeof OpenRouterRequestSchema>): Promise<z.infer<typeof OpenRouterResponseSchema>> {
  // Walidacja danych wejściowych
  const validationResult = OpenRouterRequestSchema.safeParse(request);
  if (!validationResult.success) {
    throw new Error(`Invalid request payload: ${validationResult.error.message}`);
  }

  const response = await fetch(this.openRouterApiUrl, {
    method: 'POST',
    headers: this.getHeaders(),
    body: JSON.stringify(validationResult.data),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  
  // Walidacja odpowiedzi
  const responseValidation = OpenRouterResponseSchema.safeParse(data);
  if (!responseValidation.success) {
      throw new Error(`Invalid response from OpenRouter API: ${responseValidation.error.message}`);
  }

  return responseValidation.data;
}
```

## 4. Prywatne metody i pola

### `getHeaders`

Prywatna metoda pomocnicza do generowania nagłówków HTTP dla żądań API.

```typescript
// Wewnątrz klasy OpenRouterService

private getHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${this.apiKey}`,
    'Content-Type': 'application/json',
  };
}
```

## 5. Obsługa błędów

Usługa implementuje obsługę błędów na kilku poziomach:

1.  **Błąd konfiguracji:** Konstruktor rzuca błąd, jeśli klucz API nie zostanie podany.
2.  **Błąd walidacji żądania:** Przed wysłaniem żądania, jego zawartość jest walidowana przy użyciu schematu Zod. W przypadku niezgodności rzucany jest błąd z informacją o problemie.
3.  **Błąd API:** Jeśli odpowiedź z API ma status inny niż `2xx`, treść błędu jest odczytywana, a następnie rzucany jest szczegółowy wyjątek.
4.  **Błąd walidacji odpowiedzi:** Odpowiedź z API jest walidowana, aby upewnić się, że ma oczekiwaną strukturę.

## 6. Kwestie bezpieczeństwa

1.  **Klucz API:**  Należy go przechowywać w zmiennych środowiskowych (`.env`) `import.meta.env.OPENROUTER_API_KEY`.
2.  **Walidacja danych wejściowych:** Wszystkie dane pochodzące od użytkownika (np. treść wiadomości) muszą być walidowane przed wysłaniem do API, aby zapobiec atakom typu prompt injection.
3.  **Ekspozycja API:** Usługa `OpenRouterService` powinna być używana wyłącznie po stronie serwera (np. w endpointach API Astro w `src/pages/api`).

## 7. Plan wdrożenia krok po kroku

1.  **Instalacja zależności:**
    Upewnij się, że masz zainstalowany `zod`:
    ```bash
    npm install zod
    ```

2.  **Konfiguracja zmiennych środowiskowych:**
    Utwórz plik `.env` w głównym katalogu projektu i dodaj swój klucz API:
    ```
    OPENROUTER_API_KEY="sk-or-..."

3.  **Utworzenie pliku usługi:**
    Utwórz nowy plik `src/lib/services/openrouter.service.ts` i wklej do niego kod klasy `OpenRouterService` (połączone fragmenty z sekcji 2, 3 i 4).

4.  **Utworzenie endpointu API w Astro:**
    Utwórz plik `src/pages/api/chat.ts`, który będzie obsługiwał żądania od klienta i korzystał z `OpenRouterService`.

    ```typescript
    // src/pages/api/chat.ts
    import type { APIRoute } from 'astro';
    import { OpenRouterService } from '../../lib/services/openrouter.service';
    import { z } from 'zod';

    // Schemat walidacji dla ciała żądania przychodzącego do naszego API
    const ApiRequestSchema = z.object({
      userMessage: z.string(),
    });

    export const POST: APIRoute = async ({ request }) => {
      try {
        const body = await request.json();
        const validation = ApiRequestSchema.safeParse(body);

        if (!validation.success) {
          return new Response(JSON.stringify({ error: 'Invalid input', details: validation.error.flatten() }), { status: 400 });
        }

        const { userMessage } = validation.data;
        
        const apiKey = import.meta.env.OPENROUTER_API_KEY;
        const openRouterService = new OpenRouterService(apiKey);

        // Przykład użycia z formatowaniem JSON
        const movieSchema = {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Tytuł filmu.' },
                year: { type: 'number', description: 'Rok produkcji.' },
                director: { type: 'string', description: 'Reżyser filmu.' },
            },
            required: ['title', 'year', 'director'],
        };

        const openRouterRequest = {
          model: 'google/gemini-flash-1.5',
          messages: [
            { role: 'system', content: 'Jesteś ekspertem od filmów. Odpowiadaj w formacie JSON.' },
            { role: 'user', content: `Podaj informacje o filmie: ${userMessage}` },
          ],
          response_format: {
            type: 'json_schema' as const,
            json_schema: {
              name: 'movie_info',
              strict: true,
              schema: movieSchema,
            },
          },
          temperature: 0.7,
        };

        const result = await openRouterService.generateChatCompletion(openRouterRequest);
        
        // Parsowanie odpowiedzi JSON z contentu
        const content = result.choices[0].message.content;
        const parsedContent = JSON.parse(content);

        return new Response(JSON.stringify(parsedContent), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return new Response(JSON.stringify({ error: 'Internal Server Error', message: errorMessage }), { status: 500 });
      }
    };
    ```
    **Uwaga:** Pamiętaj, aby ustawić `export const prerender = false;` w plikach API, jeśli nie jest to globalnie skonfigurowane.

5.  **Wywołanie z frontendu (przykład w komponencie React):**
    Możesz teraz wywołać ten endpoint z dowolnego komponentu frontendowego.

    ```tsx
    // Przykład w komponencie React
    import React, { useState } from 'react';

    const ChatComponent = () => {
      const [movie, setMovie] = useState(null);
      const [loading, setLoading] = useState(false);

      const handleFetchMovie = async () => {
        setLoading(true);
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userMessage: 'Incepcja' }),
          });
          const data = await response.json();
          if(response.ok) {
            setMovie(data);
          } else {
            console.error(data.error);
          }
        } catch (error) {
          console.error('Failed to fetch chat completion:', error);
        } finally {
          setLoading(false);
        }
      };

      return (
        <div>
          <button onClick={handleFetchMovie} disabled={loading}>
            {loading ? 'Ładowanie...' : 'Pobierz info o filmie'}
          </button>
          {movie && <pre>{JSON.stringify(movie, null, 2)}</pre>}
        </div>
      );
    };
    ```
Powyższy plan zapewnia solidne podstawy do wdrożenia niezawodnej i bezpiecznej usługi do interakcji z API OpenRouter w Twoim projekcie.

