import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Spouštím seedování databáze...');


    const hashedPassword = await bcrypt.hash('demo1234', 10);


    const user = await prisma.user.upsert({
        where: { name: 'demo' },
        update: {},
        create: {
            name: 'demo',
            password: hashedPassword,
            notes: {
                create: [
                    {
                        title: 'První demo poznámka',
                        content: 'Toto je ukázkový obsah první poznámky.',
                    },
                    {
                        title: 'Druhá demo poznámka',
                        content: 'Zadání vyžaduje alespoň jednoho demo uživatele s poznámkami.',
                    },
                ],
            },
        },
    });

    console.log(`Hotovo! Demo uživatel vytvořen: ${user.name}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });