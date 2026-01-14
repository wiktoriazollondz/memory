const API_URL = "http://localhost:3000";
let startTime;
let timerInterval;
let socket;
let isGameStarted = false;
const cards = [
  "🍎",
  "🍎",
  "🍌",
  "🍌",
  "🍇",
  "🍇",
  "🍓",
  "🍓",
  "🍒",
  "🍒",
  "🍉",
  "🍉",
  "🍏",
  "🍏",
  "🍑",
  "🍑",
];

function startTimer() {
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
    startSocket();
    createBoard();
    loadLeaderboard();
  } else {
    alert("Login failed");
  }
}

function startSocket() {
  socket = io(API_URL);
  socket.on("connect", () => socket.emit("join-room", "game1"));

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
    const username = document.getElementById("username").value;
    alert(`${data.message} Czas: ${finalTime}s`);

    await fetch(`${API_URL}/users/${username}/score`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newTime: parseInt(finalTime) }),
    });
    loadLeaderboard();
  });
}

function createBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";
  isGameStarted = false;
  cards.forEach((symbol, index) => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerText = "?";
    card.onclick = () => {
      if (!isGameStarted) {
        startTimer();
        isGameStarted = true;
      }
      socket.emit("flip-card", { index, symbol, room: "game1" });
    };
    board.appendChild(card);
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

async function deleteAccount() {
  const username = document.getElementById("username").value;
  if (!confirm(`Are you sure you want to delete account: ${username}?`)) return;

  try {
    const response = await fetch(`${API_URL}/users/${username}`, {
      method: "DELETE",
    });

    if (response.ok) {
      alert("Account deleted.");
      location.reload(); // Odśwież stronę, by wrócić do logowania
    }
  } catch (err) {
    console.error("Delete failed", err);
  }
}
