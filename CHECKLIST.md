link do GitHub Actions: https://github.com/wiktoriazollondz/memory/actions

1. Upewnij się, że Twój lokalny klaster Kubernetes jest uruchomiony (Docker Desktop)
2. włącz apke na środowisko dev z Kustomize - `kubectl apply -k k8s/overlays/dev`
3. czekaj na uruchomienie podów - `kubectl get pods -n memory-game -w`
4. `kubectl port-forward svc/memory-frontend-service-dev 8080:80 -n memory-game`
4. http://localhost:8080


### *Wymagania architektoniczne — Kubernetes i CI/CD*

*** Manifesty Kubernetes ***
# k8s/
-> Namespace - `namespace: memory-game` kustomization.yaml
-> Deployment - `przepis na wdrożenie` backend \ frontend \ mqtt -deployment.yaml
-> StatefulSet - `memory-db-dev-0` database-statefulset.yaml
-> Service - `lista adresów` services.yaml
-> Ingress - `przekierowania` ingress.yaml
-> ConfigMap - `configMapGenerator (ustawienia apki)` kustomization.yaml
-> Secret - `secretGenerator (dane wrażliwe)` kustomization.yaml
-> PVC (wirtualny dysk twardy) - `volumeClaimTemplates` database-statefulset.yaml


*** Deploymenty i rolling update *** backend ma 2 repliki
# kubectl get deploy -n memory-game
# kubectl rollout status deployment/memory-backend-dev -n memory-game     `rolling update`


*** Baza danych i trwałość w Kubernetes ***
StatefulSet gwarantuje, że nowy pod z tą samą nazwą i podłączy się do tego samego fizycznego dysku, żeby nie zgubić danych
`volumeClaimTemplates` w database-statefulset.yaml


*** Services, Ingress i izolacja ***
Bazy danych ani mqtt nie ma w ingress (tylko frontend i wybrane ścieżki (API/Socket))


*** ConfigMap i Secret ***
Kustomize generuje memory-game-secrets, a w kodzie są jako zmienne środowiskowe process.env.DATABASE_PASSWORD


*** Probes i zasoby ***
`read / live nessProbe` - sondy sprawdzają czy serwery poprawnie działają 
(backend - sonda TCP (`tcpSocket`), frontend - sondy HTTP (`httpGet`))

limit zapotrzebowania kontenerów na CPU i RAM (`resources: requests / limits`) -> aplikacja nie zużyje wszystkich zasobów klastra
# kubectl describe pod -l app=memory-backend -n memory-game     `lista z limitami CPU/RAM i sondami żywotności`


*** SecurityContext oraz initContainer *** `backend-deployment.yaml`
- kontenery działają jako `non-root` (bez praw admina)
- securityContext wymuszającą użytkownika 1000 (bez praw admina)
- initContainer na obrazie `busybox` (zajmuje czas), który czeka na uruchomienie bazy


*** CI/CD GitHub Actions ***
działający pipeline CI/CD w GitHub Actions -> przy pushu obrazy Dockera są budowane i walidowane
`.github\workflows\ci-cd.yaml`



### *Rzeczy dodatkowe spoza zajęć*

*** Kustomize *** - parametryzacja manifestów + obługiwanie 2 środowisk (dev i prod)
base/kustomization.yaml + overlays/dev/ + overlays/prod/
    (bez końcówek)           (-dev)          (-prod)

/dev (NODE_ENV=development) zaciąga bazę, ale dynamicznie modyfikuje ConfigMapy, wstrzykuje deweloperskie hasła
/prod (NODE_ENV=production) może wstrzykiwać trudniejsze produkcyjne hasła do bazy danych albo przypisywać więcej zasobów RAM



### *Wymagania specyficzne dla tego projektu*

*** Minimalna funkcjonalność aplikacji *** 
Zaimplementowaliśmy odczyt i zapis takich zasobów jak użytkownicy, loginy, historia rozgrywek, komentarze oraz własne talie kart

# kubectl port-forward svc/memory-backend-service-dev 3000:3000 -n memory-game
# curl http://localhost:3000/health
-> odpalic gre memory
# kubectl port-forward deployment/memory-frontend-dev 8080:80 -n memory-game


*** Trwałość danych aplikacji ***
baza PostgresSQL z pliku JSON -> można zobaczyć przez adminer.yaml
# kubectl port-forward svc/adminer-service-dev 8081:8080 -n memory-game
# http://localhost:8081

# TEST
1. kubectl port-forward deployment/memory-frontend-dev 8080:80 -n memory-game
http://localhost:8080
piszę komentarz na multiplayer
2. kubectl delete pod memory-db-dev-0 -n memory-game
3. kubectl get pods -n memory-game -w            i czekam aż memory-db-dev-0 Running
4. odświeżam stronę a komentarz dalej tam jest :)


*** KOLEJKA WIADOMOSCI MQTT ***
broker wiadomości MQTT w modelu Publish/Subscribe, do asynchronicznej komunikacji między replikami backendu
# kubectl logs deployment/memory-mqtt-dev -n memory-game