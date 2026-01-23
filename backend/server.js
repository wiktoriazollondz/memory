require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const socketHandler = require("./src/services/socketService");
const authCtrl = require("./src/controllers/authController");
const commentCtrl = require("./src/controllers/commentController");
const authenticateToken = require("./src/middleware/authMiddleware");

const app = express();
app.use(cors({ origin: "http://127.0.0.1:5500", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.post("/register", authCtrl.register);
app.post("/login", authCtrl.login);
app.post("/logout", authCtrl.logout);
app.get("/users", authCtrl.getLeaderboard);
app.patch("/users/:username/score", authenticateToken, authCtrl.updateScore);
app.delete("/users/:username", authenticateToken, authCtrl.deleteAccount);

app.get("/comments", commentCtrl.getComments);
app.post("/comments", authenticateToken, commentCtrl.postComment);
app.patch("/comments/:id", authenticateToken, commentCtrl.editComment);
app.delete("/comments/:id", authenticateToken, commentCtrl.deleteComment);
app.delete("/comments-clear", authenticateToken, commentCtrl.clearAllComments);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

socketHandler(io); // Uruchomienie logiki gry

server.listen(3000, () => console.log("Server running on port 3000"));

// require("dotenv").config();
// const express = require("express");
// const bcrypt = require("bcryptjs");
// const fs = require("fs");
// const http = require("http");
// const { Server } = require("socket.io");
// const mqtt = require("mqtt");
// const cors = require("cors");
// const jwt = require("jsonwebtoken");
// const app = express();
// app.use(
//   cors({
//     origin: "http://127.0.0.1:5500",
//     credentials: true,
//   }),
// );
// app.use(express.json());

// const SECRET_KEY = process.env.JWT_SECRET;
// const DB_FILE = "./database.json";
// let users = [];
// const TOTAL_PAIRS = 8;
// let rooms = {};
// let comments = [];
// const cards = [
//   "🍎",
//   "🍎",
//   "🍌",
//   "🍌",
//   "🍇",
//   "🍇",
//   "🍓",
//   "🍓",
//   "🍒",
//   "🍒",
//   "🍉",
//   "🍉",
//   "🍏",
//   "🍏",
//   "🍑",
//   "🍑",
// ];

// // zmiana odczytu
// if (fs.existsSync(DB_FILE)) {
//   const data = JSON.parse(fs.readFileSync(DB_FILE));
//   users = data.users || [];
//   comments = data.comments || [];
// }

// const saveToFile = () => {
//   const dataToSave = {
//     users: users,
//     comments: comments,
//   };
//   fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2));
// };

// function shuffle(array) {
//   let shuffled = [...array];
//   for (let i = shuffled.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
//   }
//   return shuffled;
// }

// const resetRoom = (roomName) => {
//   if (rooms[roomName]) {
//     rooms[roomName].flippedCards = [];
//     rooms[roomName].matchedPairs = [];
//     rooms[roomName].currentPlayerIndex = 0;
//     rooms[roomName].gameStarted = false;
//   }
// };

// const cookieParser = require("cookie-parser");
// app.use(cookieParser());

// const authenticateToken = (req, res, next) => {
//   // Pobranie tokena z ciasteczka zamiast z Headerów
//   const token = req.cookies.token;

//   if (!token) return res.status(401).send("Brak dostępu (brak ciasteczka)");

//   jwt.verify(token, SECRET_KEY, (err, user) => {
//     if (err) return res.status(403).send("Sesja wygasła");
//     req.user = user;
//     next();
//   });
// };

// // ~~~~~~~~~~~~~~~~ WebSocket ~~~~~~~~~~~~~~~~

// const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: "*" } });

// io.on("connection", (socket) => {
//   socket.on("join-room", (data) => {
//     const { roomName, mode } = data;
//     socket.join(roomName);

//     if (!rooms[roomName]) {
//       rooms[roomName] = {
//         flippedCards: [],
//         matchedPairs: [],
//         players: [],
//         currentPlayerIndex: 0,
//         gameStarted: false,
//         mode: mode,
//         board: shuffle(cards),
//       };
//     }

//     if (!rooms[roomName].players.includes(socket.id)) {
//       rooms[roomName].players.push(socket.id);
//     }

//     if (mode === "single") {
//       rooms[roomName].gameStarted = true;
//       socket.emit("start-game", { board: rooms[roomName].board });
//     } else if (
//       rooms[roomName].players.length === 2 &&
//       !rooms[roomName].gameStarted
//     ) {
//       rooms[roomName].gameStarted = true;
//       io.to(roomName).emit("start-game", { board: rooms[roomName].board });
//     }

//     const activePlayer =
//       rooms[roomName].players[rooms[roomName].currentPlayerIndex];
//     io.to(roomName).emit("turn-update", activePlayer);
//   });

//   socket.on("flip-card", (data) => {
//     const room = rooms[data.room];
//     if (!room || !room.gameStarted) return;

//     if (
//       room.mode === "multi" &&
//       room.players[room.currentPlayerIndex] !== socket.id
//     )
//       return;

//     const symbolFromServer = room.board[data.index];
//     room.flippedCards.push({ index: data.index, symbol: symbolFromServer });

//     io.to(data.room).emit("flip-card", {
//       index: data.index,
//       symbol: symbolFromServer,
//     });

//     if (room.flippedCards.length === 2) {
//       const [card1, card2] = room.flippedCards;
//       if (card1.symbol === card2.symbol && card1.index !== card2.index) {
//         room.matchedPairs.push(card1.index, card2.index);
//         io.to(data.room).emit("match-result", {
//           match: true,
//           indices: [card1.index, card2.index],
//         });

//         if (room.matchedPairs.length === TOTAL_PAIRS * 2) {
//           io.to(data.room).emit("game-over", {
//             winnerId: socket.id,
//             mode: room.mode,
//           });
//           resetRoom(data.room);
//         }
//       } else {
//         io.to(data.room).emit("match-result", {
//           match: false,
//           indices: [card1.index, card2.index],
//         });
//         if (room.mode === "multi") {
//           room.currentPlayerIndex =
//             (room.currentPlayerIndex + 1) % room.players.length;
//         }
//       }
//       room.flippedCards = [];
//       io.to(data.room).emit(
//         "turn-update",
//         room.players[room.currentPlayerIndex],
//       );
//     }
//   });

//   socket.on("disconnect", () => {
//     for (const roomName in rooms) {
//       const room = rooms[roomName];
//       if (room.players.includes(socket.id)) {
//         room.players = room.players.filter((id) => id !== socket.id);

//         if (room.players.length === 0) {
//           delete rooms[roomName];
//         } else {
//           room.gameStarted = false;
//           room.currentPlayerIndex = 0;
//           room.matchedPairs = [];
//           room.flippedCards = [];
//           io.to(roomName).emit("player-left");
//         }
//       }
//     }
//   });
// });

// // ~~~~~~~~~~~~~~~~ mqtt ~~~~~~~~~~~~~~~~

// const mqttClient = mqtt.connect("mqtt://broker.hivemq.com");
// mqttClient.on("connect", () => {
//   console.log("MQTT connected");
// });

// // ~~~~~~~~~~~~~~~~ CRUD ~~~~~~~~~~~~~~~~

// app.post("/register", async (req, res) => {
//   const { username, password } = req.body;
//   if (users.find((u) => u.username === username))
//     return res.status(400).send("Exists");
//   const hashedPassword = await bcrypt.hash(password, 10);
//   users.push({ username, password: hashedPassword, bestTime: null });
//   saveToFile();
//   res.status(201).send("Registered");
// });

// app.post("/login", async (req, res) => {
//   const { username, password } = req.body;
//   const user = users.find((u) => u.username === username);

//   if (!user || !(await bcrypt.compare(password, user.password))) {
//     return res.status(400).send("Błędny login lub hasło");
//   }

//   const token = jwt.sign({ username: user.username }, SECRET_KEY, {
//     expiresIn: "1h",
//   });

//   // ciasteczka
//   res.cookie("token", token, {
//     httpOnly: true,
//     secure: false,
//     sameSite: "lax",
//     maxAge: 3600000, // 1h
//   });

//   res.status(200).json({ username: user.username });
// });

// app.post("/logout", (req, res) => {
//   res.clearCookie("token");
//   res.status(200).send("Logged out");
// });

// app.get("/users", (req, res) => {
//   const searchText = req.query.search;
//   let leaderboard = users
//     .filter((u) => u.bestTime !== null)
//     .sort((a, b) => a.bestTime - b.bestTime);
//   if (searchText)
//     leaderboard = leaderboard.filter((u) =>
//       u.username.toLowerCase().includes(searchText.toLowerCase()),
//     );
//   res.json(
//     leaderboard.map((u) => ({ username: u.username, bestTime: u.bestTime })),
//   );
// });

// app.patch("/users/:username/score", authenticateToken, async (req, res) => {
//   if (req.user.username !== req.params.username) {
//     return res.status(403).send("Nie możesz zmieniać wyników innych graczy!");
//   }

//   const { newTime } = req.body;
//   const user = users.find((u) => u.username === req.params.username);
//   if (user && (user.bestTime === null || newTime < user.bestTime)) {
//     user.bestTime = newTime;
//     saveToFile();
//     mqttClient.publish(
//       "memory-game/scores",
//       JSON.stringify({ player: user.username, score: newTime }),
//     );
//   }
//   res.json(user);
// });

// app.delete("/users/:username", authenticateToken, async (req, res) => {
//   if (req.user.username !== req.params.username) {
//     return res.status(403).send("Nie masz uprawnień");
//   }
//   users = users.filter((u) => u.username !== req.params.username);
//   saveToFile();
//   res.json({ message: "Deleted" });
// });

// app.post("/comments", authenticateToken, (req, res) => {
//   const { text } = req.body;
//   const newComment = {
//     id: Date.now().toString(),
//     username: req.user.username,
//     text: text,
//     date: new Date().toLocaleString(),
//   };
//   comments.push(newComment);
//   saveToFile(); // <-- DODAJ TO, żeby komentarze się zapisywały
//   res.status(201).json(newComment);
// });

// app.get("/comments", (req, res) => {
//   res.json(comments);
// });

// app.patch("/comments/:id", authenticateToken, (req, res) => {
//   const comment = comments.find((c) => c.id === req.params.id);

//   if (!comment) return res.status(404).send("Nie znaleziono komentarza");
//   if (comment.username !== req.user.username)
//     return res.status(403).send("To nie Twój komentarz!");

//   comment.text = req.body.text;
//   res.json(comment);
// });

// app.delete("/comments/:id", authenticateToken, (req, res) => {
//   const commentIndex = comments.findIndex((c) => c.id === req.params.id);

//   if (commentIndex === -1) return res.status(404).send("Nie znaleziono");
//   if (comments[commentIndex].username !== req.user.username)
//     return res.status(403).send("Brak uprawnień");

//   comments.splice(commentIndex, 1);
//   res.json({ message: "Usunięto komentarz" });
// });

// server.listen(3000, () => console.log("Server running on port 3000"));
