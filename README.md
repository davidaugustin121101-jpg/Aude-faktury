# Audeflow Faktury (MVP)

AI zpracování přijatých faktur → schválení → odeslání do iDokladu nebo Fakturoidu.

Produkční URL: **https://faktury.audeflow.cz**

## Funkce MVP

- PDF upload (jednotlivě i hromadně)
- Claude extrakce + návrh účetního kódu
- Paměť kódů per dodavatel
- Detekce duplicit
- Fronta + hromadné schválení
- Režim pro účetní (více klientů / workspace)
- iDoklad + Fakturoid (API klíče, Fakturoid OAuth na produkci)

## Lokální vývoj

```bash
cp .env.example .env.local
# doplň klíče v .env.local
npm install
npm run dev
```

Otevři [http://localhost:3000](http://localhost:3000).

## Deploy na Vercel

1. Importuj GitHub repozitář `aude-faktury` do [Vercel](https://vercel.com/new)
2. Nastav doménu `faktury.audeflow.cz`
3. V **Settings → Environment Variables** zkopíruj vše z `.env.example` (produkční hodnoty)
4. `NEXT_PUBLIC_APP_URL` musí být `https://faktury.audeflow.cz`
5. Deploy

### Povinné env proměnné (MVP)

| Proměnná | Popis |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Stripe webhook, admin operace |
| `ANTHROPIC_API_KEY` | Claude PDF extrakce |
| `NEXT_PUBLIC_APP_URL` | `https://faktury.audeflow.cz` |

### Volitelné (podle funkcí)

- **Stripe** – placené plány (`STRIPE_*`)
- **Resend** – e-mail po odeslání faktury
- **Fakturoid OAuth** – `FAKTUROID_CLIENT_ID`, `FAKTUROID_CLIENT_SECRET`

### Supabase

Migrace v `supabase/migrations/` – na produkčním projektu spusť v pořadí 001–005.

V Supabase Auth → URL Configuration nastav:

- Site URL: `https://faktury.audeflow.cz`
- Redirect URLs: `https://faktury.audeflow.cz/**`

### Supabase Storage

Bucket `invoice-pdfs` (private) – migrace 004.

### iDoklad / Fakturoid

Každý klient (workspace) má vlastní připojení v **Nastavení → Fakturační systém**.

Fakturoid OAuth redirect: `https://faktury.audeflow.cz/api/accounting/fakturoid/callback`

## Stack

Next.js 14 · TypeScript · Tailwind · Supabase · Claude · Stripe · Vercel
