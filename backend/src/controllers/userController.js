const mqtt = require("mqtt");
const { users, comments, history, decks, saveToFile } = require("../database");

exports.syncUser = (req, res) => {
  const sub = req.auth?.payload?.sub; // unikalny numer ID z Logto
  const { username } = req.body;

  let user = users.find((u) => u.logtoId === sub || u.username === username);
  if (!user) {
    users.push({ logtoId: sub, username: username, bestTime: null });
  } else {
    user.logtoId = sub;
    user.username = username;
  }
  await saveToFile();
  res.status(200).send({ message: "OK" });
};

exports.getLogtoUsername = (req) => {
  const sub = req.auth?.payload?.sub;
  const user = users.find((u) => u.logtoId === sub);
  return user ? user.username : "Gracz";
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

exports.updateScore = (req, res) => {
  const { username } = req.params;
  const { newTime } = req.body;
  const reqUsername = exports.getLogtoUsername(req);

  if (reqUsername !== username) {
    return res.status(403).send("Nie możesz zmieniać wyników innych graczy");
  }

  let user = users.find((u) => u.username === username);
  if (user && (user.bestTime === null || newTime < user.bestTime)) {
    user.bestTime = newTime;
    await saveToFile();
    const payload = JSON.stringify({ username: user.username, score: newTime });
    mqttClient.publish(topicSingleplayer, payload);
  }
  res.json(user);
};

exports.deleteAccount = (req, res) => {
  const username = req.params.username;
  const reqUsername = exports.getLogtoUsername(req);
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

  await saveToFile();
  res.json({ message: "Konto oraz powiązane dane zostały usunięte" });
};