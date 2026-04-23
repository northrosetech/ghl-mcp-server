// Opportunities & Pipelines Tools
// ================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ENDPOINTS } from "../constants.js";
import { ghlRequest, formatToolResponse, formatErrorResponse, getLocationId } from "../services/api-client.js";

export function registerOpportunitiesTools(server: McpServer): void {
  // ─── SEARCH OPPORTUNITIES ───
  server.registerTool(
    "ghl_search_opportunities",
    {
      title: "Search GHL Opportunities",
      description: "Search opportunities (deals) by pipeline, stage, status, contact, or monetary value.",
      inputSchema: {
        locationId: z.string().optional(),
        pipelineId: z.string().optional().describe("Filter by pipeline ID"),
        pipelineStageId: z.string().optional().describe("Filter by stage ID"),
        contactId: z.string().optional().describe("Filter by contact ID"),
        status: z.enum(["open", "won", "lost", "abandoned", "all"]).optional(),
        query: z.string().optional().describe("Search term"),
        limit: z.number().int().min(1).max(100).optional().default(20),
        startAfter: z.string().optional().describe("Pagination cursor"),
        startAfterId: z.string().optional(),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const queryParams: Record<string, string | number> = {
          location_id: getLocationId(params.locationId),
          limit: params.limit || 20,
        };
        if (params.pipelineId) queryParams.pipeline_id = params.pipelineId;
        if (params.pipelineStageId) queryParams.pipeline_stage_id = params.pipelineStageId;
        if (params.contactId) queryParams.contact_id = params.contactId;
        if (params.status && params.status !== "all") queryParams.status = params.status;
        if (params.query) queryParams.q = params.query;
        if (params.startAfter) queryParams.startAfter = params.startAfter;
        if (params.startAfterId) queryParams.startAfterId = params.startAfterId;

        const data = await ghlRequest(ENDPOINTS.opportunities.search, "GET", undefined, queryParams);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── GET OPPORTUNITY ───
  server.registerTool(
    "ghl_get_opportunity",
    {
      title: "Get GHL Opportunity",
      description: "Get details of a specific opportunity/deal.",
      inputSchema: {
        opportunityId: z.string().describe("Opportunity ID"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.opportunities.get(params.opportunityId));
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── CREATE OPPORTUNITY ───
  server.registerTool(
    "ghl_create_opportunity",
    {
      title: "Create GHL Opportunity",
      description: "Create a new opportunity/deal in a pipeline.",
      inputSchema: {
        locationId: z.string().optional(),
        pipelineId: z.string().describe("Pipeline ID to create opportunity in"),
        pipelineStageId: z.string().describe("Stage ID within the pipeline"),
        contactId: z.string().describe("Contact ID to associate"),
        name: z.string().describe("Opportunity/deal name"),
        status: z.enum(["open", "won", "lost", "abandoned"]).optional().default("open"),
        monetaryValue: z.number().optional().describe("Deal value in currency"),
        source: z.string().optional().describe("Lead source"),
        assignedTo: z.string().optional().describe("Assigned user ID"),
        customFields: z.array(z.object({
          id: z.string(),
          field_value: z.union([z.string(), z.number(), z.boolean()]),
        })).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          locationId: getLocationId(params.locationId),
          pipelineId: params.pipelineId,
          pipelineStageId: params.pipelineStageId,
          contactId: params.contactId,
          name: params.name,
          status: params.status || "open",
        };
        if (params.monetaryValue !== undefined) body.monetaryValue = params.monetaryValue;
        if (params.source) body.source = params.source;
        if (params.assignedTo) body.assignedTo = params.assignedTo;
        if (params.customFields) body.customFields = params.customFields;

        const data = await ghlRequest(ENDPOINTS.opportunities.create, "POST", body);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── UPDATE OPPORTUNITY ───
  server.registerTool(
    "ghl_update_opportunity",
    {
      title: "Update GHL Opportunity",
      description: "Update an existing opportunity — move stages, change value, update status, etc.",
      inputSchema: {
        opportunityId: z.string().describe("Opportunity ID"),
        pipelineId: z.string().optional(),
        pipelineStageId: z.string().optional().describe("Move to a different stage"),
        name: z.string().optional(),
        status: z.enum(["open", "won", "lost", "abandoned"]).optional(),
        monetaryValue: z.number().optional(),
        source: z.string().optional(),
        assignedTo: z.string().optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const { opportunityId, ...updateData } = params;
        const data = await ghlRequest(ENDPOINTS.opportunities.update(opportunityId), "PUT", updateData as Record<string, unknown>);
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── DELETE OPPORTUNITY ───
  server.registerTool(
    "ghl_delete_opportunity",
    {
      title: "Delete GHL Opportunity",
      description: "Permanently delete an opportunity.",
      inputSchema: {
        opportunityId: z.string().describe("Opportunity ID to delete"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.opportunities.delete(params.opportunityId), "DELETE");
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── UPDATE OPPORTUNITY STATUS ───
  server.registerTool(
    "ghl_update_opportunity_status",
    {
      title: "Update Opportunity Status",
      description: "Change the status of an opportunity (open, won, lost, abandoned).",
      inputSchema: {
        opportunityId: z.string().describe("Opportunity ID"),
        status: z.enum(["open", "won", "lost", "abandoned"]).describe("New status"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.opportunities.updateStatus(params.opportunityId), "PUT", { status: params.status });
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ─── LIST PIPELINES ───
  server.registerTool(
    "ghl_list_pipelines",
    {
      title: "List GHL Pipelines",
      description: "Get all pipelines and their stages for a location.",
      inputSchema: {
        locationId: z.string().optional(),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await ghlRequest(ENDPOINTS.opportunities.listPipelines, "GET", undefined, {
          locationId: getLocationId(params.locationId),
        });
        return { content: [{ type: "text", text: formatToolResponse(data) }] };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );
}
