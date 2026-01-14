const express = require("express");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const mqtt = require("mqtt");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = "./database.json";
let users = [];
const TOTAL_PAIRS = 8;

// load data from file
if (fs.existsSync(DB_FILE)) {
  const data = fs.readFileSync(DB_FILE);
  users = JSON.parse(data);
}
const saveToFile = () => {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
};

let gameState = {
  flippedCards: [],
  matchedPairs: [],
};

// ~~~~~~~~~ websocket ~~~~~~~~~
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  gameState.flippedCards = [];
  gameState.matchedPairs = [];

  socket.on("join-room", (roomName) => {
    socket.join(roomName);
    console.log(`User ${socket.id} joined room: ${roomName}`);
  });

  socket.on("flip-card", (data) => {
    // data = { index: 0, symbol: '🍎', room: 'game1' }
    gameState.flippedCards.push(data);
    io.to(data.room).emit("flip-card", data);

    if (gameState.flippedCards.length === 2) {
      const [card1, card2] = gameState.flippedCards;

      if (card1.symbol === card2.symbol && card1.index !== card2.index) {
        // para
        gameState.matchedPairs.push(card1.index, card2.index);

        io.to(data.room).emit("match-result", {
          match: true,
          indices: [card1.index, card2.index],
        });

        // Sprawdź czy to koniec (wszystkie 8 kart trafione)
        if (gameState.matchedPairs.length === TOTAL_PAIRS * 2) {
          io.to(data.room).emit("game-over", {
            message: "Gratulacje! Odnaleziono wszystkie pary!",
          });
        }
      } else {
        // pudło
        io.to(data.room).emit("match-result", {
          match: false,
          indices: [card1.index, card2.index],
        });
      }
      gameState.flippedCards = [];
    }
  });

  socket.on("disconnect", () => console.log("User disconnected"));
});

// ~~~~~~~~~ mqtt ~~~~~~~~~
const mqttClient = mqtt.connect("mqtt://broker.hivemq.com");

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker!");
  mqttClient.subscribe("memory-game/announcements");
});

// ~~~~~~~~~ CRUD ~~~~~~~~~
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (users.find((u) => u.username === username))
      return res.status(400).send("User already exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword, bestTime: null });
    saveToFile();
    res.status(201).send("User registered");
  } catch {
    res.status(500).send("Error on server");
  }
});

app.get("/users", (req, res) => {
  try {
    const searchText = req.query.search;
    let leaderboard = users
      .filter((u) => u.bestTime !== null)
      .sort((a, b) => a.bestTime - b.bestTime)
      .map((u) => ({ username: u.username, bestTime: u.bestTime }));

    if (searchText) {
      leaderboard = leaderboard.filter((u) =>
        u.username.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    res.json(leaderboard);
  } catch {
    res.status(500).send("Błąd serwera");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = users.find((u) => u.username === username);
    if (!user) return res.status(400).send("User not found");

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) res.status(200).send(`Welcome ${user.username}!`);
    else res.status(400).send("Invalid password");
  } catch {
    res.status(500).send("Error on server");
  }
});

app.patch("/users/:username/score", async (req, res) => {
  try {
    const { newTime } = req.body;
    const { username } = req.params;
    const user = users.find((u) => u.username === username);
    if (!user) return res.status(404).send("User not found");

    if (user.bestTime === null || newTime < user.bestTime) {
      user.bestTime = newTime;
      saveToFile();
      mqttClient.publish(
        "memory-game/scores",
        JSON.stringify({ player: username, score: newTime })
      );
    }
    res.json(user);
  } catch {
    res.status(500).send("Error on server");
  }
});

app.delete("/users/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const userExists = users.some((u) => u.username === username);
    if (!userExists) return res.status(404).send("User not found");

    users = users.filter((u) => u.username !== username);

    saveToFile();
    res.json({
      message: `User ${username} and their scores deleted successfully.`,
    });
  } catch {
    res.status(500).send("Error on server");
  }
});

server.listen(3000, () => console.log("Server running on port 3000"));
