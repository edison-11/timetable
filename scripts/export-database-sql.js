const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
const pool = require('../server/config/database');

const outputPath = path.resolve(__dirname, '../database.sql');
const databaseName = process.env.DB_NAME || 'timetable_system';

const quoteIdentifier = (value) => `\`${String(value).replace(/`/g, '``')}\``;

const sqlValue = (value) => {
  if (Buffer.isBuffer(value)) {
    return `X'${value.toString('hex')}'`;
  }
  return mysql.escape(value);
};

const chunk = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const getTables = async () => {
  const [rows] = await pool.query('SHOW FULL TABLES');
  const tableKey = `Tables_in_${databaseName}`;
  const typeKey = 'Table_type';

  return rows.map((row) => ({
    name: row[tableKey],
    type: row[typeKey]
  })).filter((table) => table.name);
};

const appendTableData = async (lines, tableName) => {
  const [rows] = await pool.query(`SELECT * FROM ${quoteIdentifier(tableName)}`);
  if (!rows.length) return;

  const columns = Object.keys(rows[0]);
  const columnSql = columns.map(quoteIdentifier).join(', ');

  for (const group of chunk(rows, 100)) {
    const values = group.map((row) => {
      const rowValues = columns.map((column) => sqlValue(row[column])).join(', ');
      return `(${rowValues})`;
    });
    lines.push(`INSERT INTO ${quoteIdentifier(tableName)} (${columnSql}) VALUES`);
    lines.push(`${values.join(',\n')};`);
    lines.push('');
  }
};

const run = async () => {
  const tables = await getTables();
  const baseTables = tables.filter((table) => table.type === 'BASE TABLE');
  const views = tables.filter((table) => table.type === 'VIEW');

  const lines = [
    `-- Database dump for ${databaseName}`,
    `-- Generated at ${new Date().toISOString()}`,
    'SET FOREIGN_KEY_CHECKS=0;',
    'SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";',
    'START TRANSACTION;',
    '',
    `CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(databaseName)};`,
    `USE ${quoteIdentifier(databaseName)};`,
    ''
  ];

  for (const table of views) {
    lines.push(`DROP VIEW IF EXISTS ${quoteIdentifier(table.name)};`);
  }
  for (const table of baseTables) {
    lines.push(`DROP TABLE IF EXISTS ${quoteIdentifier(table.name)};`);
  }
  lines.push('');

  for (const table of baseTables) {
    const [rows] = await pool.query(`SHOW CREATE TABLE ${quoteIdentifier(table.name)}`);
    lines.push(`-- Structure for table ${quoteIdentifier(table.name)}`);
    lines.push(rows[0]['Create Table'] + ';');
    lines.push('');
  }

  for (const view of views) {
    const [rows] = await pool.query(`SHOW CREATE VIEW ${quoteIdentifier(view.name)}`);
    lines.push(`-- Structure for view ${quoteIdentifier(view.name)}`);
    lines.push(rows[0]['Create View'] + ';');
    lines.push('');
  }

  for (const table of baseTables) {
    lines.push(`-- Data for table ${quoteIdentifier(table.name)}`);
    await appendTableData(lines, table.name);
  }

  lines.push('COMMIT;');
  lines.push('SET FOREIGN_KEY_CHECKS=1;');
  lines.push('');

  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
  console.log(`Database exported to ${outputPath}`);
  console.log(`Tables: ${baseTables.length}, Views: ${views.length}`);
};

run()
  .catch((error) => {
    console.error('Database export failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
