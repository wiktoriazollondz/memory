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
  const response = await fetch(`${API_URL}/users`);
  const users = await response.json();
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";
  users.forEach((u) => {
    const li = document.createElement("li");
    li.innerText = `${u.username}: ${u.bestTime}s`;
    list.appendChild(li);
  });
}

export async function searchPlayers() {
  const term = document.getElementById("search-input").value;
  const response = await fetch(`${API_URL}/users?search=${term}`);
  const users = await response.json();
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";
  users.forEach((u) => {
    const li = document.createElement("li");
    li.innerText = `${u.username}: ${u.bestTime}s`;
    list.appendChild(li);
  });
}

window.searchPlayers = searchPlayers;
