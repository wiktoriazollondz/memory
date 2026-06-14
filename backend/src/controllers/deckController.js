const http = require("http");
const { decks, saveToFile } = require("../database");

const getLogtoUsername = (req) => {
  return new Promise((resolve) => {
    if (!req.headers.authorization) return resolve("Gracz");
    const options = {
      hostname: "logto-service-dev", port: 3001, path: "/oidc/userinfo",
      method: "GET", headers: { Authorization: req.headers.authorization },
    };
    const request = http.request(options, (response) => {
      let data = ""; response.on("data", (chunk) => (data += chunk));
      response.on("end", () => {
        try { const parsed = JSON.parse(data); resolve(parsed.username || parsed.name || "Gracz"); } 
        catch (e) { resolve("Gracz"); }
      });
    });
    request.on("error", () => resolve("Gracz")); request.end();
  });
};

exports.getDecks = async (req, res) => {
  const username = await getLogtoUsername(req);
  const userDecks = decks.filter((d) => d.owner === username || d.isDefault);
  res.json(userDecks);
};

exports.createDeck = async (req, res) => {
  const username = await getLogtoUsername(req);
  const { name, icons } = req.body;
  
  if (!icons || icons.length !== 8) return res.status(400).send("Talia musi mieć 8 ikon");

  const newDeck = {
    id: Date.now().toString(),
    owner: username,
    name: name || "Moja talia",
    icons: icons,
    isDefault: false,
  };

  decks.push(newDeck);
  saveToFile();
  res.status(201).json(newDeck);
};

exports.updateDeck = async (req, res) => {
  const username = await getLogtoUsername(req);
  const deck = decks.find((d) => d.id === req.params.id && d.owner === username);
  if (!deck) return res.status(404).send("Nie znaleziono talii");

  deck.icons = req.body.icons || deck.icons;
  deck.name = req.body.name || deck.name;

  saveToFile();
  res.json(deck);
};

exports.deleteDeck = async (req, res) => {
  const username = await getLogtoUsername(req);
  const index = decks.findIndex((d) => d.id === req.params.id && d.owner === username);
  if (index === -1) return res.status(404).send("Nie znaleziono talii");

  decks.splice(index, 1);
  saveToFile();
  res.json({ message: "Talia usunięta" });
};