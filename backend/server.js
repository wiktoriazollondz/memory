require("dotenv").config();
const express = require("express");
const { auth } = require("express-oauth2-jwt-bearer");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const socketHandler = require("./src/socketService");
const userCtrl = require("./src/controllers/userController");
const commentCtrl = require("./src/controllers/commentController");
const historyCtrl = require("./src/controllers/historyController");
const deckCtrl = require("./src/controllers/deckController");

const app = express();

// middleware OAuth 2.0 z Logto
const requireAuth = auth({
  audience: "https://memory-api", // API Identifier z Logto
  issuer: "http://localhost:3001/oidc", // kto wydał token
  jwksUri: "http://logto-service-dev:3001/oidc/jwks", // skąd backend w K8s ma pobrać klucze szyfrujące
});

// middleware do sprawdzania roli admina
const requireAdmin = (req, res, next) => {
  console.log("ROLE Z TOKENA:", JSON.stringify(req.auth?.payload?.roles));
  const roles = req.auth?.payload?.roles || [];

  if (roles.includes("admin")) {
    next();
  } else {
    res.status(403).json({ error: "Dostęp zabroniony: Wymagana rola admina" });
  }
};

app.use(cors({ origin: "http://localhost:8080", credentials: true }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

socketHandler(io);
userCtrl.initMQTT(io);

// endpoint niezabezpieczone
app.get("/health", (req, res) => res.status(200).send({ status: "OK" }));
app.get("/users", userCtrl.getLeaderboard);
app.get("/comments", commentCtrl.getComments);

// endpointy zabezpieczone (requireAuth)
app.post("/sync-user", requireAuth, userCtrl.syncUser);
app.patch("/users/:username/score", requireAuth, userCtrl.updateScore);

// endpoint wymagający admina (requireAuth + requireAdmin)
app.delete(
  "/users/:username",
  requireAuth,
  requireAdmin,
  userCtrl.deleteAccount,
);

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

app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    console.error("Błąd tokena JWT (401):", err.message);
    res.status(401).send(err.message);
  } else {
    next(err);
  }
});

if (require.main === module) {
  server.listen(3000, "0.0.0.0", () => {
    console.log("Serwer działa na porcie 3000");
  });
}

module.exports = app;
