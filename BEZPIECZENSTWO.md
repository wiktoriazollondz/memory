# kubectl port-forward deployment/memory-frontend-dev 8080:80 -n memory-game

# kubectl port-forward deploy/memory-backend-dev 3000:3000 -n memory-game

# kubectl port-forward svc/logto-service-dev 3001:3001 -n memory-game

panel Logto
kubectl port-forward svc/logto-service-dev 3002:3002 -n memory-game

## niezabezpieczone

http://localhost:3000/health

## zabezpieczone:

http://localhost:3000/history
http://localhost:3000/decks
http://localhost:3000/comments
http://localhost:3000/users

## wymagany admin

usunięcie swojego konta (danych w bazie) => Błąd: {"error":"Dostęp zabroniony: Wymagana rola admina"}
konto admin

## PCKE (Proof Key for Code)

To kryptograficzny dowód, który potwierdza, że dokładnie ta sama przeglądarka, która zaczęła logowanie, faktycznie je kończy.

1. Kiedy gracz loguje się na frontendzie, przeglądarka tworzy w tle WŁASNE jednorazowe, tajne hasło i wysyła do serwera Logto jedynie jego zaszyfrowany "odcisk" (hash).
2. Po udanym logowaniu Logto wydaje token dostępu tylko wtedy, gdy aplikacja na dowód prześle to pierwotne, niezaszyfrowane hasło, co gwarantuje, że nikt po drodze nie przechwycił procesu logowania.

## Volumen danych dla authorization serwera (PVC)

w k8s/base/logto-db.yaml na końcu

# testy automatyczne

w backend/app.test.js
