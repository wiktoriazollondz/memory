# Gra Memory (Singleplayer i Multiplayer) - Wiktoria Zollondz

### Aplikacja to rozproszony system full-stack, działający w architekturze mikrousługowej, wykorzystujący trzy różne protokoły komunikacyjne do optymalizacji ruchu sieciowego oraz zapewnienia rozgrywki w czasie rzeczywistym.


# 1. REST API (Protokół HTTP) - zarządzanie stanem i użytkownikami

- CREATE => rejestracja, dodawanie komentarzy, dodawanie nowej rozgrywki w historii, dodawanie nowej talii
- READ => odczyt tabeli wyników, odczyt komentarzy, odczyt historii, odczyt stworzonych talii
- UPDATE => poprawienie czasu w tabeli, edycja komentarza, dodanie notatki w historii, edycja talii
- DELETE => usuwanie: konta, komentarza, rozgrywki w historii, talii
- Autoryzacja => obsługa logowania/wylogowywania z wykorzystaniem ciasteczek (cookies) oraz tokenów JWT, hasła szyfrowane w db


# 2. WebSocket (Protokół WS) - rozgrywka w czasie rzeczywistym

- zarządzanie pokojami => tworzenie i dołączanie, blokada pełnych pokoi, obsługa rozłączeń
- synchronizacja rozgrywki => wspólna plansza, odwracanie kart
- zarządzanie turami i wynikami
- komunikacja i czat
- powiadomienia globalne (z mqtt)


# 3. Broker wiadomości (Protokół MQTT) - komunikacja asynchroniczna

- powiadomienie o ilości osób online grających
- powiadomienie o ustawieniu nowego najlepszego wyniku danego gracza dla każdego


# 4. Infrastruktura i wdrożenie (środowisko chmurowe) - projekt został w pełni skonteneryzowany i przygotowany do wdrożenia

- konteneryzacja (Docker) => rozdzielenie aplikacji na niezależne obrazy (Frontend, Backend)
- skalowalność => logika gry i API działają jako Deployment, co pozwala na utrzymywanie wielu replik backendu jednocześnie; baza danych funkcjonuje w stabilnym trybie StatefulSet
- brama sieciowa (NGINX Ingress)
- zarządzanie środowiskami (Kustomize) => płynne przełączanie między środowiskiem deweloperskim a produkcyjnym
- CI/CD => GitHub Actions, które po każdej zmianie w kodzie buduje nowe obrazy, testuje manifesty i wypycha je do globalnego rejestru