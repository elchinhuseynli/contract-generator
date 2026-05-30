# Contract DMS

Generate, manage, and export Czech work contracts (**Smlouva o dílo**) for Flex Digital Agency — with ARES company lookup, a live document preview, a full document management system, status tracking, versioning, and PDF export.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (base-ui registry) — design system shared with the Flex Agency Help Desk (indigo accent, Inter + JetBrains Mono)
- **Supabase** — Postgres + Auth + Row-Level Security
- **Vercel** for hosting

## Features

- **Generator** — multi-section form with [ARES](https://ares.gov.cz) lookup by IČO, editable price line items (Příloha B), editable standard provisions (Příloha A), a dynamic timeline, and a live serif document preview.
- **Document management** — save, list, search/filter, edit, duplicate, and delete contracts.
- **Status pipeline** — Koncept → Odesláno → Podepsáno → Archivováno.
- **Versioning** — every save snapshots a version; restore any earlier one.
- **PDF export** — a print-ready view (`/print/[id]`) that opens the browser's "Save as PDF".
- **Settings** — the Zhotovitel (Flex Digital) details are editable and flow into every contract.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase values
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |

## Database

The schema lives in Supabase (`profiles`, `org_settings`, `clients`, `contracts`, `contract_versions`) with RLS enabled. Tables were created via migrations on the Supabase project.

> **Security:** RLS grants every *authenticated* user full access (team-shared model). Before exposing the URL publicly, disable open sign-ups in **Supabase → Authentication** (invite-only), or add an approval gate. Auth emails are sent via Resend SMTP.

## Deployment (Vercel)

1. Connect the repo to a Vercel project (Next.js is auto-detected — no `vercel.json` needed).
2. Add the two environment variables above in **Project Settings → Environment Variables**.
3. Deploy. The middleware (`proxy.ts`) handles auth/session refresh at the edge.

## Project structure

```
app/
  (app)/            # authenticated shell (sidebar) — dashboard, contracts, clients, settings
  login/            # auth
  print/[id]/       # print-to-PDF view
  api/ares/[ico]/   # ARES proxy
components/contract # form, preview, editor, table, version history, status
lib/
  contract/         # template (single source of truth), schema, types, export
  db/               # queries + server actions
  supabase/         # client / server / middleware helpers
legacy/             # the original v1 app (HTML/JS/Express), archived
```

The v1 app is preserved in [`legacy/`](legacy/).
