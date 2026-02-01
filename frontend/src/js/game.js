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
} from "./config.js";
import { getSelectedDeckIcons } from "./decks.js";
import { startSocket } from "./socket.js";

let myTurn = true;
let timerInterval = null;
let startTime = null;
let isTimerRunning = false;

export async function startSinglePlayer() {
  console.log("Startuję Singleplayer...");

  const selectedIcons = await getSelectedDeckIcons();
  const roomName = `single_${sessionStorage.getItem("username")}_${Date.now()}`;
  setCurrentRoom(roomName);
  setGameMode("single");

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
        isTimerRunning = true;
      }
      socket.emit("flip-card", { index: index, room: currentRoom });
    };
    board.appendChild(card);
  });
}

export function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById("timer").innerText = seconds;
  }, 1000);
}

export function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  return document.getElementById("timer").innerText;
}

export function backToMenu() {
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
    fetch(`${API_URL}/comments-clear`, {
      method: "DELETE",
      credentials: "include",
    });
  }
  if (socket) socket.disconnect();

  document.getElementById("game-section").style.display = "none";
  document.getElementById("menu-section").style.display = "block";
}

window.startSinglePlayer = startSinglePlayer;
window.startMultiPlayer = startMultiPlayer;
window.backToMenu = backToMenu;
