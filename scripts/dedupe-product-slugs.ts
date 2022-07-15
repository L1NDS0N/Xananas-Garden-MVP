/**
 * Finds products sharing the same slug (the last piece of production's schema drift —
 * it blocks recreating the products_slug_key unique index) and renames every duplicate
 * but the oldest by appending "-2", "-3", etc., then creates the unique index.
 *
 * Safe to re-run: if there are no duplicates left, it just (re)creates the index and exits.
 *
 * Usage:
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx ts-node scripts/dedupe-product-slugs.ts
 */
import 'dotenv/config';
import { createClient } from '@libsql/client';

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  process.exit(1);
}

async function main() {
  const client = createClient({ url: TURSO_URL!, authToken: TURSO_TOKEN! });

  const dupes = await client.execute(
    `SELECT slug FROM products GROUP BY slug HAVING COUNT(*) > 1`
  );

  if (dupes.rows.length === 0) {
    console.log('✅ No duplicate slugs found.');
  } else {
    const allSlugs = new Set(
      (await client.execute(`SELECT slug FROM products`)).rows.map(r => r.slug as string)
    );

    console.log(`Found ${dupes.rows.length} slug(s) shared by more than one product:\n`);

    for (const row of dupes.rows) {
      const slug = row.slug as string;
      const products = (
        await client.execute({
          sql: `SELECT id, name, createdAt FROM products WHERE slug = ? ORDER BY createdAt ASC`,
          args: [slug],
        })
      ).rows;

      console.log(`"${slug}" — ${products.length} products:`);
      // Keep the oldest untouched; rename the rest
      for (let i = 1; i < products.length; i++) {
        const p = products[i];
        let counter = i + 1;
        let candidate = `${slug}-${counter}`;
        while (allSlugs.has(candidate)) {
          counter++;
          candidate = `${slug}-${counter}`;
        }
        allSlugs.add(candidate);
        await client.execute({
          sql: `UPDATE products SET slug = ? WHERE id = ?`,
          args: [candidate, p.id as string],
        });
        console.log(`   ✏️  "${p.name}" (${p.id}): "${slug}" → "${candidate}"`);
      }
      const kept = products[0];
      console.log(`   ✅ "${kept.name}" (${kept.id}) kept as "${slug}" (oldest)`);
    }
  }

  try {
    await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_key" ON "products"("slug")`);
    console.log('\n✅ products_slug_key unique index is in place.');
  } catch (e: any) {
    console.error(`\n❌ Still couldn't create the unique index: ${e.message}`);
    process.exit(1);
  }

  await client.close();
  console.log('🎉 Done!');
}

main().catch(e => {
  console.error('❌ Failed:', e);
  process.exit(1);
});
