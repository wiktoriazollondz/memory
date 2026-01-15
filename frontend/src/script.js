const API_URL = "http://localhost:3000";
let startTime;
let timerInterval;
let socket;
let isGameStarted = false;
let myTurn = false;
let currentRoom = "";
let gameMode = "single";
let currentBoard = [];

async function startSinglePlayer() {
  gameMode = "single";
  currentRoom = "single_" + Math.random().toString(36).substring(7); // Unikalny pokój
  await login();
}

async function startMultiPlayer() {
  gameMode = "multi";
  currentRoom = prompt("Podaj nazwę pokoju:", "game1");
  if (!currentRoom) return;
  await login();
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
    body: JSON.stringify({ username: user, password: pass }),
  });

  if (response.ok) {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("game-section").style.display = "block";
    startSocket(currentRoom, gameMode);
    createBoard();
    loadLeaderboard();
  } else {
    alert("Błąd logowania");
  }
}

function startSocket(roomName, mode) {
  socket = io(API_URL);
  socket.on("connect", () => socket.emit("join-room", { roomName, mode }));

  socket.on("start-game", (data) => {
    isGameStarted = true;
    currentBoard = data.board;
    createBoard(data.board);
    startTimer();
    console.log("Game started by server");
  });

  socket.on("turn-update", (activePlayerId) => {
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
    const allCards = document.querySelectorAll(".card");
    allCards[data.index].innerText = data.symbol;
    allCards[data.index].classList.add("flipped");
  });

  socket.on("match-result", (result) => {
    const allCards = document.querySelectorAll(".card");
    if (result.match) {
      result.indices.forEach((idx) => {
        allCards[idx].style.background = "#2ecc71";
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
      const username = document.getElementById("username").value;
      await fetch(`${API_URL}/users/${username}/score`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newTime: parseInt(finalTime) }),
      });
      loadLeaderboard();
    } else {
      // multiplayer
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
      if (!isGameStarted || !myTurn || card.classList.contains("flipped"))
        return;
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

function backToMenu() {
  stopTimer();
  isGameStarted = false;
  myTurn = false;
  currentRoom = "";
  if (socket) {
    socket.disconnect();
  }

  document.getElementById("game-section").style.display = "none";
  document.getElementById("auth-section").style.display = "block";
  document.getElementById("timer").innerText = "0";
  document.getElementById("turn-info").innerText = "Loading...";
}

async function deleteAccount() {
  const username = document.getElementById("username").value;
  if (!confirm(`Are you sure you want to delete account: ${username}?`)) return;

  try {
    const response = await fetch(`${API_URL}/users/${username}`, {
      method: "DELETE",
    });
    if (response.ok) {
      alert("Account deleted.");
      location.reload(); // powrót do logowania
    }
  } catch (err) {
    console.error("Delete failed", err);
  }
}
