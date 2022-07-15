/**
 * Seed 15 ornamental plants directly into the Turso production database — one product per
 * plant, each with 4 variantes (subprodutos): Muda/Enxerto/Média/Adulta, with their own
 * price and stock.
 *
 * Usage:
 *   TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npx ts-node scripts/seed-plantas.ts
 *   # also remove the old one-product-per-stage rows this script used to create:
 *   TURSO_DATABASE_URL="..." TURSO_AUTH_TOKEN="..." npx ts-node scripts/seed-plantas.ts --replace
 *
 * Safe to re-run: skips a product if one with the same slug already exists, and skips a
 * variant if that product already has one with the same name. Only touches "products",
 * "product_categories" and "product_variants" — no dependency on any migration newer than
 * the ones that create those tables.
 */
import 'dotenv/config';
import { createClient } from '@libsql/client';
import { randomUUID } from 'crypto';

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
const REPLACE_OLD_FORMAT = process.argv.includes('--replace');

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  process.exit(1);
}

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const DISCLAIMER = 'O preço pode variar de acordo com a coloração da flor da planta.';

interface PlantSpec {
  name: string;
  categories: string[]; // primary category first, then any additional ones — each created if it doesn't exist yet
  description: string;
  avgPrice: number; // researched average market price (R$) — the "Média" variant's price
  tags: string; // comma-separated hashtags, used for related-products matching and SEO keywords
  videoUrl?: string; // real, verified YouTube care/ornamental-tip video — omit rather than guess one
}

// Price multiplier applied to avgPrice per growth-stage variant
const STAGE_MULTIPLIERS: Record<string, number> = {
  Muda: 0.4,
  Enxerto: 0.75,
  Média: 1.0,
  Adulta: 1.7,
};
const STAGES = Object.keys(STAGE_MULTIPLIERS);

