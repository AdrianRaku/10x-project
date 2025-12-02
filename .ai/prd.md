# Dokument wymagań produktu (PRD) - MyFilms
## 1. Przegląd produktu
MyFilms to aplikacja internetowa zaprojektowana dla entuzjastów kina, którzy mają trudności ze znalezieniem nowych, interesujących filmów i seriali. Aplikacja ma na celu dostarczanie spersonalizowanych rekomendacji generowanych przez AI, opartych na indywidualnych ocenach i preferencjach użytkownika. Użytkownicy mogą wyszukiwać filmy, oceniać je, tworzyć osobiste listy ("do obejrzenia", "ulubione") i otrzymywać sugestie dopasowane do ich gustu, co ma na celu usprawnienie procesu odkrywania nowych treści i zwiększenie satysfakcji z oglądania.

## 2. Problem użytkownika
Jako kinomaniak amator, często mam problem ze znalezieniem nowego interesującego mnie filmu lub serialu. Obecne platformy streamingowe oferują ogromne biblioteki treści, ale brak im spersonalizowanych rekomendacji opartych na moich unikalnych preferencjach. Często tracę czas na przeglądanie tysięcy tytułów, co prowadzi do frustracji i niezadowolenia z doświadczenia oglądania.

## 3. Wymagania funkcjonalne
- 3.1. Zarządzanie kontem użytkownika:
    - 3.1.1. Użytkownicy mogą zarejestrować się przy użyciu adresu e-mail i hasła.
    - 3.1.2. Użytkownicy mogą logować się do aplikacji.
    - 3.1.3. Sesja użytkownika jest utrzymywana po zalogowaniu.
- 3.2. Wyszukiwanie i ocenianie filmów:
    - 3.2.1. Aplikacja jest zintegrowana z API The Movie Database (TMDb) w celu wyszukiwania filmów.
    - 3.2.2. Użytkownicy mogą oceniać filmy w skali 1-10.
    - 3.2.3. Ocenienie filmu jest równoznaczne z oznaczeniem go jako "obejrzany".
- 3.3. Strona szczegółów filmu:
    - 3.3.1. Każdy film posiada stronę szczegółów z plakatem, opisem i oceną.
    - 3.3.2. Użytkownik może na niej ocenić film, zmienić/usunąć ocenę oraz zarządzać przynależnością filmu do list "Ulubione" i "Do obejrzenia".
- 3.4. Listy personalne:
    - 3.4.1. Użytkownik ma dostęp do trzech osobistych list: "Ocenione", "Do obejrzenia" i "Ulubione".
    - 3.4.2. Listy są prezentowane w formie siatki kafelków (plakat + tytuł).
- 3.5. Rekomendacje AI:
    - 3.5.1. Funkcja rekomendacji jest dostępna po ocenieniu co najmniej 10 filmów.
    - 3.5.2. System generuje 5 rekomendacji na podstawie historii ocen użytkownika i opcjonalnego promptu tekstowego.
    - 3.5.3. Rekomendacje nie zawierają filmów już ocenionych przez użytkownika.
    - 3.5.4. Obowiązuje limit 3 zapytań o rekomendacje na dzień na użytkownika.

## 4. Granice produktu
Następujące funkcje nie wchodzą w zakres wersji MVP:
- Aplikacja mobilna.
- Komentarze do filmów i funkcje społecznościowe.
- Obsługa wielu języków.
- Paginacja (stronicowanie) list i wyników wyszukiwania.
- Zaawansowane zarządzanie kontem (zmiana hasła, zmiana e-maila, usunięcie konta).

## 5. Historyjki użytkowników
- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji przy użyciu mojego adresu e-mail i hasła, aby uzyskać dostęp do jej funkcjonalności.
- Kryteria akceptacji:
    - 1. Formularz rejestracji zawiera pola na adres e-mail i hasło.
    - 2. Po pomyślnym przesłaniu formularza, w bazie danych tworzone jest nowe konto użytkownika.
    - 3. Użytkownik jest automatycznie zalogowany i przekierowany na stronę główną.
    - 4. System uniemożliwia rejestrację na adres e-mail, który już istnieje w bazie, i wyświetla odpowiedni komunikat.

- ID: US-002
- Tytuł: Logowanie użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na swoje konto, aby uzyskać dostęp do moich list i rekomendacji.
- Kryteria akceptacji:
    - 1. Formularz logowania zawiera pola na adres e-mail i hasło.
    - 2. Po pomyślnym uwierzytelnieniu, użytkownik jest zalogowany i przekierowany na stronę główną.
    - 3. W przypadku podania błędnych danych, system wyświetla komunikat o nieprawidłowym loginie lub haśle.

