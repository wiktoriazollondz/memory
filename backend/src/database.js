const { Client } = require('pg');

const users = [];
const comments = [];
const rooms = {};
const history = [];
const decks = [];

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
    console.log("Połączono z bazą PostgreSQL w Kubernetesie");

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
      console.log("Wczytano stan gry z bazy danych PostgreSQL!");
    } else {
      decks.push({ 
        id: "default", 
        owner: "system", 
        name: "Owoce", 
        icons: ["🍎", "🍌", "🍇", "🍓", "🍒", "🥝", "🍉", "🥭"], 
        isDefault: true 
      });
      
      const initialData = JSON.stringify({ users, comments, history, decks });
      await client.query('INSERT INTO game_state (id, data) VALUES (1, $1)', [initialData]);
      console.log("Stworzono początkowy stan gry w bazie PostgreSQL.");
    }
  } catch (err) {
    console.error("Błąd bazy danych:", err);
  }
};

await initDB();

const saveToFile = async () => {
  const dataToSave = JSON.stringify({ users, comments, history, decks });
  try {
    if (!client._connected) {
      console.warn("Baza niepołączona, pomijam zapis (baza wstanie później)");
      return;
    }
    await client.query('UPDATE game_state SET data = $1 WHERE id = 1', [dataToSave]);
  } catch (err) {
    console.error("Błąd zapisu:", err);
  }
};

module.exports = { users, comments, history, decks, rooms, saveToFile, client };