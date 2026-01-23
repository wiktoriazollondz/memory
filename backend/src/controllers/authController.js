const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mqtt = require("mqtt");
const { users, saveToFile } = require("../database");

// konfiguracja MQTT dla publikowania wyników
const mqttClient = mqtt.connect("mqtt://broker.hivemq.com");

mqttClient.on("connect", () => {
  console.log("MQTT: Połączono z brokerem HiveMQ (authController)");
});

mqttClient.on("error", (err) => {
  console.error("MQTT: Błąd połączenia:", err);
});

exports.register = async (req, res) => {
  const { username, password } = req.body;
  if (users.find((u) => u.username === username))
    return res.status(400).send("Użytkownik już istnieje");
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword, bestTime: null });
  saveToFile();
  res.status(201).send("Zarejestrowano");
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).send("Błędny login lub hasło");
  }

  const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 3600000,
  });
  res.status(200).json({ username: user.username });
};

exports.logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).send("Wylogowano");
};

exports.getLeaderboard = (req, res) => {
  const searchText = req.query.search;
  let leaderboard = users
    .filter((u) => u.bestTime !== null)
    .sort((a, b) => a.bestTime - b.bestTime);
  if (searchText) {
    leaderboard = leaderboard.filter((u) =>
      u.username.toLowerCase().includes(searchText.toLowerCase()),
    );
  }
  res.json(
    leaderboard.map((u) => ({ username: u.username, bestTime: u.bestTime })),
  );
};

exports.updateScore = async (req, res) => {
  if (req.user.username !== req.params.username) {
    return res.status(403).send("Nie możesz zmieniać wyników innych graczy!");
  }
  const { newTime } = req.body;
  const user = users.find((u) => u.username === req.params.username);
  if (user && (user.bestTime === null || newTime < user.bestTime)) {
    user.bestTime = newTime;
    saveToFile();
    mqttClient.publish(
      "memory-game/scores",
      JSON.stringify({ player: user.username, score: newTime }),
    );
  }
  res.json(user);
};

exports.deleteAccount = (req, res) => {
  const username = req.params.username;
  if (req.user.username !== username)
    return res.status(403).send("Brak uprawnień");

  const index = users.findIndex((u) => u.username === username);
  if (index !== -1) {
    users.splice(index, 1);

    const { comments } = require("../database");
    for (let i = comments.length - 1; i >= 0; i--) {
      if (comments[i].username === username) {
        comments.splice(i, 1);
      }
    }
    saveToFile();
    res.json({ message: "Konto oraz powiązane dane zostały usunięte" });
  } else {
    res.status(404).send("Nie znaleziono użytkownika");
  }
};