- ID: US-003
- Tytuł: Wyszukiwanie filmów
- Opis: Jako zalogowany użytkownik, chcę móc wyszukać filmy po tytule, aby je znaleźć i ocenić.
- Kryteria akceptacji:
    - 1. Na stronie głównej znajduje się pole wyszukiwania.
    - 2. Po wpisaniu frazy i zainicjowaniu wyszukiwania, aplikacja odpytuje API TMDb.
    - 3. Wyniki są wyświetlane jako siatka kafelków (maksymalnie 20), zawierających plakat i tytuł filmu.
    - 4. W przypadku braku wyników, wyświetlany jest komunikat "Nie znaleziono filmów pasujących do Twojego zapytania".

- ID: US-004
- Tytuł: Ocenianie filmu
- Opis: Jako zalogowany użytkownik, chcę móc ocenić film w skali 1-10, aby zapisać moją opinię i budować profil preferencji dla systemu rekomendacji.
- Kryteria akceptacji:
    - 1. Z poziomu wyników wyszukiwania lub strony szczegółów mogę ocenić film.
    - 2. Po zainicjowaniu oceny, pojawia się interfejs do wyboru oceny od 1 do 10.
    - 3. Po wystawieniu oceny, film jest dodawany do mojej listy "Ocenione".
    - 4. Mogę zmienić lub usunąć istniejącą ocenę na stronie szczegółów filmu.

- ID: US-005
- Tytuł: Onboarding nowego użytkownika do rekomendacji
- Opis: Jako nowy  zalogowany użytkownik, który nie ocenił jeszcze 10 filmów, chcę zobaczyć ekran powitalny, który poinformuje mnie, co muszę zrobić, aby odblokować rekomendacje.
- Kryteria akceptacji:
    - 1. Po zalogowaniu, jeśli mam mniej niż 10 ocenionych filmów, widzę ekran powitalny.
    - 2. Ekran zawiera komunikat "Witaj! Aby otrzymać pierwszą rekomendację, wyszukaj i oceń co najmniej 10 filmów".
    - 3. Na ekranie widoczna jest wyszukiwarka filmów.

- ID: US-006
- Tytuł: Generowanie rekomendacji AI
- Opis: Jako zalogowany użytkownik, który ocenił co najmniej 10 filmów, chcę móc wygenerować spersonalizowane rekomendacje filmowe.
- Kryteria akceptacji:
    - 1. Gdy mam 10 lub więcej ocen, na stronie głównej widoczny jest przycisk "Zaproponuj coś dla mnie" i opcjonalne pole na prompt tekstowy.
    - 2. Po kliknięciu przycisku, system wysyła do AI moje oceny (tytuł, rok, ocena) i opcjonalny prompt.
    - 3. Aplikacja wyświetla 5 rekomendacji w formie kafelków.
    - 4. Rekomendacje nie zawierają filmów, które już oceniłem.
    - 5. Próba wygenerowania rekomendacji po przekroczeniu dziennego limitu (5) skutkuje wyświetleniem odpowiedniego komunikatu.

- ID: US-007
- Tytuł: Zarządzanie listą "Do obejrzenia"
- Opis: Jako zalogowany użytkownik, chcę móc dodawać filmy do listy "Do obejrzenia" i usuwać je z niej, aby śledzić tytuły, które planuję obejrzeć.
- Kryteria akceptacji:
    - 1. Na kafelku filmu (w rekomendacjach, wyszukiwaniu) oraz na stronie szczegółów znajduje się przycisk "Do obejrzenia".
    - 2. Kliknięcie przycisku dodaje film do listy "Do obejrzenia" i zmienia stan przycisku (np. ikonę).
    - 3. Ponowne kliknięcie usuwa film z listy i przywraca pierwotny stan przycisku.
    - 4. Mogę przeglądać zawartość mojej listy "Do obejrzenia" na osobnej stronie.

- ID: US-008
- Tytuł: Zarządzanie listą "Ulubione"
- Opis: Jako zalogowany użytkownik, chcę móc oznaczać filmy jako "ulubione", aby stworzyć kolekcję moich najlepszych tytułów.
- Kryteria akceptacji:
    - 1. Na kafelku filmu oraz na stronie szczegółów znajduje się przycisk "Dodaj do ulubionych" (np. serduszko).
    - 2. Kliknięcie przycisku dodaje film do listy "Ulubione".
    - 3. Ponowne kliknięcie usuwa film z listy.
    - 4. Mogę przeglądać zawartość mojej listy "Ulubione" na osobnej stronie.

