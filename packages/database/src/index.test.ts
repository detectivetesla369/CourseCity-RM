import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { createDatabase } from './index.js';
import { createMigrator } from './migrator.js';

describe('Database and Migrations Test Suite', () => {
  it('instantiates Kysely database connection factory without throwing', () => {
    const db = createDatabase('postgresql://test:test@localhost:5432/test');
    expect(db).toBeDefined();
    expect(typeof db.selectFrom).toBe('function');
    expect(typeof db.insertInto).toBe('function');
  });

  it('configures migrator pointing to migrations directory', () => {
    const db = createDatabase('postgresql://test:test@localhost:5432/test');
    const migrator = createMigrator(db);
    expect(migrator).toBeDefined();
    expect(typeof migrator.migrateToLatest).toBe('function');
    expect(typeof migrator.migrateDown).toBe('function');
  });

  it('verifies that all migration files exist and export up and down handlers', async () => {
    const migrationsDir = path.resolve(__dirname, '../migrations');
    expect(fs.existsSync(migrationsDir)).toBe(true);

    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.ts'));
    expect(files.length).toBe(9);

    const expectedMigrations = [
      '0001_identity_and_auth.ts',
      '0002_roles_and_permissions.ts',
      '0003_publishers_and_organizations.ts',
      '0004_courses_and_curriculum.ts',
      '0005_commerce_and_reconciliation.ts',
      '0006_learning_and_progress.ts',
      '0007_assessments_and_credentials.ts',
      '0008_receipts_and_verification.ts',
      '0009_operations_and_platform.ts',
    ];

    expect(files.sort()).toEqual(expectedMigrations.sort());

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const mod = await import(filePath);
      expect(typeof mod.up).toBe('function');
      expect(typeof mod.down).toBe('function');
    }
  });
});
