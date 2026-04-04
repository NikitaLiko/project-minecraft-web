
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: {
            email: 'd20120607@gmail.com',
        },
        include: {
            profile: true,
        }
    });

    console.log(user);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
