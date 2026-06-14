import { API_URL } from "./config.js";
import { showToast } from "./notifications.js";

let currentEditId = null;
let currentDeleteId = null;

export function openDeck() {
  document.getElementById("deck-modal").style.display = "flex";
  loadDecks();
}

export function closeDeck() {
  document.getElementById("deck-modal").style.display = "none";
}

export function openDeckForm(id = null, name = "", icons = "") {
  currentEditId = id;
  const title = id ? "Edytuj talię" : "Nowa talia";

  document.getElementById("deck-form-title").innerText = title;
  document.getElementById("deck-name-input").value = name;

  const iconsField = document.getElementById("deck-icons-input");
  iconsField.value = icons;
  iconsField.disabled = !!id;

  document.getElementById("deck-form-modal").style.display = "flex";
}

export function closeDeckForm() {
  document.getElementById("deck-form-modal").style.display = "none";
}

export async function loadDecks() {
  try {
    const token = await window.getLogtoToken();
    const response = await fetch(`${API_URL}/decks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return showToast("Błąd ładowania talii", "error");

    const decks = await response.json();
    const list = document.getElementById("deck-manager-list");
    list.innerHTML = "";

    decks.forEach((deck) => {
      const isDefault = deck.id === "default";
      const row = document.createElement("tr");
      const iconsStr = deck.icons.join("");

      row.innerHTML = `
        <td>${deck.name}</td>
        <td>${iconsStr}</td>
        <td>
          ${
            isDefault
              ? "<em>Domyślna</em>"
              : `
            <button onclick="openDeckForm('${deck.id}', '${deck.name}', '${iconsStr}')">✏️</button>
            <button onclick="askDeleteDeck('${deck.id}')">🗑️</button>
          `
          }
        </td>
      `;
      list.appendChild(row);
    });
    updateDeckSelect(decks);
  } catch (err) {
    console.error("Błąd pobierania talii:", err);
  }
}

export async function handleDeckSubmit() {
  const name = document.getElementById("deck-name-input").value.trim();
  const iconsInput = document.getElementById("deck-icons-input").value.trim();

  if (!name) return showToast("Nazwa jest wymagana!", "error");

  try {
    const token = await window.getLogtoToken();

    if (!currentEditId) {
      // użycie segmentera, który "widzi" emoji tak jak człowiek
      const segmenter = new Intl.Segmenter("pl", { granularity: "grapheme" });
      const segments = segmenter.segment(iconsInput);
      const icons = [...segments].map((s) => s.segment);
      console.log("Wykryte ikony:", icons);

      if (icons.length !== 8) {
        return showToast(
          `Wymagane 8 emoji! (Wpisałeś: ${icons.length})`,
          "error",
        );
      }

      const response = await fetch(`${API_URL}/decks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, icons }),
      });

      if (response.ok) {
        showToast("Talia utworzona!", "success");
        closeDeckForm();
        loadDecks();
      }
    } else {
      const response = await fetch(`${API_URL}/decks/${currentEditId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        showToast("Nazwa zmieniona!", "success");
        closeDeckForm();
        loadDecks();
      }
    }
  } catch (err) {
    console.error("Błąd zapisu talii:", err);
  }
}

export function askDeleteDeck(id) {
  currentDeleteId = id;
  document.getElementById("confirm-modal").style.display = "flex";
  document.getElementById("confirm-yes-btn").onclick = confirmDelete;
}

export function closeConfirm() {
  document.getElementById("confirm-modal").style.display = "none";
  currentDeleteId = null;
}

export async function confirmDelete() {
  if (!currentDeleteId) return;

  try {
    const token = await window.getLogtoToken();
    const response = await fetch(`${API_URL}/decks/${currentDeleteId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      showToast("Talia została usunięta", "info");
      closeConfirm();
      loadDecks();
    }
  } catch (err) {
    console.error("Błąd usuwania talii:", err);
  }
}

export function updateDeckSelect(decks) {
  const select = document.getElementById("active-deck-select");
  if (!select) return;
  const current = select.value;
  select.innerHTML = decks
    .map((d) => `<option value="${d.id}">${d.name}</option>`)
    .join("");
  if (current) select.value = current;
}

export async function getSelectedDeckIcons() {
  try {
    const select = document.getElementById("active-deck-select");
    const token = await window.getLogtoToken();
    const response = await fetch(`${API_URL}/decks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const decks = await response.json();
    const deck = decks.find((d) => d.id === (select?.value || "default"));
    return deck ? deck.icons : ["🍎", "🍌", "🍇", "🍓", "🍒", "🥝", "🍉", "🥭"];
  } catch {
    return ["🍎", "🍌", "🍇", "🍓", "🍒", "🥝", "🍉", "🥭"];
  }
}

window.openDeck = openDeck;
window.closeDeck = closeDeck;
window.openDeckForm = openDeckForm;
window.closeDeckForm = closeDeckForm;
window.handleDeckSubmit = handleDeckSubmit;
window.askDeleteDeck = askDeleteDeck;
window.closeConfirm = closeConfirm;
window.confirmDelete = confirmDelete;
