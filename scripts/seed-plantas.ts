/**
 * Seed 15 ornamental plants × 4 growth-stage variations (Muda/Enxerto/Média/Adulta)
 * directly into the Turso production database.
 *
 * Usage:
 *   TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npx ts-node scripts/seed-plantas.ts
 *
 * Safe to re-run: skips a product if one with the same slug already exists.
 * Only touches the "products" and "product_categories" tables — no dependency
 * on any migration newer than the base schema.
 */
import 'dotenv/config';
import { createClient } from '@libsql/client';
import { randomUUID } from 'crypto';

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

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


interface PlantSpec {
  name: string;
  category: string; // category name — created if it doesn't exist yet
  description: string; // ends with DISCLAIMER automatically, don't repeat it here
  avgPrice: number; // researched average market price (R$) — used as the "Média" stage price
  note: string; // additional information about the product
}

// Price multiplier applied to avgPrice per growth-stage variation
const STAGE_MULTIPLIERS: Record<string, number> = {
  Muda: 0.4,
  Enxerto: 0.75,
  Média: 1.0,
  Adulta: 1.7,
};

const PLANTS: PlantSpec[] = [
  {
    name: 'Rosa do Deserto',
    category: 'Rosas do Deserto',
    description:
      'Suculenta arbustiva (Adenium obesum) com caule grosso e sinuoso (caudex) que armazena água, folhas verdes brilhantes na ponta dos ramos e flores tubulares vistosas em tons de rosa, vermelho, branco ou bicolores. Cresce lentamente até 1-2m, é extremamente resistente à seca e ao sol pleno, exigindo solo bem drenado e regas espaçadas.\n\n' +
      'Dica de uso ornamental: destaque em vaso decorativo na entrada ou varanda; o caudex escultural também a torna ótima para composições estilo bonsai; combina bem com jardins de pedras e paisagismo xerófilo.',
    avgPrice: 60,
    note: 'o preço pode variar de acordo com a coloração da flor da planta.'
  },
  {
    name: 'Cacto',
    category: 'Plantas Ornamentais',
    description:
      'Planta suculenta de caule espinhoso adaptada a ambientes secos, com formas variadas (colunares, globulares) e florescimento ocasional vistoso. Baixíssima manutenção — tolera longos períodos sem água e prefere sol pleno ou luz indireta forte.\n\n' +
      'Dica de uso ornamental: ótimo para composições de vasos e terrários com outras suculentas, decoração de mesa e escritório, jardins de pedra e bordas de baixa manutenção.',
    avgPrice: 25,
    note: 'o preço pode variar de acordo com a coloração da flor da planta.'
  },
  {
    name: 'Colônia',
    category: 'Plantas Ornamentais',
    description:
      'Gengibre ornamental (Alpinia zerumbet) de porte arbustivo tropical, folhas longas verde-brilhante (há variedade variegada com listras amarelas) e inflorescências pendentes de flores brancas com miolo rosado, muito aromáticas — atrai borboletas e beija-flores. Cultivo fácil em meia-sombra a sol.\n\n' +
      'Dica de uso ornamental: ótima como cerca viva ou fundo de canteiro tropical, em maciços de jardim ou vaso grande de varanda; as folhas também são usadas em arranjos florais.',
    avgPrice: 55,
    note: 'o preço pode variar de acordo com a coloração da flor da planta.'
  },
  {
    name: 'Bromélia',
    category: 'Plantas Ornamentais',
    description:
      'Planta epífita/terrestre de roseta (gênero Aechmea, entre os mais populares) com folhas rígidas formando um "tanque" central que acumula água, produzindo uma inflorescência central colorida e duradoura — rosa, vermelha ou amarela — que pode durar meses. Cuidado fácil, indicada até para iniciantes, tolera baixa luminosidade.\n\n' +
      'Dica de uso ornamental: ótima planta de interior em vaso decorativo, fixada em troncos ou painéis verdes (jardim vertical) e para dar um toque tropical a varandas sombreadas.',
    avgPrice: 40,
    note: 'o preço pode variar de acordo com a coloração da flor da planta.'
  },
  {
    name: 'Dama da Noite',
    category: 'Plantas Ornamentais',
    description:
      'Arbusto (Cestrum nocturnum) de porte médio, 1,5 a 4 metros, folhagem verde discreta e pequenas flores tubulares esverdeadas/creme que liberam um perfume intenso à noite. Cresce rápido, aceita poda e pode ser conduzida como arvoreta ou trepadeira. Cuidado fácil, sol pleno a meia-sombra.\n\n' +
      'Dica de uso ornamental: ideal como cerca viva perfumada perto de varandas e janelas para aproveitar o aroma noturno, ou conduzida em treliça como trepadeira em jardins sensoriais.',
    avgPrice: 30,
    note: 'o preço pode variar de acordo com a coloração da flor da planta.'
  },
  {
    name: 'Roseira',
    category: 'Plantas Ornamentais',
    description:
      'Arbusto lenhoso (Rosa spp.) com folhagem verde serrilhada e flores clássicas em várias cores — vermelho, rosa, branco, amarelo, bicolores — muitas vezes perfumadas. Precisa de sol pleno, solo fértil e adubação regular; cuidado moderado, incluindo atenção a pragas como pulgão e oídio.\n\n' +
      'Dica de uso ornamental: perfeita em canteiros e roseirais, como borda de jardim, flor de corte para arranjos, ou conduzida como trepadeira em pergolados.',
    avgPrice: 60,
    note: 'o preço pode variar de acordo com a coloração da flor da planta.'
  },
  {
    name: 'Brinco de Princesa',
    category: 'Plantas Ornamentais',
    description:
      'Subarbusto (Fuchsia hybrida) de ramos flexíveis e folhagem verde-escura, famoso pelas flores pendentes bicolores — tons de rosa, vermelho, roxo, branco — em formato de brinco. Prefere clima ameno e meia-sombra, sendo sensível a calor e sol forte direto. Cuidado moderado.\n\n' +
      'Dica de uso ornamental: linda em vaso suspenso com efeito cascata em varandas sombreadas e floreiras; também pode ser conduzida em formato de "arvorezinha" para destaque em jardim formal.',
    avgPrice: 15,
    note: 'o preço pode variar de acordo com a coloração da flor da planta.'
  },
  {
    name: 'Borboletinha Azul',
    category: 'Plantas Ornamentais',
    description:
      'Herbácea perene rasteira (Evolvulus glomeratus), também chamada azulzinha, de até 30cm, folhas pequenas e prateadas/aveludadas, com flores azuis vibrantes em floração abundante e contínua. Gosta de sol pleno, tolera meia-sombra; não tolera solo encharcado. Cuidado fácil.\n\n' +
      'Dica de uso ornamental: excelente como forração/tapete floral em canteiros, borda de jardim, ou em vaso suspenso e jardineiras combinada com outras floríferas.',
    avgPrice: 12,
    note: 'o preço pode variar de acordo com a coloração da flor da planta.'
  },
  {
    name: 'Violeteira',
    category: 'Plantas Ornamentais',
    description:
      'Planta de interior compacta (Saintpaulia ionantha, a violeta africana) com folhas aveludadas em roseta e flores delicadas em tons de roxo, rosa, branco ou azul, com floração praticamente o ano todo em ambiente interno. Prefere luz indireta forte, ambiente úmido e rega pela base, evitando molhar as folhas. Cuidado fácil a moderado.\n\n' +
      'Dica de uso ornamental: perfeita como planta de mesa ou parapeito interno, presente decorativo em vaso pequeno e em composições de mini-jardim indoor.',
    avgPrice: 30,
    note: 'o preço pode variar de acordo com a coloração da flor da planta.'
  },
  {
    name: 'Angélica',
    category: 'Plantas Ornamentais',
    description:
      'Bulbosa perene (Polianthes tuberosa, também conhecida como tuberosa ou jacinto-da-índia) que forma roseta basal de folhas finas, com hastes florais altas — cerca de 80cm — e flores tubulares brancas muito perfumadas, com floração predominantemente noturna no verão e outono. Cultivo em sol pleno, fácil manutenção.\n\n' +
      'Dica de uso ornamental: ótima em canteiros de fundo ou destaque, como flor de corte perfumada para buquês e arranjos, e plantada em grupo para efeito de massa floral.',
    avgPrice: 25,
    note: 'o preço pode variar de acordo com a coloração da flor da planta.'
  },
  {
    name: 'Rabo de Macaco',
    category: 'Plantas Ornamentais',
    description:
      'Cacto (Hildewintera colademononis) de caules longos e cilíndricos cobertos por espinhos macios semelhantes a pelos, com crescimento pendente que pode ultrapassar 1m de comprimento. Produz flores grandes vermelhas, rosa ou laranja na primavera-verão. Cuidado fácil — sol pleno a meia-sombra, solo bem drenado, rega espaçada.\n\n' +
      'Dica de uso ornamental: ótimo em vaso suspenso/pendente para varanda, jardim vertical, ou como peça de destaque em composições de suculentas.',
    avgPrice: 30,
    note: 'o preço pode variar de acordo com a coloração da flor da planta.'
  },
  {
    name: 'Antúrio',
    category: 'Plantas Ornamentais',
    description:
      'Planta tropical de interior (Anthurium andraeanum) com folhas em formato de coração verde-brilhante e uma espata cerosa vistosa — vermelha, rosa, branca ou salmão — ao redor de uma espádice central, com floração praticamente contínua. Porte de 30cm a 1m. Prefere luz indireta e umidade alta; cuidado fácil a moderado.\n\n' +
      'Dica de uso ornamental: decorativa em vaso de interior, muito usada em ambientes internos e escritórios, e também como flor de corte em arranjos duradouros.',
    avgPrice: 35,
    note: 'o preço pode variar de acordo com a coloração da flor da planta.'
  },
  {
    name: 'Chifre de Veado',
    category: 'Plantas Ornamentais',
    description:
      'Samambaia epífita (Platycerium bifurcatum) de aspecto escultural, com frondes estéreis em forma de escudo que abraçam o suporte e frondes férteis bifurcadas semelhantes a chifres, de textura felpuda acinzentada. Precisa de luz indireta e alta umidade — não tolera sol direto. Cuidado moderado, com substrato específico para epífitas.\n\n' +
      'Dica de uso ornamental: fixada em placas de madeira ou xaxim para pendurar na parede como um "quadro vivo", ótima em jardins verticais e ambientes internos com luz filtrada.',
    avgPrice: 85,
    note: 'o preço pode variar de acordo com a coloração da flor da planta.'
  },
  {
    name: 'Camarão Branco',
    category: 'Plantas Ornamentais',
    description:
      'Arbusto (Justicia betonica, o "camarão-branco-rendado") de ramos flexíveis, folhas verdes com nervuras destacadas e brácteas brancas estriadas de verde formando espigas que lembram um camarão. Floração vistosa e prolongada. Cuidado fácil, sol pleno a meia-sombra.\n\n' +
      'Dica de uso ornamental: ótimo como cerca viva informal, em maciços e canteiros de fundo — atrai polinizadores para o jardim.',
    avgPrice: 16,
    note: 'o preço pode variar de acordo com a coloração da flor da planta.'
  },
  {
    name: 'Gmelina',
    category: 'Plantas Ornamentais',
    description:
      'Arbusto/trepadeira lenhosa tropical (Gmelina philippensis, o "bico-de-papagaio") de folhagem verde exuberante, com inflorescências pendentes formadas por brácteas amarelas que lembram um bico de papagaio, envolvendo pequenas flores internas. Pode ser conduzida como arbusto, trepadeira ou pequena árvore/bonsai. Baixa manutenção — sol pleno, solo drenado, poda ocasional.\n\n' +
      'Dica de uso ornamental: ótima em pérgolas e caramanchões quando conduzida como trepadeira, como cerca viva de destaque floral, ou em vaso como bonsai/pré-bonsai.',
    avgPrice: 60,
    note: 'o preço pode variar de acordo com a coloração da flor da planta.'
  },
];

