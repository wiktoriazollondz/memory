const API_URL = "http://127.0.0.1:3000";
let startTime;
let timerInterval;
let socket;
let isGameStarted = false;
let isTimerRunning = false;
let myTurn = false;
let currentRoom = "";
let gameMode = "single";
let currentBoard = [];

document.addEventListener("submit", (e) => e.preventDefault());

async function startSinglePlayer() {
  gameMode = "single";
  currentRoom = "single_" + Math.random().toString(36).substring(7);

  document.getElementById("menu-section").style.display = "none";
  document.getElementById("game-section").style.display = "block";
  startSocket(currentRoom, gameMode);
  createBoard([]);
}

async function startMultiPlayer() {
  const room = prompt("Podaj nazwę pokoju:", "game1");
  if (!room) return;
  gameMode = "multi";
  currentRoom = room;

  document.getElementById("menu-section").style.display = "none";
  document.getElementById("game-section").style.display = "block";
  startSocket(currentRoom, gameMode);
  createBoard([]);
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById("timer").innerText = seconds;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  return document.getElementById("timer").innerText;
}

async function register() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password: pass }),
  });
  alert(await response.text());
}

async function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username: user, password: pass }),
  });

  if (response.ok) {
    localStorage.setItem("username", user);
    document.getElementById("logged-user-display").innerText = user;
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("menu-section").style.display = "block"; // Pokazujemy menu
    document.getElementById("game-section").style.display = "none";
    loadLeaderboard();
    loadComments();
  } else {
    alert("Błąd logowania: " + (await response.text()));
  }
}

async function logout() {
  try {
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    console.error("Błąd wylogowania na serwerze", err);
  }
  localStorage.removeItem("username");
  localStorage.removeItem("roomName");
  localStorage.removeItem("gameMode");
  document.getElementById("menu-section").style.display = "none";
  document.getElementById("game-section").style.display = "none";
  document.getElementById("auth-section").style.display = "block";
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}

function startSocket(roomName, mode) {
  currentRoom = roomName;
  gameMode = mode;
  localStorage.setItem("roomName", roomName);
  localStorage.setItem("gameMode", mode);
  socket = io(API_URL);
  socket.on("connect", () => socket.emit("join-room", { roomName, mode }));

  socket.on("start-game", (data) => {
    isGameStarted = true;
    isTimerRunning = false;
    currentBoard = data.board;
    createBoard(data.board);
    const timerView = document.getElementById("timer-container");
    const turnView = document.getElementById("turn-info");

    if (gameMode === "single") {
      timerView.style.display = "inline";
      turnView.style.display = "none";
      document.getElementById("timer").innerText = "0";
    } else {
      timerView.style.display = "none";
      turnView.style.display = "inline";
    }
    stopTimer();
  });

  socket.on("player-left", () => {
    isGameStarted = false;
    stopTimer();
    alert("Przeciwnik opuścił pokój. Oczekiwanie na nowego gracza...");
    document.getElementById("turn-info").innerText =
      "Oczekiwanie na przeciwnika...";
    document.getElementById("turn-info").style.color = "orange";
  });

  socket.on("turn-update", (activePlayerId) => {
    if (gameMode === "single") {
      myTurn = true;
      return;
    }
    const turnInfo = document.getElementById("turn-info");
    turnInfo.style.display = "inline";

    if (socket.id === activePlayerId) {
      myTurn = true;
      turnInfo.innerText = "Twoja tura!";
      turnInfo.style.color = "green";
    } else {
      myTurn = false;
      turnInfo.innerText = "Czekaj na ruch przeciwnika...";
      turnInfo.style.color = "red";
    }
  });

  socket.on("flip-card", (data) => {
    const allCards = document.querySelectorAll(".card");
    allCards[data.index].innerText = data.symbol;
    allCards[data.index].classList.add("flipped");
  });

  socket.on("match-result", (result) => {
    const allCards = document.querySelectorAll(".card");
    if (result.match) {
      result.indices.forEach((idx) => {
        allCards[idx].onclick = null;
        allCards[idx].classList.add("matched");
      });
    } else {
      setTimeout(() => {
        result.indices.forEach((idx) => {
          allCards[idx].innerText = "?";
          allCards[idx].classList.remove("flipped");
        });
      }, 1000);
    }
  });

  socket.on("game-over", async (data) => {
    const finalTime = stopTimer();
    isGameStarted = false;

    if (data.mode === "single") {
      alert(`GRATULACJE! Twój czas: ${finalTime}s`);
      const username = localStorage.getItem("username");

      await fetch(`${API_URL}/users/${username}/score`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newTime: parseInt(finalTime) }),
      });
      loadLeaderboard();
    } else {
      if (socket.id === data.winnerId) {
        alert("GRATULACJE! Wygrałeś pojedynek!");
      } else {
        alert("PRZEGRANA :( Powodzenia następnym razem!");
      }
    }
    document.getElementById("back-button").style.display = "block";
  });
}

