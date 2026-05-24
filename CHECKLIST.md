# Projekt: Gra Memory (Kubernetes & CI/CD)

## Architektura i Technologie
- **Frontend:** HTML, CSS, JS (obsługiwane przez serwer NGINX)
- **Backend:** Node.js (Express, Socket.io)
- **Baza danych / Trwały nośnik:** Plik JSON na Kubernetes PersistentVolume (PVC)
- **Kolejka wiadomości (Dodatkowy komponent):** Broker MQTT (Eclipse Mosquitto)

---

## Wymagania projektowe

- **Aplikacja składająca się z min. 2 mikroserwisów** (Frontend i Backend).
- **Baza danych w Kubernetes z trwałymi danymi (PVC)** - Dane graczy (plik JSON) zapisują się na dysku klastra i przetrwają restarty podów.
- **Dodatkowy komponent architektury (Cache/Kolejka)** - Wdrożono broker MQTT do obsługi powiadomień/statusów.
- **Wdrażanie za pomocą Kustomize** - Skonfigurowano podział na `base` i `overlays/dev`.
- **Skonfigurowany Ingress** - Ruch przechodzi przez wirtualny router NGINX Ingress Controller.
- **Automatyzacja CI/CD (GitHub Actions)** - Pipeline buduje obrazy Dockera.

1. *Manifesty Kubernetes*: Masz wszystkie wymagane zasoby K8s, starannie zorganizowane.
2. *Deploymenty i rolling update*: Frontend i Backend to Deploymenty. Backend działa na 2 replikach i ma poprawną strategię aktualizacji.
3. *Baza danych i trwałość (PVC)*: Postgres stoi jako w pełni profesjonalny StatefulSet z własnym dyskiem (PVC).
4. *Izolacja*: Wewnętrzny Service, zewnętrzny Ingress. Baza i MQTT ukryte bezpiecznie w klastrze.
5. *ConfigMap i Secret*: Zarządzane dynamicznie przez Kustomize – bezpieczne i eleganckie.
6. *SecurityContext i initContainer*: Backend działa jako użytkownik 1000 (non-root) i czeka na bazę przez initContainer.
7. *CI/CD*: Twój GitHub Actions świeci na zielono, automatyzując wdrożenie!
8. *Cache, kolejka, worker*: Wdrożyłaś MQTT, co jest książkowym przykładem tego punktu.

---

## 🔍 Dowody działania

Ze względu na specyfikę działania Docker Desktop na systemie Windows (blokada portu 80), ruch przekierowywany jest za pomocą tunelu.
```bash
kubectl port-forward deployment/memory-frontend-dev 8080:80 -n memory-game