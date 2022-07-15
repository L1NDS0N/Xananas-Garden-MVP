/**
 * Apply Prisma migrations to Turso. Safe to re-run — statements that fail because the
 * column/table/index already exists are reported as skipped instead of aborting.
 *
 * Usage:
 *   npx ts-node scripts/apply-turso-migration.ts                    # every migration, in order (default)
 *   npx ts-node scripts/apply-turso-migration.ts 20260831014402     # just that one migration
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

  let migrationsToApply: string[];

  if (targetMigration) {
    const found = migrations.find(m => m.startsWith(targetMigration));
    if (!found) {
      console.error(`❌ Migration "${targetMigration}" not found`);
      process.exit(1);
    }
    migrationsToApply = [found];
  } else {
    migrationsToApply = migrations;
  }

  const client = createClient({
    url: TURSO_URL!,
    authToken: TURSO_TOKEN!,
  });

  let totalApplied = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const migrationToApply of migrationsToApply) {
    const migrationPath = join(migrationsDir, migrationToApply, 'migration.sql');
    if (!existsSync(migrationPath)) {
      console.error(`❌ migration.sql not found in ${migrationToApply}, skipping`);
      continue;
    }

    const sql = readFileSync(migrationPath, 'utf-8');

    // Split into individual statements, stripping full-line comments so a
    // "-- Comment\nALTER TABLE ..." chunk isn't dropped just because it starts with "--"
    const statements = sql
      .split(';')
      .map(s => s.split('\n').filter(line => !line.trim().startsWith('--')).join('\n').trim())
      .filter(s => s.length > 0);

    console.log(`\n🗄️  Applying migration: ${migrationToApply}`);
    console.log(`   Found ${statements.length} SQL statements`);

    for (const stmt of statements) {
      try {
        await client.execute(stmt + ';');
        totalApplied++;
        const firstLine = stmt.split('\n')[0].substring(0, 70);
        console.log(`   ✅ ${firstLine}...`);
      } catch (e: any) {
        const msg = e.message || '';
        if (msg.includes('already exists') || msg.includes('duplicate column') || msg.includes('duplicate name')) {
          totalSkipped++;
          console.log(`   ⏭️  Skipped (already exists)`);
        } else {
          totalFailed++;
          console.error(`   ❌ Error: ${msg}`);
          console.error(`      Statement: ${stmt.substring(0, 100)}...`);
        }
      }
    }
  }

  await client.close();
  console.log(`\n📈 Results: ${totalApplied} applied, ${totalSkipped} skipped, ${totalFailed} failed`);
  if (totalFailed > 0) {
    console.error('⚠️  Some statements failed — check the errors above before deploying.');
    process.exit(1);
  }
  console.log('🎉 Done!');
}

main().catch(e => {
  console.error('❌ Failed:', e);
  process.exit(1);
});
