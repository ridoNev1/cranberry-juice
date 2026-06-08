# Cranberry Juice — Comprehensive Build Plan

> Chatbot Platform · Next.js 16 · PostgreSQL · OpenAI Responses API · MinIO

---

## 1. Current State Audit

### ✅ Already Done
| Feature | Status | Notes |
|---|---|---|
| Auth — register + email OTP | Done | better-auth + Resend |
| Auth — login + email OTP | Done | |
| Auth — middleware protection | Done | `proxy.ts` |
| UI — auth pages (login / register / verify) | Done | Shadcn, dark mode |
| UI — chat shell (sidebar + main area) | Done | Shadcn Sidebar |
| Database — Prisma + PostgreSQL | Done | User/Session/Account/Verification |
| Theme — light/dark mode | Done | next-themes |

### ❌ Not Yet Built
| Feature | Priority |
|---|---|
| Project (Agent) CRUD | P0 |
| System prompts per project | P0 |
| Chat session per project | P0 |
| Real-time streaming chat (OpenAI) | P0 |
| File upload to project (OpenAI Files API) | P1 |
| MinIO integration (own file storage) | P1 |
| Chat history persistence | P0 |
| README + architecture doc | P2 |

### 🗑️ Features to Remove / Clean Up
- `Upgrade` button in chat header — remove (not a SaaS, just a platform)
- `Export chat` button — keep as placeholder, implement after core is done

> **Note:** `@formisch/react` dipakai di `login-form.tsx` + `register-form.tsx` — keep.
> `@marsidev/react-turnstile` dipakai di login + register sebagai Cloudflare bot protection — keep, intentional.

---

## 2. Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                    Browser (Next.js)                   │
│  Auth pages ─── /chat/[projectId] ─── /projects        │
└───────────────────────┬────────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼────────────────────────────────┐
│              Next.js App Router (Edge-ready)            │
│  app/api/auth/[...]   ← better-auth handler            │
│  app/api/projects/    ← Project CRUD                   │
│  app/api/chat/        ← Streaming route (Edge)         │
│  app/api/files/       ← File upload proxy              │
└────────┬─────────────────────┬──────────────────────────┘
         │                     │
┌────────▼───────┐   ┌─────────▼──────────┐
│  PostgreSQL    │   │  OpenAI API         │
│  (Prisma)      │   │  - Responses API    │
│  Users         │   │  - Files API        │
│  Projects      │   └────────────────────┘
│  Messages      │
│  Prompts       │   ┌────────────────────┐
│  Files         │   │  MinIO (VPS)        │
└────────────────┘   │  - User file blobs  │
                     │  - Referenced by    │
                     │    OpenAI file_id   │
                     └────────────────────┘
```

---

## 3. Database Schema (New Tables)

```prisma
// Extend schema.prisma — add to existing User model:
// agents    Agent[]

model Agent {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  model       String   @default("gpt-4o-mini")
  systemPrompt String? @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  conversations Conversation[]
  agentFiles   AgentFile[]
  savedPrompts SavedPrompt[]
}

model Conversation {
  id        String    @id @default(cuid())
  agentId   String
  userId    String
  title     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  agent    Agent     @relation(fields: [agentId], references: [id], onDelete: Cascade)
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages Message[]
}

model Message {
  id             String   @id @default(cuid())
  conversationId String
  role           String   // "user" | "assistant" | "system"
  content        String   @db.Text
  // OpenAI Responses API: store previous_response_id for chaining
  openaiResponseId String?
  createdAt      DateTime @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
}

