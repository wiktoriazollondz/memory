import LogtoClient from "@logto/browser";
import { startSocket } from "./socket.js";
import { deleteAccount, askDeleteAccount } from "./user.js";
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
  askDeleteHistory,
  closeHistoryNoteModal,
  openHistoryNoteModal,
  saveHistoryNote,
  loadHistory,
} from "./history.js";
import {
  openDeck,
  closeDeck,
  openDeckForm,
  closeDeckForm,
  loadDecks,
  handleDeckSubmit,
  askDeleteDeck,
  closeConfirm,
  confirmDelete,
  updateDeckSelect,
  getSelectedDeckIcons,
} from "./decks.js";

const logto = new LogtoClient({
  endpoint: "http://localhost:3001/",
  appId: "dlo8k7hsg7mgbluyy7j1s",
  scopes: ["urn:logto:scope:roles"],
});

window.startSocket = startSocket;

window.handleLogin = async function (event) {
  event.preventDefault();
  await logto.signIn(`${window.location.origin}/callback`);
};

window.logout = async function () {
  await logto.signOut(window.location.origin);
};
// window.register = register;
window.deleteAccount = deleteAccount;
window.askDeleteAccount = askDeleteAccount;

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
window.openHistoryNoteModal = openHistoryNoteModal;
window.closeHistoryNoteModal = closeHistoryNoteModal;
window.saveHistoryNote = saveHistoryNote;
window.askDeleteHistory = askDeleteHistory;

window.openDeck = openDeck;
window.closeDeck = closeDeck;
window.openDeckForm = openDeckForm;
window.closeDeckForm = closeDeckForm;
window.loadDecks = loadDecks;
window.handleDeckSubmit = handleDeckSubmit;
window.askDeleteDeck = askDeleteDeck;
window.closeConfirm = closeConfirm;
window.confirmDelete = confirmDelete;
window.updateDeckSelect = updateDeckSelect;
window.getSelectedDeckIcons = getSelectedDeckIcons;

window.adminDeleteUser = async function () {
  const targetUsername = document.getElementById("user-to-delete").value;

  if (!targetUsername) {
    alert("Wpisz nick gracza!");
    return;
  }

  try {
    const token = await logto.getAccessToken("https://memory-api");

    const response = await fetch(
      `http://localhost:3000/users/${targetUsername}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`, // Pokazujemy kłódce nasz token!
        },
      },
    );

    if (response.ok) {
      alert(`Sukces! Gracz ${targetUsername} został usunięty.`);
    } else {
      const errorData = await response.json();
      alert(`Błąd: ${errorData.error}`);
    }
  } catch (error) {
    console.error("Błąd usuwania:", error);
    alert("Nie udało się usunąć gracza (sprawdź konsolę).");
  }
};

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

window.addEventListener("load", async () => {
  const savedUser = sessionStorage.getItem("username");

  document.getElementById("game-section").style.display = "none";
  document.getElementById("menu-section").style.display = "none";
  document.getElementById("auth-section").style.display = "block";

  // Logto przekieruje nas na adres /callback z ukrytym kodem w URL
  if (window.location.pathname === "/callback") {
    await logto.handleSignInCallback(window.location.href);
    window.history.replaceState(null, "", "/"); // czyścimy pasek adresu
  }

  // PKCE: sprawdzamy kryptograficznie, czy użytkownik ma ważną sesję
  const isAuthenticated = await logto.isAuthenticated();

  if (isAuthenticated) {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("menu-section").style.display = "block";

    // pobieramy zweryfikowane dane prosto z tokena
    const userInfo = await logto.fetchUserInfo();
    document.getElementById("logged-user-display").innerText =
      userInfo.username || userInfo.name || "Gracz";

    if (userInfo.roles && userInfo.roles.includes("admin")) {
      document.getElementById("admin-panel").style.display = "block";
    }

    loadLeaderboard();
    loadDecks();
    loadComments();
    loadHistory();
  }
});
