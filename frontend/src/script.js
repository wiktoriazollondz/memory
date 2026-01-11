const API_URL = "http://localhost:3000";

async function register() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass }),
    });

    const data = await response.text();
    alert(data);
  } catch (error) {
    console.error("Error registering:", error);
  }
}

async function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass }),
    });

    if (response.ok) {
      const message = await response.text();
      alert(message);

      document.getElementById("auth-section").style.display = "none";
      document.getElementById("game-section").style.display = "block";
      document.getElementById("room-id").innerText = "test room";

      startSocket();
      createBoard();
      loadLeaderboard();
    } else {
      alert("Login failed");
    }
  } catch (error) {
    console.error("Connection error:", error);
  }
}

let socket;

function startSocket() {
  socket = io(API_URL);

  socket.on("connect", () => {
    console.log("Connected to WS with ID:", socket.id);
    socket.emit("join-room", "game1");
  });

  // listen for card flips from other players
  socket.on("flip-card", (data) => {
    console.log("Another player flipped card:", data.index);

    const allCards = document.querySelectorAll(".card");
    const targetCard = allCards[data.index];

    if (targetCard) {
      targetCard.innerText = data.symbol;
      targetCard.classList.add("flipped");

      // hide after 1 second
      setTimeout(() => {
        targetCard.innerText = "?";
        targetCard.classList.remove("flipped");
      }, 1000);
    }
  });
}

const cards = ["🍎", "🍎", "🍌", "🍌", "🍇", "🍇", "🍓", "🍓"];

function createBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";

  cards.forEach((symbol, index) => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.index = index;
    card.innerText = "?";

    card.onclick = () => {
      socket.emit("flip-card", {
        index: index,
        symbol: symbol,
        room: "game1",
      });
    };
    board.appendChild(card);
  });
}

async function loadLeaderboard() {
  try {
    const response = await fetch(`${API_URL}/users`);
    const users = await response.json();

    const list = document.getElementById("leaderboard-list");
    list.innerHTML = "";

    users.forEach((u) => {
      const li = document.createElement("li");
      li.innerText = `${u.username}`;
      list.appendChild(li);
    });
  } catch (error) {
    console.error("Leaderboard failed", error);
  }
}
