const http = require("http");
const { comments, saveToFile } = require("../database");

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