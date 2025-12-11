# AI Rules for 10x-project

MyFilms to aplikacja webowa dla miłośników kina, która pomaga odkrywać nowe filmy i seriale dzięki spersonalizowanym rekomendacjom AI. Użytkownicy mogą wyszukiwać filmy (przez TMDb API), oceniać je w skali 1-10 i tworzyć osobiste listy ("Do obejrzenia", "Ulubione", "Ocenione"). Po ocenieniu minimum 10 filmów system generuje dopasowane rekomendacje na podstawie historii ocen i opcjonalnego promptu tekstowego.

## Tech Stack

- Astro 5
- TypeScript 5
- React 19
- Tailwind 4
- Shadcn/ui
- Supabase

## Project Structure

- `./src` - source code
- `./src/layouts` - Astro layouts
- `./src/pages` - Astro pages
- `./src/pages/api` - API endpoints
- `./src/middleware/index.ts` - Astro middleware
- `./src/db` - Supabase clients and types
- `./src/types.ts` - Shared types for backend and frontend (Entities, DTOs)
- `./src/components` - Client-side components written in Astro (static) and React (dynamic)
- `./src/components/ui` - Client-side components from Shadcn/ui
- `./src/components/hooks` - Custom React hooks
- `./src/lib` - Services and helpers
- `./src/assets` - static internal assets
- `./public` - public assets

## Coding Practices

- Use feedback from linters to improve the code when making changes
- Prioritize error handling and edge cases
- Handle errors and edge cases at the beginning of functions
- Use early returns for error conditions to avoid deeply nested if statements
- Place the happy path last in the function for improved readability
- Avoid unnecessary else statements; use if-return pattern instead
- Use guard clauses to handle preconditions and invalid states early
