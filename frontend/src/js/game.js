import {
  socket,
  gameMode,
  API_URL,
  isGameStarted,
  lockBoard,
  currentRoom,
  setCurrentRoom,
  setGameMode,
  setIsGameStarted,
  setIsTimerRunning,
  isTimerRunning,
  startTime,
  timerInterval,
  myTurn,
  setMyTurn,
  setLockBoard,
  setStartTime,
  setTimerInterval,
} from "./config.js";
import { getSelectedDeckIcons } from "./decks.js";
import { startSocket } from "./socket.js";

export async function startSinglePlayer() {
  console.log("Startuję Singleplayer...");
  setLockBoard(false);
  const selectedIcons = await getSelectedDeckIcons();
  const roomName = `single_${sessionStorage.getItem("username")}_${Date.now()}`;
  setCurrentRoom(roomName);
  setGameMode("single");
  setIsGameStarted(true);
  setMyTurn(true);
  setIsTimerRunning(false);

  document.getElementById("game-user-display").innerText =
    "Gracz: " + sessionStorage.getItem("username");
  document.getElementById("menu-section").style.display = "none";
  document.getElementById("game-section").style.display = "block";
  document.getElementById("timer-container").style.display = "inline";

  startSocket(currentRoom, "single", selectedIcons);
}

export async function startMultiPlayer() {
  const room = prompt("Podaj nazwę pokoju:", "game1");
  if (!room) return;

  const selectedIcons = await getSelectedDeckIcons();

  setGameMode("multi");
  setCurrentRoom(room);

  document.getElementById("board").innerHTML = "";
  document.getElementById("leaderboard-container").style.display = "none";
  document.getElementById("chat-container").style.display = "block";
  document.getElementById("menu-section").style.display = "none";
  document.getElementById("game-section").style.display = "block";
  document.getElementById("back-button").style.display = "inline-block";

  const turnInfo = document.getElementById("turn-info");
  turnInfo.innerText = "Oczekiwanie na drugiego gracza...";
  turnInfo.style.color = "orange";

  document.getElementById("room-display").innerText = "Pokój ID: " + room;
  document.getElementById("game-user-display").innerText =
    "Gracz: " + sessionStorage.getItem("username");

  startSocket(currentRoom, gameMode, selectedIcons);
}

export function createBoard(boardLayout) {
  const board = document.getElementById("board");
  board.innerHTML = "";
  boardLayout.forEach((symbol, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerText = "?";
    card.onclick = () => {
      if (
        lockBoard ||
        !isGameStarted ||
        !myTurn ||
        card.classList.contains("flipped")
      )
        return;
      if (gameMode === "single" && !isTimerRunning) {
        startTimer();
        setIsTimerRunning(true);
      }
      socket.emit("flip-card", { index: index, room: currentRoom });
    };
    board.appendChild(card);
  });
}

export function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  setStartTime(Date.now());

  const interval = setInterval(() => {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    const timerElem = document.getElementById("timer");
    if (timerElem) timerElem.innerText = seconds;
  }, 1000);
  setTimerInterval(interval);
}

export function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    setTimerInterval(null);
  }
  return document.getElementById("timer").innerText;
}

export async function backToMenu() {
  stopTimer();
  setIsGameStarted(false);
  setIsTimerRunning(false);

  document.getElementById("board").innerHTML = "";
  document.getElementById("turn-info").innerText = "";
  document.getElementById("room-display").innerText = "";
  document.getElementById("game-user-display").innerText = "";

  const timerElem = document.getElementById("timer");
  if (timerElem) timerElem.innerText = "0";

  if (gameMode === "multi") {
    try {
      // 1. Pobieramy klucz z Logto
      const token = await window.getLogtoToken();
      
      // 2. Dołączamy klucz w nagłówkach
      await fetch(`${API_URL}/comments-clear`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error("Błąd uwierzytelniania przy czyszczeniu czatu:", error);
    }
  }
  
  if (socket) socket.disconnect();

  document.getElementById("game-section").style.display = "none";
  document.getElementById("menu-section").style.display = "block";
}

window.startSinglePlayer = startSinglePlayer;
window.startMultiPlayer = startMultiPlayer;
window.backToMenu = backToMenu;