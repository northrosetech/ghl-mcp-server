# GHL MCP Server

> GoHighLevel MCP Server for Claude, N8N, and Custom AI Agents
> Built by Saurabh K Shah (https://saurabhshah.com)

A comprehensive Model Context Protocol (MCP) server that connects AI assistants directly to your GoHighLevel CRM. Supports **60+ tools** across contacts, conversations, calendars, pipelines, payments, invoices, workflows, custom fields, social media, and more.

## Features

- **Contacts**: Search, create, update, delete, upsert, tags, notes, tasks, workflow management
- **Conversations & Messaging**: SMS, Email, WhatsApp, search threads, send messages, schedule sends
- **Calendars & Appointments**: List calendars, get free slots, create/update/delete events
- **Opportunities & Pipelines**: Full deal management, stage transitions, pipeline listing
- **Payments & Invoices**: Orders, transactions, subscriptions, create/send/void invoices
- **Workflows**: List all workflows, add/remove contacts from workflows
- **Custom Fields**: List, create custom fields for contacts
- **Locations**: Sub-account details, tags management
- **Users**: Search team members
- **Forms & Surveys**: List forms/surveys, get submissions
- **Campaigns**: List all campaigns
- **Social Media**: List/create posts, view connected accounts
- **Funnels & Blogs**: List funnels, blogs
- **Products**: List products and prices

## Quick Start

### 1. Get Your GHL Credentials

1. Log into GoHighLevel → **Settings** → **Private Integrations**
2. Click **Create New Integration**
3. Name it (e.g., "Claude MCP Server")
4. Select all scopes you need (contacts, conversations, calendars, payments, etc.)
5. Copy the **Private Integration Token**
6. Note your **Location ID** (visible in the URL when viewing any sub-account)

### 2. Install & Configure

```bash
git clone https://github.com/northrosetech/ghl-mcp-server.git
cd ghl-mcp-server
npm install
cp .env.example .env
```

Edit `.env`:
```env
GHL_API_KEY=your_private_integration_token_here
GHL_LOCATION_ID=your_location_id_here
```

Build:
```bash
npm run build
```

### 3. Connect to Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on Mac):

```json
{
  "mcpServers": {
    "ghl": {
      "command": "node",
      "args": ["/absolute/path/to/ghl-mcp-server/dist/index.js"],
      "env": {
        "GHL_API_KEY": "your_private_integration_token",
        "GHL_LOCATION_ID": "your_location_id",
        "TRANSPORT": "stdio"
      }
    }
  }
}
```

Restart Claude Desktop. You should see GHL tools available.

### 4. Connect to N8N (HTTP Mode)

Start the server in HTTP mode:
```bash
TRANSPORT=http PORT=3001 GHL_API_KEY=your_token GHL_LOCATION_ID=your_id node dist/index.js
```

In N8N:
1. Add an **MCP Client** node
2. Set URL to `http://localhost:3001/mcp`
3. Set transport to **HTTP Streamable**
4. Use the GHL tools in your workflows

### 5. Connect to Claude Code

Add to your project's `.mcp.json`:
```json
{
  "mcpServers": {
    "ghl": {
      "command": "node",
      "args": ["./ghl-mcp-server/dist/index.js"],
      "env": {
        "GHL_API_KEY": "your_token",
        "GHL_LOCATION_ID": "your_id"
      }
    }
  }
}
```

## Available Tools (60+)

### Contacts (15 tools)
| Tool | Description |
|------|-------------|
| `ghl_search_contacts` | Search contacts by query, tags, filters |
| `ghl_get_contact` | Get contact by ID |
| `ghl_create_contact` | Create new contact |
| `ghl_update_contact` | Update existing contact |
| `ghl_delete_contact` | Delete contact |
| `ghl_upsert_contact` | Create or update by email/phone |
| `ghl_add_contact_tags` | Add tags to contact |
| `ghl_remove_contact_tags` | Remove tags from contact |
| `ghl_get_contact_notes` | Get contact notes |
| `ghl_create_contact_note` | Add note to contact |
| `ghl_delete_contact_note` | Delete a note |
| `ghl_get_contact_tasks` | Get contact tasks |
| `ghl_create_contact_task` | Create task for contact |
| `ghl_update_contact_task` | Update task |
| `ghl_add_contact_to_workflow` | Add contact to workflow |
| `ghl_remove_contact_from_workflow` | Remove from workflow |

### Conversations & Messaging (6 tools)
| Tool | Description |
|------|-------------|
| `ghl_search_conversations` | Search conversation threads |
| `ghl_get_conversation` | Get conversation details |
| `ghl_get_messages` | Get messages in a thread |
| `ghl_send_message` | Send SMS/Email/WhatsApp/etc. |
| `ghl_cancel_scheduled_message` | Cancel scheduled message |
| `ghl_update_conversation` | Update conversation status |

### Calendars & Appointments (8 tools)
| Tool | Description |
|------|-------------|
| `ghl_list_calendars` | List all calendars |
| `ghl_get_calendar` | Get calendar details |
| `ghl_get_free_slots` | Get available booking slots |
| `ghl_get_events` | Get appointments/events |
| `ghl_create_event` | Create appointment |
| `ghl_update_event` | Update appointment |
| `ghl_delete_event` | Delete appointment |
| `ghl_create_calendar` | Create new calendar |

### Opportunities & Pipelines (7 tools)
| Tool | Description |
|------|-------------|
| `ghl_search_opportunities` | Search deals |
| `ghl_get_opportunity` | Get deal details |
| `ghl_create_opportunity` | Create new deal |
| `ghl_update_opportunity` | Update deal / move stages |
| `ghl_delete_opportunity` | Delete deal |
| `ghl_update_opportunity_status` | Change deal status |
| `ghl_list_pipelines` | List pipelines & stages |

### Payments & Invoices (9 tools)
| Tool | Description |
|------|-------------|
| `ghl_list_orders` | List payment orders |
| `ghl_get_order` | Get order details |
| `ghl_list_transactions` | List transactions |
| `ghl_list_subscriptions` | List subscriptions |
| `ghl_list_invoices` | List invoices |
| `ghl_get_invoice` | Get invoice details |
| `ghl_create_invoice` | Create invoice |
| `ghl_send_invoice` | Email invoice to contact |
| `ghl_void_invoice` | Void an invoice |

### Other Tools (15+ tools)
| Tool | Description |
|------|-------------|
| `ghl_list_workflows` | List all workflows |
| `ghl_list_custom_fields` | List custom fields |
| `ghl_create_custom_field` | Create custom field |
| `ghl_get_location` | Get location details |
| `ghl_get_location_tags` | Get location tags |
| `ghl_create_location_tag` | Create new tag |
| `ghl_search_users` | Search team members |
| `ghl_list_forms` | List forms |
| `ghl_get_form_submissions` | Get form submissions |
| `ghl_list_surveys` | List surveys |
| `ghl_list_campaigns` | List campaigns |
| `ghl_list_social_posts` | List social posts |
| `ghl_create_social_post` | Create/schedule social post |
| `ghl_list_social_accounts` | List connected social accounts |
| `ghl_list_funnels` | List funnels/websites |
| `ghl_list_products` | List products |
| `ghl_list_blogs` | List blogs |
| `ghl_list_links` | List trigger links |

## Architecture

```
ghl-mcp-server/
├── src/
│   ├── index.ts              # Entry point (stdio + HTTP transport)
│   ├── constants.ts          # All GHL API endpoints & config
│   ├── types.ts              # TypeScript interfaces
│   ├── services/
│   │   └── api-client.ts     # Auth, rate limiting, error handling
│   └── tools/
│       ├── contacts.ts       # Contact management tools
│       ├── conversations.ts  # Messaging tools
│       ├── calendars.ts      # Calendar & appointment tools
│       ├── opportunities.ts  # Pipeline & deal tools
│       └── business.ts       # Payments, invoices, workflows, etc.
├── dist/                     # Compiled JS
├── package.json
├── tsconfig.json
└── .env.example
```

## Rate Limits

The server includes built-in rate limiting matching GHL's limits:
- **Burst**: 100 requests per 10 seconds
- **Daily**: 200,000 requests per day

The server automatically queues and retries when limits are approached.

## Error Handling

All tools return actionable error messages with hints:
- **401**: Check your API key (must be Private Integration Token)
- **403**: Missing scopes — edit your Private Integration in GHL Settings
- **404**: Resource not found — check the ID
- **422**: Validation error with details
- **429**: Rate limit — automatic retry

## License

MIT — Built by Saurabh K Shah (https://saurabhshah.com)
