*** kubectl get nodes *** - lista węzłów 

*** kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml *** - zainstalowanie oficjalnego kontrolera NGINX dla Docker Desktop

*** kubectl create namespace memory-game *** - całą grę wrzucamy do odizolowanej przestrzeni nazw memory-game

*** kubectl apply -k k8s/overlays/dev *** - Kustomize weźmie nasze pliki z base, wygeneruje ConfigMapy, Secrety z hasłami, dotnie konfigurację pod środowisko dev i wyśle do klastra

*** kubectl delete -k k8s/overlays/dev *** - usuwa stare wdrożenie

*** kubectl get pods -n memory-game -w *** - podglądanue procesów kubernetesa na żywo

*** kubectl port-forward deployment/memory-frontend-dev 8080:80 -n memory-game *** - w PowerShellu żeby działała strona na http://localhost:8080