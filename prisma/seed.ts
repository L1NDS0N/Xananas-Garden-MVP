import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Administrador',
      username: 'admin',
      email: 'admin@xananas.com',
      password: adminPassword,
      admin: true,
    },
  });
  console.log('✅ Admin user created:', admin.username);

  // Create categories
  const categories = [
    { name: 'Rosas do Deserto' },
    { name: 'Vasos Plásticos' },
    { name: 'Vasos de Cimento' },
    { name: 'Fertilizantes' },
    { name: 'Ferramentas' },
    { name: 'Acessórios' },
  ];

  for (const cat of categories) {
    await prisma.productCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Categories created');

  // Get category IDs for products
  const rosasCategory = await prisma.productCategory.findUnique({ where: { name: 'Rosas do Deserto' } });
  const vasosCategory = await prisma.productCategory.findUnique({ where: { name: 'Vasos Plásticos' } });
  const fertCategory = await prisma.productCategory.findUnique({ where: { name: 'Fertilizantes' } });

  // Create sample products with slugs and videos
  if (rosasCategory) {
    const products = [
      {
        name: 'Rosa Negra Premium',
        slug: toSlug('Rosa Negra Premium'),
        description: 'Adenium é um gênero de planta com flor na família Apocynaceae. Nativa da África e Península Arábica. Esta variedade negra é rara e muito procurada entre colecionadores. Floresce profusamente durante a primavera e verão, com flores de um tom rosa-escuro quase negro que encantam qualquer jardineiro.\n\nCaracterísticas:\n- Altura: 30-50cm\n- Flor: rosa-escura\n- Ciclo: perene\n- Exposição: sol pleno\n- Rega: moderada',
        price: 89.90,
        amount: 15,
        note: 'Entrega com vaso incluso',
        videoUrl: 'https://www.youtube.com/watch?v=qqlBRt6iNcA',
        categoryId: rosasCategory.id,
      },
      {
        name: 'Rosa do Deserto Branca',
        slug: toSlug('Rosa do Deserto Branca'),
        description: 'Variedade clássica com flores brancas puras. Perfeita para jardins e varandas. Fácil manutenção.\n\nA Adenium branca é uma das variedades mais elegantes, com flores brancas imaculadas que contrastam com o caude robusto. Ideal para iniciantes e colecionadores.\n\nCaracterísticas:\n- Altura: 25-45cm\n- Flor: branca pura\n- Ciclo: perene\n- Exposição: sol pleno\n- Rega: moderada',
        price: 59.90,
        amount: 25,
        videoUrl: 'https://www.youtube.com/watch?v=qqlBRt6iNcA',
        categoryId: rosasCategory.id,
      },
      {
        name: 'Rosa do Deserto Rosa',
        slug: toSlug('Rosa do Deserto Rosa'),
        description: 'Flores rosa delicadas que transformam qualquer espaço. Ideal para presentes e para quem está começando no mundo das adeniums.\n\nCaracterísticas:\n- Altura: 20-40cm\n- Flor: rosa médio\n- Ciclo: perene\n- Exposição: sol pleno\n- Rega: moderada\n\nDica: Proteja de geadas fortes.',
        price: 49.90,
        amount: 30,
        categoryId: rosasCategory.id,
      },
    ];

    for (const product of products) {
      const existing = await prisma.product.findFirst({ where: { slug: product.slug } });
      if (!existing) {
        await prisma.product.create({ data: product });
      }
    }
  }

  if (vasosCategory) {
    const products = [
      {
        name: 'Vaso Plástico Retangular',
        slug: toSlug('Vaso Plástico Retangular'),
        description: 'Vaso plástico resistente para plantio. Disponível em várias cores.\n\nIdeal para formação de jardins verticais e varandas. Material de alta durabilidade resistente a UV.\n\nDimensões: 30x15x15cm\nMaterial: Polipropileno reciclado\nDrenagem: Sim',
        price: 25.90,
        amount: 50,
        categoryId: vasosCategory.id,
      },
      {
        name: 'Vaso Plástico Redondo',
        slug: toSlug('Vaso Plástico Redondo'),
        description: 'Vaso redondo clássico. Ideal para rosas do deserto e outras plantas suculentas.\n\nDimensões: Ø20cm x 18cm\nMaterial: Polipropileno\nDrenagem: Sim, com furos na base',
        price: 19.90,
        amount: 40,
        categoryId: vasosCategory.id,
      },
    ];

    for (const product of products) {
      const existing = await prisma.product.findFirst({ where: { slug: product.slug } });
      if (!existing) {
        await prisma.product.create({ data: product });
      }
    }
  }

  if (fertCategory) {
    const products = [
      {
        name: 'Fertilizante Universal',
        slug: toSlug('Fertilizante Universal'),
        description: 'Fertilizante completo para todo tipo de plantas. Enriquecido com micronutrientes essenciais para um crescimento saudável.\n\nComposição: NPK 10-10-10 + micronutrientes\nPeso: 1kg\nAplicação: A cada 30 dias\n\nIdeal para rosas do deserto, suculentas e plantas ornamentais.',
        price: 34.90,
        amount: 100,
        videoUrl: 'https://www.youtube.com/watch?v=qqlBRt6iNcA',
        categoryId: fertCategory.id,
      },
    ];

    for (const product of products) {
      const existing = await prisma.product.findFirst({ where: { slug: product.slug } });
      if (!existing) {
        await prisma.product.create({ data: product });
      }
    }
  }

  console.log('✅ Sample products created');
  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