const PLANTS: PlantSpec[] = [
  {
    name: 'Rosa do Deserto',
    categories: ['Rosas do Deserto', 'Suculentas'],
    description:
      'Suculenta arbustiva (Adenium obesum) com caule grosso e sinuoso (caudex) que armazena água, folhas verdes brilhantes na ponta dos ramos e flores tubulares vistosas em tons de rosa, vermelho, branco ou bicolores. Cresce lentamente até 1-2m, é extremamente resistente à seca e ao sol pleno, exigindo solo bem drenado e regas espaçadas.\n\n' +
      'Dica de uso ornamental: destaque em vaso decorativo na entrada ou varanda; o caudex escultural também a torna ótima para composições estilo bonsai; combina bem com jardins de pedras e paisagismo xerófilo.',
    avgPrice: 60,
    tags: 'rosa-do-deserto,adenium,suculenta,bonsai,jardim-de-pedras',
    videoUrl: 'https://www.youtube.com/watch?v=njkEqlhmeBo',
  },
  {
    name: 'Cacto',
    categories: ['Plantas Ornamentais', 'Suculentas'],
    description:
      'Planta suculenta de caule espinhoso adaptada a ambientes secos, com formas variadas (colunares, globulares) e florescimento ocasional vistoso. Baixíssima manutenção — tolera longos períodos sem água e prefere sol pleno ou luz indireta forte.\n\n' +
      'Dica de uso ornamental: ótimo para composições de vasos e terrários com outras suculentas, decoração de mesa e escritório, jardins de pedra e bordas de baixa manutenção.',
    avgPrice: 25,
    tags: 'cacto,suculenta,baixa-manutencao,terrario,decoracao',
    videoUrl: 'https://www.youtube.com/watch?v=pPNYcohu8GA',
  },
  {
    name: 'Colônia',
    categories: ['Plantas Ornamentais', 'Cercas Vivas'],
    description:
      'Gengibre ornamental (Alpinia zerumbet) de porte arbustivo tropical, folhas longas verde-brilhante (há variedade variegada com listras amarelas) e inflorescências pendentes de flores brancas com miolo rosado, muito aromáticas — atrai borboletas e beija-flores. Cultivo fácil em meia-sombra a sol.\n\n' +
      'Dica de uso ornamental: ótima como cerca viva ou fundo de canteiro tropical, em maciços de jardim ou vaso grande de varanda; as folhas também são usadas em arranjos florais.',
    avgPrice: 55,
    tags: 'colonia,gengibre-ornamental,tropical,cerca-viva,aromatica',
    videoUrl: 'https://www.youtube.com/watch?v=aPkrV8z7oCo',
  },
  {
    name: 'Bromélia',
    categories: ['Plantas Ornamentais', 'Plantas de Interior'],
    description:
      'Planta epífita/terrestre de roseta (gênero Aechmea, entre os mais populares) com folhas rígidas formando um "tanque" central que acumula água, produzindo uma inflorescência central colorida e duradoura — rosa, vermelha ou amarela — que pode durar meses. Cuidado fácil, indicada até para iniciantes, tolera baixa luminosidade.\n\n' +
      'Dica de uso ornamental: ótima planta de interior em vaso decorativo, fixada em troncos ou painéis verdes (jardim vertical) e para dar um toque tropical a varandas sombreadas.',
    avgPrice: 40,
    tags: 'bromelia,planta-de-interior,jardim-vertical,tropical,baixa-luminosidade',
    videoUrl: 'https://www.youtube.com/watch?v=tm0PNeG0NRY',
  },
  {
    name: 'Dama da Noite',
    categories: ['Plantas Ornamentais', 'Plantas Perfumadas', 'Cercas Vivas'],
    description:
      'Arbusto (Cestrum nocturnum) de porte médio, 1,5 a 4 metros, folhagem verde discreta e pequenas flores tubulares esverdeadas/creme que liberam um perfume intenso à noite. Cresce rápido, aceita poda e pode ser conduzida como arvoreta ou trepadeira. Cuidado fácil, sol pleno a meia-sombra.\n\n' +
      'Dica de uso ornamental: ideal como cerca viva perfumada perto de varandas e janelas para aproveitar o aroma noturno, ou conduzida em treliça como trepadeira em jardins sensoriais.',
    avgPrice: 30,
    tags: 'dama-da-noite,arbusto-perfumado,jardim-sensorial,cerca-viva,floracao-noturna',
    videoUrl: 'https://www.youtube.com/watch?v=bE_RnH9BIDU',
  },
  {
    name: 'Roseira',
    categories: ['Plantas Ornamentais', 'Flores de Corte'],
    description:
      'Arbusto lenhoso (Rosa spp.) com folhagem verde serrilhada e flores clássicas em várias cores — vermelho, rosa, branco, amarelo, bicolores — muitas vezes perfumadas. Precisa de sol pleno, solo fértil e adubação regular; cuidado moderado, incluindo atenção a pragas como pulgão e oídio.\n\n' +
      'Dica de uso ornamental: perfeita em canteiros e roseirais, como borda de jardim, flor de corte para arranjos, ou conduzida como trepadeira em pergolados.',
    avgPrice: 60,
    tags: 'roseira,rosas,flor-de-corte,roseiral,jardim',
    videoUrl: 'https://www.youtube.com/watch?v=MVrbx4NZuk8',
  },
  {
    name: 'Brinco de Princesa',
    categories: ['Plantas Ornamentais'],
    description:
      'Subarbusto (Fuchsia hybrida) de ramos flexíveis e folhagem verde-escura, famoso pelas flores pendentes bicolores — tons de rosa, vermelho, roxo, branco — em formato de brinco. Prefere clima ameno e meia-sombra, sendo sensível a calor e sol forte direto. Cuidado moderado.\n\n' +
      'Dica de uso ornamental: linda em vaso suspenso com efeito cascata em varandas sombreadas e floreiras; também pode ser conduzida em formato de "arvorezinha" para destaque em jardim formal.',
    avgPrice: 15,
    tags: 'brinco-de-princesa,fuchsia,vaso-suspenso,floreira,sombra',
    videoUrl: 'https://www.youtube.com/watch?v=mdPM-ovmOJs',
  },
  {
    name: 'Borboletinha Azul',
    categories: ['Plantas Ornamentais'],
    description:
      'Herbácea perene rasteira (Evolvulus glomeratus), também chamada azulzinha, de até 30cm, folhas pequenas e prateadas/aveludadas, com flores azuis vibrantes em floração abundante e contínua. Gosta de sol pleno, tolera meia-sombra; não tolera solo encharcado. Cuidado fácil.\n\n' +
      'Dica de uso ornamental: excelente como forração/tapete floral em canteiros, borda de jardim, ou em vaso suspenso e jardineiras combinada com outras floríferas.',
    avgPrice: 12,
    tags: 'borboletinha-azul,azulzinha,forracao,flores-azuis,baixa-manutencao',
    videoUrl: 'https://www.youtube.com/watch?v=aWz3zeL-LcY',
  },
  {
    name: 'Violeteira',
    categories: ['Plantas Ornamentais', 'Plantas de Interior'],
    description:
      'Planta de interior compacta (Saintpaulia ionantha, a violeta africana) com folhas aveludadas em roseta e flores delicadas em tons de roxo, rosa, branco ou azul, com floração praticamente o ano todo em ambiente interno. Prefere luz indireta forte, ambiente úmido e rega pela base, evitando molhar as folhas. Cuidado fácil a moderado.\n\n' +
      'Dica de uso ornamental: perfeita como planta de mesa ou parapeito interno, presente decorativo em vaso pequeno e em composições de mini-jardim indoor.',
    avgPrice: 30,
    tags: 'violeteira,violeta-africana,planta-de-interior,presente,mini-jardim',
    videoUrl: 'https://www.youtube.com/watch?v=O0w8FL6zJYA',
  },
  {
    name: 'Angélica',
    categories: ['Plantas Ornamentais', 'Plantas Perfumadas', 'Flores de Corte'],
    description:
      'Bulbosa perene (Polianthes tuberosa, também conhecida como tuberosa ou jacinto-da-índia) que forma roseta basal de folhas finas, com hastes florais altas — cerca de 80cm — e flores tubulares brancas muito perfumadas, com floração predominantemente noturna no verão e outono. Cultivo em sol pleno, fácil manutenção.\n\n' +
      'Dica de uso ornamental: ótima em canteiros de fundo ou destaque, como flor de corte perfumada para buquês e arranjos, e plantada em grupo para efeito de massa floral.',
    avgPrice: 25,
    tags: 'angelica,tuberosa,bulbosa,flor-perfumada,flor-de-corte',
    videoUrl: 'https://www.youtube.com/watch?v=arFa98Pccbo',
  },
  {
    name: 'Rabo de Macaco',
    categories: ['Plantas Ornamentais', 'Suculentas'],
    description:
      'Cacto (Hildewintera colademononis) de caules longos e cilíndricos cobertos por espinhos macios semelhantes a pelos, com crescimento pendente que pode ultrapassar 1m de comprimento. Produz flores grandes vermelhas, rosa ou laranja na primavera-verão. Cuidado fácil — sol pleno a meia-sombra, solo bem drenado, rega espaçada.\n\n' +
      'Dica de uso ornamental: ótimo em vaso suspenso/pendente para varanda, jardim vertical, ou como peça de destaque em composições de suculentas.',
    avgPrice: 30,
    tags: 'rabo-de-macaco,cacto-pendente,suculenta,vaso-suspenso,jardim-vertical',
    videoUrl: 'https://www.youtube.com/watch?v=D-X4EyKBmQE',
  },
  {
    name: 'Antúrio',
    categories: ['Plantas Ornamentais', 'Plantas de Interior'],
    description:
      'Planta tropical de interior (Anthurium andraeanum) com folhas em formato de coração verde-brilhante e uma espata cerosa vistosa — vermelha, rosa, branca ou salmão — ao redor de uma espádice central, com floração praticamente contínua. Porte de 30cm a 1m. Prefere luz indireta e umidade alta; cuidado fácil a moderado.\n\n' +
      'Dica de uso ornamental: decorativa em vaso de interior, muito usada em ambientes internos e escritórios, e também como flor de corte em arranjos duradouros.',
    avgPrice: 35,
    tags: 'anturio,planta-de-interior,flor-tropical,escritorio,presente',
    videoUrl: 'https://www.youtube.com/watch?v=YLf8SALfRGI',
  },
  {
    name: 'Chifre de Veado',
    categories: ['Plantas Ornamentais', 'Plantas de Interior'],
    description:
      'Samambaia epífita (Platycerium bifurcatum) de aspecto escultural, com frondes estéreis em forma de escudo que abraçam o suporte e frondes férteis bifurcadas semelhantes a chifres, de textura felpuda acinzentada. Precisa de luz indireta e alta umidade — não tolera sol direto. Cuidado moderado, com substrato específico para epífitas.\n\n' +
      'Dica de uso ornamental: fixada em placas de madeira ou xaxim para pendurar na parede como um "quadro vivo", ótima em jardins verticais e ambientes internos com luz filtrada.',
    avgPrice: 85,
    tags: 'chifre-de-veado,samambaia,epifita,jardim-vertical,quadro-vivo',
    videoUrl: 'https://www.youtube.com/watch?v=IECcZvraGWk',
  },
  {
    name: 'Camarão Branco',
    categories: ['Plantas Ornamentais', 'Cercas Vivas'],
    description:
      'Arbusto (Justicia betonica, o "camarão-branco-rendado") de ramos flexíveis, folhas verdes com nervuras destacadas e brácteas brancas estriadas de verde formando espigas que lembram um camarão. Floração vistosa e prolongada. Cuidado fácil, sol pleno a meia-sombra.\n\n' +
      'Dica de uso ornamental: ótimo como cerca viva informal, em maciços e canteiros de fundo — atrai polinizadores para o jardim.',
    avgPrice: 16,
    tags: 'camarao-branco,arbusto,cerca-viva,atrai-polinizadores,jardim',
    videoUrl: 'https://www.youtube.com/watch?v=stwO5KVwY8o',
  },
  {
    name: 'Gmelina',
    categories: ['Plantas Ornamentais', 'Trepadeiras'],
    description:
      'Arbusto/trepadeira lenhosa tropical (Gmelina philippensis, o "bico-de-papagaio") de folhagem verde exuberante, com inflorescências pendentes formadas por brácteas amarelas que lembram um bico de papagaio, envolvendo pequenas flores internas. Pode ser conduzida como arbusto, trepadeira ou pequena árvore/bonsai. Baixa manutenção — sol pleno, solo drenado, poda ocasional.\n\n' +
      'Dica de uso ornamental: ótima em pérgolas e caramanchões quando conduzida como trepadeira, como cerca viva de destaque floral, ou em vaso como bonsai/pré-bonsai.',
    avgPrice: 60,
    tags: 'gmelina,bico-de-papagaio,trepadeira,pergolado,bonsai',
    videoUrl: 'https://www.youtube.com/watch?v=4-J21nWIfsQ',
  },
];

