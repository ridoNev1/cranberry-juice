# Cranberry Juice — Functional System Design (FSD)

**Version:** 1.0  
**Date:** June 2026  
**Author:** Engineering Team  
**Live Demo:** https://cranberry.satu-meja.com

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [System Architecture](#system-architecture)
4. [Authentication & Security](#authentication--security)
5. [Database Design](#database-design)
6. [API Reference](#api-reference)
7. [AI & Chat Engine](#ai--chat-engine)
8. [Agent System](#agent-system)
9. [File Storage & Uploads](#file-storage--uploads)
10. [Frontend Architecture](#frontend-architecture)
11. [Saved Prompts](#saved-prompts)
12. [Deployment & Infrastructure](#deployment--infrastructure)
13. [Non-Functional Requirements](#non-functional-requirements)

---

## 1. Overview

**Cranberry Juice** is a multi-tenant, multi-agent AI chat platform built on Next.js 16. It allows users to:

- Register and authenticate securely via email + OTP
- Create and manage custom AI agents with individual system prompts, models, and knowledge bases
- Chat with agents using streaming responses (SSE)
- Upload files to agent knowledge bases (RAG via OpenAI vector stores)
- Attach images/documents per-message for inline AI analysis
- Toggle advanced modes: Deeper Research (reasoning model) and Web Search
- Save and reuse prompts per agent

The system is deployed on a VPS using Docker Compose, with nginx as reverse proxy and Let's Encrypt SSL. All user data is isolated per-account. The platform integrates OpenAI Responses API, MinIO object storage, PostgreSQL, and Cloudflare Turnstile for bot protection.

---

## 2. Tech Stack

### Core

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.6 |
| Language | TypeScript | 5.x |
| Runtime | Node.js | 22 (Alpine) |
| UI Library | React | 19.2.4 |
| Package Manager | pnpm | 10.33.0 |

### UI & Styling

| Library | Purpose | Version |
|---------|---------|---------|
| Tailwind CSS | Utility-first styling | 4.x |
| Radix UI | Accessible primitives | 1.5.0 |
| shadcn | Component library (Radix-based) | 4.10.0 |
| next-themes | Dark/light mode | 0.4.6 |
| Lucide React | Icon set | 1.17.0 |
| Sonner | Toast notifications | 2.0.7 |
| class-variance-authority | Component variants | 0.7.1 |

### Data & Backend

| Library | Purpose | Version |
|---------|---------|---------|
| Prisma ORM | Database access | 7.8.0 |
| @prisma/adapter-pg | PostgreSQL native adapter | 7.8.0 |
| pg | PostgreSQL client | 8.21.0 |
| Better Auth | Authentication framework | 1.6.14 |
| Resend | Transactional email | 6.12.4 |
| OpenAI SDK | AI completions + files | 6.42.0 |
| AWS SDK S3 | MinIO S3-compatible storage | 3.1063.0 |
| Zod | Server-side validation | 4.4.3 |
| Valibot | Client-side schema validation | 1.4.1 |

### Bot Protection

| Library | Purpose |
|---------|---------|
| @marsidev/react-turnstile | Cloudflare Turnstile captcha widget |

### Dev Tools

| Tool | Purpose |
|------|---------|
| ESLint | Linting |
| Prettier | Code formatting |
| Vitest | Unit testing |

---

## 3. System Architecture

```
                          ┌──────────────────────────────────┐
                          │        User Browser               │
                          │  React 19 + Next.js App Router   │
                          └──────────────┬───────────────────┘
                                         │ HTTPS
                          ┌──────────────▼───────────────────┐
                          │            nginx                  │
                          │  SSL termination (Let's Encrypt)  │
                          │  cranberry.satu-meja.com → :3000  │
                          └──────────────┬───────────────────┘
                                         │ HTTP :3000
                          ┌──────────────▼───────────────────┐
                          │       Next.js App (Docker)        │
                          │  - Server Components (SSR)        │
                          │  - API Routes (/api/*)            │
                          │  - SSE Streaming (/api/chat)      │
                          └───┬──────────┬────────────────────┘
                              │          │          │
               ┌──────────────▼─┐  ┌────▼──────┐  ┌▼───────────────┐
               │  PostgreSQL 16  │  │   MinIO   │  │  OpenAI API    │
               │  (Prisma ORM)   │  │ (S3 compat│  │  Responses API │
               │  Users, Agents  │  │  files)   │  │  Files API     │
               │  Conversations  │  └───────────┘  │  Vector Stores │
               └────────────────┘                  └────────────────┘
```

**Deployment topology:**
- All services run on one VPS (Ubuntu 22.04, 2 CPU, 4 GB RAM)
- Docker network `cranberry` bridges all containers
- Port 3000 bound to `127.0.0.1` only — external traffic via nginx on 80/443
- MinIO console accessible on port 9001

---

## 4. Authentication & Security

### Framework

Better Auth v1.6.14 handles all auth flows. Configuration: `lib/auth.ts`.

### Auth Flow

```
Register:
  1. User submits email + password + Turnstile token
  2. Server verifies Turnstile token
  3. better-auth creates unverified User record
  4. Resend sends OTP email
  5. User submits OTP → email verified
  6. Session cookie set (HTTP-only)

Login:
  1. User submits email + password + Turnstile token
  2. Server verifies Turnstile → password match
  3. Session created, HTTP-only cookie returned
```

### Session Management

- **Storage:** PostgreSQL `Session` table via Prisma adapter
- **Transport:** HTTP-only cookie (prevents XSS token theft)
- **Server Component:** `getCurrentSession()` → `lib/auth-current.ts`
- **API Route:** `getRequestSession(request)` → `lib/auth-session.ts`
- Unauthenticated requests → `redirect("/login")`

### Bot Protection

Cloudflare Turnstile protects login and register forms:
- **Widget:** `components/turnstile-widget.tsx` using `@marsidev/react-turnstile`
- **Verification:** `lib/turnstile.ts` → POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify`
- Site key: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (baked at build time)
- Secret key: `TURNSTILE_SECRET_KEY` (runtime env)

### Auth API

`app/api/auth/[...all]/route.ts` → `toNextJsHandler(auth)` exposes all Better Auth endpoints (signIn, signUp, signOut, verifyOTP, etc.)

### Rate Limiting

Chat endpoint is rate-limited at 20 requests/minute per user:
- Implementation: `lib/rate-limit.ts` — in-memory sliding window
- Response: `429 Too Many Requests` with `Retry-After` header
- Note: for multi-instance scale, swap to Redis

---

## 5. Database Design

**Technology:** PostgreSQL 16 + Prisma ORM 7.8.0 + `@prisma/adapter-pg`

**Schema file:** `prisma/schema.prisma`

### Entity Relationship Overview

```
User ──< Session
User ──< Account
User ──< Agent ──< Conversation ──< Message ──< ChatAttachment
                │──< AgentFile
                └──< SavedPrompt
```

### Models

#### User
| Field | Type | Notes |
|-------|------|-------|
| id | String | CUID, PK |
| name | String | Display name |
| email | String | Unique |
| emailVerified | Boolean | Default false |
| image | String? | Avatar URL |
| createdAt | DateTime | |
| updatedAt | DateTime | Auto-updated |

#### Agent
| Field | Type | Notes |
|-------|------|-------|
| id | String | CUID, PK |
| userId | String | FK → User (cascade) |
| name | String | Agent display name |
| description | String? | Short description |
| model | String | Default: `gpt-4o-mini` |
| systemPrompt | String? | Text, behavioral instructions |
| vectorStoreId | String? | Unique, OpenAI vector store ID |
| isDefault | Boolean | Default false; one per user |
| createdAt | DateTime | |
| updatedAt | DateTime | Indexed |

**Indexes:** `[userId]`, `[userId, isDefault]`, `[updatedAt]`

#### Conversation
| Field | Type | Notes |
|-------|------|-------|
| id | String | CUID, PK |
| agentId | String | FK → Agent (cascade) |
| userId | String | FK → User (cascade) |
| title | String? | Auto-generated from first message |
| createdAt | DateTime | |
| updatedAt | DateTime | Indexed |

**Indexes:** `[agentId]`, `[userId]`, `[updatedAt]`

#### Message
| Field | Type | Notes |
|-------|------|-------|
| id | String | CUID, PK |
| conversationId | String | FK → Conversation (cascade) |
| role | String | `user` / `assistant` / `system` |
| content | String | Text (db.Text) |
| openaiResponseId | String? | OpenAI Responses API response ID |
| createdAt | DateTime | Indexed |

**Indexes:** `[conversationId]`, `[createdAt]`

#### AgentFile (Knowledge Base)
| Field | Type | Notes |
|-------|------|-------|
| id | String | CUID, PK |
| agentId | String | FK → Agent (cascade) |
| userId | String | FK → User (cascade) |
| filename | String | Original filename |
| mimeType | String | MIME type |
| sizeBytes | Int | File size |
| minioKey | String | S3 key in MinIO |
| openaiFileId | String? | OpenAI Files API ID |
| openaiVectorStoreFileId | String? | Vector store attachment ID |
| vectorStoreStatus | String? | `in_progress` / `completed` / `failed` |
| createdAt | DateTime | |

#### ChatAttachment (Per-message)
| Field | Type | Notes |
|-------|------|-------|
| id | String | CUID, PK |
| userId | String | FK → User (cascade) |
| agentId | String? | FK → Agent (cascade) |
| conversationId | String? | FK → Conversation (cascade) |
| messageId | String? | FK → Message (cascade) |
| filename | String | Original filename |
| mimeType | String | MIME type |
| sizeBytes | Int | File size |
| minioKey | String | S3 key in MinIO |
| openaiFileId | String? | OpenAI Files API ID |
| createdAt | DateTime | |

#### SavedPrompt
| Field | Type | Notes |
|-------|------|-------|
| id | String | CUID, PK |
| agentId | String | FK → Agent (cascade) |
| userId | String | FK → User (cascade) |
| label | String | Short display name (≤100 chars) |
| content | String | Full prompt text (db.Text, ≤4000 chars) |
| createdAt | DateTime | |

### Migrations

| Migration | Description |
|-----------|-------------|
| `20260608161000_init_auth_baseline` | Better Auth core tables (User, Session, Account, Verification) |
| `20260608162000_add_agent_chat_foundation` | Agent, Conversation, Message, SavedPrompt |
| `20260609102000_add_vector_store_fields` | vectorStoreId on Agent; AgentFile with OpenAI fields |
| `20260609143000_add_default_agent_flag` | isDefault flag on Agent |
| `20260609144500_add_chat_attachments` | ChatAttachment table |

---

## 6. API Reference

All routes require authentication unless noted. Session checked via `getRequestSession()`.

### Authentication

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/auth/[...all]` | GET, POST | — | Better Auth catch-all handler |

### Chat

| Route | Method | Request Body | Response | Description |
|-------|--------|-------------|----------|-------------|
| `/api/chat` | POST | `{ agentId?, conversationId?, message, attachmentIds[], deeperResearch, webMode }` | SSE stream | Stream AI response; rate-limited 20 req/min |
| `/api/chat/files` | POST | FormData: `file` | `{ attachment: ChatAttachment }` | Upload chat attachment |

**SSE Events from `/api/chat`:**

| Event | Data | Description |
|-------|------|-------------|
| `start` | `{ conversationId, userMessageId }` | Request accepted, IDs allocated |
| `delta` | `{ text }` | Streamed text chunk from model |
| `done` | `{ assistantMessageId, responseId }` | Stream complete |
| `error` | `{ message }` | Error occurred |

### Agents

| Route | Method | Request | Response | Description |
|-------|--------|---------|----------|-------------|
| `/api/agents` | GET | — | `{ agents[] }` | List user's custom agents |
| `/api/agents` | POST | `{ name, description?, model, systemPrompt? }` | `{ agent }` | Create agent + vector store |
| `/api/agents/[id]` | GET | — | `{ agent }` | Get agent details |
| `/api/agents/[id]` | PATCH | Partial agent fields | `{ agent }` | Update agent |
| `/api/agents/[id]` | DELETE | — | 204 | Delete agent, cascade conversations + vector store |
| `/api/agents/[id]/files` | GET | — | `{ files[] }` | List knowledge base files |
| `/api/agents/[id]/files` | POST | FormData: `file` | `{ file: AgentFile }` | Upload file to KB |
| `/api/agents/[id]/conversations` | GET | — | `{ conversations[] }` | List agent conversations |
| `/api/agents/[id]/conversations` | POST | `{ title? }` | `{ conversation }` | Create conversation |

### Conversations

| Route | Method | Request | Response | Description |
|-------|--------|---------|----------|-------------|
| `/api/conversations/[id]` | GET | — | `{ conversation }` | Get conversation metadata |
| `/api/conversations/[id]` | DELETE | — | 204 | Delete conversation + messages |
| `/api/conversations/[id]/messages` | GET | — | `{ conversation, messages[] }` | All messages |

### Files

| Route | Method | Request | Response | Description |
|-------|--------|---------|----------|-------------|
| `/api/files/[fileId]` | DELETE | — | 204 | Delete agent file (MinIO + OpenAI) |

### Saved Prompts

| Route | Method | Request | Response | Description |
|-------|--------|---------|----------|-------------|
| `/api/saved-prompts` | GET | `?agentId=` | `{ prompts[] }` | List prompts for agent |
| `/api/saved-prompts` | POST | `{ agentId, label, content }` | `{ prompt }` | Create prompt |
| `/api/saved-prompts/[id]` | DELETE | — | 204 | Delete prompt |

---

## 7. AI & Chat Engine

### OpenAI Integration

**Client:** `lib/openai.ts` → singleton `OpenAI` instance using `OPENAI_API_KEY`

**API used:** OpenAI Responses API (`openai.responses.create()`) — supports streaming, tools, and `previous_response_id` for conversation continuity.

### Available Models

| Model ID | Label | Use Case |
|----------|-------|----------|
| `gpt-4o-mini` | GPT-4o Mini | Default, fast responses |
| `gpt-4.1-mini` | GPT-4.1 Mini | Balanced |
| `gpt-4o` | GPT-4o | Multimodal |
| `gpt-5-mini` | GPT-5 Mini | Reasoning |
| `gpt-5.4-mini` | GPT-5.4 Mini | Deeper Research mode |

### Chat Request Flow

```
Client → POST /api/chat
  1. Validate session (401 if missing)
  2. Rate limit check (429 if exceeded)
  3. Parse + validate body (Zod schema)
  4. Resolve/create conversation
  5. Determine model:
     - deeperResearch=true → gpt-5.4-mini
     - otherwise → agent.model
  6. Build tools array:
     - agent.vectorStoreId → { type: "file_search", vector_store_ids: [...] }
     - webMode=true → { type: "web_search_preview" }
  7. Build input (text or multimodal with attachments)
  8. Call openai.responses.create({ stream: true, previous_response_id })
  9. Stream SSE events back to client:
     - "start" → send IDs
     - "delta" → stream text chunks
     - "done" → persist assistant message to DB
     - "error" → emit error event
```

### Conversation Continuity

Each assistant message stores `openaiResponseId`. The next request passes it as `previous_response_id` to the Responses API, allowing OpenAI to recall the prior context without re-sending the full history.

### Multimodal Input

When attachments are present, the input is built as a `ResponseInput` array:

```typescript
[
  { type: "input_text", text: userMessage },
  { type: "input_image", file_id: openaiFileId },   // images
  { type: "input_file",  file_id: openaiFileId },   // PDFs
]
```

### Tools

| Tool | Trigger | Effect |
|------|---------|--------|
| `file_search` | Agent has `vectorStoreId` | RAG over agent knowledge base via OpenAI vector store |
| `web_search_preview` | `webMode: true` in request | Real-time web search by OpenAI |

Both tools can be active simultaneously.

### Streaming (SSE)

- Server: `ReadableStream` piped to `Response` with `Content-Type: text/event-stream`
- Client (`chat-room.tsx`): reads via `response.body.getReader()`, decodes events line by line

---

## 8. Agent System

### What is an Agent?

An Agent is a user-owned, isolated AI assistant with:
- Its own **system prompt** (behavioral instructions)
- Its own **AI model** selection
- Its own **conversation history** (separate threads per agent)
- Its own **knowledge base** (files indexed in OpenAI vector store)
- Its own **saved prompts** (reusable messages)

### Default Agent

Every user has exactly one default agent (`isDefault: true`):
- Created automatically on first chat page visit via `getOrCreateDefaultAgent(userId)`
- Named "Cranberry Assistant"
- Not shown in the custom agents list
- Used for the global `/chat` route

### Agent Lifecycle

**Create (POST /api/agents):**
1. Validate input (name, model, systemPrompt)
2. Create Agent record in DB
3. Create OpenAI vector store → store `vectorStoreId` on Agent
4. Return Agent (succeeds even if vector store creation fails)

**Update (PATCH /api/agents/[id]):**
- Partial updates to: name, description, model, systemPrompt
- Does not affect vector store

**Delete (DELETE /api/agents/[id]):**
1. Fetch agent, verify ownership
2. Delete OpenAI vector store if `vectorStoreId` present
3. Prisma cascade deletes: Conversations → Messages → ChatAttachments, AgentFiles, SavedPrompts

**Vector Store — Lazy Initialization:**

`lib/agents/vector-store.ts` → `ensureAgentVectorStore({ userId, agent })`:
- If `agent.vectorStoreId` exists → return it
- Else: create new OpenAI vector store, persist to DB, return ID

This is called during file uploads to guarantee a vector store exists before attaching files.

### Query Layer

All DB access via `lib/agents/queries.ts`:

| Function | Purpose |
|----------|---------|
| `listAgents(userId)` | All custom agents, ordered by updatedAt DESC |
| `getOrCreateDefaultAgent(userId)` | Lazy default agent |
| `getAgent(userId, id)` | Single agent with file/conversation counts |
| `createAgent(userId, input, opts)` | Create with optional vectorStoreId |
| `updateAgent(userId, id, input)` | Partial update, ownership validated |
| `deleteAgent(userId, id)` | Hard delete |
| `setAgentVectorStoreId(userId, agentId, id)` | Attach vector store ID |
| `listAgentFiles(userId, agentId)` | Files ordered by createdAt DESC |
| `createAgentFile(input)` | Create file record |
| `deleteAgentFile(userId, id)` | Delete file record |
| `updateAgentFileVectorStore(...)` | Update vector store status fields |

---

## 9. File Storage & Uploads

### Architecture

Files are stored in two places simultaneously:
1. **MinIO** — permanent, durable binary storage (S3-compatible)
2. **OpenAI Files API** — for inference (multimodal input or vector store indexing)

### MinIO Configuration

**Client:** `lib/minio.ts` → `S3Client` from `@aws-sdk/client-s3`

| Env Var | Purpose |
|---------|---------|
| `MINIO_ENDPOINT` | MinIO server URL |
| `MINIO_ACCESS_KEY` | S3 access key |
| `MINIO_SECRET_KEY` | S3 secret key |
| `MINIO_BUCKET` | Bucket name |
| `MINIO_FORCE_PATH_STYLE` | `true` for self-hosted MinIO |

### File Types

#### Chat Attachments (per-message)

- **Purpose:** images or documents sent inline with a chat message
- **Upload:** `POST /api/chat/files` (FormData)
- **MinIO path:** `chat/{userId}/{attachmentId}-{filename}`
- **OpenAI purpose:** `vision` (images) or `assistants` (PDFs)
- **Lifecycle:** tied to the conversation/message

#### Agent Files (knowledge base)

- **Purpose:** persistent documents for RAG (retrieval-augmented generation)
- **Upload:** `POST /api/agents/[id]/files` (FormData)
- **MinIO path:** `agents/{userId}/{agentId}/{fileId}-{filename}`
- **OpenAI purpose:** `assistants`, attached to vector store
- **Lifecycle:** persists until agent or file deleted

### File Validation

`lib/agents/files.ts`:

| Rule | Value |
|------|-------|
| Allowed types | PDF, JPEG, PNG, WebP |
| Max file size | 10 MB |
| Vector store support | PDF only |
| Filename sanitization | Remove special chars, limit length |

### Agent File Upload Flow

```
POST /api/agents/[id]/files
  1. Validate session + ownership
  2. Validate file (type, size)
  3. Generate unique file ID
  4. Upload to MinIO
  5. Upload to OpenAI Files API → get openaiFileId
  6. Create AgentFile record in DB (status: in_progress)
  7. If PDF:
     a. ensureAgentVectorStore (lazy create)
     b. attachFileToAgentVectorStore → poll status
     c. Update AgentFile with vectorStoreStatus = "completed"
  8. Return AgentFile
```

### Chat Attachment Upload Flow

```
POST /api/chat/files
  1. Validate session
  2. Upload to MinIO
  3. Upload to OpenAI Files API → get openaiFileId
  4. Create ChatAttachment record in DB
  5. Return attachment (client stores ID, sends in /api/chat request)
```

---

## 10. Frontend Architecture

### Page Structure

```
app/
├── layout.tsx                     Root layout (ThemeProvider, fonts)
├── page.tsx                       Redirect → /chat
├── (auth)/
│   ├── login/page.tsx             Login form + Turnstile
│   ├── register/page.tsx          Register form + Turnstile
│   └── verify/page.tsx            OTP verification
├── chat/
│   ├── layout.tsx                 ChatSidebar + default agent chat
│   └── page.tsx                   Default agent chat room
├── chat/[agentId]/
│   └── page.tsx                   Per-agent chat room
├── agents/
│   ├── page.tsx                   Agent management list
│   ├── new/page.tsx               Create agent form
│   └── [id]/settings/page.tsx     Edit agent + file upload
└── api/                           Route handlers (see §6)
```

### Key Components

#### ChatRoom (`components/chat/chat-room.tsx`)

The core chat interface. Server-rendered with hydration props, then fully client-driven.

**Props:**
- `agent` — current agent info (id, name, model)
- `conversationBasePath` — URL prefix for conversation routing
- `initialConversationId` + `initialMessages` — SSR hydration
- `emptyLayout` — controls which suggested prompts to show

**State:**
- `conversationId` — current conversation (null = new chat)
- `messages[]` — full message list
- `attachments[]` — pending file attachments
- `isStreaming` — true while request in flight

**Core methods:**
- `handleSubmit(message, options)` → POST `/api/chat`, reads SSE stream
- `handleAttachFiles(files[])` → POST `/api/chat/files` for each file
- `handleRemoveAttachment(id)` → remove from pending list

#### ChatInput (`components/chat/chat-input.tsx`)

Rich message composer with multiple modes.

**Features:**
- Auto-expanding textarea (max 200px default, 400px expanded)
- **Deeper Research toggle** — sends `deeperResearch: true`, uses `gpt-5.4-mini`
- **Web Mode toggle** — sends `webMode: true`, adds `web_search_preview` tool
- **File attachment** — PDF + image picker (preview badges)
- **Saved Prompts panel** — bookmark icon → load/save/delete prompts
- **Send on Enter** (Shift+Enter = newline)
- Inline mode badges shown when active

#### ChatSidebar (`components/chat/chat-sidebar.tsx`)

Conversation history and navigation.

**Sections:**
- Global chat (default agent conversations, grouped by date)
- Per-agent sections (custom agents with their conversations)
- Grouping: Today / Yesterday / Last 7 days / Earlier
- Real-time search filter (local, no API call)
- Delete conversation with confirmation dialog

**Date groups:** computed client-side from `updatedAt` timestamp

#### AgentForm (`components/agents/agent-form.tsx`)

Create and edit agents.

**Fields:** Name, Model (dropdown), Description, System Prompt  
**Side panel:** live agent preview, model info, stats  
**Actions:** Save, Delete (with confirm dialog)

#### FileUploader (`components/agents/file-uploader.tsx`)

Upload and manage agent knowledge base files.

**Features:**
- Click to browse or drag-and-drop
- Upload progress + vector store status badges
- Delete files inline
- Supported: PDF, JPEG, PNG, WebP (max 10 MB)

### State Management

The app uses **local React state only** — no global state library (Redux, Zustand, etc.):

- `useState` / `useEffect` in ChatRoom, ChatInput, ChatSidebar
- Session: `useSession()` from better-auth client
- Server data fetched in Server Components (RSC), passed as props
- Form state: `@formisch/react` + Valibot/Zod schemas

### Theme

- **Default:** light mode
- **Toggle:** `components/theme-toggle.tsx` — Sun/Moon icon, persisted in localStorage
- **Implementation:** `next-themes` ThemeProvider wraps root layout
- Every page header has a `<ThemeToggle />` at far right

### Fonts

| Font | Usage |
|------|-------|
| Outfit | Headings |
| IBM Plex Sans | Body text |
| Geist Mono | Monospace / code |

### Loading & Error States

Each route segment has:
- `loading.tsx` — skeleton UI shown during RSC data fetch
- `error.tsx` — error boundary with "Try again" button

---

## 11. Saved Prompts

### Purpose

Allows users to save frequently used messages per agent, for quick reuse in chat.

### Data Flow

**Save a prompt:**
1. User types message in ChatInput
2. Clicks bookmark → enter label (≤100 chars)
3. POST `/api/saved-prompts` with `{ agentId, label, content }`
4. Validated: label + content non-empty, content ≤4000 chars
5. Saved to `SavedPrompt` table
6. Toast success

**Load a prompt:**
1. User opens saved prompts panel (bookmark icon)
2. GET `/api/saved-prompts?agentId=` fetches list
3. User clicks prompt → text inserted into textarea
4. Textarea auto-expands to fit content

**Delete a prompt:**
1. Hover over prompt → delete button appears
2. DELETE `/api/saved-prompts/[id]`
3. Removed from list, toast success

### Query Functions (`lib/chat/saved-prompts.ts`)

| Function | Description |
|----------|-------------|
| `listSavedPrompts(userId, agentId)` | Ordered by createdAt DESC |
| `createSavedPrompt({ userId, agentId, label, content })` | Create new prompt |
| `deleteSavedPrompt(userId, id)` | Delete with ownership check |

---

## 12. Deployment & Infrastructure

### Server

| Resource | Value |
|----------|-------|
| Provider | Tencent Cloud |
| OS | Ubuntu 22.04 |
| CPU | 2 vCPU |
| RAM | 4 GB |
| Disk | 59 GB |
| IP | 43.157.241.12 |
| Domain | cranberry.satu-meja.com |

### Docker Architecture

**Multi-stage Dockerfile:**

| Stage | Base | Purpose |
|-------|------|---------|
| `base` | node:22-alpine | Shared pnpm setup |
| `deps` | base | Install dependencies (frozen lockfile) |
| `builder` | base | Next.js production build |
| `runner` | base | Minimal runtime image |

**Builder stage notes:**
- Build-time env vars (placeholders for SDK initialization): `DATABASE_URL`, `RESEND_API_KEY`, `OPENAI_API_KEY`, etc.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` passed as Docker build arg (baked into client bundle)
- Runs `prisma generate` then `next build`

**Runner stage:**
- Copies: `.next/standalone`, `.next/static`, `public`, `prisma/`, `prisma.config.js`
- Installs `prisma@7` via npm for migration support
- Runs as unprivileged user `nextjs` (UID 1001)
- CMD: `node server.js`

### Docker Compose Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| app | cranberry-juice:latest | 127.0.0.1:3000 | Next.js application |
| postgres | postgres:16-alpine | internal | Primary database |
| minio | minio/minio:latest | 9001 (console) | Object storage |

All services share the `cranberry` bridge network. Postgres and MinIO use named volumes for persistence. App waits for both to be healthy before starting.

### nginx Configuration

Reverse proxy with SSL termination:
- Listens on 80 (redirects to HTTPS) and 443
- SSL via Let's Encrypt (auto-renews via certbot cron)
- Proxies to `127.0.0.1:3000`
- Headers set: `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`, `Host`
- `client_max_body_size 50M` for file uploads
- `proxy_read_timeout 300s` for long AI responses

### Deploy Script (`deploy.sh`)

```
1. rsync source to server
   (excludes: .next, node_modules, .git, .env*, *.tar.gz)

2. SSH → docker build on server
   (--build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY from .env.production)

3. SSH → docker run prisma migrate deploy
   (in cranberry network, DATABASE_URL from .env.production)

4. SSH → docker compose up -d app
   (rolling restart, postgres + minio already running)
```

### Environment Variables

| Variable | Required | Build/Runtime | Description |
|----------|----------|---------------|-------------|
| `DATABASE_URL` | Yes | Runtime | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Runtime | 32+ char random secret |
| `BETTER_AUTH_URL` | Yes | Runtime | Public app URL (e.g. https://cranberry.satu-meja.com) |
| `RESEND_API_KEY` | Yes | Runtime | Resend email API key |
| `RESEND_DOMAIN` | Yes | Runtime | Verified sender domain |
| `OPENAI_API_KEY` | Yes | Runtime | OpenAI API key |
| `MINIO_ENDPOINT` | Yes | Runtime | MinIO server URL |
| `MINIO_ACCESS_KEY` | Yes | Runtime | MinIO access key |
| `MINIO_SECRET_KEY` | Yes | Runtime | MinIO secret key |
| `MINIO_BUCKET` | Yes | Runtime | Bucket name |
| `MINIO_FORCE_PATH_STYLE` | Yes | Runtime | `true` for self-hosted |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Yes | **Build-time** | Cloudflare Turnstile site key |
| `TURNSTILE_SECRET_KEY` | Yes | Runtime | Cloudflare Turnstile secret |

---

## 13. Non-Functional Requirements

### Scalability

- **Database:** indexed on frequently queried columns (`userId`, `agentId`, `updatedAt`)
- **Auth sessions:** stored in PostgreSQL (horizontally scalable)
- **Rate limiting:** in-memory (single instance); swap to Redis for multi-instance
- **File uploads:** streamed to MinIO (no base64 encoding)
- **Chat streaming:** SSE (efficient long-lived connection)

### Security

- Passwords hashed by Better Auth (bcrypt)
- Sessions stored server-side (HTTP-only cookie, not localStorage)
- All routes validate session before accessing data
- Ownership enforced on every DB query (userId + agentId checks)
- Bot protection on auth forms (Cloudflare Turnstile)
- Rate limiting on AI endpoint
- File type + size validation before upload
- Docker runs as non-root user (`nextjs`, UID 1001)
- Port 3000 bound to `127.0.0.1` only

### Reliability

- `restart: unless-stopped` on all Docker services
- Healthchecks on postgres (pg_isready) and minio (mc ready)
- App waits for dependency health before starting
- Error boundaries (`error.tsx`) per route segment
- SSE errors surfaced as toast notifications (not silent failures)
- SSL auto-renews via certbot cron

### Extensibility

- Model selection decoupled from chat logic (`AGENT_MODEL_OPTIONS` in `lib/agents/models.ts`)
- Tools are additive (array-based, easy to add new OpenAI tools)
- Agent system supports any number of agents per user
- Saved prompts are per-agent (scoped, not global)
- File types validated in a dedicated function (easy to extend)

### Performance

- Next.js App Router: Server Components for initial page data (no waterfall)
- `previous_response_id` for context — no full history re-send per message
- Streaming SSE: first token appears in <1s typically
- Standalone Next.js build: minimal cold-start overhead
- Images served from `public/` or MinIO directly

---

*Document generated from codebase analysis of Cranberry Juice v1.0.*
