# Weekly Football Lineups

Next.js + MongoDB app for weekly football team lineups.

## Local setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Set these env vars:

- `MONGODB_URI`: MongoDB connection string
- `ADMIN_PHONE_NUMBERS`: comma-separated admin phone numbers
- `NEXT_PUBLIC_APP_URL`: public app URL, for example the Render URL

## Render

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm run start
```

Required environment variables:

- `MONGODB_URI`
- `ADMIN_PHONE_NUMBERS`
- `NEXT_PUBLIC_APP_URL`

Health check:

```text
/api/health
```

If MongoDB is Atlas, make sure Network Access allows Render. For a quick first deploy,
allow `0.0.0.0/0`, then tighten later if needed.
