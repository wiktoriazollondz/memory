const mqtt = require("mqtt");
const http = require("http");
const { users, comments, history, decks, saveToFile } = require("../database");

const getLogtoUsername = (req) => {
  return new Promise((resolve) => {
    if (!req.headers.authorization) return resolve("Gracz");

    const options = {
      hostname: "logto-service-dev",
      port: 3001,
      path: "/oidc/userinfo",
      method: "GET",
      headers: { Authorization: req.headers.authorization },
    };

    const request = http.request(options, (response) => {
      let data = "";
      response.on("data", (chunk) => (data += chunk));
      response.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.username || parsed.name || "Gracz");
        } catch (e) {
          resolve("Gracz");
        }
      });
    });

    request.on("error", (err) => {
      console.error("Błąd pobierania nazwy z Logto:", err.message);
      resolve("Gracz");
    });

    request.end();
  });
};

const mqttClient = mqtt.connect("mqtt://broker.hivemq.com");
const topicSingleplayer = "game/global/scores";
const topicOnline = "game/global/heartbeat";

mqttClient.on("connect", () => {
  console.log("MQTT: Połączono z brokerem HiveMQ");
  mqttClient.subscribe([topicSingleplayer, topicOnline]);
});

exports.initMQTT = (io) => {
  setInterval(() => {
    const playerCount = io.engine.clientsCount;
    const data = JSON.stringify({ count: playerCount });
    mqttClient.publish(topicOnline, data);
  }, 10000);

  mqttClient.on("message", (receivedTopic, message) => {
    try {
      const data = JSON.parse(message.toString());
      if (receivedTopic === topicSingleplayer) {
        console.log(`MQTT: Nowy wynik odebrany: ${data.username} - ${data.score}s`);
        io.emit("global-record-notify", { user: data.username, score: data.score });
      } else if (receivedTopic === topicOnline) {
        console.log(`MQTT: Liczba osób online: ${data.count}`);
        io.emit("mqtt-player-count", data.count);
      }
    } catch (e) {
      console.error("MQTT: Błąd", e);
    }
  });
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
  res.json(leaderboard.map((u) => ({ username: u.username, bestTime: u.bestTime })));
};

exports.updateScore = async (req, res) => {
  const { username } = req.params;
  const { newTime } = req.body;
  const reqUsername = await getLogtoUsername(req);

  if (reqUsername !== username) {
    return res.status(403).send("Nie możesz zmieniać wyników innych graczy");
  }

  let user = users.find((u) => u.username === username);
  // Jeśli to nowy gracz z Logto, dodajemy go do tablicy wyników
  if (!user) {
    user = { username: username, password: "logto-managed", bestTime: null };
    users.push(user);
  }

  if (user.bestTime === null || newTime < user.bestTime) {
    user.bestTime = newTime;
    saveToFile();
    const payload = JSON.stringify({ username: user.username, score: newTime });
    mqttClient.publish(topicSingleplayer, payload);
  }
  res.json(user);
};

exports.deleteAccount = async (req, res) => {
  const username = req.params.username;
  const reqUsername = await getLogtoUsername(req);
  const roles = req.auth?.payload?.roles || [];

  if (reqUsername !== username && !roles.includes("admin")) {
    return res.status(403).send("Brak uprawnień");
  }

  const index = users.findIndex((u) => u.username === username);
  if (index !== -1) users.splice(index, 1);

  const filteredComments = comments.filter((c) => c.username !== username);
  comments.length = 0;
  comments.push(...filteredComments);

  const filteredHistory = history.filter((h) => h.username !== username);
  history.length = 0;
  history.push(...filteredHistory);

  const filteredDecks = decks.filter((d) => d.owner !== username);
  decks.length = 0;
  decks.push(...filteredDecks);

  saveToFile();
  res.json({ message: "Konto oraz powiązane dane zostały usunięte" });
};