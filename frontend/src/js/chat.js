import { socket, currentRoom, API_URL } from "./config.js";
import { showToast } from "./notifications.js";

export async function loadComments() {
  try {
    const token = await window.getLogtoToken();

    const response = await fetch(`${API_URL}/comments`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) return;

    const comments = await response.json();
    const list = document.getElementById("comments-list");
    if (!list) return;

    const currentUser = sessionStorage.getItem("username");
    list.innerHTML = "";

    comments.forEach((c) => {
      const li = document.createElement("li");
      let content = `<strong>${c.username}</strong>: ${c.text}`;

      if (c.username === currentUser) {
        content += ` <button onclick="editComment('${c.id}')">Edytuj</button>
                     <button onclick="deleteComment('${c.id}')">Usuń</button>`;
      }

      li.innerHTML = content;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Czat padł:", err);
  }
}

export async function addComment(e) {
  if (e) e.preventDefault();
  const input = document.getElementById("comment-input");
  if (!input || !input.value) return;

  const token = await window.getLogtoToken();

  const response = await fetch(`${API_URL}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text: input.value }),
  });

  if (response.ok) {
    input.value = "";
    loadComments();
    if (socket && socket.connected) {
      socket.emit("chat-update", { room: currentRoom });
    }
  } else {
    showToast("Błąd wysyłania!", "error");
  }
}

export async function editComment(id) {
  const newText = prompt("Nowa treść:");
  if (!newText) return;

  const token = await window.getLogtoToken();

  const response = await fetch(`${API_URL}/comments/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text: newText }),
  });

  if (response.ok) {
    loadComments();
    socket.emit("chat-update", { room: currentRoom });
  }
}

export async function deleteComment(id) {
  if (!confirm("Usunąć?")) return;

  const token = await window.getLogtoToken();

  const response = await fetch(`${API_URL}/comments/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    loadComments();
    socket.emit("chat-update", { room: currentRoom });
  }
}

const chatInput = document.getElementById("comment-input");
if (chatInput) {
  chatInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      addComment(event);
    }
  });
}

window.addComment = addComment;
window.editComment = editComment;
window.deleteComment = deleteComment;
