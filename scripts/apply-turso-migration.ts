/**
 * Apply a specific or latest Prisma migration to Turso.
 * 
 * Usage:
 *   npx ts-node scripts/apply-turso-migration.ts                    # latest migration
 *   npx ts-node scripts/apply-turso-migration.ts 20260831014402     # specific migration
 */
import 'dotenv/config';
import { createClient } from '@libsql/client';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  process.exit(1);
}

const migrationsDir = join(__dirname, '..', 'prisma', 'migrations');

async function main() {
  const targetMigration = process.argv[2];

  // Find migration folders
  const migrations = readdirSync(migrationsDir)
    .filter(f => !f.endsWith('.sql') && f !== 'migration_lock.toml')
    .sort();

  if (migrations.length === 0) {
    console.error('❌ No migrations found');
    process.exit(1);
  }

  let migrationToApply: string;

  if (targetMigration) {
    const found = migrations.find(m => m.startsWith(targetMigration));
    if (!found) {
      console.error(`❌ Migration "${targetMigration}" not found`);
      process.exit(1);
    }
    migrationToApply = found;
  } else {
    migrationToApply = migrations[migrations.length - 1];
  }

  const migrationPath = join(migrationsDir, migrationToApply, 'migration.sql');
  
  if (!existsSync(migrationPath)) {
    console.error(`❌ migration.sql not found in ${migrationToApply}`);
    process.exit(1);
  }

  const sql = readFileSync(migrationPath, 'utf-8');
  
  // Split into individual statements, stripping full-line comments so a
  // "-- Comment\nALTER TABLE ..." chunk isn't dropped just because it starts with "--"
  const statements = sql
    .split(';')
    .map(s => s.split('\n').filter(line => !line.trim().startsWith('--')).join('\n').trim())
    .filter(s => s.length > 0);

  console.log(`🗄️  Applying migration: ${migrationToApply}`);
   console.log(`   Found ${statements.length} SQL statements`);

  const client = createClient({
    url: TURSO_URL!,
    authToken: TURSO_TOKEN!,
  });

  let applied = 0;
  let skipped = 0;

  for (const stmt of statements) {
    try {
      await client.execute(stmt + ';');
      applied++;
      const firstLine = stmt.split('\n')[0].substring(0, 70);
      console.log(`   ✅ ${firstLine}...`);
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('already exists') || msg.includes('duplicate column') || msg.includes('duplicate name')) {
        skipped++;
        console.log(`   ⏭️  Skipped (already exists)`);
      } else {
        console.error(`   ❌ Error: ${msg}`);
        console.error(`      Statement: ${stmt.substring(0, 100)}...`);
      }
    }
  }

  await client.close();
  console.log(`\n📈 Results: ${applied} applied, ${skipped} skipped`);
  console.log('🎉 Done!');
}

main().catch(e => {
  console.error('❌ Failed:', e);
  process.exit(1);
});
