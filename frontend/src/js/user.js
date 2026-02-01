import { API_URL, gameMode } from "./config.js";
import { loadLeaderboard } from "./leaderboard.js";
import { loadComments } from "./chat.js";
import { loadHistory } from "./history.js";
import { loadDecks } from "./decks.js";

export async function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username: user, password: pass }),
  });

  if (response.ok) {
    sessionStorage.setItem("username", user);
    document.getElementById("logged-user-display").innerText = user;

    document.getElementById("auth-section").style.display = "none";
    document.getElementById("menu-section").style.display = "block";
    document.getElementById("game-section").style.display = "none";

    loadLeaderboard();
    loadComments();
    loadHistory();
    loadDecks();
  } else {
    alert("Błąd logowania!");
  }
}

export async function register() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password: pass }),
  });
  alert(await response.text());
}

export async function logout() {
  if (gameMode === "multi") {
    await fetch(`${API_URL}/comments-clear`, {
      method: "DELETE",
      credentials: "include",
    });
  }
  await fetch(`${API_URL}/logout`, { method: "POST", credentials: "include" });
  sessionStorage.clear();
  location.reload();
}

export async function deleteAccount() {
  const username = sessionStorage.getItem("username");
  if (!username) return;

  const confirmed = confirm("Czy na pewno chcesz usunąć konto?");
  if (!confirmed) return;

  try {
    const response = await fetch(`${API_URL}/users/${username}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (response.ok) {
      alert("Twoje konto zostało usunięte!");
      sessionStorage.clear();
      location.reload();
    } else {
      const errorText = await response.text();
      alert("Błąd podczas usuwania konta: " + errorText);
    }
  } catch (err) {
    console.error("Błąd sieci:", err);
    alert("Nie udało się połączyć z serwerem.");
  }
}

window.login = login;
window.register = register;
window.logout = logout;
window.deleteAccount = deleteAccount;
