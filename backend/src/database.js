const fs = require("fs");
const DB_FILE = "./database.json";

let users = [];
let comments = [];
let rooms = {};
let history = [];

let decks = [
  {
    id: "default",
    owner: "system",
    name: "Owoce",
    icons: ["🍎", "🍌", "🍇", "🍓", "🍒", "🥝", "🍉", "🥭"],
    isDefault: true,
  },
];

if (fs.existsSync(DB_FILE)) {
  const data = JSON.parse(fs.readFileSync(DB_FILE));
  users = data.users || [];
  comments = data.comments || [];
}

const saveToFile = () => {
  const dataToSave = { users, comments };
  fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2));
};

module.exports = { users, comments, history, decks, rooms, saveToFile };
