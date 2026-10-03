import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import { Migrator, FileMigrationProvider, Kysely } from 'kysely';
import type { Database } from './index.js';

export function createMigrator(db: Kysely<Database>, customFolder?: string): Migrator {
  const migrationsFolder = customFolder || path.resolve(process.cwd(), 'migrations');

  return new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: migrationsFolder,
    }),
  });
}

export async function migrateToLatest(db: Kysely<Database>) {
  const migrator = createMigrator(db);
  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`[MIGRATION SUCCESS]: ${it.migrationName}`);
    } else if (it.status === 'Error') {
      console.error(`[MIGRATION FAILED]: ${it.migrationName}`);
    }
  });

  if (error) {
    console.error('Failed to migrate database to latest:');
    console.error(error);
    throw error;
  }
}

export async function migrateDown(db: Kysely<Database>) {
  const migrator = createMigrator(db);
  const { error, results } = await migrator.migrateDown();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`[MIGRATION DOWN SUCCESS]: ${it.migrationName}`);
    } else if (it.status === 'Error') {
      console.error(`[MIGRATION DOWN FAILED]: ${it.migrationName}`);
    }
  });

  if (error) {
    console.error('Failed to migrate down:');
    console.error(error);
    throw error;
  }
}
