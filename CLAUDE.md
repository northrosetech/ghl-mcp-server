# CLAUDE.md

> Project context for Claude Code, Cursor, and other AI coding tools working on this repository.
> For end-user install instructions, see [README.md](./README.md).
> For machine-readable server discovery, see [mcp.json](./mcp.json).

---

## What This Is

**GHL MCP Server** is a Model Context Protocol (MCP) server that exposes the [GoHighLevel](https://highlevel.com) CRM API as tools an AI agent can call. It ships 60+ tools covering contacts, conversations, calendars, pipelines, payments, invoices, workflows, and more.

- **Built by:** Saurabh K Shah (https://saurabhshah.com)
- **License:** MIT
- **Language:** TypeScript (Node.js, ESM)
- **MCP SDK:** `@modelcontextprotocol/sdk`
- **Transports:** stdio (for Claude Desktop / Claude Code) and HTTP Streamable (for N8N and remote clients)

---

## Repository Layout

```
ghl-mcp-server/
├── src/
│   ├── index.ts                # Entry point, transport selection, server wiring
│   ├── constants.ts            # GHL API endpoints, rate limits, version headers
│   ├── types.ts                # Shared TypeScript interfaces
│   ├── services/
│   │   └── api-client.ts       # HTTP client: auth, rate limiting, error mapping
│   └── tools/
│       ├── contacts.ts         # Contact CRUD, tags, notes, tasks, workflow attach
│       ├── conversations.ts    # SMS/Email/WhatsApp messaging, threads
│       ├── calendars.ts        # Calendars, free slots, appointments
│       ├── opportunities.ts    # Deals, pipelines, stage transitions
│       └── business.ts         # Payments, invoices, workflows, forms, social, misc
├── dist/                       # Compiled JS output (committed? check .gitignore)
├── mcp.json                    # Machine-readable server manifest
├── CLAUDE.md                   # This file
├── README.md                   # End-user docs
├── package.json
├── tsconfig.json
└── .env.example
```

---

## How It Works

1. `src/index.ts` creates a single `McpServer` instance.
2. Each file in `src/tools/` exports a `register*Tools(server)` function that calls `server.tool(name, schema, handler)` for each tool it owns.
3. All tool handlers go through `src/services/api-client.ts`, which handles auth headers, the GHL `Version` header, rate limiting (100 req / 10s burst, 200k/day), and error mapping.
4. Transport is chosen at startup via the `TRANSPORT` env var: `stdio` (default) or `http`.

### Environment Variables

| Var | Required | Default | Purpose |
|-----|----------|---------|---------|
| `GHL_API_KEY` | Yes | — | GHL Private Integration Token |
| `GHL_LOCATION_ID` | Yes | — | Sub-account ID |
| `GHL_BASE_URL` | No | `https://services.leadconnectorhq.com` | API base |
| `GHL_API_VERSION` | No | `2021-07-28` | `Version` header value |
| `TRANSPORT` | No | `stdio` | `stdio` or `http` |
| `PORT` | No | `3001` | HTTP port when `TRANSPORT=http` |
| `LOG_LEVEL` | No | `info` | Log verbosity |

---

## Build, Run, Develop

```bash
npm install          # install deps
npm run build        # tsc → dist/
npm run dev          # tsc --watch
npm run start        # node dist/index.js (stdio by default)
npm run start:http   # HTTP transport on PORT
```

Always run `npm run build` before shipping. No broken builds.

---

## Conventions

### Tool Naming
- All tools are prefixed `ghl_` (e.g. `ghl_search_contacts`, `ghl_create_invoice`).
- Verb-first after the prefix: `ghl_get_*`, `ghl_list_*`, `ghl_create_*`, `ghl_update_*`, `ghl_delete_*`, `ghl_search_*`.
- Keep names snake_case to match the existing set.

### Tool Descriptions
- One sentence, action-first, tells the agent **when to use it**, not how it's implemented.
- Mention required inputs inline so the LLM has hints without reading the schema.

### Schemas
- Use Zod (`z.object({...})`) for input schemas. The MCP SDK converts them to JSON Schema automatically.
- Mark truly required fields as required. Mark everything else `.optional()`.
- Use `.describe()` on every field so the agent understands intent.

### Error Handling
- All network calls go through `apiClient` in `src/services/api-client.ts`. Do not call `fetch` directly from a tool handler.
- The client already maps 401/403/404/422/429 to actionable error messages. Don't re-wrap those.
- For logic errors inside a tool (bad combination of args, etc.), throw a clear `Error` with a hint.

### TypeScript
- Strict mode. Avoid `any`. If you need an escape hatch, use `unknown` and narrow.
- ESM imports require `.js` extensions on relative paths (e.g. `from "./tools/contacts.js"`) even though the source is `.ts`.

---

## Adding a New Tool

1. Pick the right file in `src/tools/` (or create a new one if the domain is new).
2. Inside the `register*Tools` function, add:
   ```ts
   server.tool(
     "ghl_do_thing",
     {
       // Zod input schema
       foo: z.string().describe("What foo is"),
       bar: z.number().optional().describe("Optional bar"),
     },
     async ({ foo, bar }) => {
       const data = await apiClient.request("GET", `/path/${foo}`, { params: { bar } });
       return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
     }
   );
   ```
3. If you created a new file, import and call its `register*Tools` from `src/index.ts`.
4. Update the tool table in [README.md](./README.md) and the capabilities list in [mcp.json](./mcp.json).
5. `npm run build` and smoke-test against a real GHL sub-account.

---

## Stop Rules for AI Agents

Stop and ask the human before:

- Changing the `apiClient` auth, rate-limit, or retry logic (shared surface, easy to break every tool).
- Bumping `@modelcontextprotocol/sdk`, `express`, or `zod` major versions.
- Changing tool **names** or removing tools (breaks downstream agent prompts and N8N workflows).
- Introducing a new transport (e.g. SSE, WebSocket) or changing the HTTP route shape.
- Writing secrets to disk, logs, or error messages. `GHL_API_KEY` must never appear in stdout/stderr.
- Adding a new dependency for something you could write in ~30 lines.

---

## Testing Against a Real Tenant

There is no automated test suite yet. To smoke-test a change:

1. Create a **throwaway sub-account** in GHL, or use a sandbox location.
2. Put the creds in `.env`.
3. `npm run build && npm run start:stdio` (or `start:http`).
4. Connect from Claude Desktop / Claude Code / MCP Inspector and exercise the affected tools.
5. Check that error paths (bad IDs, missing scopes) return the actionable messages from `api-client.ts`.

If you add meaningful logic, pair it with a manual test plan in the PR description.

---

## Publishing & Distribution Notes

This repo is intended to be shared publicly so others can self-host. When preparing a release:

- Bump `version` in `package.json` **and** `mcp.json` together.
- Update the capabilities list in `mcp.json` if tools were added or removed.
- Keep `README.md` install instructions in sync with `mcp.json`.
- Do not commit `.env`, `dist/` with embedded secrets, or anything under `node_modules/`.
- Tag releases as `v1.x.y` and keep CHANGELOG entries in the release notes.

---

*Last updated: 2026-04-22*