model SavedPrompt {
  id        String   @id @default(cuid())
  agentId   String
  userId    String
  label     String
  content   String   @db.Text
  createdAt DateTime @default(now())

  agent Agent @relation(fields: [agentId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model AgentFile {
  id           String   @id @default(cuid())
  agentId      String
  userId       String
  filename     String
  mimeType     String
  sizeBytes    Int
  minioKey     String   // path in MinIO bucket
  openaiFileId String?  // after uploading to OpenAI Files API
  createdAt    DateTime @default(now())

  agent Agent @relation(fields: [agentId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 4. API Routes

### Agent (Project) CRUD
| Method | Route | Description |
|---|---|---|
| GET | `/api/agents` | List user's agents |
| POST | `/api/agents` | Create agent |
| GET | `/api/agents/[id]` | Get agent detail |
| PATCH | `/api/agents/[id]` | Update agent (name, model, systemPrompt) |
| DELETE | `/api/agents/[id]` | Delete agent |

### Conversations & Messages
| Method | Route | Description |
|---|---|---|
| GET | `/api/agents/[id]/conversations` | List conversations |
| POST | `/api/agents/[id]/conversations` | Start new conversation |
| GET | `/api/conversations/[id]/messages` | Load message history |
| DELETE | `/api/conversations/[id]` | Delete conversation |

### Streaming Chat
| Method | Route | Description |
|---|---|---|
| POST | `/api/chat` | Stream response (Edge runtime) |

**OpenAI Responses API pattern:**
```ts
// First message in conversation:
POST https://api.openai.com/v1/responses
{
  model: agent.model,
  input: [{ role: "user", content: userMessage }],
  instructions: agent.systemPrompt,
  stream: true
}
// → save response.id as openaiResponseId

// Follow-up messages (stateful chaining):
POST https://api.openai.com/v1/responses
{
  model: agent.model,
  input: [{ role: "user", content: userMessage }],
  previous_response_id: lastMessage.openaiResponseId,
  stream: true
}
```

### Files
| Method | Route | Description |
|---|---|---|
| POST | `/api/agents/[id]/files` | Upload file → MinIO → OpenAI Files API |
| GET | `/api/agents/[id]/files` | List agent files |
| DELETE | `/api/files/[fileId]` | Delete file (MinIO + OpenAI) |

**File upload flow:**
1. Client sends file to `/api/agents/[id]/files`
2. Server streams to MinIO (own storage)
3. Server forwards to OpenAI Files API → gets `file_id`
4. Save `AgentFile` record (both `minioKey` + `openaiFileId`)
5. Use `openaiFileId` in chat requests with file search

---

## 5. Frontend Pages & Routes

```
/                    → redirect to /chat (if logged in) or /login
/login               → Auth: email + password + OTP
/register            → Auth: name + email + password + OTP
/(auth)/verify       → OTP verification

/chat                → Agent selector / welcome (no agent selected)
/chat/[agentId]      → Chat room for specific agent
  └── /new           → force new conversation

/agents              → Agent management list
/agents/new          → Create new agent form
/agents/[id]/settings → Edit agent: name, model, system prompt, files
```

---

## 6. UI Components to Build

| Component | Location | Description |
|---|---|---|
| `AgentList` | sidebar | Replaces mock history with real agents |
| `AgentCard` | `/agents` page | Agent overview card |
| `AgentForm` | `/agents/new`, `/agents/[id]/settings` | Create/edit form |
| `SystemPromptEditor` | agent settings | Textarea with char count |
| `ModelSelector` | agent settings | Dropdown: gpt-4o, gpt-4o-mini, etc. |
| `ChatRoom` | `/chat/[agentId]` | Full chat UI with message history |
| `MessageBubble` | ChatRoom | User / AI message bubbles with markdown |
| `StreamingIndicator` | ChatRoom | "AI is typing…" pulse animation |
| `ConversationList` | sidebar | Per-agent conversation history |
| `FileUploader` | agent settings | Drag-drop upload, list uploaded files |
| `SavedPromptsPicker` | chat input | Modal to pick a saved prompt |

---

## 7. Tech Stack — Final Decisions

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 (App Router) | Already set up |
| Auth | better-auth + email OTP | Already done |
| DB | PostgreSQL + Prisma | Already set up |
| LLM | OpenAI Responses API | Per requirement, user provides key |
| File Storage | MinIO (VPS) | User's preference, own infra |
| OAI Files | OpenAI Files API | For attaching files to chat |
| Email | Resend | Already set up |
| UI | Shadcn + Tailwind v4 | Already set up |
| Streaming | Vercel AI SDK (`streamText`) | Works with OpenAI, handles SSE |
| Markdown | `react-markdown` + `remark-gfm` | Render AI markdown responses |

### New packages to install
```bash
pnpm add ai openai @aws-sdk/client-s3 @aws-sdk/lib-storage react-markdown remark-gfm
```

---

## 8. Environment Variables

```env
# Already set
DATABASE_URL=
BETTER_AUTH_SECRET=
RESEND_API_KEY=
RESEND_DOMAIN=

# To add
OPENAI_API_KEY=              # User will provide
MINIO_ENDPOINT=              # VPS IP or domain
MINIO_PORT=9000
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=cranberry-juice
MINIO_USE_SSL=true
```

---

## 9. MinIO Setup (VPS)

```bash
# On VPS — run MinIO with Docker
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -v /data/minio:/data \
  -e MINIO_ROOT_USER=admin \
  -e MINIO_ROOT_PASSWORD=<strong-password> \
  quay.io/minio/minio server /data --console-address ":9001"

# Create bucket: cranberry-juice
# Set lifecycle: files deleted when AgentFile record is deleted (manual cleanup via API)
```

---

## 10. Implementation Phases

### Phase 1 — Foundation Cleanup (1 session)
- [ ] Remove unused packages (`@formisch/react`, `@marsidev/react-turnstile`)
- [ ] Remove "Upgrade" button from chat header
- [ ] Update Prisma schema (add Agent, Conversation, Message, SavedPrompt, AgentFile)
- [ ] Run `prisma migrate`
- [ ] Add OpenAI + MinIO env vars to `.env.example`
- [ ] Install new packages (`ai`, `openai`, `@aws-sdk/*`, `react-markdown`)

### Phase 2 — Agent CRUD (1–2 sessions)
- [ ] `/api/agents` CRUD endpoints
- [ ] `/agents` listing page
- [ ] `/agents/new` create form
- [ ] `/agents/[id]/settings` edit page (name, description, model, system prompt)
- [ ] Update sidebar: replace mock history with real agent list
- [ ] Update `/chat` welcome: show agent cards or "Create your first agent"

### Phase 3 — Chat Engine (2 sessions)
- [ ] `/api/chat` streaming route (Edge runtime, Vercel AI SDK)
- [ ] Conversation creation + persistence
- [ ] Message history load on conversation open
- [ ] `ChatRoom` component with `MessageBubble`
- [ ] `StreamingIndicator`
- [ ] Markdown rendering in AI responses
- [ ] `/chat/[agentId]` route — loads agent, last conversation or new
- [ ] Update sidebar: per-agent conversation list (grouped by date)
- [ ] "New chat" button creates new conversation in current agent context

### Phase 4 — File Uploads (1 session)
- [ ] MinIO client setup (`lib/minio.ts`)
- [ ] `/api/agents/[id]/files` — upload, list, delete
- [ ] Forward file to OpenAI Files API after MinIO upload
- [ ] `FileUploader` component in agent settings
- [ ] Wire `file_id` into chat requests (file_search tool)

### Phase 5 — Saved Prompts (0.5 session)
- [ ] `/api/agents/[id]/prompts` CRUD
- [ ] `SavedPromptsPicker` modal in chat input
- [ ] "Save this prompt" quick action in chat

### Phase 6 — Polish & Deliverables (1 session)
- [ ] Error boundaries + toast error handling across all routes
- [ ] Loading skeletons for agent list, message history
- [ ] `README.md` — setup instructions, env vars, run commands
- [ ] `ARCHITECTURE.md` — this plan condensed, with diagrams
- [ ] Deploy to production (Vercel + external PostgreSQL + MinIO VPS)
- [ ] Record demo video

---

## 11. Security Checklist

- [x] All API routes validate session via `auth.api.getSession()`
- [x] Users can only access their own agents/conversations (userId filter on all queries)
- [ ] File uploads: validate MIME type + size limit (10MB) server-side
- [ ] Rate limit `/api/chat` endpoint (prevent abuse)
- [ ] OpenAI key stored server-side only, never exposed to client
- [ ] MinIO bucket: private, no public access
- [ ] CORS: only allow own origin on API routes

---

## 12. Deliverables Checklist

| Item | Status |
|---|---|
| Source code on GitHub | ⬜ Push repo |
| README with run instructions | ⬜ Phase 6 |
| Architecture doc (Markdown) | ⬜ Phase 6 |
| Publicly hosted demo | ⬜ Phase 6 — Vercel + domain |
| Demo recording | ⬜ Phase 6 |

---

## 13. Out of Scope (for now)

- Analytics dashboard
- Team/multi-user workspaces
- Billing / plan limits
- OAuth social logins (Google, GitHub)
- Fine-tuning models
- Voice input/output
