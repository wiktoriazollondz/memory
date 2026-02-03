const { rooms } = require("./database");

const TOTAL_PAIRS = 8;
const cards = [
  "🍎",
  "🍎",
  "🍌",
  "🍌",
  "🍇",
  "🍇",
  "🍓",
  "🍓",
  "🍒",
  "🍒",
  "🍉",
  "🍉",
  "🍏",
  "🍏",
  "🍑",
  "🍑",
];

//algorytm Fishera-Yatesa
function shuffle(array) {
  let shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const resetRoom = (roomName) => {
  if (rooms[roomName]) {
    rooms[roomName].flippedCards = [];
    rooms[roomName].matchedPairs = [];
    rooms[roomName].currentPlayerIndex = 0;
    rooms[roomName].gameStarted = false;
  }
};

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    socket.on("join-room", (data) => {
      const { roomName, mode, icons } = data;

      //blokada max 2 osoby w pokoju
      if (
        rooms[roomName] &&
        rooms[roomName].mode === "multi" &&
        rooms[roomName].players.length >= 2 &&
        !rooms[roomName].players.find((p) => p.id === socket.id) //ten sam gracz
      ) {
        socket.emit("error-msg", "Ten pokój jest już pełny");
        return;
      }

      socket.join(roomName);

      let deckToUse =
        icons && icons.length === 8 ? [...icons, ...icons] : cards;

      if (!rooms[roomName]) {
        rooms[roomName] = {
          flippedCards: [],
          matchedPairs: [],
          players: [],
          currentPlayerIndex: 0,
          gameStarted: false,
          mode: mode,
          scores: {},
          board: shuffle(deckToUse),
        };
      }

      if (!rooms[roomName].players.includes(socket.id)) {
        rooms[roomName].players.push(socket.id);
        rooms[roomName].scores[socket.id] = 0;
      }

      if (mode === "single") {
        rooms[roomName].gameStarted = true;
        socket.emit("start-game", { board: rooms[roomName].board });
      } else if (
        rooms[roomName].players.length === 2 &&
        !rooms[roomName].gameStarted
      ) {
        rooms[roomName].players.forEach((id) => {
          rooms[roomName].scores[id] = 0;
        });
        rooms[roomName].gameStarted = true;
        rooms[roomName].currentPlayerIndex = 0;

        io.to(roomName).emit("score-update", rooms[roomName].scores);
        io.to(roomName).emit("start-game", { board: rooms[roomName].board });

        setTimeout(() => {
          const activePlayer = rooms[roomName].players[0];
          io.to(roomName).emit("turn-update", activePlayer);
        }, 300);
      }
    });

    socket.on("flip-card", (data) => {
      const room = rooms[data.room];
      if (!room || !room.gameStarted) return;
      //blokada, jak nie jest twoja tura
      if (
        room.mode === "multi" &&
        room.players[room.currentPlayerIndex] !== socket.id
      )
        return;
      if (room.flippedCards.length >= 2) return;
      //blokada kliknięcia w tę samą kartę
      if (
        room.flippedCards.length === 1 &&
        room.flippedCards[0].index === data.index
      )
        return;

      const symbolFromServer = room.board[data.index];
      room.flippedCards.push({ index: data.index, symbol: symbolFromServer });

      io.to(data.room).emit("flip-card", {
        index: data.index,
        symbol: symbolFromServer,
      });

      if (room.flippedCards.length === 2) {
        const [card1, card2] = room.flippedCards;
        const isMatch = card1.symbol === card2.symbol;

        if (isMatch) {
          room.matchedPairs.push(card1.index, card2.index);
          room.scores[socket.id] = (room.scores[socket.id] || 0) + 1;
          io.to(data.room).emit("score-update", room.scores);
          io.to(data.room).emit("match-result", {
            match: true,
            indices: [card1.index, card2.index],
          });

          if (room.matchedPairs.length === TOTAL_PAIRS * 2) {
            io.to(data.room).emit("game-over", {
              scores: room.scores,
              mode: room.mode,
            });
            resetRoom(data.room);
          }
        } else {
          //brak dopasowania
          io.to(data.room).emit("match-result", {
            match: false,
            indices: [card1.index, card2.index],
          });
          //zmiana tury
          if (room.mode === "multi") {
            room.currentPlayerIndex =
              (room.currentPlayerIndex + 1) % room.players.length;
          }
        }

        room.flippedCards = [];

        const delay = isMatch ? 300 : 1100;
        setTimeout(() => {
          if (rooms[data.room] && rooms[data.room].gameStarted) {
            io.to(data.room).emit(
              "turn-update",
              rooms[data.room].players[rooms[data.room].currentPlayerIndex],
            );
          }
        }, delay);
      }
    });

    socket.on("chat-clear-request", (data) => {
      io.to(data.room).emit("clear-chat-frontend");
    });

    socket.on("chat-update", (data) => {
      io.to(data.room).emit("refresh-chat");
    });

    socket.on("disconnect", () => {
      for (const roomName in rooms) {
        const room = rooms[roomName];
        if (room.players.includes(socket.id)) {
          room.players = room.players.filter((id) => id !== socket.id);

          if (room.players.length === 0) {
            delete rooms[roomName];
          } else {
            //jeśli ktoś wyszedł w trakcie gry
            if (room.gameStarted) {
              io.to(roomName).emit("player-left");
              resetRoom(roomName);
            }
          }
        }
      }
    });
  });
};

module.exports = socketHandler;
