# Schemat Bazy Danych PostgreSQL dla Aplikacji MyFilms

## 1. Lista Tabel

### Tabela: `ratings`

Przechowuje oceny filmów wystawione przez użytkowników.

| Nazwa kolumny | Typ danych    | Ograniczenia                                                          | Opis                                                     |
| :------------ | :------------ | :-------------------------------------------------------------------- | :------------------------------------------------------- |
| `id`          | `bigint`      | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY`                         | Unikalny identyfikator oceny.                            |
| `user_id`     | `uuid`        | `NOT NULL`, `FOREIGN KEY REFERENCES auth.users(id) ON DELETE CASCADE` | Identyfikator użytkownika z tabeli `auth.users`.         |
| `tmdb_id`     | `integer`     | `NOT NULL`                                                            | Identyfikator filmu z API The Movie Database (TMDb).     |
| `rating`      | `smallint`    | `NOT NULL`, `CHECK (rating >= 1 AND rating <= 10)`                    | Ocena filmu w skali od 1 do 10.                          |
| `created_at`  | `timestamptz` | `NOT NULL`, `DEFAULT now()`                                           | Znacznik czasowy utworzenia rekordu.                     |
| `updated_at`  | `timestamptz` | `NOT NULL`, `DEFAULT now()`                                           | Znacznik czasowy ostatniej aktualizacji rekordu.         |
|               |               | `UNIQUE (user_id, tmdb_id)`                                           | Zapewnia, że użytkownik może ocenić dany film tylko raz. |

### Typ ENUM: `list_type`

Definiuje możliwe typy list personalnych użytkownika.

```sql
CREATE TYPE public.list_type AS ENUM ('watchlist', 'favorite');
```

### Tabela: `user_lists`

Przechowuje filmy dodane przez użytkowników do list personalnych ("Do obejrzenia", "Ulubione").

| Nazwa kolumny | Typ danych    | Ograniczenia                                                          | Opis                                                                                    |
| :------------ | :------------ | :-------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| `id`          | `bigint`      | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY`                         | Unikalny identyfikator wpisu na liście.                                                 |
| `user_id`     | `uuid`        | `NOT NULL`, `FOREIGN KEY REFERENCES auth.users(id) ON DELETE CASCADE` | Identyfikator użytkownika z tabeli `auth.users`.                                        |
| `tmdb_id`     | `integer`     | `NOT NULL`                                                            | Identyfikator filmu z API The Movie Database (TMDb).                                    |
| `list_type`   | `list_type`   | `NOT NULL`                                                            | Typ listy, do której należy film (`watchlist` lub `favorite`).                          |
| `created_at`  | `timestamptz` | `NOT NULL`, `DEFAULT now()`                                           | Znacznik czasowy utworzenia rekordu.                                                    |
|               |               | `UNIQUE (user_id, tmdb_id, list_type)`                                | Zapewnia, że film nie zostanie zduplikowany na tej samej liście dla danego użytkownika. |

### Tabela: `ai_recommendation_requests`

Loguje zapytania o rekomendacje AI w celu zarządzania dziennym limitem.