async function main() {
  const client = createClient({ url: TURSO_URL!, authToken: TURSO_TOKEN! });

  if (REPLACE_OLD_FORMAT) {
    console.log('🧹 Removendo produtos do formato antigo (um produto por estágio)...');
    let removed = 0;
    for (const plant of PLANTS) {
      for (const stage of STAGES) {
        const oldSlug = toSlug(`${plant.name} - ${stage}`);
        const existing = await client.execute({ sql: 'SELECT id, name FROM products WHERE slug = ?', args: [oldSlug] });
        for (const row of existing.rows) {
          await client.execute({ sql: 'DELETE FROM stock_history WHERE productId = ?', args: [row.id as string] });
          await client.execute({ sql: 'DELETE FROM product_images WHERE productId = ?', args: [row.id as string] });
          await client.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [row.id as string] });
          console.log(`   🗑️  ${row.name}`);
          removed++;
        }
      }
    }
    console.log(`   ${removed} produto(s) removido(s).\n`);
  }

  const categoryIdCache = new Map<string, string>();
  async function getOrCreateCategoryId(name: string): Promise<string> {
    if (categoryIdCache.has(name)) return categoryIdCache.get(name)!;
    const existing = await client.execute({ sql: 'SELECT id FROM product_categories WHERE name = ?', args: [name] });
    if (existing.rows.length > 0) {
      const id = existing.rows[0].id as string;
      categoryIdCache.set(name, id);
      return id;
    }
    const id = randomUUID();
    const now = new Date().toISOString();
    await client.execute({
      sql: 'INSERT INTO product_categories (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
      args: [id, name, now, now],
    });
    console.log(`   🆕 Categoria criada: ${name}`);
    categoryIdCache.set(name, id);
    return id;
  }

  // Every active payment method gets linked to each seeded product, matching the admin
  // form's "todos" default — functionally the same as leaving it unlinked (which already
  // means "accepts all active methods"), but explicit so it survives a method being
  // deactivated later without silently changing what these products accept.
  const activeMethodIds = (
    await client.execute('SELECT id FROM payment_methods WHERE active = true')
  ).rows.map(r => r.id as string);

  let productsCreated = 0, productsSkipped = 0, variantsCreated = 0, variantsSkipped = 0;

  for (const plant of PLANTS) {
    const categoryIds = await Promise.all(plant.categories.map(getOrCreateCategoryId));
    const [primaryCategoryId, ...extraCategoryIds] = categoryIds;
    const slug = toSlug(plant.name);
    const now = new Date().toISOString();

    let productId: string;
    const existingProduct = await client.execute({ sql: 'SELECT id FROM products WHERE slug = ?', args: [slug] });
    if (existingProduct.rows.length > 0) {
      productId = existingProduct.rows[0].id as string;
      console.log(`⏭️  Produto já existe: ${plant.name}`);
      productsSkipped++;
    } else {
      productId = randomUUID();
      await client.execute({
        sql: `INSERT INTO products
          (id, name, slug, description, note, price, amount, published, categoryId, tags, videoUrl, maxInstallments, installmentInterest, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [productId, plant.name, slug, plant.description, DISCLAIMER, plant.avgPrice, 0, true, primaryCategoryId, plant.tags, plant.videoUrl || null, 12, false, now, now],
      });

      for (const categoryId of extraCategoryIds) {
        await client.execute({
          sql: 'INSERT INTO product_category_links (id, productId, categoryId, createdAt) VALUES (?, ?, ?, ?)',
          args: [randomUUID(), productId, categoryId, now],
        });
      }

      for (const paymentMethodId of activeMethodIds) {
        await client.execute({
          sql: 'INSERT INTO product_payment_methods (id, productId, paymentMethodId, createdAt) VALUES (?, ?, ?, ?)',
          args: [randomUUID(), productId, paymentMethodId, now],
        });
      }

      console.log(`✅ Produto criado: ${plant.name} (${plant.categories.join(', ')})`);
      productsCreated++;
    }

    const existingVariants = await client.execute({ sql: 'SELECT name FROM product_variants WHERE productId = ?', args: [productId] });
    const existingVariantNames = new Set(existingVariants.rows.map(r => r.name as string));

    for (let i = 0; i < STAGES.length; i++) {
      const stage = STAGES[i];
      if (existingVariantNames.has(stage)) {
        console.log(`   ⏭️  Variação já existe: ${stage}`);
        variantsSkipped++;
        continue;
      }
      const price = Math.round(plant.avgPrice * STAGE_MULTIPLIERS[stage] * 100) / 100;
      const variantId = randomUUID();
      await client.execute({
        sql: `INSERT INTO product_variants (id, name, price, amount, "order", active, productId, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [variantId, stage, price, 10, i, true, productId, now, now],
      });
      // Stock entry audit trail — matches the 10 units set directly above
      await client.execute({
        sql: `INSERT INTO stock_history (id, type, quantity, previousAmount, newAmount, reason, productId, variantId, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [randomUUID(), 'entry', 10, 0, 10, 'Estoque inicial (seed)', productId, variantId, now],
      });
      console.log(`   ✅ ${stage} — R$ ${price.toFixed(2)} (10 em estoque)`);
      variantsCreated++;
    }
  }

  await client.close();
  console.log(
    `\n📈 Resultado: ${productsCreated} produtos criados (${productsSkipped} já existiam), ` +
    `${variantsCreated} variações criadas (${variantsSkipped} já existiam).`
  );
}

main().catch(e => {
  console.error('❌ Falhou:', e);
  process.exit(1);
});
