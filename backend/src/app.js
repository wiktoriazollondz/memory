const express = require("express");
const bcrypt = require("bcryptjs");
const app = express();

app.use(express.json()); // This allows the server to read JSON body

let users = []; // Our temporary database

// 1. CREATE- Registration
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const userExists = users.find((user) => user.username === username);
    if (userExists) {
      return res.status(400).send("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });

    res.status(201).send("User registered");
  } catch {
    res.status(500).send("Error on server");
  }
});

// 2. READ
app.get("/users", (req, res) => {
  try {
    const searchText = req.query.search;
    let usernames = users.map((u) => ({ username: u.username }));
    if (searchText) {
      usernames = onlyUsers.filter((u) =>
        u.username.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    res.json(usernames);
  } catch {
    res.status(500).send("Error on server");
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));

// 3. UPDATE/READ - login
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
