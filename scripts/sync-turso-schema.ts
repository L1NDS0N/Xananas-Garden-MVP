/**
 * Bring the Turso (production) schema fully in line with the local dev.db schema.
 *
 * Why this exists: prisma/migrations/ has drifted from the schema that's actually been
 * applied over time (some columns — e.g. products.maxInstallments/installmentInterest —
 * were added straight to the schema/dev.db without ever getting a migration file; others
 * — e.g. product_images.imageSm — exist in old migrations but were removed from the
 * schema by hand). Replaying migration history one file at a time therefore keeps
 * surfacing a *different* missing column on every deploy. This script skips the
 * migration files entirely: it introspects the real, working local database (dev.db,
 * which every `next build` in this repo is validated against) and the real production
 * database, and patches production with exactly the tables/columns/indexes it's missing.
 *
 * Safe to re-run: every statement is additive (CREATE TABLE IF missing, ADD COLUMN IF
 * missing, CREATE INDEX IF missing) and a failure on one statement (e.g. a UNIQUE index
 * that can't be created because of pre-existing duplicate data) is reported and skipped
 * rather than aborting the run.
 *
 * Usage:
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx ts-node scripts/sync-turso-schema.ts
 *   # optionally point at a different local reference database:
 *   npx ts-node scripts/sync-turso-schema.ts path/to/other.db
 */
import 'dotenv/config';
import { createClient, type Client } from '@libsql/client';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  process.exit(1);
}

const localDbArg = process.argv[2];
const localDbPath = resolve(localDbArg || join(__dirname, '..', 'prisma', 'dev.db'));

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

interface ForeignKeyInfo {
  from: string;
  table: string;
  to: string;
  on_update: string;
  on_delete: string;
}

async function tableColumns(client: Client, table: string): Promise<ColumnInfo[]> {
  const r = await client.execute(`PRAGMA table_info("${table}")`);
  return r.rows as unknown as ColumnInfo[];
}

async function foreignKeys(client: Client, table: string): Promise<ForeignKeyInfo[]> {
  const r = await client.execute(`PRAGMA foreign_key_list("${table}")`);
  return r.rows as unknown as ForeignKeyInfo[];
}

function buildAddColumnSql(table: string, col: ColumnInfo, fk?: ForeignKeyInfo): string {
  let stmt = `ALTER TABLE "${table}" ADD COLUMN "${col.name}" ${col.type}`;
  if (col.notnull) {
    if (col.dflt_value === null || col.dflt_value === undefined) {
      throw new Error(`column is NOT NULL with no default — cannot auto-add safely`);
    }
    stmt += ' NOT NULL';
  }
  if (col.dflt_value !== null && col.dflt_value !== undefined) {
    stmt += ` DEFAULT ${col.dflt_value}`;
  }
  if (fk) {
    stmt += ` REFERENCES "${fk.table}"("${fk.to}") ON DELETE ${fk.on_delete || 'NO ACTION'} ON UPDATE ${fk.on_update || 'NO ACTION'}`;
  }
  return stmt;
}

