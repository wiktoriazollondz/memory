const { comments, saveToFile } = require("../database");

exports.getComments = (req, res) => res.json(comments);

exports.postComment = (req, res) => {
  const newComment = {
    id: Date.now().toString(),
    username: req.user.username,
    text: req.body.text,
    date: new Date().toLocaleString(),
  };
  comments.push(newComment);
  saveToFile();
  res.status(201).json(newComment);
};

exports.editComment = (req, res) => {
  const comment = comments.find((c) => c.id === req.params.id);
  if (!comment) return res.status(404).send("Nie znaleziono komentarza");
  if (comment.username !== req.user.username)
    return res.status(403).send("To nie Twój komentarz!");

  comment.text = req.body.text;
  saveToFile();
  res.json(comment);
};

exports.deleteComment = (req, res) => {
  const index = comments.findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).send("Nie znaleziono komentarza");
  if (comments[index].username !== req.user.username)
    return res.status(403).send("Brak uprawnień");

  comments.splice(index, 1);
  saveToFile();
  res.json({ message: "Usunięto komentarz" });
};

exports.clearAllComments = (req, res) => {
  comments.length = 0;
  saveToFile();
  res.json({ message: "Baza danych czatu została wyczyszczona." });
};
