require("dotenv").config();
const express = require("express");
const { auth } = require("express-oauth2-jwt-bearer");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const socketHandler = require("./src/socketService");
const userCtrl = require("./src/controllers/userController");
const commentCtrl = require("./src/controllers/commentController");
const historyCtrl = require("./src/controllers/historyController");
const deckCtrl = require("./src/controllers/deckController");

const app = express();

// middleware OAuth 2.0 z Logto
const requireAuth = auth({
  audience: "https://memory-api", // API Identifier z Logto
  issuerBaseURL: "http://localhost:3001/oidc", // kto wydał token
  jwksUri: "http://logto-service-dev:3001/oidc/jwks", // skąd backend w K8s ma pobrać klucze szyfrujące
});

// middleware do sprawdzania roli admina
const requireAdmin = (req, res, next) => {
  // wyciągamy role z odszyfrowanego tokena
  const roles = req.auth?.payload?.roles || [];

  if (roles.includes("admin")) {
    next();
  } else {
    res.status(403).json({ error: "Dostęp zabroniony: Wymagana rola admina" });
  }
};

app.use(cors({ origin: "http://127.0.0.1:5500", credentials: true }));
app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

socketHandler(io);
userCtrl.initMQTT(io);

// endpoint niezabezpieczone (dla każdego)
app.get("/health", (req, res) => res.status(200).send({ status: "OK" }));
app.get("/users", userCtrl.getLeaderboard);

// endpointy zabezpieczone (requireAuth)
app.patch("/users/:username/score", requireAuth, userCtrl.updateScore);

// endpoint wymagający admina (requireAuth + requireAdmin)
app.delete(
  "/users/:username",
  requireAuth,
  requireAdmin,
  userCtrl.deleteAccount,
);

app.get("/comments", commentCtrl.getComments);
app.post("/comments", requireAuth, commentCtrl.postComment);
app.patch("/comments/:id", requireAuth, commentCtrl.editComment);
app.delete("/comments/:id", requireAuth, commentCtrl.deleteComment);
app.delete("/comments-clear", requireAuth, commentCtrl.clearAllComments);

app.get("/history", requireAuth, historyCtrl.getHistory);
app.post("/history", requireAuth, historyCtrl.postHistory);
app.patch("/history/:id", requireAuth, historyCtrl.updateHistoryNote);
app.delete("/history/:id", requireAuth, historyCtrl.deleteHistory);

app.get("/decks", requireAuth, deckCtrl.getDecks);
app.post("/decks", requireAuth, deckCtrl.createDeck);
app.patch("/decks/:id", requireAuth, deckCtrl.updateDeck);
app.delete("/decks/:id", requireAuth, deckCtrl.deleteDeck);

server.listen(3000, "0.0.0.0", () => {
  console.log("Serwer działa na porcie 3000");
});
