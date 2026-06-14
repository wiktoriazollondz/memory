# kubectl port-forward deploy/memory-backend-dev 3000:3000 -n memory-game

niezabezpieczone
http://localhost:3000/health
http://localhost:3000/comments
http://localhost:3000/users

zabezpieczone:
http://localhost:3000/history/wika
http://localhost:3000/decks/wika
http://localhost:3000/users/wika
http://localhost:3000/comments/wika

wymagany admin:
curl.exe -X DELETE http://localhost:3000/users/wika  => Brak dostępu