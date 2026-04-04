import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating config...');
  const rconPort = process.env.RCON_PORT ? parseInt(process.env.RCON_PORT, 10) : 25651;
  const rconPassword = process.env.RCON_PASSWORD ?? null;
  const config = await prisma.systemConfig.upsert({
    where: { id: 'config' },
    update: {
      rconPort,
      ...(rconPassword !== null && { rconPassword }),
    },
    create: {
      id: 'config',
      rconPort,
      rconPassword,
    }
  });
  console.log('Config updated (rconPort=%s, password set=%s)', config.rconPort, !!config.rconPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
