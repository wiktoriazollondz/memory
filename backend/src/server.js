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
let rooms = {};
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

function shuffle(array) {
  let shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

if (fs.existsSync(DB_FILE)) {
  const data = fs.readFileSync(DB_FILE);
  users = JSON.parse(data);
}
const saveToFile = () => {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
};

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const resetRoom = (roomName) => {
  if (rooms[roomName]) {
    rooms[roomName].flippedCards = [];
    rooms[roomName].matchedPairs = [];
    rooms[roomName].currentPlayerIndex = 0;
    rooms[roomName].gameStarted = false;
  }
};

io.on("connection", (socket) => {
  socket.on("join-room", (data) => {
    const { roomName, mode } = data;
    socket.join(roomName);

    if (!rooms[roomName]) {
      rooms[roomName] = {
        flippedCards: [],
        matchedPairs: [],
        players: [],
        currentPlayerIndex: 0,
        gameStarted: false,
        mode: mode,
        board: shuffle(cards),
      };
    }

    if (!rooms[roomName].players.includes(socket.id)) {
      rooms[roomName].players.push(socket.id);
    }

    if (mode === "single") {
      rooms[roomName].gameStarted = true;
      socket.emit("start-game", { board: rooms[roomName].board });
    } else if (
      rooms[roomName].players.length >= 2 &&
      !rooms[roomName].gameStarted
    ) {
      rooms[roomName].gameStarted = true;
      io.to(roomName).emit("start-game", { board: rooms[roomName].board });
    }

    io.to(roomName).emit(
      "turn-update",
      rooms[roomName].players[rooms[roomName].currentPlayerIndex]
    );
  });

  socket.on("flip-card", (data) => {
    const room = rooms[data.room];
    if (!room || !room.gameStarted) return;

    if (
      room.mode === "multi" &&
      room.players[room.currentPlayerIndex] !== socket.id
    )
      return;

    const symbolFromServer = room.board[data.index];
    room.flippedCards.push({ index: data.index, symbol: symbolFromServer });

    io.to(data.room).emit("flip-card", {
      index: data.index,
      symbol: symbolFromServer,
    });

    if (room.flippedCards.length === 2) {
      const [card1, card2] = room.flippedCards;
      if (card1.symbol === card2.symbol && card1.index !== card2.index) {
        room.matchedPairs.push(card1.index, card2.index);
        io.to(data.room).emit("match-result", {
          match: true,
          indices: [card1.index, card2.index],
        });

        if (room.matchedPairs.length === TOTAL_PAIRS * 2) {
          io.to(data.room).emit("game-over", {
            winnerId: socket.id,
            mode: room.mode,
          });
          resetRoom(data.room);
        }
      } else {
        io.to(data.room).emit("match-result", {
          match: false,
          indices: [card1.index, card2.index],
        });
        if (room.mode === "multi") {
          room.currentPlayerIndex =
            (room.currentPlayerIndex + 1) % room.players.length;
        }
      }
      room.flippedCards = [];
      io.to(data.room).emit(
        "turn-update",
        room.players[room.currentPlayerIndex]
      );
    }
  });

  socket.on("disconnect", () => {
    for (const roomName in rooms) {
      rooms[roomName].players = rooms[roomName].players.filter(
        (id) => id !== socket.id
      );

      if (rooms[roomName].players.length === 0) {
        delete rooms[roomName];
      } else {
        resetRoom(roomName);
      }
    }
  });
});

const mqttClient = mqtt.connect("mqtt://broker.hivemq.com");
mqttClient.on("connect", () => {
  console.log("MQTT connected");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (users.find((u) => u.username === username))
    return res.status(400).send("Exists");
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword, bestTime: null });
  saveToFile();
  res.status(201).send("Registered");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(400).send("Failed");
  res.status(200).send(`Welcome ${user.username}!`);
});

app.get("/users", (req, res) => {
  const searchText = req.query.search;
  let leaderboard = users
    .filter((u) => u.bestTime !== null)
    .sort((a, b) => a.bestTime - b.bestTime);
  if (searchText)
    leaderboard = leaderboard.filter((u) =>
      u.username.toLowerCase().includes(searchText.toLowerCase())
    );
  res.json(
    leaderboard.map((u) => ({ username: u.username, bestTime: u.bestTime }))
  );
});

app.patch("/users/:username/score", async (req, res) => {
  const { newTime } = req.body;
  const user = users.find((u) => u.username === req.params.username);
  if (user && (user.bestTime === null || newTime < user.bestTime)) {
    user.bestTime = newTime;
    saveToFile();
    mqttClient.publish(
      "memory-game/scores",
      JSON.stringify({ player: user.username, score: newTime })
    );
  }
  res.json(user);
});

app.delete("/users/:username", async (req, res) => {
  users = users.filter((u) => u.username !== req.params.username);
  saveToFile();
  res.json({ message: "Deleted" });
});

server.listen(3000, () => console.log("Server running on port 3000"));
