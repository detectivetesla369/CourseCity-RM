import { createDatabase, Database } from '@coursecity/database';
import type { Kysely } from 'kysely';

let dbInstance: Kysely<Database> | null = null;

export function getDatabase(connectionString?: string): Kysely<Database> {
  if (!dbInstance) {
    const url =
      connectionString ||
      process.env.DATABASE_URL ||
      'postgresql://coursecity_user:coursecity_dev_pass@localhost:5432/coursecity_dev';
    dbInstance = createDatabase(url);
  }
  return dbInstance;
}

export function setDatabase(db: Kysely<Database>): void {
  dbInstance = db;
}
