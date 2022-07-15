import { GetServerSideProps } from 'next';
import { prisma } from '../lib/prisma';

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = 'https://xananasgarden.vercel.app';

  // Static pages
  const staticPages = [
    { url: baseUrl, lastMod: new Date().toISOString(), priority: '1.0', changefreq: 'daily' },
    { url: `${baseUrl}/catalogo`, lastMod: new Date().toISOString(), priority: '0.9', changefreq: 'daily' },
    { url: `${baseUrl}/rastrear`, lastMod: new Date().toISOString(), priority: '0.5', changefreq: 'monthly' },
  ];

  // Dynamic product pages
  const products = await prisma.product.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  const productPages = products.map(p => ({
    url: `${baseUrl}/catalogo/${p.slug}`,
    lastMod: p.updatedAt.toISOString(),
    priority: '0.8',
    changefreq: 'weekly',
  }));

  const allPages = [...staticPages, ...productPages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(p => `  <url>
    <loc>${p.url}</loc>
    <lastmod>${p.lastMod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  res.write(sitemap);
  res.end();

  return { props: {} };
};

export default function Sitemap() { return null; }
