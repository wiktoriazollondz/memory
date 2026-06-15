const http = require("http");
const { comments, saveToFile } = require("../database");
const { getLogtoUsername } = require("./userController");

exports.getComments = (req, res) => res.json(comments);

exports.postComment = async (req, res) => {
  const username = await getLogtoUsername(req);
  const newComment = {
    id: Date.now().toString(),
    username: username,
    text: req.body.text,
    date: new Date().toLocaleString(),
  };
  comments.push(newComment);
  saveToFile();
  res.status(201).json(newComment);
};

exports.editComment = async (req, res) => {
  const username = await getLogtoUsername(req);
  const comment = comments.find((c) => c.id === req.params.id);
  
  if (!comment) return res.status(404).send("Nie znaleziono komentarza");
  if (comment.username !== username) return res.status(403).send("To nie twój komentarz");

  comment.text = req.body.text;
  saveToFile();
  res.json(comment);
};

exports.deleteComment = async (req, res) => {
  const username = await getLogtoUsername(req);
  const index = comments.findIndex((c) => c.id === req.params.id);
  
  if (index === -1) return res.status(404).send("Nie znaleziono komentarza");
  if (comments[index].username !== username) return res.status(403).send("Brak uprawnień");

  comments.splice(index, 1);
  saveToFile();
  res.json({ message: "Usunięto komentarz" });
};

exports.clearAllComments = (req, res) => {
  comments.length = 0;
  saveToFile();
  res.json({ message: "Czat wyczyszczony" });
};