| Nazwa kolumny | Typ danych    | Ograniczenia                                                          | Opis                                             |
| :------------ | :------------ | :-------------------------------------------------------------------- | :----------------------------------------------- |
| `id`          | `bigint`      | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY`                         | Unikalny identyfikator zapytania.                |
| `user_id`     | `uuid`        | `NOT NULL`, `FOREIGN KEY REFERENCES auth.users(id) ON DELETE CASCADE` | Identyfikator użytkownika z tabeli `auth.users`. |
| `created_at`  | `timestamptz` | `NOT NULL`, `DEFAULT now()`                                           | Znacznik czasowy utworzenia zapytania.           |

## 2. Relacje Między Tabelami

- **`auth.users` ↔ `ratings` (Jeden-do-wielu)**: Jeden użytkownik może mieć wiele ocen, ale każda ocena należy do jednego użytkownika.
- **`auth.users` ↔ `user_lists` (Jeden-do-wielu)**: Jeden użytkownik może mieć wiele filmów na swoich listach, ale każdy wpis na liście należy do jednego użytkownika.
- **`auth.users` ↔ `ai_recommendation_requests` (Jeden-do-wielu)**: Jeden użytkownik może mieć wiele zapytań o rekomendacje, ale każde zapytanie należy do jednego użytkownika.

## 3. Indeksy

Indeksy są tworzone w celu optymalizacji wydajności zapytań.

- **W tabeli `ratings`**:
  - `CREATE INDEX ON public.ratings (user_id);`
- **W tabeli `user_lists`**:
  - `CREATE INDEX ON public.user_lists (user_id);`
  - `CREATE INDEX ON public.user_lists (user_id, list_type);`
- **W tabeli `ai_recommendation_requests`**:
  - `CREATE INDEX ON public.ai_recommendation_requests (user_id, created_at);`

## 4. Zasady Bezpieczeństwa na Poziomie Wiersza (RLS)

Wszystkie tabele przechowujące dane użytkowników muszą mieć włączone RLS. Poniższe polityki zapewniają, że użytkownicy mogą zarządzać (wyświetlać, wstawiać, aktualizować, usuwać) wyłącznie własnymi danymi.

### Polityki dla tabeli `ratings`

```sql
-- Włączenie RLS
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Polityka SELECT: Użytkownicy mogą odczytywać tylko swoje oceny.
CREATE POLICY "Allow individual read access" ON public.ratings FOR SELECT
USING (auth.uid() = user_id);

-- Polityka INSERT: Użytkownicy mogą dodawać oceny tylko w swoim imieniu.
CREATE POLICY "Allow individual insert access" ON public.ratings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Polityka UPDATE: Użytkownicy mogą aktualizować tylko swoje oceny.
CREATE POLICY "Allow individual update access" ON public.ratings FOR UPDATE
USING (auth.uid() = user_id);

-- Polityka DELETE: Użytkownicy mogą usuwać tylko swoje oceny.
CREATE POLICY "Allow individual delete access" ON public.ratings FOR DELETE
USING (auth.uid() = user_id);
```

### Polityki dla tabeli `user_lists`

```sql
-- Włączenie RLS
ALTER TABLE public.user_lists ENABLE ROW LEVEL SECURITY;

-- Polityki analogiczne do tabeli ratings (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Allow individual read access" ON public.user_lists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow individual insert access" ON public.user_lists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow individual update access" ON public.user_lists FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Allow individual delete access" ON public.user_lists FOR DELETE
USING (auth.uid() = user_id);
```

### Polityki dla tabeli `ai_recommendation_requests`

```sql
-- Włączenie RLS
ALTER TABLE public.ai_recommendation_requests ENABLE ROW LEVEL SECURITY;

-- Polityki analogiczne do tabeli ratings (SELECT, INSERT)
CREATE POLICY "Allow individual read access" ON public.ai_recommendation_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow individual insert access" ON public.ai_recommendation_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

## 5. Dodatkowe Uwagi

- **Normalizacja**: Schemat jest w Trzeciej Postaci Normalnej (3NF). Dane filmów (tytuł, opis, plakat) nie są przechowywane w bazie, aby uniknąć redundancji; zamiast tego używany jest `tmdb_id`, a szczegóły będą pobierane na żądanie z zewnętrznego API (TMDb).
- **Integralność Danych**: Ograniczenie `CHECK` w tabeli `ratings` oraz unikalne indeksy kompozytowe w tabelach `ratings` i `user_lists` zapewniają spójność i integralność danych na poziomie bazy danych.
- **Automatyzacja**: Kolumny `created_at` i `updated_at` (w tabeli `ratings`) używają wartości domyślnych i triggerów do automatycznego zarządzania znacznikami czasowymi, co jest standardową praktyką w Supabase. Dla `updated_at` zostanie użyty standardowy trigger `moddatetime`.
  ```sql
  CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.ratings
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
  ```
