# Pierwszy test Web MVP - scenariusz

Data przygotowania: 2026-10-01

Cel:
- sprawdzić, czy dziecko potrafi przejść podstawowy flow Eduli bez tłumaczenia mechaniki przez dorosłego
- wychwycić blokery UX i niezrozumiałe zadania
- sprawdzić, czy Misja z Gobim daje motywację do dalszego korzystania
- nie oceniać jeszcze finalnego designu ani systemu mastery

## Założenia testu

Pierwszy test prowadzimy w wersji Web:
- telefon w przeglądarce jako główne urządzenie
- opcjonalnie drugi przebieg na desktopie
- bez wdrażania natywnych Android/iOS

Na pierwszym teście nie zmieniamy zasad w trakcie sesji.
Dorosły obserwuje i pomaga tylko wtedy, gdy dziecko całkowicie utknie.

## Przygotowanie

Przed testem:
- konto rodzica działa
- profil dziecka istnieje
- aplikacja otwiera się na telefonie
- staging korzysta z właściwego Supabase
- mamy możliwość sprawdzenia zapisanych sesji po teście

Nie pokazujemy dziecku wcześniej flow ani rozwiązań zadań.

## Etap 1 - przekazanie telefonu

Rodzic:
1. loguje się
2. wybiera dziecko
3. klika "Przekaż telefon dziecku"

Obserwujemy:
- czy komunikat przejścia do trybu dziecka jest zrozumiały
- czy dziecko samo rozpoznaje przycisk startu
- czy ekran nie zawiera informacji przeznaczonych dla rodzica

Zapisz:
- czy potrzebna była pomoc
- co dziecko powiedziało spontanicznie
- gdzie kliknęło jako pierwsze

## Etap 2 - onboarding

Pozwól dziecku przejść onboarding bez wyjaśniania.

Obserwujemy:
- czy czyta / rozumie komunikaty
- czy wie, co zrobić na kolejnej planszy
- czy onboarding jest za długi
- czy Gobi jest zauważony i zrozumiały

Sygnał problemu:
- dziecko pyta "co mam zrobić?"
- próbuje klikać element niebędący przyciskiem
- chce pominąć ekran zanim przeczyta sens komunikatu

## Etap 3 - pierwszy trening

Dziecko wybiera kategorię i nowy typ zadania.

Dla każdego zadania zapisujemy:
- czy instrukcja była zrozumiała
- czy dziecko wiedziało, gdzie kliknąć
- czy pomyłka wynikała z wiedzy czy z interfejsu
- czy feedback "Spróbuj jeszcze raz" wystarczył
- czy potrzebna była pomoc dorosłego

Szczególnie sprawdzamy:
- dodawanie/odejmowanie z kropkami
- brakującą liczbę
- wzory/sekwencje
- Sudoku
- kopiowanie siatki
- kod symboliczny
- zadania pamięciowe

Nie musimy przejść wszystkich rendererów w jednej sesji dziecka.
Pełny renderer smoke test wykonujemy osobno jako test techniczny.

## Etap 4 - ekran "Ćwicz"

Po poznaniu pierwszych mechanik sprawdzamy:
- czy dziecko rozumie różnicę między nowym treningiem a poznanym ćwiczeniem
- czy status mechaniki jest zrozumiały
- czy potrafi samodzielnie wybrać kolejną rzecz

Nie pytamy dziecka wprost "czy rozumiesz".
Patrzymy, co robi.

## Etap 5 - odblokowanie Misji

Kiedy Misja staje się dostępna:

Obserwujemy:
- czy dziecko zauważa zmianę
- czy rozumie, że Misja jest nagrodą/wyzwaniem po treningu
- czy chce wejść w Misję samo
- czy ekran z zasadami przed Misją jest potrzebny i zrozumiały

## Etap 6 - pełna Misja z Gobim

Przechodzimy wszystkie 10 zadań.

Dla każdego zadania notujemy:
- poprawnie za pierwszym razem
- błąd merytoryczny
- błąd UX
- użyta podpowiedź
- potrzebna pomoc dorosłego
- oznaki frustracji
- oznaki znudzenia
- pozytywna reakcja

Dodatkowo obserwujemy:
- czy dziecko patrzy na wynik Gobi vs dziecko
- czy wynik wpływa na emocje
- czy podpowiedź jest traktowana jako pomoc, czy jako przypadkowy przycisk
- czy tempo między zadaniami jest dobre

## Etap 7 - test przerwania

Nie musi być podczas pierwszej dziecięcej sesji.

Techniczny test dorosłego:
1. rozpocznij Misję
2. wykonaj kilka zadań
3. odśwież stronę
4. sprawdź powrót do właściwego miejsca
5. powtórz na zadaniu pamięciowym podczas fazy zapamiętywania
6. powtórz podczas fazy odpowiedzi

Oczekiwane:
- brak utraty już zapisanych odpowiedzi
- brak ponownego naliczania punktów
- brak możliwości wykorzystania refreshu do ponownego zobaczenia bodźca pamięciowego

## Etap 8 - wynik

Po Misji sprawdzamy:
- czy dziecko rozumie, kto wygrał
- czy wynik jest dla niego ważny
- czy chce kliknąć "jeszcze raz"
- czy chce wrócić do ćwiczeń
- czy pyta o punkty/nagrody

Najważniejsze pytanie obserwacyjne:
- czy dziecko chce zrobić coś dalej bez zachęty dorosłego?

## Etap 9 - widok rodzica

Po zakończeniu:
- wróć do trybu rodzica
- otwórz statystyki
- otwórz raport

Sprawdzamy:
- czy ostatnia Misja jest zapisana
- czy liczba zadań i punktów się zgadza
- czy wyniki kategorii/mechanik są wiarygodne
- czy raport nie wyciąga wniosków przy zbyt małej liczbie danych

## Co zapisujemy po teście

Dla każdego problemu:
- ekran
- co dziecko próbowało zrobić
- czego oczekiwało
- co faktycznie się stało
- czy problem zablokował dalszą sesję
- priorytet: blocker / ważne / drobne

Nie poprawiamy wszystkiego.
Najpierw naprawiamy:
1. blokery
2. niezrozumiałe interakcje
3. zadania wymagające tłumaczenia dorosłego
4. błędy zapisu/progresji
5. dopiero potem kosmetykę

## Pytania po sesji

Pytania powinny być krótkie:
- Co było najfajniejsze?
- Co było najtrudniejsze?
- Które zadanie chciałabyś zrobić jeszcze raz?
- Co myślisz o Gobim?
- Chcesz jeszcze jedną Misję?

Nie pytamy:
- "Czy aplikacja Ci się podoba?"
- "Czy wszystko było zrozumiałe?"

Takie pytania są zbyt sugerujące.

## Kryterium powodzenia pierwszego MVP

Pierwszy test uznajemy za udany produktowo, jeśli:
- dziecko potrafi wejść w trening bez ciągłego prowadzenia
- większość interakcji rozumie po samej instrukcji i UI
- błędy nie blokują dalszej gry
- Misja jest możliwa do ukończenia
- zapis danych działa
- dziecko wykazuje chęć kontynuacji przynajmniej w części sesji

Nie wymagamy jeszcze:
- idealnej progresji
- kompletnego Level 0
- automatycznego mastery
- finalnego designu
- Android/iOS
