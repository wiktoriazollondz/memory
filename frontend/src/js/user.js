import { API_URL } from "./config.js";
import { showToast } from "./notifications.js";
import { closeConfirm } from "./decks.js"; // Dodany brakujący import modalu!

export function askDeleteAccount() {
  const username = sessionStorage.getItem("username");
  if (!username) return showToast("Nie jesteś zalogowany!", "error");
  document.getElementById("confirm-modal").style.display = "flex";
  document.getElementById("confirm-yes-btn").onclick = deleteAccount;
}

export async function deleteAccount() {
  const username = sessionStorage.getItem("username");
  const btn = document.getElementById("confirm-yes-btn");
  if (btn) btn.disabled = true;

  try {
    const token = await window.getLogtoToken();

    const response = await fetch(`${API_URL}/users/${username}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok || response.status === 404) {
      showToast("Konto usunięte", "info");
      sessionStorage.clear();

      setTimeout(() => {
        if (typeof window.logout === "function") {
          window.logout();
        } else {
          location.reload();
        }
      }, 1500);
    } else {
      const errorText = await response.text();
      showToast("Błąd: " + errorText, "error");
      if (btn) btn.disabled = false;
    }
  } catch (err) {
    showToast("Błąd sieci: Nie udało się połączyć z serwerem", "error");
    if (btn) btn.disabled = false;
  } finally {
    closeConfirm();
  }
}

window.askDeleteAccount = askDeleteAccount;
window.deleteAccount = deleteAccount;

// import { API_URL, gameMode } from "./config.js";
// import { loadLeaderboard } from "./leaderboard.js";
// import { loadComments } from "./chat.js";
// import { loadHistory } from "./history.js";
// import { loadDecks } from "./decks.js";
// import { showToast } from "./notifications.js";

// export async function login() {
//   const user = document.getElementById("username").value;
//   const pass = document.getElementById("password").value;

//   if (!user || !pass) {
//     return showToast("Login i hasło nie mogą być puste!", "error");
//   }

//   const response = await fetch(`${API_URL}/login`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     credentials: "include",
//     body: JSON.stringify({ username: user, password: pass }),
//   });

//   if (response.ok) {
//     showToast("Miłej gry " + user + "!", "success");
//     sessionStorage.setItem("username", user);
//     document.getElementById("logged-user-display").innerText = user;

//     document.getElementById("auth-section").style.display = "none";
//     document.getElementById("menu-section").style.display = "block";
//     document.getElementById("game-section").style.display = "none";

//     loadLeaderboard();
//     loadComments();
//     loadHistory();
//     loadDecks();
//   } else {
//     showToast("Błąd logowania!", "error");
//   }
// }

// export async function register() {
//   const user = document.getElementById("username").value.trim();
//   const pass = document.getElementById("password").value.trim();

//   if (!user || !pass) {
//     return showToast("Uzupełnij login i hasło!", "error");
//   }

//   try {
//     const response = await fetch(`${API_URL}/register`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ username: user, password: pass }),
//     });

//     const message = await response.text();

//     if (response.ok) {
//       showToast(message || "Konto utworzone! Możesz się zalogować", "success");
//       document.getElementById("username").value = "";
//       document.getElementById("password").value = "";
//     } else {
//       showToast(message || "Błąd rejestracji", "error");
//     }
//   } catch (err) {
//     showToast("Brak połączenia z serwerem", "error");
//   }
// }

// export async function logout() {
//   if (gameMode === "multi") {
//     await fetch(`${API_URL}/comments-clear`, {
//       method: "DELETE",
//       credentials: "include",
//     });
//   }
//   await fetch(`${API_URL}/logout`, { method: "POST", credentials: "include" });
//   sessionStorage.clear();
//   location.reload();
// }

// export function askDeleteAccount() {
//   const username = sessionStorage.getItem("username");
//   if (!username) return showToast("Nie jesteś zalogowany!", "error");
//   document.getElementById("confirm-modal").style.display = "flex";
//   document.getElementById("confirm-yes-btn").onclick = deleteAccount;
// }

// export async function deleteAccount() {
//   const username = sessionStorage.getItem("username");
//   const btn = document.getElementById("confirm-yes-btn");
//   if (btn) btn.disabled = true;

//   try {
//     const response = await fetch(`${API_URL}/users/${username}`, {
//       method: "DELETE",
//       credentials: "include",
//     });
//     if (response.ok || response.status === 404) {
//       showToast("Konto usunięte", "info");
//       sessionStorage.clear();
//       setTimeout(() => {
//         location.reload();
//       }, 1500);
//     } else {
//       const errorText = await response.text();
//       showToast("Błąd: " + errorText, "error");
//       if (btn) btn.disabled = false;
//     }
//   } catch (err) {
//     showToast("Błąd sieci: Nie udało się połączyć z serwerem", "error");
//     if (btn) btn.disabled = false;
//   } finally {
//     closeConfirm();
//   }
// }

// window.login = login;
// window.register = register;
// window.logout = logout;
// window.askDeleteAccount = askDeleteAccount;
// window.deleteAccount = deleteAccount;
