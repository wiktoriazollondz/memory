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

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

socketHandler(io);

authCtrl.initMQTT(io);

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

server.listen(3000, "0.0.0.0", () => {
  console.log("Serwer działa na porcie 3000");
});
