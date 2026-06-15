const http = require("http");
const { history, saveToFile } = require("../database");
const { getLogtoUsername } = require("./userController");

exports.getHistory = async (req, res) => {
  const username = await getLogtoUsername(req);
  const userHistory = history.filter((h) => h.username === username);
  res.json(userHistory);
};

exports.postHistory = async (req, res) => {
  const username = await getLogtoUsername(req);
  const newEntry = {
    id: Date.now().toString(),
    username: username,
    score: req.body.score,
    mode: req.body.mode || "single",
    date: new Date().toLocaleString(),
    note: "",
  };

  history.push(newEntry);
  saveToFile();
  res.status(201).json(newEntry);
};

exports.updateHistoryNote = async (req, res) => {
  const username = await getLogtoUsername(req);
  const entry = history.find((h) => h.id === req.params.id);

  if (!entry) return res.status(404).send("Nie znaleziono wpisu");
  if (entry.username !== username) return res.status(403).send("To nie twój wpis");

  entry.note = req.body.note;
  saveToFile();
  res.json(entry);
};

exports.deleteHistory = async (req, res) => {
  const username = await getLogtoUsername(req);
  const index = history.findIndex((h) => h.id === req.params.id);

  if (index === -1) return res.status(404).send("Nie znaleziono wpisu");
  if (history[index].username !== username) return res.status(403).send("Brak uprawnień");

  history.splice(index, 1);
  saveToFile();
  res.json({ message: "Usunięto wpis z historii" });
};