require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const socketHandler = require("./src/socketService");
const userCtrl = require("./src/controllers/userController");
const commentCtrl = require("./src/controllers/commentController");
const historyCtrl = require("./src/controllers/historyController");
const deckCtrl = require("./src/controllers/deckController");
const authenticateToken = require("./src/token");

const app = express();
app.use(cors({ origin: "http://127.0.0.1:5500", credentials: true }));
app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

socketHandler(io);

userCtrl.initMQTT(io);

app.get('/health', (req, res) => res.status(200).send({ status: 'OK' }));
app.post("/login", userCtrl.login);
app.post("/logout", userCtrl.logout);

app.post("/register", userCtrl.register);
app.get("/users", userCtrl.getLeaderboard);
app.patch("/users/:username/score", authenticateToken, userCtrl.updateScore);
app.delete("/users/:username", authenticateToken, userCtrl.deleteAccount);

app.get("/comments", commentCtrl.getComments);
app.post("/comments", authenticateToken, commentCtrl.postComment);
app.patch("/comments/:id", authenticateToken, commentCtrl.editComment);
app.delete("/comments/:id", authenticateToken, commentCtrl.deleteComment);
app.delete("/comments-clear", authenticateToken, commentCtrl.clearAllComments);

app.get("/history", authenticateToken, historyCtrl.getHistory);
app.post("/history", authenticateToken, historyCtrl.postHistory);
app.patch("/history/:id", authenticateToken, historyCtrl.updateHistoryNote);
app.delete("/history/:id", authenticateToken, historyCtrl.deleteHistory);

app.get("/decks", authenticateToken, deckCtrl.getDecks);
app.post("/decks", authenticateToken, deckCtrl.createDeck);
app.patch("/decks/:id", authenticateToken, deckCtrl.updateDeck);
app.delete("/decks/:id", authenticateToken, deckCtrl.deleteDeck);

server.listen(3000, "0.0.0.0", () => {
  console.log("Serwer działa na porcie 3000");
});
