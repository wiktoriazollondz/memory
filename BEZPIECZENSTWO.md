# kubectl port-forward deployment/memory-frontend-dev 8080:80 -n memory-game

# kubectl port-forward deploy/memory-backend-dev 3000:3000 -n memory-game

# kubectl port-forward svc/logto-service-dev 3001:3001 -n memory-game

panel Logto
kubectl port-forward svc/logto-service-dev 3002:3002 -n memory-game

## niezabezpieczone

http://localhost:3000/health
http://localhost:3000/comments
http://localhost:3000/users

## zabezpieczone:

http://localhost:3000/history/wika
http://localhost:3000/decks/wika
http://localhost:3000/users/wika
http://localhost:3000/comments/wika

## wymagany admin

usunięcie swojego konta (danych w bazie) => Błąd: {"error":"Dostęp zabroniony: Wymagana rola admina"}
konto admin

## PCKE (Proof Key for Code)

To kryptograficzny dowód, który potwierdza, że dokładnie ta sama przeglądarka, która zaczęła logowanie, faktycznie je kończy.

1. Gdy klikasz "Zaloguj", przeglądarka wymyśla jednorazowe tajne hasło i wysyła do serwera Logto tylko jego zaszyfrowany hash
2. Po pomyślnym zalogowaniu, aplikacja chce odebrać bilet wstępu (token) i musi podać to pierwotne, niezaszyfrowane hasło
3. Serwer sprawdza, czy hasło pasuje do hasha – jeśli haker ukradnie kod po drodze, nic z nim nie zrobi, bo nie zna oryginalnego hasła, które jest schowane w pamięci RAM

## Volumen danych dla authorization serwera (PVC)

w k8s/base/logto-db.yaml na końcu

# testy automatyczne

w backend/app.test.js