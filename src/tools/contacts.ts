// Contacts Tools
// ===============
// CRUD operations, tags, notes, tasks for GHL contacts

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ENDPOINTS } from "../constants.js";
import { ghlRequest, formatToolResponse, formatErrorResponse, getLocationId } from "../services/api-client.js";

export function registerContactsTools(server: McpServer): void {
  // ─── SEARCH CONTACTS ───
  server.registerTool(
    "ghl_search_contacts",
    {
      title: "Search GHL Contacts",
      description: `Search contacts in GoHighLevel by query, tags, filters, or custom fields. Returns paginated results.

Args:
  - query (string): Search term (name, email, phone)
  - locationId (string): Location ID (uses default if omitted)
  - limit (number): Results per page (1-100, default 20)
  - filters (object): Advanced filters like tags, date ranges, custom fields

Returns: List of contacts with pagination metadata.`,
      inputSchema: {
        locationId: z.string().optional().describe("GHL Location ID (uses default if omitted)"),
        query: z.string().optional().describe("Search term — name, email, phone"),
        limit: z.number().int().min(1).max(100).default(20).describe("Results per page"),
        startAfter: z.string().optional().describe("Pagination cursor from previous response"),
        startAfterId: z.string().optional().describe("Pagination ID cursor from previous response"),
        filters: z.array(z.object({
          field: z.string().describe("Field to filter on"),
          operator: z.string().describe("Filter operator: eq, neq, contains, etc."),
          value: z.union([z.string(), z.number(), z.boolean()]).describe("Filter value"),
        })).optional().describe("Advanced search filters"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          locationId: getLocationId(params.locationId),
          page: 1,
          pageLimit: params.limit || 20,
        };

        if (params.query) body.query = params.query;
        if (params.filters) body.filters = params.filters;

        const data = await ghlRequest(ENDPOINTS.contacts.search, "POST", body);
        return {
          content: [{ type: "text", text: formatToolResponse(data) }],
        };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── GET CONTACT ───
  server.registerTool(
    "ghl_get_contact",
    {
      title: "Get GHL Contact",
      description: "Get a single contact by ID with all details including custom fields, tags, and activity.",
      inputSchema: {
        contactId: z.string().describe("The contact ID to retrieve"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.contacts.get(params.contactId));
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── CREATE CONTACT ───
  server.registerTool(
    "ghl_create_contact",
    {
      title: "Create GHL Contact",
      description: `Create a new contact in GoHighLevel.

Args:
  - firstName, lastName, email, phone (strings): Basic contact info
  - tags (string[]): Tags to apply
  - source (string): Lead source
  - customFields (array): Custom field values as [{id, field_value}]
  - locationId (string): Location ID (uses default if omitted)

Returns: Created contact object with ID.`,
      inputSchema: {
        locationId: z.string().optional(),
        firstName: z.string().optional().describe("First name"),
        lastName: z.string().optional().describe("Last name"),
        name: z.string().optional().describe("Full name (alternative to first/last)"),
        email: z.string().optional().describe("Email address"),
        phone: z.string().optional().describe("Phone number with country code"),
        companyName: z.string().optional().describe("Company name"),
        address1: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
        website: z.string().optional(),
        timezone: z.string().optional(),
        tags: z.array(z.string()).optional().describe("Tags to apply"),
        source: z.string().optional().describe("Lead source"),
        dnd: z.boolean().optional().describe("Do Not Disturb flag"),
        customFields: z.array(z.object({
          id: z.string(),
          field_value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
        })).optional().describe("Custom field values"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          locationId: getLocationId(params.locationId),
        };
        // Copy all provided fields
        const fields = ["firstName", "lastName", "name", "email", "phone", "companyName",
          "address1", "city", "state", "postalCode", "country", "website", "timezone",
          "tags", "source", "dnd", "customFields"] as const;
        for (const field of fields) {
          if (params[field] !== undefined) body[field] = params[field];
        }
        const data = await ghlRequest(ENDPOINTS.contacts.create, "POST", body);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── UPDATE CONTACT ───
  server.registerTool(
    "ghl_update_contact",
    {
      title: "Update GHL Contact",
      description: "Update an existing contact. Only pass fields you want to change.",
      inputSchema: {
        contactId: z.string().describe("Contact ID to update"),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        companyName: z.string().optional(),
        address1: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
        website: z.string().optional(),
        tags: z.array(z.string()).optional(),
        source: z.string().optional(),
        dnd: z.boolean().optional(),
        customFields: z.array(z.object({
          id: z.string(),
          field_value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
        })).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const { contactId, ...updateFields } = params;
        const data = await ghlRequest(ENDPOINTS.contacts.update(contactId), "PUT", updateFields as Record<string, unknown>);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── DELETE CONTACT ───
  server.registerTool(
    "ghl_delete_contact",
    {
      title: "Delete GHL Contact",
      description: "Permanently delete a contact. This cannot be undone.",
      inputSchema: {
        contactId: z.string().describe("Contact ID to delete"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.contacts.delete(params.contactId), "DELETE");
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── UPSERT CONTACT ───
  server.registerTool(
    "ghl_upsert_contact",
    {
      title: "Upsert GHL Contact",
      description: "Create or update a contact by email/phone. If a match is found, updates; otherwise creates new.",
      inputSchema: {
        locationId: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        companyName: z.string().optional(),
        tags: z.array(z.string()).optional(),
        source: z.string().optional(),
        customFields: z.array(z.object({
          id: z.string(),
          field_value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
        })).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const { locationId, ...rest } = params;
        const body: Record<string, unknown> = {
          ...rest,
          locationId: getLocationId(locationId),
        };
        const data = await ghlRequest(ENDPOINTS.contacts.upsert, "POST", body);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── ADD TAGS ───
  server.registerTool(
    "ghl_add_contact_tags",
    {
      title: "Add Tags to Contact",
      description: "Add one or more tags to a contact.",
      inputSchema: {
        contactId: z.string().describe("Contact ID"),
        tags: z.array(z.string()).min(1).describe("Tags to add"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.contacts.addTags(params.contactId), "POST", { tags: params.tags });
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── REMOVE TAGS ───
  server.registerTool(
    "ghl_remove_contact_tags",
    {
      title: "Remove Tags from Contact",
      description: "Remove one or more tags from a contact.",
      inputSchema: {
        contactId: z.string().describe("Contact ID"),
        tags: z.array(z.string()).min(1).describe("Tags to remove"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.contacts.removeTags(params.contactId), "DELETE", { tags: params.tags });
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── GET NOTES ───
  server.registerTool(
    "ghl_get_contact_notes",
    {
      title: "Get Contact Notes",
      description: "Get all notes for a contact.",
      inputSchema: {
        contactId: z.string().describe("Contact ID"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.contacts.getNotes(params.contactId));
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── CREATE NOTE ───
  server.registerTool(
    "ghl_create_contact_note",
    {
      title: "Create Contact Note",
      description: "Add a note to a contact.",
      inputSchema: {
        contactId: z.string().describe("Contact ID"),
        body: z.string().describe("Note content"),
        userId: z.string().optional().describe("User ID who created the note"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = { body: params.body };
        if (params.userId) body.userId = params.userId;
        const data = await ghlRequest(ENDPOINTS.contacts.createNote(params.contactId), "POST", body);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── DELETE NOTE ───
  server.registerTool(
    "ghl_delete_contact_note",
    {
      title: "Delete Contact Note",
      description: "Delete a specific note from a contact.",
      inputSchema: {
        contactId: z.string().describe("Contact ID"),
        noteId: z.string().describe("Note ID to delete"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.contacts.deleteNote(params.contactId, params.noteId), "DELETE");
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── GET TASKS ───
  server.registerTool(
    "ghl_get_contact_tasks",
    {
      title: "Get Contact Tasks",
      description: "Get all tasks for a contact.",
      inputSchema: {
        contactId: z.string().describe("Contact ID"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.contacts.getTasks(params.contactId));
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── CREATE TASK ───
  server.registerTool(
    "ghl_create_contact_task",
    {
      title: "Create Contact Task",
      description: "Create a task for a contact.",
      inputSchema: {
        contactId: z.string().describe("Contact ID"),
        title: z.string().describe("Task title"),
        body: z.string().optional().describe("Task description"),
        dueDate: z.string().optional().describe("Due date (ISO 8601)"),
        completed: z.boolean().optional().default(false),
        assignedTo: z.string().optional().describe("User ID to assign task to"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      try {
        const { contactId, ...taskData } = params;
        const data = await ghlRequest(ENDPOINTS.contacts.createTask(contactId), "POST", taskData as Record<string, unknown>);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── UPDATE TASK ───
  server.registerTool(
    "ghl_update_contact_task",
    {
      title: "Update Contact Task",
      description: "Update an existing task for a contact.",
      inputSchema: {
        contactId: z.string().describe("Contact ID"),
        taskId: z.string().describe("Task ID"),
        title: z.string().optional(),
        body: z.string().optional(),
        dueDate: z.string().optional(),
        completed: z.boolean().optional(),
        assignedTo: z.string().optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const { contactId, taskId, ...updateData } = params;
        const data = await ghlRequest(ENDPOINTS.contacts.updateTask(contactId, taskId), "PUT", updateData as Record<string, unknown>);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── ADD TO WORKFLOW ───
  server.registerTool(
    "ghl_add_contact_to_workflow",
    {
      title: "Add Contact to Workflow",
      description: "Add a contact to a GHL workflow/automation.",
      inputSchema: {
        contactId: z.string().describe("Contact ID"),
        workflowId: z.string().describe("Workflow ID to add contact to"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const endpoint = `/contacts/${params.contactId}/workflow/${params.workflowId}`;
        const data = await ghlRequest(endpoint, "POST");
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── REMOVE FROM WORKFLOW ───
  server.registerTool(
    "ghl_remove_contact_from_workflow",
    {
      title: "Remove Contact from Workflow",
      description: "Remove a contact from a GHL workflow.",
      inputSchema: {
        contactId: z.string().describe("Contact ID"),
        workflowId: z.string().describe("Workflow ID"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const endpoint = `/contacts/${params.contactId}/workflow/${params.workflowId}`;
        const data = await ghlRequest(endpoint, "DELETE");
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );
}