async function main() {
  console.log(`📎 Reference schema: ${localDbPath}`);
  const local = createClient({ url: `file:${localDbPath}` });
  const prod = createClient({ url: TURSO_URL!, authToken: TURSO_TOKEN! });

  const localObjects = (
    await local.execute(
      `SELECT type, name, tbl_name, sql FROM sqlite_master
       WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'
       ORDER BY rowid`
    )
  ).rows as unknown as { type: string; name: string; tbl_name: string; sql: string }[];

  const prodTableNames = new Set(
    (await prod.execute(`SELECT name FROM sqlite_master WHERE type='table'`)).rows.map(r => r.name as string)
  );
  const prodIndexNames = new Set(
    (await prod.execute(`SELECT name FROM sqlite_master WHERE type='index'`)).rows.map(r => r.name as string)
  );

  let createdTables = 0, createdIndexes = 0, addedColumns = 0, failed = 0;
  const tablesToDiff: string[] = [];
  const newlyCreatedTables: string[] = [];

  // Pass 1 — create any table missing wholesale, in the same order it was created locally
  // (so foreign keys always point at a table that already exists).
  for (const obj of localObjects) {
    if (obj.type !== 'table') continue;
    if (prodTableNames.has(obj.name)) {
      tablesToDiff.push(obj.name);
      continue;
    }
    try {
      await prod.execute(obj.sql);
      console.log(`✅ CREATE TABLE "${obj.name}"`);
      createdTables++;
      prodTableNames.add(obj.name);
      newlyCreatedTables.push(obj.name);
    } catch (e: any) {
      console.error(`❌ CREATE TABLE "${obj.name}": ${e.message}`);
      failed++;
    }
  }

  // A brand-new "payment_methods" table needs the same 4 built-in rows the original
  // migration seeded (fixed UUIDs, so historical Sale.paymentType values keep resolving) —
  // this is the one lookup table the app can't function without any rows in.
  if (newlyCreatedTables.includes('payment_methods')) {
    try {
      await prod.execute(`
        INSERT INTO "payment_methods" ("id", "key", "name", "active", "isDefault", "maxInstallments", "order", "createdAt", "updatedAt") VALUES
          ('7cd67d4f-ec33-47b7-b125-89f945466042', 'money', 'Dinheiro', true, true, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ('aae2fe4a-fd69-48d5-8cab-a54af4465a73', 'card', 'Cartão', true, true, 12, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ('11a2b2e6-eee2-447a-9614-9a00cbb43a92', 'pix', 'PIX', true, true, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ('26fe7546-5d85-402d-8cf9-9cbc3b87812a', 'other', 'Outros', true, true, 1, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `);
      console.log('✅ Seeded default payment methods (money/card/pix/other)');
    } catch (e: any) {
      console.error(`❌ Seeding default payment methods: ${e.message}`);
      failed++;
    }
  }

  // Pass 2 — for tables that already existed in prod, add any column present locally but missing there
  for (const table of tablesToDiff) {
    const [localCols, prodCols, fks] = await Promise.all([
      tableColumns(local, table),
      tableColumns(prod, table),
      foreignKeys(local, table),
    ]);
    const prodColNames = new Set(prodCols.map(c => c.name));
    const fkByColumn = new Map(fks.map(fk => [fk.from, fk]));

    for (const col of localCols) {
      if (prodColNames.has(col.name)) continue;
      try {
        const sql = buildAddColumnSql(table, col, fkByColumn.get(col.name));
        await prod.execute(sql);
        console.log(`✅ ${table}.${col.name} (${col.type})`);
        addedColumns++;
      } catch (e: any) {
        console.error(`❌ ${table}.${col.name}: ${e.message}`);
        failed++;
      }
    }
  }

  // Pass 3 — indexes (skip sqlite's own auto-indexes for inline UNIQUE/PK constraints)
  for (const obj of localObjects) {
    if (obj.type !== 'index' || obj.name.startsWith('sqlite_autoindex_')) continue;
    if (prodIndexNames.has(obj.name)) continue;
    try {
      await prod.execute(obj.sql);
      console.log(`✅ CREATE INDEX "${obj.name}" ON "${obj.tbl_name}"`);
      createdIndexes++;
    } catch (e: any) {
      console.error(`❌ CREATE INDEX "${obj.name}" ON "${obj.tbl_name}": ${e.message}`);
      if (/unique/i.test(e.message)) {
        console.error(`   ↳ looks like "${obj.tbl_name}" already has duplicate data for this index — fix the data, then re-run this script.`);
      }
      failed++;
    }
  }

  await local.close();
  await prod.close();

  console.log(`\n📈 Results: ${createdTables} tables, ${addedColumns} columns, ${createdIndexes} indexes created — ${failed} failed`);
  if (failed > 0) {
    console.error('⚠️  Some statements failed — see errors above. Safe to re-run after fixing them.');
    process.exit(1);
  }
  console.log('🎉 Production schema now matches dev.db!');
}

main().catch(e => {
  console.error('❌ Failed:', e);
  process.exit(1);
});
