import { API_URL } from "./config.js";

export function openDeck() {
  document.getElementById("deck-modal").style.display = "flex";
  loadDecks();
}

export function closeDeck() {
  document.getElementById("deck-modal").style.display = "none";
}

export async function loadDecks() {
  const response = await fetch(`${API_URL}/decks`, { credentials: "include" });

  if (!response.ok) {
    const errorMsg = await response.text();
    console.warn("Serwer odrzucił żądanie:", errorMsg);
    return;
  }
  const decks = await response.json();
  const list = document.getElementById("deck-manager-list");
  list.innerHTML = "";

  decks.forEach((deck) => {
    const isDefault = deck.id === "default";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${deck.name}</td>
      <td><small>${deck.icons.join(" ")}</small></td>
      <td>
        ${
          isDefault
            ? "<em>Domyślna</em>"
            : `
          <button onclick="editDeck('${deck.id}')">✏️</button>
          <button onclick="deleteDeck('${deck.id}')" style="color:red">🗑️</button>
        `
        }
      </td>
    `;
    list.appendChild(row);
  });

  updateDeckSelect(decks);
}

export async function getSelectedDeckIcons() {
  try {
    const select = document.getElementById("active-deck-select");
    if (!select || !select.value) {
      return ["🍎", "🍌", "🍇", "🍓", "🍒", "🥝", "🍉", "🥭"];
    }

    const response = await fetch(`${API_URL}/decks`, {
      credentials: "include",
    });
    const decks = await response.json();
    const deck = decks.find((d) => d.id === select.value);

    return deck ? deck.icons : ["🍎", "🍌", "🍇", "🍓", "🍒", "🥝", "🍉", "🥭"];
  } catch (err) {
    console.error("Błąd pobierania talii, używam domyślnej:", err);
    return ["🍎", "🍌", "🍇", "🍓", "🍒", "🥝", "🍉", "🥭"];
  }
}

export async function createNewDeck() {
  const name = prompt("Podaj nazwę nowej talii:");
  if (!name) return;
  const iconsInput = prompt("Wpisz dokładnie 8 emoji (bez spacji):");
  if (!iconsInput) return;

  const icons = Array.from(iconsInput);
  if (icons.length !== 8)
    return alert("Błąd: Talia musi mieć dokładnie 8 emoji!");

  await fetch(`${API_URL}/decks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, icons }),
  });
  loadDecks();
}

export async function editDeck(id) {
  const newName = prompt("Podaj nową nazwę dla talii:");
  if (!newName) return;

  await fetch(`${API_URL}/decks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name: newName }),
  });
  loadDecks();
}

export async function deleteDeck(id) {
  if (!confirm("Czy na pewno chcesz usunąć tę talię?")) return;

  await fetch(`${API_URL}/decks/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  loadDecks();
}

export function updateDeckSelect(decks) {
  const select = document.getElementById("active-deck-select");
  const current = select.value;
  select.innerHTML = decks
    .map((d) => `<option value="${d.id}">${d.name}</option>`)
    .join("");
  if (current) select.value = current;
}

window.openDeck = openDeck;
window.closeDeck = closeDeck;
window.createNewDeck = createNewDeck;
window.editDeck = editDeck;
window.deleteDeck = deleteDeck;
