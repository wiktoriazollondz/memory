# Raport z projektu: Gra Memory - Architektura i Wymagania

## Wymagania architektoniczne — Kubernetes i CI/CD

### 1. Manifesty Kubernetes (12%)
Projekt wykorzystuje narzędzie **Kustomize**, żeby logicznie podzielić pliki konfiguracyjne na bazowe (`k8s/base`) i te dla środowiska deweloperskiego (`k8s/overlays/dev`). Mamy zaimplementowane wszystkie wymagane obiekty: `Deploymenty` dla logiki aplikacji, `StatefulSet` dla bazy danych, `Service` do komunikacji wewnętrznej oraz `Ingress` do wystawienia gry na zewnątrz. Poufne dane i zmienne środowiskowe generujemy dynamicznie przez `ConfigMap` i `Secret`, a za fizyczne miejsce na dysku odpowiada `PersistentVolumeClaim` (PVC).

### 2. Deploymenty i rolling update (10%)
Aplikacja została oparta na zasobach typu `Deployment`. Główny serwer backendu (Node.js) celowo uruchomiliśmy w **minimum 2 replikach** (`replicas: 2`), aby spełnić wymóg wysokiej dostępności. Skonfigurowaliśmy w nim strategię `RollingUpdate` z parametrami `maxSurge` i `maxUnavailable`, dzięki czemu podczas wdrażania nowych wersji Kubernetes podmienia pody pojedynczo, bez odcinania graczy od serwera.

### 3. Baza danych i trwałość w Kubernetes (12%)
Zależało nam na pełnej trwałości danych, dlatego relacyjną bazę **PostgreSQL** wdrożyliśmy jako `StatefulSet`. Użyliśmy sekcji `volumeClaimTemplates`, która automatycznie podpina wirtualny dysk (`PersistentVolumeClaim`). Dzięki temu nasze dane zapisują się fizycznie i nie znikają, nawet jeśli pod bazy ulegnie awarii lub zostanie celowo zrestartowany.

### 4. Services, Ingress i izolacja (10%)
Cała komunikacja wewnątrz klastra odbywa się bezpiecznie przez klastrowe adresy DNS zapewniane przez obiekty `Service`. Baza PostgreSQL oraz nasz broker MQTT są całkowicie odcięte od internetu. Na zewnątrz wystawiliśmy jedynie frontend oraz specyficzne ścieżki API backendu za pomocą routera **Ingress (NGINX)**. Skonfigurowaliśmy w nim również mechanizm *Sticky Sessions*, aby połączenia WebSocket poprawnie trafiały do konkretnych replik backendu.

### 5. ConfigMap i Secret (8%)
Nie trzymamy żadnych haseł w jawnym kodzie JavaScript. Wykorzystaliśmy generatory Kustomize (`configMapGenerator` oraz `secretGenerator`), aby dynamicznie tworzyć konfigurację podczas wdrożenia. Hasło do bazy danych jest bezpiecznie wstrzykiwane do podów jako zmienna środowiskowa, co chroni nasze dane produkcyjne przed wyciekiem w repozytorium kodu.

### 6. Probes i zasoby (10%)
Nałożyliśmy na kontenery limity zapotrzebowania na CPU i RAM (`resources: requests / limits`), aby aplikacja nie zużyła wszystkich zasobów klastra. Wdrożyliśmy też sondy sprawdzające, czy serwery poprawnie działają: backend jest odpytywany pod kątem otwartego portu przez sondę TCP (`tcpSocket`), a frontend monitorowany przez sondy HTTP (`httpGet`).

### 7. SecurityContext oraz initContainer (8%)
Ze względów bezpieczeństwa nasze pody aplikacyjne działają bez uprawnień roota (skonfigurowaliśmy `runAsNonRoot: true` oraz `runAsUser: 1000` w bloku `securityContext`). W backendzie zastosowaliśmy również `initContainer` oparty na obrazie *busybox* – to mały skrypt startowy, który wstrzymuje uruchomienie serwera Node.js do momentu, aż baza danych w pełni wystartuje i zacznie odpowiadać w sieci.

### 8. CI/CD GitHub Actions (10%)
Mamy w pełni działający pipeline CI/CD w GitHub Actions. Przy pushu do głównej gałęzi repozytorium, kod jest automatycznie pobierany, a obrazy Dockera są budowane i walidowane, przygotowując projekt do szybkiego wdrożenia w klastrze.

---

## Wymagania specyficzne dla tego projektu

### 9. Minimalna funkcjonalność aplikacji (10%)
Aplikacja pozwala na w pełni funkcjonalną grę w Memory. Zaimplementowaliśmy odczyt i zapis takich zasobów jak użytkownicy, loginy, historia rozgrywek, komentarze oraz własne talie kart. Serwer backendu posiada również specjalny endpoint `/health`, który odpowiada statusem "OK" na pingi od Kubernetesa, udowadniając gotowość do pracy.

### 10. Trwałość danych aplikacji (5%)
Zamiast trzymać stan gry wyłącznie w pamięci RAM lub lokalnych plikach kontenera, połączyliśmy aplikację Node.js asynchronicznym konektorem (`pg`) z naszą bazą PostgreSQL. Wszystkie dane są zapisywane w jednym zbiorczym formacie JSONB. Projekt przechodzi tzw. "Test Chaosu" – po brutalnym zabiciu podów backendu lub bazy danych, system przywraca pełen stan aplikacji z dysku, bez utraty danych.

### 11. Cache, kolejka albo worker (5%)
Architektura została rozbudowana o dodatkowy komponent: brokera wiadomości **Eclipse Mosquitto (MQTT)**, działającego w modelu Publish/Subscribe. Znajduje się on bezpiecznie wewnątrz klastra i służy jako asynchroniczny kanał komunikacji w tle, pozwalając naszym niezależnym replikom backendu wymieniać się informacjami.
