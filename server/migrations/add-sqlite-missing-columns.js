const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./timetable.db');

const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (error, rows) => {
    if (error) reject(error);
    else resolve(rows);
  });
});

const run = (sql) => new Promise((resolve, reject) => {
  db.run(sql, (error) => {
    if (error) reject(error);
    else resolve();
  });
});

const hasColumn = async (tableName, columnName) => {
  const columns = await all(`PRAGMA table_info(${tableName})`);
  return columns.some((column) => column.name === columnName);
};

const addColumnIfMissing = async (tableName, columnName, definition) => {
  if (await hasColumn(tableName, columnName)) {
    console.log(`${tableName}.${columnName} already exists`);
    return;
  }

  await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  console.log(`Added ${tableName}.${columnName}`);
};

const migrate = async () => {
  await addColumnIfMissing('shift', 'teacher_changeover_minutes', 'INTEGER NOT NULL DEFAULT 5');
  await addColumnIfMissing('module', 'department', "VARCHAR(50) NOT NULL DEFAULT 'SSOD'");
  await addColumnIfMissing('class', 'class_teacher_id', 'INTEGER');
};

migrate()
  .then(() => {
    console.log('SQLite missing-columns migration completed');
    db.close();
  })
  .catch((error) => {
    console.error(error);
    db.close();
    process.exit(1);
  });
