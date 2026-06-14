import {
  socket,
  setSocket,
  setCurrentRoom,
  gameMode,
  API_URL,
  isGameStarted,
  setIsGameStarted,
  setIsTimerRunning,
  setMyTurn,
  setCurrentBoard,
  setLockBoard,
  lockBoard,
  myTurn,
} from "./config.js";
import { createBoard, stopTimer, backToMenu } from "./game.js";
import { loadLeaderboard } from "./leaderboard.js";
import { loadComments } from "./chat.js";
import { showToast } from "./notifications.js";

export function startSocket(roomName, mode, icons = null) {
  if (socket) {
    socket.disconnect();
  }
  const newSocket = io({ transports: ["websocket"] });

  setSocket(newSocket);
  setCurrentRoom(roomName);

  newSocket.on("connect", () => {
    console.log("Połączono z socketem!");
    newSocket.emit("join-room", { roomName, mode, icons });
  });

  newSocket.on("start-game", (data) => {
    setIsGameStarted(true);
    setMyTurn(gameMode === "single");
    setIsTimerRunning(false);
    document.getElementById("timer").innerText = "0";
    setCurrentBoard(data.board);
    createBoard(data.board);

    const chatView = document.getElementById("chat-container");
    const leaderboardView = document.getElementById("leaderboard-container");
    const timerView = document.getElementById("timer-container");
    const turnView = document.getElementById("turn-info");
    const backBtn = document.getElementById("back-button");
    const scoreDisplay = document.getElementById("score-display");

    if (backBtn) backBtn.style.display = "inline-block";

    if (gameMode === "single") {
      if (chatView) chatView.style.display = "none";
      if (leaderboardView) leaderboardView.style.display = "block";
      if (timerView) timerView.style.display = "inline";
      if (turnView) turnView.style.display = "none";
      if (scoreDisplay) scoreDisplay.innerText = "";
      loadLeaderboard();
    } else {
      if (chatView) chatView.style.display = "block";
      if (leaderboardView) leaderboardView.style.display = "none";
      if (timerView) timerView.style.display = "none";
      if (turnView) {
        turnView.style.display = "inline";
        turnView.innerText = "Gra się rozpoczęła!";
        turnView.style.color = "blue";
      }
      if (scoreDisplay) scoreDisplay.innerText = "0 : 0";
      loadComments();
    }
    stopTimer();
  });

  newSocket.on("turn-update", (activePlayerId) => {
    if (mode === "single") return;
    if (!isGameStarted) return;
    const turnInfo = document.getElementById("turn-info");
    if (newSocket.id === activePlayerId) {
      setMyTurn(true);
      turnInfo.innerText = "Twoja tura!";
      turnInfo.style.color = "green";
    } else {
      setMyTurn(false);
      turnInfo.innerText = "Ruch przeciwnika...";
      turnInfo.style.color = "red";
    }
  });

  newSocket.on("flip-card", (data) => {
    const cards = document.querySelectorAll(".card");
    cards[data.index].innerText = data.symbol;
    cards[data.index].classList.add("flipped");

    const flippedCards = document.querySelectorAll(
      ".card.flipped:not(.matched)",
    );
    if (flippedCards.length === 2) {
      setLockBoard(true);
    }
  });

  newSocket.on("score-update", (scores) => {
    const scoreDisplay = document.getElementById("score-display");
    if (!scoreDisplay) return;

    if (gameMode === "multi") {
      const myScore = scores[newSocket.id] || 0;
      const opponentId = Object.keys(scores).find((id) => id !== newSocket.id);
      const opponentScore = opponentId ? scores[opponentId] || 0 : 0;

      scoreDisplay.innerText = `${myScore} : ${opponentScore}`;
    }
  });

  newSocket.on("match-result", (result) => {
    const cards = document.querySelectorAll(".card");

    if (result.match) {
      result.indices.forEach((idx) => cards[idx].classList.add("matched"));
      setLockBoard(false);
    } else {
      setTimeout(() => {
        result.indices.forEach((idx) => {
          cards[idx].innerText = "?";
          cards[idx].classList.remove("flipped");
        });
        setLockBoard(false);
      }, 1000);
    }
  });

  newSocket.on("global-record-notify", (data) => {
    showGlobalNotification(
      `Nowy wynik! ${data.user} ukończył grę w ${data.score}s!`,
    );
  });

  socket.on("mqtt-player-count", (count) => {
    const counterElem = document.getElementById("online-counter");
    if (counterElem) counterElem.innerText = `Graczy online: ${count}`;
  });

  newSocket.on("refresh-chat", loadComments);

  newSocket.on(
    "clear-chat-frontend",
    () => (document.getElementById("comments-list").innerHTML = ""),
  );

  newSocket.on("error-msg", (msg) => {
    showToast(msg, "error");
    backToMenu();
  });

  newSocket.on("player-left", () => {
    showToast("Przeciwnik opuścił pokój", "info");

    const turnInfo = document.getElementById("turn-info");
    if (turnInfo) {
      turnInfo.innerText = "Przeciwnik wyszedł z gry";
      turnInfo.style.color = "grey";
    }
  });

  newSocket.on("game-over", async (data) => {
    const time = stopTimer();
    setIsGameStarted(false);
    setIsTimerRunning(false);
    const turnInfo = document.getElementById("turn-info");
    const scoreDisplay = document.getElementById("score-display");

    if (mode === "multi") {
      const myScore = data.scores[newSocket.id] || 0;
      const opponentId = Object.keys(data.scores).find(
        (id) => id !== newSocket.id,
      );
      const opponentScore = opponentId ? data.scores[opponentId] || 0 : 0;

      if (scoreDisplay) scoreDisplay.innerText = "";

      if (myScore > opponentScore) {
        turnInfo.innerText = `WYGRANA! Wynik: ${myScore} : ${opponentScore}`;
        turnInfo.style.color = "green";
      } else if (myScore < opponentScore) {
        turnInfo.innerText = `PRZEGRANA! Wynik: ${myScore} : ${opponentScore}`;
        turnInfo.style.color = "red";
      } else {
        turnInfo.innerText = `REMIS! Wynik: ${myScore} : ${opponentScore}`;
        turnInfo.style.color = "orange";
      }
    } else {
      showToast("WYGRANA! Twój czas to: " + time + "s", "success");
    }

    if (mode === "single") {
      try {
        const token = await window.getLogtoToken();

        await fetch(
          `${API_URL}/users/${sessionStorage.getItem("username")}/score`,
          {
            method: "PATCH",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ newTime: parseInt(time) }),
          },
        );
        await fetch(`${API_URL}/history`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            score: parseInt(time),
            mode: "single",
          }),
        });

        loadLeaderboard();
      } catch (err) {
        console.error("Błąd zapisu wyników:", err);
      }
    }
    const backBtn = document.getElementById("back-button");
    if (backBtn) backBtn.style.display = "block";
  });
}