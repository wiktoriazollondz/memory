const API_URL = "/api";
let startTime;
let timerInterval;
let socket;
let isGameStarted = false;
let isTimerRunning = false;
let myTurn = false;
let currentRoom = "";
let gameMode = "single";
let currentBoard = [];

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
    sessionStorage.setItem("username", user);
    document.getElementById("logged-user-display").innerText = user;

    document.getElementById("auth-section").style.display = "none";
    document.getElementById("menu-section").style.display = "block";
    document.getElementById("game-section").style.display = "none";

    loadLeaderboard();
    loadComments();
  } else {
    alert("Błąd logowania!");
  }
}

async function logout() {
  if (gameMode === "multi") {
    await fetch(`${API_URL}/comments-clear`, {
      method: "DELETE",
      credentials: "include",
    });
  }
  await fetch(`${API_URL}/logout`, { method: "POST", credentials: "include" });
  sessionStorage.clear();
  location.reload();
}

async function startSinglePlayer() {
  stopTimer();
  isTimerRunning = false;
  const timerElem = document.getElementById("timer");
  if (timerElem) timerElem.innerText = "0";

  gameMode = "single";
  currentRoom = "single_" + Math.random().toString(36).substring(7);

  document.getElementById("game-user-display").innerText =
    "Gracz: " + sessionStorage.getItem("username");
  document.getElementById("menu-section").style.display = "none";
  document.getElementById("game-section").style.display = "block";
  document.getElementById("back-button").style.display = "inline-block";

  startSocket(currentRoom, gameMode);
  createBoard([]);
}

async function startMultiPlayer() {
  const room = prompt("Podaj nazwę pokoju:", "game1");
  if (!room) return;

  gameMode = "multi";
  currentRoom = room;

  document.getElementById("board").innerHTML = "";
  document.getElementById("leaderboard-container").style.display = "none";
  document.getElementById("chat-container").style.display = "block";
  document.getElementById("menu-section").style.display = "none";
  document.getElementById("game-section").style.display = "block";
  document.getElementById("back-button").style.display = "inline-block";

  const turnInfo = document.getElementById("turn-info");
  turnInfo.style.display = "inline";
  turnInfo.innerText = "Oczekiwanie na drugiego gracza...";
  turnInfo.style.color = "orange";

  document.getElementById("room-display").innerText = "Pokój ID: " + room;
  document.getElementById("game-user-display").innerText =
    "Gracz: " + sessionStorage.getItem("username");

  startSocket(currentRoom, gameMode);
}

function startSocket(roomName, mode) {
  currentRoom = roomName;
  socket = io();
  socket.on("connect", () => socket.emit("join-room", { roomName, mode }));

  socket.on("start-game", (data) => {
    isGameStarted = true;
    myTurn = gameMode === "single";
    isTimerRunning = false;
    currentBoard = data.board;
    createBoard(data.board);

    const chatView = document.getElementById("chat-container");
    const leaderboardView = document.getElementById("leaderboard-container");
    const timerView = document.getElementById("timer-container");
    const turnView = document.getElementById("turn-info");
    const backBtn = document.getElementById("back-button");

    if (backBtn) backBtn.style.display = "inline-block";

    if (gameMode === "single") {
      if (chatView) chatView.style.display = "none";
      if (leaderboardView) leaderboardView.style.display = "block";
      if (timerView) timerView.style.display = "inline";
      if (turnView) turnView.style.display = "none";
      loadLeaderboard();
    } else {
      if (chatView) chatView.style.display = "block";
      if (leaderboardView) leaderboardView.style.display = "none";
      if (timerView) timerView.style.display = "none";
      if (turnView) {
        turnView.style.display = "inline";
        turnView.innerText = "Gra się rozpoczęła!";
        turnView.style.color = "blue";
      }
      loadComments();
    }
    stopTimer();
  });

  socket.on("turn-update", (activePlayerId) => {
    if (mode === "single") return;
    const turnInfo = document.getElementById("turn-info");
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
    const cards = document.querySelectorAll(".card");
    cards[data.index].innerText = data.symbol;
    cards[data.index].classList.add("flipped");
  });

  socket.on("match-result", (result) => {
    const cards = document.querySelectorAll(".card");
    if (result.match) {
      result.indices.forEach((idx) => cards[idx].classList.add("matched"));
    } else {
      setTimeout(() => {
        result.indices.forEach((idx) => {
          cards[idx].innerText = "?";
          cards[idx].classList.remove("flipped");
        });
      }, 1000);
    }
  });

  socket.on("global-record-notify", (data) => {
    showGlobalNotification(
      `Nowy wynik! ${data.user} ukończył grę w ${data.score}s!`,
    );
  });

  socket.on("refresh-chat", loadComments);

  socket.on(
    "clear-chat-frontend",
    () => (document.getElementById("comments-list").innerHTML = ""),
  );

  socket.on("game-over", async (data) => {
    const time = stopTimer();
    isGameStarted = false;
    alert(
      data.winnerId === socket.id || mode === "single"
        ? "WYGRANA!"
        : "PRZEGRANA!",
    );

    if (mode === "single") {
      await fetch(
        `${API_URL}/users/${sessionStorage.getItem("username")}/score`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ newTime: parseInt(time) }),
        },
      );
      loadLeaderboard();
    }
    document.getElementById("back-button").style.display = "block";
  });
}

