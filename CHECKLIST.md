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

---

## 🔍 Dowody działania

Ze względu na specyfikę działania Docker Desktop na systemie Windows (blokada portu 80), ruch przekierowywany jest za pomocą tunelu.
```bash
kubectl port-forward deployment/memory-frontend-dev 8080:80 -n memory-game