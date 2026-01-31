import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(connectionString?: string) {
  const pool = new Pool({
    connectionString: connectionString || process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Starting database migration check...\n');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    const { rows: completed } = await pool.query(
      'SELECT migration_name FROM schema_migrations ORDER BY migration_name'
    );
    const completedMigrations = new Set(completed.map((r) => r.migration_name));

    console.log(`✅ Found ${completedMigrations.size} completed migrations\n`);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .filter((f) => !f.startsWith('000_'))
      .sort();

    console.log(`📁 Found ${files.length} migration files\n`);

    const pendingMigrations = files.filter((f) => !completedMigrations.has(f));

    if (pendingMigrations.length === 0) {
      console.log('✅ All migrations are up to date!\n');
      await pool.end();
      return;
    }

    console.log(
      `⚠️  Found ${pendingMigrations.length} pending migration(s):\n`
    );
    pendingMigrations.forEach((m) => console.log(`   - ${m}`));
    console.log('');

    for (const migrationFile of pendingMigrations) {
      console.log(`🔧 Running migration: ${migrationFile}`);

      const migrationPath = path.join(migrationsDir, migrationFile);
      const sql = fs.readFileSync(migrationPath, 'utf8');

      try {
        await pool.query('BEGIN');
        await pool.query(sql);
        await pool.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
          [migrationFile]
        );
        await pool.query('COMMIT');

        console.log(`   ✅ Success\n`);
      } catch (error: any) {
        await pool.query('ROLLBACK');
        console.error(`   ❌ Failed: ${error.message}\n`);
        throw new Error(`Migration ${migrationFile} failed: ${error.message}`);
      }
    }

    console.log('✅ All migrations completed successfully!\n');
    await pool.end();
  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
    await pool.end();
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
