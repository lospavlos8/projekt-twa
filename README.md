# Požadavky a instalace

Projekt vyžaduje Node.js 20+ a npm.

```bash
npm install
```

# Nastavení prostředí (.env)

Zkopírujte ukázkový soubor a vyplňte platné hodnoty pro Supabase / PostgreSQL a NextAuth:

```bash
copy .env.local.example .env
```

V souboru `.env` nastavte hlavně:

- `DATABASE_URL` pro pooled připojení přes Supabase pooler
- `DIRECT_URL` pro přímé Prisma operace a migrace
- `NEXTAUTH_SECRET` pro podepisování session
- `NEXTAUTH_URL` podle lokální nebo produkční URL aplikace

# Migrace a spuštění

Po nastavení `.env` spusťte synchronizaci databáze a vývojový server:

```bash
npx prisma db push
npm run dev
```

Aplikace poběží na `http://localhost:3000`.

# Demo uživatel (Seed)

Pro naplnění databáze ukázkovými daty spusťte:

```bash
npx prisma db seed
```

Přihlašovací údaje demo účtu:

| Pole | Hodnota |
| --- | --- |
| E-mail / jméno | `demo@demo.cz` |
| Heslo | `heslo123` |

# Export a Import JSON

Po přihlášení lze export spustit přes `GET /api/notes/export`, který stáhne soubor `moje_poznamky.json`.

Import se provádí `POST` požadavkem na `/api/notes/import` s JSON polem poznámek v těle requestu. Endpoint přijímá maximálně 100 poznámek a odmítne příliš velký payload.
