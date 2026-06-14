import { API_URL } from "./config.js";
import { showToast } from "./notifications.js";
import { closeConfirm } from "./decks.js";

let currentHistoryId = null;

export function openHistory() {
  document.getElementById("history-modal").style.display = "flex";
  loadHistory();
}

export function closeHistory() {
  document.getElementById("history-modal").style.display = "none";
}

export async function loadHistory() {
  try {
    const token = await window.getLogtoToken();
    const response = await fetch(`${API_URL}/history`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) return;

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
          <button onclick="openHistoryNoteModal('${h.id}', '${h.note || ""}')">📝</button>
          <button onclick="askDeleteHistory('${h.id}')">🗑️</button>
        </td>
      `;
      list.appendChild(row);
    });
  } catch (err) {
    console.error("Błąd ładowania historii:", err);
  }
}

export function openHistoryNoteModal(id, oldNote) {
  currentHistoryId = id;
  document.getElementById("history-note-input").value = oldNote;
  document.getElementById("history-note-modal").style.display = "flex";
}

export function closeHistoryNoteModal() {
  document.getElementById("history-note-modal").style.display = "none";
  currentHistoryId = null;
}

export async function saveHistoryNote() {
  const note = document.getElementById("history-note-input").value.trim();

  try {
    const token = await window.getLogtoToken();
    const response = await fetch(`${API_URL}/history/${currentHistoryId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ note }),
    });

    if (response.ok) {
      showToast("Notatka zapisana", "success");
      closeHistoryNoteModal();
      loadHistory();
    }
  } catch (err) {
    console.error("Błąd zapisu notatki:", err);
  }
}

export function askDeleteHistory(id) {
  currentHistoryId = id;
  const modal = document.getElementById("confirm-modal");
  modal.style.display = "flex";
  document.getElementById("confirm-yes-btn").onclick = confirmDeleteHistory;
}

async function confirmDeleteHistory() {
  try {
    const token = await window.getLogtoToken();
    const response = await fetch(`${API_URL}/history/${currentHistoryId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      showToast("Wpis usunięty", "info");
      closeConfirm();
      loadHistory();
    }
  } catch (err) {
    console.error("Błąd usuwania wpisu:", err);
  }
}

window.openHistory = openHistory;
window.closeHistory = closeHistory;
window.openHistoryNoteModal = openHistoryNoteModal;
window.closeHistoryNoteModal = closeHistoryNoteModal;
window.saveHistoryNote = saveHistoryNote;
window.askDeleteHistory = askDeleteHistory;
