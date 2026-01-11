const express = require("express");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const app = express();
const DB_FILE = "./database.json";
const http = require("http");
const { Server } = require("socket.io");

app.use(express.json());

let users = [];

// load data from file
if (fs.existsSync(DB_FILE)) {
  const data = fs.readFileSync(DB_FILE);
  users = JSON.parse(data);
}
const saveToFile = () => {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
};

//websocket
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join a specific game room
  socket.on("join-room", (roomName) => {
    socket.join(roomName);
    console.log(`User ${socket.id} joined room: ${roomName}`);
  });

  socket.on("flip_card", (data) => {
    // data = { room: "room123", cardIndex: 5 }
    io.to(data.room).emit("flip-card", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const userExists = users.find((user) => user.username === username);
    if (userExists) {
      return res.status(400).send("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword, bestTime: null });

    res.status(201).send("User registered");
    saveToFile();
  } catch {
    res.status(500).send("Error on server");
  }
});

app.get("/users", (req, res) => {
  try {
    const searchText = req.query.search;
    let usernames = users.map((u) => ({ username: u.username }));
    if (searchText) {
      usernames = usernames.filter((u) =>
        u.username.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    res.json(usernames);
  } catch {
    res.status(500).send("Error on server");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = users.find((u) => u.username === username);

    if (!user) return res.status(400).send("User not found");

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      res.status(201).send(`Welcome ${user.username}!`);
    } else {
      res.status(400).send("Invalid password");
    }
  } catch {
    res.status(500).send("Error on server");
  }
});

app.delete("/users/:username", async (req, res) => {
  try {
    const username = req.params.username;
    users = users.filter((u) => u.username !== username);
    res.json(users);
    saveToFile();
  } catch {
    res.status(500).send("Error on server");
  }
});

app.patch("/users/:username/score", async (req, res) => {
  try {
    const { newTime } = req.body;
    const username = req.params.username;

    const user = users.find((u) => u.username === username);
    if (!user) return res.status(400).send("User not found");

    user.bestTime = newTime;
    res.json(user);
    saveToFile();
  } catch {
    res.status(500).send("Error on server");
  }
});

server.listen(3000, () => console.log("Server running on port 3000"));
