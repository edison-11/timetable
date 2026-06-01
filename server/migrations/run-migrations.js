const path = require('path');
const pool = require('../config/database');

const migrations = [
  {
    name: '003_multi_school_architecture',
    modulePath: './003_multi_school_architecture'
  },
  {
    name: '004_school_profile_and_subscription',
    modulePath: './004_school_profile_and_subscription'
  },
  {
    name: '005_fix_user_roles',
    modulePath: './005_fix_user_roles'
  },
  {
    name: '006_lifecycle_statuses',
    modulePath: './006_lifecycle_statuses'
  },
  {
    name: '007_assign_legacy_data_to_default_school',
    modulePath: './007_assign_legacy_data_to_default_school'
  }
];

const ensureMigrationTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration_name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const hasMigrationRun = async (name) => {
  const [rows] = await pool.query(
    'SELECT migration_name FROM schema_migrations WHERE migration_name = ? LIMIT 1',
    [name]
  );
  return rows.length > 0;
};

const recordMigration = async (name) => {
  await pool.query(
    'INSERT INTO schema_migrations (migration_name) VALUES (?)',
    [name]
  );
};

const run = async () => {
  await ensureMigrationTable();

  for (const migration of migrations) {
    if (await hasMigrationRun(migration.name)) {
      console.log(`Skipping ${migration.name}; already applied`);
      continue;
    }

    const migrationModule = require(path.resolve(__dirname, migration.modulePath));
    if (typeof migrationModule.up !== 'function') {
      throw new Error(`${migration.name} does not export an up() function`);
    }

    console.log(`Applying ${migration.name}`);
    await migrationModule.up();
    await recordMigration(migration.name);
    console.log(`Applied ${migration.name}`);
  }
};

run()
  .then(async () => {
    console.log('Database migrations complete');
    await pool.end();
  })
  .catch(async (error) => {
    console.error('Database migration failed:', error);
    await pool.end();
    process.exit(1);
  });