function createBoard(boardLayout) {
  const board = document.getElementById("board");
  board.innerHTML = "";
  boardLayout.forEach((symbol, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerText = "?";
    card.onclick = () => {
      if (!isGameStarted || !myTurn || card.classList.contains("flipped"))
        return;
      if (gameMode === "single" && !isTimerRunning) {
        startTimer();
        isTimerRunning = true;
      }
      socket.emit("flip-card", { index: index, room: currentRoom });
    };
    board.appendChild(card);
  });
}

function showGlobalNotification(text) {
  const notification = document.createElement("div");
  notification.innerText = text;
  notification.classList.add("global-notification");
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 4000);
}

async function loadLeaderboard() {
  const response = await fetch(`${API_URL}/users`);
  const users = await response.json();
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";
  users.forEach((u) => {
    const li = document.createElement("li");
    li.innerText = `${u.username}: ${u.bestTime}s`;
    list.appendChild(li);
  });
}

async function searchPlayers() {
  const term = document.getElementById("search-input").value;
  const response = await fetch(`${API_URL}/users?search=${term}`);
  const users = await response.json();
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";
  users.forEach((u) => {
    const li = document.createElement("li");
    li.innerText = `${u.username}: ${u.bestTime}s`;
    list.appendChild(li);
  });
}

async function loadComments() {
  try {
    const response = await fetch(`${API_URL}/comments`, {
      credentials: "include",
    });
    if (!response.ok) return;

    const comments = await response.json();
    const list = document.getElementById("comments-list");
    if (!list) return;

    const currentUser = sessionStorage.getItem("username");
    list.innerHTML = "";

    comments.forEach((c) => {
      const li = document.createElement("li");
      // Budujemy treść
      let content = `<strong>${c.username}</strong>: ${c.text}`;

      if (c.username === currentUser) {
        content += ` <button onclick="editComment('${c.id}')">Edytuj</button>
                             <button onclick="deleteComment('${c.id}')">Usuń</button>`;
      }

      li.innerHTML = content;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Czat padł:", err);
  }
}

async function addComment(e) {
  if (e) e.preventDefault();
  const input = document.getElementById("comment-input");
  if (!input || !input.value) return;

  const response = await fetch(`${API_URL}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ text: input.value }),
  });

  if (response.ok) {
    input.value = "";
    loadComments();
    if (socket && socket.connected) {
      socket.emit("chat-update", { room: currentRoom });
    }
  } else {
    alert("Błąd wysyłania: " + (await response.text()));
  }
}

async function editComment(id) {
  const newText = prompt("Nowa treść:");
  if (!newText) return;
  const response = await fetch(`${API_URL}/comments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ text: newText }),
  });
  if (response.ok) {
    loadComments();
    socket.emit("chat-update", { room: currentRoom });
  }
}

async function deleteComment(id) {
  if (!confirm("Usunąć?")) return;
  const response = await fetch(`${API_URL}/comments/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (response.ok) {
    loadComments();
    socket.emit("chat-update", { room: currentRoom });
  }
}

function backToMenu() {
  stopTimer();
  isGameStarted = false;
  isTimerRunning = false;

  document.getElementById("board").innerHTML = "";
  document.getElementById("turn-info").innerText = "";
  document.getElementById("room-display").innerText = "";
  document.getElementById("game-user-display").innerText = "";

  const timerElem = document.getElementById("timer");
  if (timerElem) timerElem.innerText = "0";

  if (gameMode === "multi") {
    fetch(`${API_URL}/comments-clear`, {
      method: "DELETE",
      credentials: "include",
    });
  }
  if (socket) socket.disconnect();

  document.getElementById("game-section").style.display = "none";
  document.getElementById("menu-section").style.display = "block";
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

window.onload = function () {
  const savedUser = sessionStorage.getItem("username");
  document.getElementById("game-section").style.display = "none";
  document.getElementById("menu-section").style.display = "none";
  document.getElementById("auth-section").style.display = "block";

  if (savedUser) {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("menu-section").style.display = "block";
    document.getElementById("logged-user-display").innerText = savedUser;
    loadLeaderboard();
  }
};
