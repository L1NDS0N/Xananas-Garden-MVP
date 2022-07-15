/**
 * One-off: fill in `slug` for campaigns created before the slug field existed.
 * Usage: npx ts-node scripts/backfill-campaign-slugs.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const prisma = process.env.TURSO_DATABASE_URL
  ? new PrismaClient({ adapter: new PrismaLibSQL({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN }) })
  : new PrismaClient();

const COMBINING_MARKS = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g');

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueSlug(base: string, existingSlugs: string[]): string {
  const slug = toSlug(base);
  let candidate = slug;
  let counter = 1;
  while (existingSlugs.includes(candidate)) {
    candidate = `${slug}-${counter}`;
    counter++;
  }
  return candidate;
}

async function main() {
  const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: 'asc' } });
  const taken = campaigns.filter(c => c.slug).map(c => c.slug as string);

  for (const c of campaigns) {
    if (c.slug) continue;
    const slug = uniqueSlug(c.name, taken);
    taken.push(slug);
    await prisma.campaign.update({ where: { id: c.id }, data: { slug } });
    console.log(`  ✅ ${c.name} -> ${slug}`);
  }

  console.log('Done!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
