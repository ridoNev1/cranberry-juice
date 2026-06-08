# Cranberry Juice

Multi-agent AI chatbot platform built with Next.js. Users can chat with a global assistant or create custom agents with their own system prompts, models, and knowledge bases (via file uploads + vector search).

## Features

- **Global chat** — default assistant at `/chat`
- **Custom agents** — per-agent system prompt, model, file search (RAG via OpenAI vector stores)
- **Streaming responses** — SSE via OpenAI Responses API
- **Deeper Research mode** — per-message model override to `gpt-5.4-mini`
- **Web search** — `web_search_preview` tool toggle
- **File attachments** — images and documents stored in MinIO, forwarded to OpenAI
- **Saved prompts** — per-agent reusable prompt library
- **Auth** — email/password with OTP email verification (Better Auth + Resend)
- **Bot protection** — Cloudflare Turnstile on auth forms

## Architecture

```
app/
  (auth)/           # Login, register, verify pages
  chat/             # Global chat (default agent)
  chat/[agentId]/   # Per-agent chat
  agents/           # Agent management
  api/
    chat/           # POST — SSE streaming chat endpoint
    agents/         # CRUD agents + file upload
    conversations/  # Delete conversation
    saved-prompts/  # CRUD saved prompts
    files/          # File proxy (presigned URLs)

components/
  chat/
    chat-room.tsx   # Streaming chat UI, message list
    chat-sidebar.tsx # Sidebar: search, conversation history, agents
    chat-input.tsx  # Textarea, mode toggles, saved prompts panel
  agents/
    agent-form.tsx  # Create/edit agent
    file-uploader.tsx

lib/
  auth.ts           # Better Auth server config
  openai.ts         # OpenAI client
  minio.ts          # MinIO S3 client
  prisma.ts         # Prisma client
  rate-limit.ts     # In-memory sliding window rate limiter
  agents/           # Agent queries, validation, vector store helpers
  chat/             # Chat queries, validation, saved prompts
```

**Stack:** Next.js 15 · TypeScript · Tailwind CSS · shadcn/ui · Prisma · PostgreSQL · MinIO · OpenAI Responses API · Better Auth · Resend · Cloudflare Turnstile

## Local Development

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL
- MinIO (or any S3-compatible storage)
- OpenAI API key

### Setup

```bash
# Install dependencies
pnpm install

# Copy env file and fill in values
cp .env.example .env

# Run database migrations
pnpm prisma migrate dev

# Start dev server
pnpm dev
```

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Long random secret for session signing |
| `RESEND_API_KEY` | Resend API key for email |
| `RESEND_DOMAIN` | Verified domain in Resend |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key |
| `OPENAI_API_KEY` | OpenAI API key |
| `MINIO_ENDPOINT` | MinIO endpoint URL |
| `MINIO_REGION` | MinIO region |
| `MINIO_ACCESS_KEY` | MinIO access key |
| `MINIO_SECRET_KEY` | MinIO secret key |
| `MINIO_BUCKET` | MinIO bucket name |
| `MINIO_FORCE_PATH_STYLE` | `true` for local MinIO |

### Commands

```bash
pnpm dev        # Start dev server
pnpm build      # Production build
pnpm start      # Start production server
pnpm typecheck  # TypeScript check
pnpm test       # Run tests
pnpm lint       # ESLint
pnpm format     # Prettier
```

## Production Deploy Checklist

- [ ] Set all environment variables (never commit `.env`)
- [ ] `BETTER_AUTH_SECRET` must be a strong random 32+ char string
- [ ] PostgreSQL: run `pnpm prisma migrate deploy` (not `migrate dev`)
- [ ] MinIO: create bucket, configure CORS to allow app origin
- [ ] OpenAI: verify API key has access to `gpt-4o`, `gpt-5.4-mini`, `web_search_preview`
- [ ] Resend: verify domain DNS records
- [ ] Cloudflare Turnstile: add production domain to site settings
- [ ] Rate limit: `lib/rate-limit.ts` uses in-memory store — swap to Redis (`@upstash/ratelimit`) for multi-instance
- [ ] Run `pnpm build` — no errors before deploying
- [ ] Test auth flow end-to-end (register → verify email → login)
- [ ] Test file upload and agent creation
- [ ] Test streaming chat response
