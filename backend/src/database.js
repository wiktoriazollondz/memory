const { Client } = require('pg');

const users = [];
const comments = [];
const rooms = {};
const history = [];
const decks = [];

// zmienne środowiskowe, które wstrzykuje Kubernetes z ConfigMap i Secret
const client = new Client({
  host: process.env.DATABASE_HOST || 'memory-db-service',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'memory_game_db',
  user: process.env.DATABASE_USER || 'db_user',
  password: process.env.DATABASE_PASSWORD || 'SuperTajneHaslo123',
});

const initDB = async () => {
  try {
    await client.connect();
    console.log("Połączono z bazą PostgreSQL w Kubernetesie");

    // Tworzymy tabelę z jedną kolumną na nasz stan gry
    await client.query(`
      CREATE TABLE IF NOT EXISTS game_state (
        id SERIAL PRIMARY KEY,
        data JSONB NOT NULL
      );
    `);

    const res = await client.query('SELECT data FROM game_state WHERE id = 1');
    if (res.rows.length > 0) {
      const data = res.rows[0].data;
      
      // wczytanie danych z bazy do pamięci RAM
      if (data.users) users.push(...data.users);
      if (data.comments) comments.push(...data.comments);
      if (data.history) history.push(...data.history);
      if (data.decks) {
        decks.push(...data.decks);
      } else {
        decks.push({ id: "default", owner: "system", name: "Owoce", icons: ["🍎", "🍌", "🍇", "🍓", "🍒", "🥝", "🍉", "🥭"], isDefault: true });
      }
      console.log("Wczytano stan gry z bazy danych!");
    } else {
      decks.push({ id: "default", owner: "system", name: "Owoce", icons: ["🍎", "🍌", "🍇", "🍓", "🍒", "🥝", "🍉", "🥭"], isDefault: true });
      const initialData = JSON.stringify({ users, comments, history, decks });
      await client.query('INSERT INTO game_state (id, data) VALUES (1, $1)', [initialData]);
    }
  } catch (err) {
    console.error("Błąd bazy danych:", err);
  }
};

initDB();

const saveToFile = () => {
  const dataToSave = JSON.stringify({ users, comments, history, decks });
  client.query('UPDATE game_state SET data = $1 WHERE id = 1', [dataToSave])
    .catch(err => console.error("Błąd zapisu do bazy:", err));
};

module.exports = { users, comments, history, decks, rooms, saveToFile };
