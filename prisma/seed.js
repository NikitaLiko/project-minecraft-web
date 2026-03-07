const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@warborn.com' },
    update: {},
    create: {
      username: 'Commander',
      email: 'admin@warborn.com',
      password: hashedPassword,
      role: 'ADMIN',
      profile: {
        create: {
          nickname: 'Commander',
          level: 100,
          money: 9999999,
          faction: 'ADMIN',
          kills: 1337,
          deaths: 0
        }
      }
    },
  });

  console.log('Admin created:', admin);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
