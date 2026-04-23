// Conversations & Messaging Tools
// ================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ENDPOINTS } from "../constants.js";
import { ghlRequest, formatToolResponse, formatErrorResponse, getLocationId } from "../services/api-client.js";

export function registerConversationsTools(server: McpServer): void {
  // ─── SEARCH CONVERSATIONS ───
  server.registerTool(
    "ghl_search_conversations",
    {
      title: "Search GHL Conversations",
      description: "Search conversations by contact ID, query, or status. Returns threaded conversations with latest message info.",
      inputSchema: {
        locationId: z.string().optional(),
        contactId: z.string().optional().describe("Filter by contact ID"),
        query: z.string().optional().describe("Search term"),
        status: z.enum(["all", "read", "unread", "starred"]).optional().default("all"),
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
        if (params.contactId) queryParams.contactId = params.contactId;
        if (params.query) queryParams.query = params.query;
        if (params.status && params.status !== "all") queryParams.status = params.status;

        const data = await ghlRequest(ENDPOINTS.conversations.search, "GET", undefined, queryParams);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── GET CONVERSATION ───
  server.registerTool(
    "ghl_get_conversation",
    {
      title: "Get GHL Conversation",
      description: "Get a single conversation by ID with metadata.",
      inputSchema: {
        conversationId: z.string().describe("Conversation ID"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.conversations.get(params.conversationId));
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── GET MESSAGES ───
  server.registerTool(
    "ghl_get_messages",
    {
      title: "Get Conversation Messages",
      description: "Get messages in a conversation thread. Returns SMS, email, and other message types.",
      inputSchema: {
        conversationId: z.string().describe("Conversation ID"),
        limit: z.number().int().min(1).max(100).optional().default(20),
        type: z.string().optional().describe("Message type filter: SMS, Email, etc."),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const queryParams: Record<string, string | number> = { limit: params.limit || 20 };
        if (params.type) queryParams.type = params.type;
        const data = await ghlRequest(ENDPOINTS.conversations.getMessages(params.conversationId), "GET", undefined, queryParams);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── SEND MESSAGE (SMS/Email/WhatsApp) ───
  server.registerTool(
    "ghl_send_message",
    {
      title: "Send Message via GHL",
      description: `Send a message (SMS, Email, WhatsApp, or other) to a contact via GoHighLevel.

Args:
  - type: "SMS", "Email", "WhatsApp", "GMB", "IG", "FB", "Custom", "Live_Chat"
  - contactId: The recipient contact ID
  - message: The message body (text for SMS/WhatsApp, HTML for email)
  - subject: Email subject (required for Email type)
  - emailFrom: Sender email (for Email type)
  - html: HTML body (for Email type, alternative to message)
  - scheduledTimestamp: ISO timestamp to schedule future send

Returns: Sent message object with ID and status.`,
      inputSchema: {
        type: z.enum(["SMS", "Email", "WhatsApp", "GMB", "IG", "FB", "Custom", "Live_Chat"]).describe("Message channel"),
        contactId: z.string().describe("Recipient contact ID"),
        message: z.string().optional().describe("Message body (text for SMS/WhatsApp)"),
        subject: z.string().optional().describe("Email subject line"),
        emailFrom: z.string().optional().describe("Sender email address"),
        html: z.string().optional().describe("HTML email body"),
        conversationId: z.string().optional().describe("Existing conversation ID (auto-created if omitted)"),
        conversationProviderId: z.string().optional().describe("Provider ID for the conversation"),
        scheduledTimestamp: z.string().optional().describe("Schedule send time (ISO 8601)"),
        emailReplyMode: z.enum(["reply", "reply_all"]).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          type: params.type,
          contactId: params.contactId,
        };
        const optionalFields = ["message", "subject", "emailFrom", "html", "conversationId",
          "conversationProviderId", "scheduledTimestamp", "emailReplyMode"] as const;
        for (const field of optionalFields) {
          if (params[field] !== undefined) body[field] = params[field];
        }
        const data = await ghlRequest(ENDPOINTS.conversations.sendMessage, "POST", body);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── CANCEL SCHEDULED MESSAGE ───
  server.registerTool(
    "ghl_cancel_scheduled_message",
    {
      title: "Cancel Scheduled Message",
      description: "Cancel a previously scheduled message.",
      inputSchema: {
        messageId: z.string().describe("Message ID to cancel"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.conversations.cancelScheduled(params.messageId), "DELETE");
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── UPDATE CONVERSATION ───
  server.registerTool(
    "ghl_update_conversation",
    {
      title: "Update GHL Conversation",
      description: "Update conversation status (starred, unread, etc.).",
      inputSchema: {
        conversationId: z.string().describe("Conversation ID"),
        starred: z.boolean().optional().describe("Star/unstar the conversation"),
        unreadCount: z.number().int().optional().describe("Set unread count (0 to mark as read)"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const { conversationId, ...updateData } = params;
        const data = await ghlRequest(ENDPOINTS.conversations.update(conversationId), "PUT", updateData as Record<string, unknown>);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );
}
