
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const targetUsername = 'Danil';

    const existingUser = await prisma.user.findUnique({
        where: { username: targetUsername },
    });

    if (existingUser) {
        console.log(`Username "${targetUsername}" is already taken.`);
        return;
    }

    const user = await prisma.user.findFirst({
        where: { email: 'd20120607@gmail.com' },
    });

    if (!user) {
        console.log('User not found.');
        return;
    }

    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
            username: targetUsername,
            profile: {
                update: {
                    nickname: targetUsername
                }
            }
        },
        include: { profile: true }
    });

    console.log('User updated successfully:', updatedUser);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
