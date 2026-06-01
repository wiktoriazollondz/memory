**_ kubectl get nodes _** - lista węzłów

**_ kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml _** - zainstalowanie oficjalnego kontrolera NGINX dla Docker Desktop

**_ kubectl create namespace memory-game _** - całą grę wrzucamy do odizolowanej przestrzeni nazw memory-game

**_ kubectl apply -k k8s/overlays/dev _** - Kustomize weźmie nasze pliki z base, wygeneruje ConfigMapy, Secrety z hasłami, dotnie konfigurację pod środowisko dev i wyśle do klastra

**_ kubectl delete -k k8s/overlays/dev _** - usuwa stare wdrożenie

**_ kubectl get pods -n memory-game -w _** - podglądanie procesów kubernetesa na żywo

**_ kubectl port-forward deployment/memory-frontend-dev 8080:80 -n memory-game _** - w PowerShellu żeby działała strona na http://localhost:8080

**_ kubectl rollout restart deployment memory-mqtt-dev -n memory-game _** - restart brokera MQTT

**_ kubectl port-forward svc/adminer-service-dev 8081:8080 -n memory-game _** - odpalenie bazy danych na http://localhost:8081

*** kubectl describe deployment memory-backend-dev -n memory-game *** - opis deploymentu

*** kubectl logs deployment/memory-backend-dev -n memory-game *** - logi deploymentu

*** kubectl apply -k k8s/overlays/dev *** - wdraża zmiany

*** docker build -t memory-backend:v8 ./backend *** - aktualizacja po zmienie backendu
