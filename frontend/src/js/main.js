import { startSocket } from "./socket.js";
import { login, register, logout, deleteAccount } from "./user.js";
import {
  startSinglePlayer,
  startMultiPlayer,
  createBoard,
  startTimer,
  stopTimer,
  backToMenu,
} from "./game.js";
import {
  showGlobalNotification,
  loadLeaderboard,
  searchPlayers,
} from "./leaderboard.js";
import {
  loadComments,
  addComment,
  editComment,
  deleteComment,
} from "./chat.js";
import {
  openHistory,
  closeHistory,
  loadHistory,
  editHistoryNote,
  deleteHistoryEntry,
} from "./history.js";
import {
  openDeck,
  closeDeck,
  loadDecks,
  getSelectedDeckIcons,
  createNewDeck,
  editDeck,
  deleteDeck,
  updateDeckSelect,
} from "./decks.js";

window.startSocket = startSocket;

window.login = login;
window.register = register;
window.logout = logout;
window.deleteAccount = deleteAccount;

window.startSinglePlayer = startSinglePlayer;
window.startMultiPlayer = startMultiPlayer;
window.createBoard = createBoard;
window.startTimer = startTimer;
window.stopTimer = stopTimer;
window.backToMenu = backToMenu;

window.showGlobalNotification = showGlobalNotification;
window.loadLeaderboard = loadLeaderboard;
window.searchPlayers = searchPlayers;

window.loadComments = loadComments;
window.addComment = addComment;
window.editComment = editComment;
window.deleteComment = deleteComment;

window.openHistory = openHistory;
window.closeHistory = closeHistory;
window.loadHistory = loadHistory;
window.editHistoryNote = editHistoryNote;
window.deleteHistoryEntry = deleteHistoryEntry;

window.openDeck = openDeck;
window.closeDeck = closeDeck;
window.loadDecks = loadDecks;
window.getSelectedDeckIcons = getSelectedDeckIcons;
window.createNewDeck = createNewDeck;
window.editDeck = editDeck;
window.deleteDeck = deleteDeck;
window.updateDeckSelect = updateDeckSelect;

window.onclick = function (event) {
  const historyModal = document.getElementById("history-modal");
  const deckModal = document.getElementById("deck-modal");

  if (event.target === historyModal) {
    closeHistory();
  }
  if (event.target === deckModal) {
    closeDeck();
  }
};

window.addEventListener("load", () => {
  const savedUser = sessionStorage.getItem("username");

  document.getElementById("game-section").style.display = "none";
  document.getElementById("menu-section").style.display = "none";
  document.getElementById("auth-section").style.display = "block";

  if (savedUser) {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("menu-section").style.display = "block";
    document.getElementById("logged-user-display").innerText = savedUser;
    loadLeaderboard();
    loadDecks();
  }
});
