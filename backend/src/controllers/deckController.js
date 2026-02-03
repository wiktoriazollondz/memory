const { decks, saveToFile } = require("../database");

exports.getDecks = (req, res) => {
  const userDecks = decks.filter(
    (d) => d.owner === req.user.username || d.isDefault,
  );
  res.json(userDecks);
};

exports.createDeck = (req, res) => {
  const { name, icons } = req.body;
  if (!icons || icons.length !== 8)
    return res.status(400).send("Talia musi mieć 8 ikon");

  const newDeck = {
    id: Date.now().toString(),
    owner: req.user.username,
    name: name || "Moja talia",
    icons: icons,
    isDefault: false,
  };

  decks.push(newDeck);
  saveToFile();
  res.status(201).json(newDeck);
};

exports.updateDeck = (req, res) => {
  const deck = decks.find(
    (d) => d.id === req.params.id && d.owner === req.user.username,
  );
  if (!deck) return res.status(404).send("Nie znaleziono talii");

  deck.icons = req.body.icons || deck.icons;
  deck.name = req.body.name || deck.name;

  saveToFile();
  res.json(deck);
};

exports.deleteDeck = (req, res) => {
  const index = decks.findIndex(
    (d) => d.id === req.params.id && d.owner === req.user.username,
  );
  if (index === -1) return res.status(404).send("Nie znaleziono talii");

  decks.splice(index, 1);
  saveToFile();
  res.json({ message: "Talia usunięta" });
};
