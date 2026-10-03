import dotenv from 'dotenv';
dotenv.config();

import { createDatabase } from './index.js';
import { migrateToLatest, migrateDown } from './migrator.js';

async function run() {
  const command = process.argv[2] || 'latest';
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://coursecity_user:coursecity_dev_pass@localhost:5432/coursecity_dev';

  const db = createDatabase(connectionString);

  try {
    if (command === 'latest') {
      console.log('Running migrations to latest...');
      await migrateToLatest(db);
      console.log('Database schema is up to date.');
    } else if (command === 'down') {
      console.log('Reverting last migration...');
      await migrateDown(db);
      console.log('Revert completed.');
    } else {
      console.error(`Unknown command: ${command}. Use 'latest' or 'down'.`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Migration CLI encountered an unhandled error:', err);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

void run();
