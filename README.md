Gra memory (singleplayer i multiplayer) - Wiktoria Zollondz

HTTP:

CRUD:

- CREATE => rejestracja, dodawanie komentarzy, dodawanie nowej rozgrywki w historii, dodawanie nowej talii
- READ => odczyt tabeli wyników, odczyt komentarzy, odczyt historii, odczyt stworzonych talii
- UPDATE => poprawienie czasu w tabeli, edycja komentarza, dodanie notatki w historii, edycja talii
- DELETE => usuwanie: konta, komentarza, rozgrywki w historii, talii

* wyszukania danych wg wzorca w tabeli wyników
* logowanie i wylogowywanie
* stworzenie klienta => frontend

MQTT:

- powiadomienie o ilości osób online grających
- powiadomienie o ustawieniu nowego najlepszego wyniku danego gracza dla każdego

WS:

- zarządzanie pokojami => tworzenie i dołączanie, blokada pełnych pokoi, obsługa rozłączeń

- synchronizacja rozgrywki => wspólna plansza, odwracanie kart

- zarządzanie turami i wynikami

- komunikacja i czat

- powiadomienia globalne (z mqtt)

Inne:

- POWIĄZANIE Z PROTOKOŁAMI:

* sensowne wykorzystanie ciasteczek (plików cookie)
* możliwość korzystania z pokoi
* konfiguracja protokołów backendowych tak, aby można było z nich korzystać po stronie frontendowej
* konfiguracja i wdrożenie aplikacji na serwer NGINX
* różne protokoły dla tej samej funkcjonalności (mqtt i websocket dla powiadomień globalnych)

- NIEPOWIĄZANE:

* wykorzystanie bazy danych
* szyfrowanie haseł przechowywanych w bazie danych
* JSON Web Token

Aplikacja