function createBoard(boardLayout) {
  const boardElement = document.getElementById("board");
  boardElement.innerHTML = "";

  boardLayout.forEach((symbol, index) => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerText = "?";
    card.onclick = () => {
      if (gameMode === "single" && isGameStarted && !isTimerRunning) {
        startTimer();
        isTimerRunning = true;
      }

      if (
        !isGameStarted ||
        !myTurn ||
        card.classList.contains("flipped") ||
        card.classList.contains("matched")
      ) {
        return;
      }
      socket.emit("flip-card", { index: index, room: currentRoom });
    };
    boardElement.appendChild(card);
  });
}

async function searchPlayers() {
  const term = document.getElementById("search-input").value;
  const response = await fetch(`${API_URL}/users?search=${term}`);
  renderLeaderboard(await response.json());
}

function renderLeaderboard(users) {
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";
  users.forEach((u) => {
    const li = document.createElement("li");
    li.innerText = `${u.username}: ${u.bestTime}s`;
    list.appendChild(li);
  });
}

async function loadLeaderboard() {
  const response = await fetch(`${API_URL}/users`);
  renderLeaderboard(await response.json());
}

async function addComment(event) {
  if (event) event.preventDefault();
  const text = document.getElementById("comment-input").value;
  if (!text) return;

  const response = await fetch(`${API_URL}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ text }),
  });

  if (response.ok) {
    document.getElementById("comment-input").value = "";
    loadComments();
  } else {
    alert("Błąd wysyłania: " + (await response.text()));
  }
}

async function loadComments() {
  try {
    const response = await fetch(`${API_URL}/comments`, {
      credentials: "include",
    });

    if (!response.ok) {
      console.error("Błąd pobierania komentarzy:", response.status);
      return;
    }

    const comments = await response.json();
    const list = document.getElementById("comments-list");
    const currentUser = localStorage.getItem("username");

    list.innerHTML = "";
    comments.forEach((c) => {
      const isOwner = c.username === currentUser;
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${c.username}</strong>: 
        <span id="text-${c.id}">${c.text}</span>
        ${
          isOwner
            ? `
          <button type="button" onclick="editComment('${c.id}')">Edytuj</button>
          <button type="button" onclick="deleteComment('${c.id}')">Usuń</button>
        `
            : ""
        }
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Błąd sieci:", err);
  }
}

async function editComment(id) {
  const newText = prompt("Wpisz nową treść komentarza:");
  if (!newText) return;

  const response = await fetch(`${API_URL}/comments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Przesyła ciasteczko autoryzacyjne
    body: JSON.stringify({ text: newText }),
  });

  if (response.ok) loadComments();
  else alert("Błąd edycji: " + (await response.text()));
}

async function deleteComment(id) {
  if (!confirm("Usunąć komentarz?")) return;

  const response = await fetch(`${API_URL}/comments/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (response.ok) loadComments();
  else alert("Błąd usuwania: " + (await response.text()));
}

function backToMenu() {
  stopTimer();
  isGameStarted = false;
  if (socket) socket.disconnect();

  document.getElementById("timer-container").style.display = "none";
  document.getElementById("turn-info").style.display = "none";
  document.getElementById("game-section").style.display = "none";
  document.getElementById("menu-section").style.display = "block";
}

async function deleteAccount() {
  const username = localStorage.getItem("username");
  if (!confirm(`Usunąć konto ${username}?`)) return;

  const response = await fetch(`${API_URL}/users/${username}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (response.ok) {
    alert("Account deleted.");
    logout();
  } else {
    alert("Błąd: " + (await response.text()));
  }
}

window.onload = function () {
  const savedUser = localStorage.getItem("username");

  document.getElementById("game-section").style.display = "none";
  document.getElementById("menu-section").style.display = "none";
  document.getElementById("auth-section").style.display = "block";

  if (savedUser) {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("menu-section").style.display = "block";
    document.getElementById("game-section").style.display = "none";
    document.getElementById("logged-user-display").innerText = savedUser;
    loadLeaderboard();
    loadComments();
  }
};

document
  .getElementById("comment-input")
  .addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addComment(e);
    }
  });
