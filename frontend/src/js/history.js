import { API_URL } from "./config.js";

export function openHistory() {
  document.getElementById("history-modal").style.display = "flex";
  loadHistory();
}

export function closeHistory() {
  document.getElementById("history-modal").style.display = "none";
}

export async function loadHistory() {
  const response = await fetch(`${API_URL}/history`, {
    credentials: "include",
  });
  if (!response.ok) {
    const errorMsg = await response.text();
    console.warn("Serwer odrzucił żądanie:", errorMsg);
    return;
  }

  const entries = await response.json();
  const list = document.getElementById("history-list");
  list.innerHTML = "";

  entries.reverse().forEach((h) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${h.date.split(",")[0]}</td>
      <td><strong>${h.score}s</strong></td>
      <td><small>${h.note || "---"}</small></td>
      <td>
        <button onclick="editHistoryNote('${h.id}')">📝</button>
        <button onclick="deleteHistoryEntry('${h.id}')">🗑️</button>
      </td>
    `;
    list.appendChild(row);
  });
}

export async function editHistoryNote(id) {
  const newNote = prompt("Dodaj notatkę do tej gry:");
  if (newNote === null) return;

  const response = await fetch(`${API_URL}/history/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ note: newNote }),
  });

  if (response.ok) {
    loadHistory();
  }
}

export async function deleteHistoryEntry(id) {
  if (!confirm("Czy na pewno chcesz usunąć ten wynik z historii?")) return;

  const response = await fetch(`${API_URL}/history/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (response.ok) {
    loadHistory();
  }
}

window.openHistory = openHistory;
window.closeHistory = closeHistory;
window.editHistoryNote = editHistoryNote;
window.deleteHistoryEntry = deleteHistoryEntry;