- ID: US-009
- Tytuł: Przeglądanie strony szczegółów filmu
- Opis: Jako zalogowany użytkownik, chcę móc zobaczyć szczegółowe informacje o filmie, klikając na jego kafelek.
- Kryteria akceptacji:
    - 1. Kliknięcie na kafelek filmu (z wyszukiwania, listy, rekomendacji) przenosi mnie na stronę szczegółów tego filmu.
    - 2. Strona szczegółów wyświetla plakat, opis, średnią ocenę (jeśli dostępna) oraz przyciski akcji ("Oceń", "Do obejrzenia", "Ulubione").
    - 3. Stan przycisków akcji odzwierciedla, czy film jest już na moich listach lub czy został oceniony.

- ID: US-010
- Tytuł: Obsługa błędów API
- Opis: Jako zalogowany użytkownik, chcę być informowany o problemach technicznych w sposób, który nie psuje mojego doświadczenia.
- Kryteria akceptacji:
    - 1. Jeśli API AI zwróci błąd podczas generowania rekomendacji, widzę komunikat "Wystąpił chwilowy błąd. Spróbuj ponownie za chwilę".
    - 2. Nieudane zapytanie z powodu błędu technicznego nie zużywa mojego dziennego limitu rekomendacji.
    - 3. Jeśli AI zwróci tytuł, którego nie ma w bazie TMDb, jest on po cichu odrzucany, a system stara się, abym zawsze otrzymał 5 prawidłowych rekomendacji.

- ID: US-011
- Tytuł: Przekierowanie niezalogowanych użytkowników
- Opis: Jako niezalogowany użytkownik, chcę być przekierowany na stronę logowania, gdy próbuję uzyskać dostęp do funkcji wymagających uwierzytelnienia.
- Kryteria akceptacji:
     - 1. Próba dostępu do strony ze szczegółami filmu kończy się przekierowaniem na stronę logowania.
     - 2. Próba wysłania zapytania o rekomendacje kończy się przekierowaniem na stronę logowania.
     - 3. Próba zarządzania listami kończy się przekierowaniem na stronę logowania.
- ID: US-012
- Tytuł: Wylogowanie użytkownika
- Opis: Jako zalogowany użytkownik, chcę móc się wylogować, aby zabezpieczyć moje konto.
- Kryteria akceptacji:
-    1. Na każdej stronie aplikacji znajduje się przycisk "Wyloguj".
    - 2. Po kliknięciu przycisku, użytkownik jest wylogowany, a jego sesja jest zakończona.
    - 3. Użytkownik jest przekierowany na stronę logowania po wylogowaniu.
- ID: US-013
- Tytuł: Odzyskiwanie hasła
- Opis: Jako użytkownik, który zapomniał hasła, chcę móc je odzyskać, aby ponownie uzyskać dostęp do mojego konta.
- Kryteria akceptacji:
    - 1. Na stronie logowania znajduje się link "Zapomniałem hasła".
    - 2. Po kliknięciu linku, użytkownik jest przekierowany na stronę odzyskiwania hasła.
    - 3. Użytkownik może wprowadzić swój adres e-mail, aby otrzymać instrukcje dotyczące resetowania hasła.
    - 4. Po pomyślnym zresetowaniu hasła, użytkownik może zalogować się przy użyciu nowego hasła.

## 6. Metryki sukcesu
- 6.1. Aktywacja użytkowników: Liczba użytkowników, którzy ocenili co najmniej 10 filmów.
- 6.2. Zaangażowanie: Średnia liczba ocenionych filmów na aktywnego użytkownika oraz stosunek liczby filmów dodanych do list z rekomendacji do liczby wygenerowanych rekomendacji.


## 7. Bezpieczny dostęp i uwierzytelnianie
- 7.1. Tylko zalogowani użytkownicy mogą korzystać z serwisu.
- 7.2. Wszystkie operacje związane z ocenianiem filmów, zarządzaniem listami i generowaniem rekomendacji wymagają uwierzytelnienia.
- 7.3. Niezalogowani użytkownicy są przekierowywani na stronę logowania/rejestracji.
- 7.4. Użytkownik może się wylogować z systemu poprzez przycisk "Wyloguj" w prawym górnym rogu interfejsu.
- 7.5. Odzyskiwanie hasła powinno być możliwe poprzez funkcję "Zapomniałem hasła" na stronie logowania.