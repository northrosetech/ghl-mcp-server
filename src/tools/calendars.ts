// Calendar & Appointments Tools
// ==============================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ENDPOINTS } from "../constants.js";
import { ghlRequest, formatToolResponse, formatErrorResponse, getLocationId } from "../services/api-client.js";

export function registerCalendarTools(server: McpServer): void {
  // ─── LIST CALENDARS ───
  server.registerTool(
    "ghl_list_calendars",
    {
      title: "List GHL Calendars",
      description: "Get all calendars for the location.",
      inputSchema: {
        locationId: z.string().optional(),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.calendars.list, "GET", undefined, {
          locationId: getLocationId(params.locationId),
        });
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── GET CALENDAR ───
  server.registerTool(
    "ghl_get_calendar",
    {
      title: "Get GHL Calendar",
      description: "Get details of a specific calendar.",
      inputSchema: {
        calendarId: z.string().describe("Calendar ID"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.calendars.get(params.calendarId));
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── GET FREE SLOTS ───
  server.registerTool(
    "ghl_get_free_slots",
    {
      title: "Get Calendar Free Slots",
      description: "Get available booking slots for a calendar within a date range.",
      inputSchema: {
        calendarId: z.string().describe("Calendar ID"),
        startDate: z.string().describe("Start date (YYYY-MM-DD or ISO 8601)"),
        endDate: z.string().describe("End date (YYYY-MM-DD or ISO 8601)"),
        timezone: z.string().optional().describe("Timezone (e.g., 'Asia/Kolkata', 'America/New_York')"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const queryParams: Record<string, string> = {
          startDate: params.startDate,
          endDate: params.endDate,
        };
        if (params.timezone) queryParams.timezone = params.timezone;
        const data = await ghlRequest(ENDPOINTS.calendars.getFreeSlots(params.calendarId), "GET", undefined, queryParams);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── GET EVENTS / APPOINTMENTS ───
  server.registerTool(
    "ghl_get_events",
    {
      title: "Get Calendar Events",
      description: "Get appointments/events for a location, optionally filtered by calendar, contact, or date range.",
      inputSchema: {
        locationId: z.string().optional(),
        calendarId: z.string().optional().describe("Filter by calendar ID"),
        contactId: z.string().optional().describe("Filter by contact ID"),
        startTime: z.string().optional().describe("Start of date range (ISO 8601)"),
        endTime: z.string().optional().describe("End of date range (ISO 8601)"),
        userId: z.string().optional().describe("Filter by assigned user"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const queryParams: Record<string, string> = {
          locationId: getLocationId(params.locationId),
        };
        if (params.calendarId) queryParams.calendarId = params.calendarId;
        if (params.contactId) queryParams.contactId = params.contactId;
        if (params.startTime) queryParams.startTime = params.startTime;
        if (params.endTime) queryParams.endTime = params.endTime;
        if (params.userId) queryParams.userId = params.userId;

        const data = await ghlRequest(ENDPOINTS.calendars.getEvents, "GET", undefined, queryParams);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── CREATE EVENT / APPOINTMENT ───
  server.registerTool(
    "ghl_create_event",
    {
      title: "Create Calendar Event",
      description: "Create a new appointment/event on a GHL calendar.",
      inputSchema: {
        calendarId: z.string().describe("Calendar ID"),
        locationId: z.string().optional(),
        contactId: z.string().describe("Contact to book for"),
        startTime: z.string().describe("Event start (ISO 8601)"),
        endTime: z.string().describe("Event end (ISO 8601)"),
        title: z.string().optional().describe("Event title"),
        status: z.enum(["confirmed", "cancelled", "showed", "noshow", "invalid"]).optional().default("confirmed"),
        appointmentStatus: z.string().optional(),
        assignedUserId: z.string().optional().describe("Assigned team member"),
        notes: z.string().optional().describe("Internal notes"),
        address: z.string().optional().describe("Meeting address"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          calendarId: params.calendarId,
          locationId: getLocationId(params.locationId),
          contactId: params.contactId,
          startTime: params.startTime,
          endTime: params.endTime,
        };
        const optionalFields = ["title", "status", "appointmentStatus", "assignedUserId", "notes", "address"] as const;
        for (const field of optionalFields) {
          if (params[field] !== undefined) body[field] = params[field];
        }
        const data = await ghlRequest(ENDPOINTS.calendars.createEvent, "POST", body);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── UPDATE EVENT ───
  server.registerTool(
    "ghl_update_event",
    {
      title: "Update Calendar Event",
      description: "Update an existing appointment/event.",
      inputSchema: {
        eventId: z.string().describe("Event/Appointment ID"),
        calendarId: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        title: z.string().optional(),
        status: z.enum(["confirmed", "cancelled", "showed", "noshow", "invalid"]).optional(),
        assignedUserId: z.string().optional(),
        notes: z.string().optional(),
        address: z.string().optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const { eventId, ...updateData } = params;
        const data = await ghlRequest(ENDPOINTS.calendars.updateEvent(eventId), "PUT", updateData as Record<string, unknown>);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── DELETE EVENT ───
  server.registerTool(
    "ghl_delete_event",
    {
      title: "Delete Calendar Event",
      description: "Delete/cancel an appointment.",
      inputSchema: {
        eventId: z.string().describe("Event ID to delete"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.calendars.deleteEvent(params.eventId), "DELETE");
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── CREATE CALENDAR ───
  server.registerTool(
    "ghl_create_calendar",
    {
      title: "Create GHL Calendar",
      description: "Create a new calendar in GoHighLevel.",
      inputSchema: {
        locationId: z.string().optional(),
        name: z.string().describe("Calendar name"),
        description: z.string().optional(),
        slug: z.string().optional().describe("URL slug for booking page"),
        calendarType: z.enum(["round_robin", "event", "class_booking", "collective", "service_booking"]).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          locationId: getLocationId(params.locationId),
          name: params.name,
        };
        if (params.description) body.description = params.description;
        if (params.slug) body.slug = params.slug;
        if (params.calendarType) body.calendarType = params.calendarType;
        const data = await ghlRequest(ENDPOINTS.calendars.create, "POST", body);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );
}