async function main() {
  const client = createClient({ url: TURSO_URL!, authToken: TURSO_TOKEN! });

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

  let created = 0;
  let skipped = 0;

  for (const plant of PLANTS) {
    const categoryId = await getOrCreateCategoryId(plant.category);
    const fullDescription = `${plant.description}`;

    for (const stage of Object.keys(STAGE_MULTIPLIERS)) {
      const name = `${plant.name} - ${stage}`;
      const slug = toSlug(name);
      const price = Math.round(plant.avgPrice * STAGE_MULTIPLIERS[stage] * 100) / 100;

      const existing = await client.execute({ sql: 'SELECT id FROM products WHERE slug = ?', args: [slug] });
      if (existing.rows.length > 0) {
        console.log(`   ⏭️  Já existe: ${name}`);
        skipped++;
        continue;
      }

      const id = randomUUID();
      const now = new Date().toISOString();
      await client.execute({
        sql: `INSERT INTO products
          (id, name, slug, description, price, amount, published, categoryId, maxInstallments, installmentInterest, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, name, slug, fullDescription, price, 10, true, categoryId, 12, false, now, now],
      });
      console.log(`   ✅ ${name} — R$ ${price.toFixed(2)}`);
      created++;
    }
  }

  await client.close();
  console.log(`\n📈 Resultado: ${created} produtos criados, ${skipped} já existiam.`);
}

main().catch(e => {
  console.error('❌ Falhou:', e);
  process.exit(1);
});
