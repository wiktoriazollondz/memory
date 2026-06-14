import { API_URL } from "./config.js";

export function showGlobalNotification(text) {
  const notification = document.createElement("div");
  notification.innerText = text;
  notification.classList.add("global-notification");
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 4000);
}

export async function loadLeaderboard() {
  try {
    const token = await window.getLogtoToken();
    const response = await fetch(`${API_URL}/users`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!response.ok) return;
    
    const users = await response.json();
    const list = document.getElementById("leaderboard-list");
    if (!list) return;
    
    list.innerHTML = "";
    users.forEach((u) => {
      const li = document.createElement("li");
      li.innerText = `${u.username}: ${u.bestTime}s`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Błąd ładowania rankingu:", err);
  }
}

export async function searchPlayers() {
  try {
    const term = document.getElementById("search-input").value;
    const token = await window.getLogtoToken();
    
    const response = await fetch(`${API_URL}/users?search=${term}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!response.ok) return;

    const users = await response.json();
    const list = document.getElementById("leaderboard-list");
    if (!list) return;
    
    list.innerHTML = "";
    users.forEach((u) => {
      const li = document.createElement("li");
      li.innerText = `${u.username}: ${u.bestTime}s`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Błąd wyszukiwania graczy:", err);
  }
}

window.searchPlayers = searchPlayers;