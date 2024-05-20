const sqlite3 = require('sqlite3').verbose();
const { getDataBasePath } = require('./utils');

function getDatabase() {
  const db = new sqlite3.Database(getDataBasePath(), (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the database.');
  });
  return db;
}

module.exports = { getDatabase };
