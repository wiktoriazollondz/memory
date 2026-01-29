const { history, saveToFile } = require("../database");

exports.getHistory = (req, res) => {
  const userHistory = history.filter((h) => h.username === req.user.username);
  res.json(userHistory);
};

exports.postHistory = (req, res) => {
  const newEntry = {
    id: Date.now().toString(),
    username: req.user.username,
    score: req.body.score,
    mode: req.body.mode || "single",
    date: new Date().toLocaleString(),
    note: "",
  };

  history.push(newEntry);
  saveToFile();
  res.status(201).json(newEntry);
};

exports.updateHistoryNote = (req, res) => {
  const entry = history.find((h) => h.id === req.params.id);

  if (!entry) return res.status(404).send("Nie znaleziono wpisu w historii");
  if (entry.username !== req.user.username)
    return res.status(403).send("To nie Twój wpis!");

  entry.note = req.body.note;
  saveToFile();
  res.json(entry);
};

exports.deleteHistory = (req, res) => {
  const index = history.findIndex((h) => h.id === req.params.id);

  if (index === -1) return res.status(404).send("Nie znaleziono wpisu");
  if (history[index].username !== req.user.username)
    return res.status(403).send("Brak uprawnień");

  history.splice(index, 1);
  saveToFile();
  res.json({ message: "Usunięto wpis z historii" });
};
