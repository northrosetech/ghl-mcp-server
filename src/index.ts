#!/usr/bin/env node
// ╔══════════════════════════════════════════════════════════════╗
// ║  GHL MCP Server — GoHighLevel Integration for AI Agents     ║
// ║  Built by Saurabh K Shah (https://saurabhshah.com)          ║
// ║  Supports: Claude Desktop, N8N, Custom Apps                 ║
// ╚══════════════════════════════════════════════════════════════╝

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

// Tool registrations
import { registerContactsTools } from "./tools/contacts.js";
import { registerConversationsTools } from "./tools/conversations.js";
import { registerCalendarTools } from "./tools/calendars.js";
import { registerOpportunitiesTools } from "./tools/opportunities.js";
import { registerBusinessTools } from "./tools/business.js";

// ─── Initialize MCP Server ───
const server = new McpServer({
  name: "ghl-mcp-server",
  version: "1.0.0",
});

// ─── Register All Tools ───
console.error("🔧 Registering GHL tools...");
registerContactsTools(server);
registerConversationsTools(server);
registerCalendarTools(server);
registerOpportunitiesTools(server);
registerBusinessTools(server);
console.error("✅ All GHL tools registered");

// ─── Transport: stdio (for Claude Desktop, Claude Code) ───
async function runStdio(): Promise<void> {
  console.error("🚀 Starting GHL MCP Server (stdio transport)...");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ GHL MCP Server running on stdio");
}

// ─── Transport: HTTP (for N8N, web apps, remote clients) ───
async function runHTTP(): Promise<void> {
  const port = parseInt(process.env.PORT || "3001");
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  // Health check
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      server: "ghl-mcp-server",
      version: "1.0.0",
      transport: "http",
      timestamp: new Date().toISOString(),
    });
  });

  // MCP endpoint — stateless, one transport per request
  app.post("/mcp", async (req, res) => {
    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      res.on("close", () => transport.close());
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("MCP request error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // Info endpoint
  app.get("/", (_req, res) => {
    res.json({
      name: "GHL MCP Server",
      version: "1.0.0",
      description: "GoHighLevel MCP Server for Claude, N8N, and custom AI agents",
      author: "Saurabh K Shah (https://saurabhshah.com)",
      endpoints: {
        mcp: "POST /mcp",
        health: "GET /health",
      },
      documentation: "https://github.com/saurabh2000/ghl-mcp-server",
    });
  });

  app.listen(port, () => {
    console.error(`🚀 GHL MCP Server running on http://localhost:${port}/mcp`);
    console.error(`📡 Health check: http://localhost:${port}/health`);
    console.error(`📋 Info: http://localhost:${port}/`);
  });
}

// ─── Start Server ───
const transport = process.env.TRANSPORT || "stdio";

if (transport === "http") {
  runHTTP().catch((error) => {
    console.error("Server startup error:", error);
    process.exit(1);
  });
} else {
  runStdio().catch((error) => {
    console.error("Server startup error:", error);
    process.exit(1);
  });
}
