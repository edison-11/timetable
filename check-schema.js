const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./timetable.db');

db.all("PRAGMA table_info(users)", (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log(JSON.stringify(rows, null, 2));
  }
  db.close();
});
