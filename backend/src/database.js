const { Client } = require('pg');

const users = [];
const comments = [];
const rooms = {};
const history = [];
const decks = [];

let isDbReady = false;

const client = new Client({
  host: process.env.DATABASE_HOST || 'memory-db-service-dev',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'memory_game_db',
  user: process.env.DATABASE_USER || 'db_user',
  password: process.env.DATABASE_PASSWORD
});

const initDB = async () => {
  try {
    await client.connect();
    console.log("Połączono z bazą PostgreSQL!");

    await client.query(`
      CREATE TABLE IF NOT EXISTS game_state (
        id SERIAL PRIMARY KEY,
        data JSONB NOT NULL
      );
    `);

    const res = await client.query('SELECT data FROM game_state WHERE id = 1');
    
    if (res.rows.length > 0) {
      const data = res.rows[0].data;
      if (data.users) users.push(...data.users);
      if (data.comments) comments.push(...data.comments);
      if (data.history) history.push(...data.history);
      if (data.decks) decks.push(...data.decks);
      console.log("Wczytano stan gry z bazy danych!");
    } else {
      const defaultDeck = { 
        id: "default", 
        owner: "system", 
        name: "Owoce", 
        icons: ["🍎", "🍌", "🍇", "🍓", "🍒", "🥝", "🍉", "🍉"], 
        isDefault: true 
      };
      decks.push(defaultDeck);
      
      const initialData = JSON.stringify({ users: [], comments: [], history: [], decks });
      await client.query('INSERT INTO game_state (id, data) VALUES (1, $1)', [initialData]);
      console.log("Stworzono początkowy stan gry w bazie.");
    }

    isDbReady = true;
  } catch (err) {
    console.error("BŁĄD BAZY DANYCH:", err);
  }
};

initDB();

const saveToFile = () => {
  if (!isDbReady) {
    console.warn("Zignorowano zapis - baza nie jest jeszcze w pełni wczytana!");
    return;
  }

  const dataToSave = JSON.stringify({ users, comments, history, decks });
  client.query('UPDATE game_state SET data = $1 WHERE id = 1', [dataToSave])
    .catch(err => console.error("Tło: Błąd zapisu do bazy:", err));
};

module.exports = { users, comments, history, decks, rooms, saveToFile, client };