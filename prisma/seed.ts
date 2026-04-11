import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("heslo123", 10);

  const demoUser = await prisma.user.upsert({
    where: {
      name: "demo@demo.cz"
    },
    update: {
      password: hashedPassword
    },
    create: {
      name: "demo@demo.cz",
      password: hashedPassword
    }
  });

  await prisma.note.deleteMany({
    where: {
      userId: demoUser.id
    }
  });

  await prisma.note.createMany({
    data: [
      {
        title: "Vitej v demo uctu",
        content: "Toto je ukazkova poznamka pro rychle overeni aplikace. Muzete ji upravit, exportovat nebo smazat.",
        userId: demoUser.id
      },
      {
        title: "Plan na dalsi tyden",
        content: "Dokoncit nasazeni na Vercel, zkontrolovat prihlaseni pres NextAuth a otestovat import a export JSON souboru.",
        userId: demoUser.id
      },
      {
        title: "Napady k produktu",
        content: "Pridat filtrovani poznamek, fulltextove vyhledavani a jednoduchy archiv pro starsi zaznamy.",
        userId: demoUser.id
      }
    ]
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
