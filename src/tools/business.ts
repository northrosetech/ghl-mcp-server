// Business Operations Tools
// =========================
// Payments, Invoices, Workflows, Custom Fields, Locations, Users, Forms, Campaigns, Social Media, etc.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ENDPOINTS } from "../constants.js";
import { ghlRequest, formatToolResponse, formatErrorResponse, getLocationId } from "../services/api-client.js";

export function registerBusinessTools(server: McpServer): void {

  // ═══════════════════════════════════════
  //  PAYMENTS & INVOICES
  // ═══════════════════════════════════════

  server.registerTool(
    "ghl_list_orders",
    {
      title: "List Payment Orders",
      description: "Get payment orders for a location.",
      inputSchema: {
        locationId: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional().default(20),
        offset: z.number().int().min(0).optional().default(0),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.payments.listOrders, "GET", undefined, {
          locationId: getLocationId(params.locationId),
          limit: params.limit || 20,
          offset: params.offset || 0,
        });
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  server.registerTool(
    "ghl_get_order",
    {
      title: "Get Payment Order",
      description: "Get details of a specific payment order.",
      inputSchema: { orderId: z.string().describe("Order ID") },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.payments.getOrder(params.orderId));
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  server.registerTool(
    "ghl_list_transactions",
    {
      title: "List Transactions",
      description: "Get payment transactions for a location.",
      inputSchema: {
        locationId: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional().default(20),
        offset: z.number().int().min(0).optional().default(0),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.payments.listTransactions, "GET", undefined, {
          locationId: getLocationId(params.locationId),
          limit: params.limit || 20,
          offset: params.offset || 0,
        });
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  server.registerTool(
    "ghl_list_subscriptions",
    {
      title: "List Subscriptions",
      description: "Get active subscriptions for a location.",
      inputSchema: {
        locationId: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional().default(20),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.payments.listSubscriptions, "GET", undefined, {
          locationId: getLocationId(params.locationId),
          limit: params.limit || 20,
        });
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  // ─── INVOICES ───
  server.registerTool(
    "ghl_list_invoices",
    {
      title: "List Invoices",
      description: "Get invoices for a location. Filter by status, contact, or date range.",
      inputSchema: {
        locationId: z.string().optional(),
        status: z.enum(["draft", "sent", "paid", "void", "partially_paid", "all"]).optional(),
        contactId: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional().default(20),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const queryParams: Record<string, string | number> = {
          locationId: getLocationId(params.locationId),
          limit: params.limit || 20,
        };
        if (params.status && params.status !== "all") queryParams.status = params.status;
        if (params.contactId) queryParams.contactId = params.contactId;
        const data = await ghlRequest(ENDPOINTS.payments.listInvoices, "GET", undefined, queryParams);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  server.registerTool(
    "ghl_get_invoice",
    {
      title: "Get Invoice",
      description: "Get details of a specific invoice.",
      inputSchema: { invoiceId: z.string() },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.payments.getInvoice(params.invoiceId));
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  server.registerTool(
    "ghl_create_invoice",
    {
      title: "Create Invoice",
      description: "Create a new invoice for a contact.",
      inputSchema: {
        locationId: z.string().optional(),
        contactId: z.string().describe("Contact to invoice"),
        name: z.string().describe("Invoice title"),
        dueDate: z.string().optional().describe("Due date (ISO 8601)"),
        items: z.array(z.object({
          name: z.string(),
          description: z.string().optional(),
          quantity: z.number(),
          price: z.number(),
        })).describe("Line items"),
        currency: z.string().optional().default("USD"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          locationId: getLocationId(params.locationId),
          contactId: params.contactId,
          name: params.name,
          items: params.items,
          currency: params.currency || "USD",
        };
        if (params.dueDate) body.dueDate = params.dueDate;
        const data = await ghlRequest(ENDPOINTS.payments.createInvoice, "POST", body);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  server.registerTool(
    "ghl_send_invoice",
    {
      title: "Send Invoice",
      description: "Send an invoice to the contact via email.",
      inputSchema: { invoiceId: z.string() },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.payments.sendInvoice(params.invoiceId), "POST");
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  server.registerTool(
    "ghl_void_invoice",
    {
      title: "Void Invoice",
      description: "Void an existing invoice.",
      inputSchema: { invoiceId: z.string() },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.payments.voidInvoice(params.invoiceId), "POST");
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  // ═══════════════════════════════════════
  //  WORKFLOWS
  // ═══════════════════════════════════════

  server.registerTool(
    "ghl_list_workflows",
    {
      title: "List GHL Workflows",
      description: "Get all workflows/automations for a location.",
      inputSchema: {
        locationId: z.string().optional(),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.workflows.list, "GET", undefined, {
          locationId: getLocationId(params.locationId),
        });
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  // ═══════════════════════════════════════
  //  CUSTOM FIELDS
  // ═══════════════════════════════════════

  server.registerTool(
    "ghl_list_custom_fields",
    {
      title: "List Custom Fields",
      description: "Get all custom fields for contacts in a location.",
      inputSchema: { locationId: z.string().optional() },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.customFields.list, "GET", undefined, {
          locationId: getLocationId(params.locationId),
        });
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  server.registerTool(
    "ghl_create_custom_field",
    {
      title: "Create Custom Field",
      description: "Create a new custom field for contacts.",
      inputSchema: {
        locationId: z.string().optional(),
        name: z.string().describe("Field display name"),
        dataType: z.enum(["TEXT", "LARGE_TEXT", "NUMERICAL", "PHONE", "MONETORY", "CHECKBOX", "SINGLE_OPTIONS", "MULTIPLE_OPTIONS", "FLOAT", "DATE"]).describe("Field data type"),
        placeholder: z.string().optional(),
        options: z.array(z.string()).optional().describe("Options for SINGLE_OPTIONS or MULTIPLE_OPTIONS type"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          name: params.name,
          dataType: params.dataType,
        };
        if (params.placeholder) body.placeholder = params.placeholder;
        if (params.options) body.options = params.options;
        const data = await ghlRequest(ENDPOINTS.customFields.create, "POST", body);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  // ═══════════════════════════════════════
  //  LOCATIONS (SUB-ACCOUNTS)
  // ═══════════════════════════════════════

  server.registerTool(
    "ghl_get_location",
    {
      title: "Get Location Details",
      description: "Get details of a GHL location/sub-account including settings, address, and configuration.",
      inputSchema: {
        locationId: z.string().optional().describe("Location ID (uses default if omitted)"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.locations.get(getLocationId(params.locationId)));
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  server.registerTool(
    "ghl_get_location_tags",
    {
      title: "Get Location Tags",
      description: "Get all tags defined in a location.",
      inputSchema: { locationId: z.string().optional() },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.locations.getTags(getLocationId(params.locationId)));
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  server.registerTool(
    "ghl_create_location_tag",
    {
      title: "Create Location Tag",
      description: "Create a new tag in the location.",
      inputSchema: {
        locationId: z.string().optional(),
        name: z.string().describe("Tag name"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(
          ENDPOINTS.locations.createTag(getLocationId(params.locationId)),
          "POST",
          { name: params.name }
        );
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  // ═══════════════════════════════════════
  //  USERS
  // ═══════════════════════════════════════

  server.registerTool(
    "ghl_search_users",
    {
      title: "Search GHL Users",
      description: "Search for users/team members in a location.",
      inputSchema: {
        locationId: z.string().optional(),
        query: z.string().optional().describe("Search by name or email"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const queryParams: Record<string, string> = {
          locationId: getLocationId(params.locationId),
        };
        if (params.query) queryParams.query = params.query;
        const data = await ghlRequest(ENDPOINTS.users.search, "GET", undefined, queryParams);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  // ═══════════════════════════════════════
  //  FORMS & SURVEYS
  // ═══════════════════════════════════════

  server.registerTool(
    "ghl_list_forms",
    {
      title: "List Forms",
      description: "Get all forms for a location.",
      inputSchema: { locationId: z.string().optional() },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.forms.list, "GET", undefined, {
          locationId: getLocationId(params.locationId),
        });
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  server.registerTool(
    "ghl_get_form_submissions",
    {
      title: "Get Form Submissions",
      description: "Get submissions for forms in a location.",
      inputSchema: {
        locationId: z.string().optional(),
        formId: z.string().optional().describe("Filter by specific form"),
        limit: z.number().int().min(1).max(100).optional().default(20),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const queryParams: Record<string, string | number> = {
          locationId: getLocationId(params.locationId),
          limit: params.limit || 20,
        };
        if (params.formId) queryParams.formId = params.formId;
        const data = await ghlRequest(ENDPOINTS.forms.getSubmissions, "GET", undefined, queryParams);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  server.registerTool(
    "ghl_list_surveys",
    {
      title: "List Surveys",
      description: "Get all surveys for a location.",
      inputSchema: { locationId: z.string().optional() },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.surveys.list, "GET", undefined, {
          locationId: getLocationId(params.locationId),
        });
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  // ═══════════════════════════════════════
  //  CAMPAIGNS
  // ═══════════════════════════════════════

  server.registerTool(
    "ghl_list_campaigns",
    {
      title: "List Campaigns",
      description: "Get all campaigns for a location.",
      inputSchema: { locationId: z.string().optional() },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.campaigns.list, "GET", undefined, {
          locationId: getLocationId(params.locationId),
        });
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  // ═══════════════════════════════════════
  //  SOCIAL MEDIA
  // ═══════════════════════════════════════

  server.registerTool(
    "ghl_list_social_posts",
    {
      title: "List Social Media Posts",
      description: "Get scheduled and published social media posts.",
      inputSchema: {
        locationId: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional().default(20),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.socialMedia.listPosts, "GET", undefined, {
          locationId: getLocationId(params.locationId),
          limit: params.limit || 20,
        });
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  server.registerTool(
    "ghl_create_social_post",
    {
      title: "Create Social Media Post",
      description: "Schedule or publish a social media post.",
      inputSchema: {
        locationId: z.string().optional(),
        accountIds: z.array(z.string()).describe("Social account IDs to post to"),
        content: z.string().describe("Post content/caption"),
        mediaUrls: z.array(z.string()).optional().describe("Media file URLs"),
        scheduledDate: z.string().optional().describe("Schedule date (ISO 8601) — omit for immediate publish"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          locationId: getLocationId(params.locationId),
          accountIds: params.accountIds,
          summary: params.content,
        };
        if (params.mediaUrls) body.media = params.mediaUrls;
        if (params.scheduledDate) body.scheduledAt = params.scheduledDate;
        const data = await ghlRequest(ENDPOINTS.socialMedia.createPost, "POST", body);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  server.registerTool(
    "ghl_list_social_accounts",
    {
      title: "List Connected Social Accounts",
      description: "Get all connected social media accounts (Facebook, Instagram, Google, etc.).",
      inputSchema: { locationId: z.string().optional() },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.socialMedia.listAccounts, "GET", undefined, {
          locationId: getLocationId(params.locationId),
        });
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  // ═══════════════════════════════════════
  //  FUNNELS & WEBSITES
  // ═══════════════════════════════════════

  server.registerTool(
    "ghl_list_funnels",
    {
      title: "List Funnels",
      description: "Get all funnels/websites for a location.",
      inputSchema: { locationId: z.string().optional() },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.funnels.list, "GET", undefined, {
          locationId: getLocationId(params.locationId),
        });
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  // ═══════════════════════════════════════
  //  PRODUCTS
  // ═══════════════════════════════════════

  server.registerTool(
    "ghl_list_products",
    {
      title: "List Products",
      description: "Get all products for a location.",
      inputSchema: { locationId: z.string().optional() },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.payments.listProducts, "GET", undefined, {
          locationId: getLocationId(params.locationId),
        });
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  // ═══════════════════════════════════════
  //  BLOGS
  // ═══════════════════════════════════════

  server.registerTool(
    "ghl_list_blogs",
    {
      title: "List Blogs",
      description: "Get all blogs for a location.",
      inputSchema: { locationId: z.string().optional() },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.blogs.list, "GET", undefined, {
          locationId: getLocationId(params.locationId),
        });
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );

  // ═══════════════════════════════════════
  //  TRIGGER LINKS
  // ═══════════════════════════════════════

  server.registerTool(
    "ghl_list_links",
    {
      title: "List Trigger Links",
      description: "Get all trigger links for a location.",
      inputSchema: { locationId: z.string().optional() },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.links.list, "GET", undefined, {
          locationId: getLocationId(params.locationId),
        });
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) { return formatErrorResponse(error); }
    }
  );
}
