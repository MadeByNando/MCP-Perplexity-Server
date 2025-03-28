#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { OpenAI } from "openai";
import { z } from "zod";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

// Logger for debugging
const logger = {
  debug: (message: string, ...args: any[]) => {
    console.error(`[DEBUG] ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    console.error(`[INFO] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  }
};

dotenv.config();

// Get Perplexity API key from environment variables
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
if (!PERPLEXITY_API_KEY) {
  logger.error("PERPLEXITY_API_KEY is not set in .env file");
  process.exit(1);
}

// API key for MCP server authentication
const MCP_API_KEY = process.env.MCP_API_KEY || "changeme-secure-key-123";

// Get port from environment or use default
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3002;

// Initialize Perplexity client using OpenAI SDK with custom baseURL
const perplexity = new OpenAI({
  apiKey: PERPLEXITY_API_KEY,
  baseURL: "https://api.perplexity.ai",
});

// Create MCP server instance
const server = new McpServer({
  name: "perplexity-api",
  version: "1.0.0",
  protocolVersion: "2024-11-05",
  capabilities: {
    resources: {},
    tools: {},
  },
  onMessage: (message: Record<string, any>) => {
    logger.debug(`Server received message: ${JSON.stringify(message)}`);
    if (message.method === "initialize") {
      logger.info(`Client initializing with protocol version: ${message.params?.protocolVersion}`);
      logger.debug(`Client capabilities: ${JSON.stringify(message.params?.capabilities)}`);
    }
    return;
  },
  onError: (error: Error) => {
    logger.error(`Server error: ${error.message}`);
  }
});

logger.info("MCP Server initialized with name: perplexity-api, version: 1.0.0");

// Helper function to handle error responses
function handleError(error: unknown) {
  logger.error("Error in tool execution:", error);
  const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
  
  return {
    content: [
      {
        type: "text" as const,
        text: `Error: ${errorMessage}`,
      },
    ],
  };
}

// Register perplexity-query tool
server.tool(
  "perplexity-query",
  "Send a query to Perplexity API and get a response",
  {
    prompt: z.string().describe("The query to send to Perplexity"),
    model: z.enum(["sonar-pro", "sonar-reasoning-pro"]).default("sonar-pro").describe("The model to use"),
    systemPrompt: z.string().optional().describe("Optional system prompt to set context"),
  },
  async ({ prompt, model, systemPrompt }) => {
    logger.info(`Executing perplexity-query tool with prompt: "${prompt.substring(0, 50)}..."`);
    try {
      const messages = [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user" as const, content: prompt },
      ];

      const response = await perplexity.chat.completions.create({
        model: model,
        messages: messages,
      });

      const result = response.choices[0].message.content;
      logger.info("Perplexity API response received successfully");
      
      return {
        content: [
          {
            type: "text" as const,
            text: result || "No response received from Perplexity API",
          },
        ],
      };
    } catch (error) {
      return handleError(error);
    }
  }
);

// Register perplexity-search tool that specifically uses web search capability
server.tool(
  "perplexity-search",
  "Perform a web search using Perplexity API",
  {
    query: z.string().describe("The search query"),
    model: z.enum(["sonar-pro", "sonar-reasoning-pro"]).default("sonar-pro").describe("The model to use"),
  },
  async ({ query, model }) => {
    logger.info(`Executing perplexity-search tool with query: "${query.substring(0, 50)}..."`);
    try {
      const systemPrompt = "You are a helpful web search assistant. Search the web for current information and provide concise answers with citations.";
      
      const response = await perplexity.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
      });

      const result = response.choices[0].message.content;
      logger.info("Perplexity API search results received successfully");
      
      return {
        content: [
          {
            type: "text" as const,
            text: result || "No search results received from Perplexity API",
          },
        ],
      };
    } catch (error) {
      return handleError(error);
    }
  }
);

// Start the server with appropriate transport based on arguments
async function main() {
  const args = process.argv.slice(2);
  const useSSE = args.includes("--sse") || args.includes("-s");

  logger.info(`Starting server with ${useSSE ? "SSE" : "STDIO"} transport`);

  try {
    if (useSSE) {
      // Setup Express server for SSE transport
      const app = express();
      
      // Apply middleware
      app.use(cors());
      app.use(express.json());
      
      // Authentication middleware
      const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const apiKey = req.headers['x-api-key'] || req.query.api_key;
        
        if (!apiKey || apiKey !== MCP_API_KEY) {
          logger.error(`Authentication failed: Invalid API key provided: ${apiKey}`);
          res.status(401).json({ error: "Unauthorized: Invalid API key" });
          return;
        }
        
        next();
      };
      
      // Apply rate limiting
      const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: 100, // Limit each IP to 100 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
      });
      app.use(limiter);
      
      logger.info("Express middleware configured (cors, json, rate-limiting)");
      
      // Track multiple SSE connections instead of a single one
      const transports = new Map<string, SSEServerTransport>();
      let connectionCount = 0;
      
      // Log all requests for debugging
      app.use((req, res, next) => {
        logger.debug(`Received ${req.method} request to ${req.path}`);
        next();
      });
      
      // SSE endpoint
      app.get("/sse", authenticate, (req, res) => {
        connectionCount++;
        const connectionId = connectionCount.toString();
        
        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        logger.info(`New SSE connection established (ID: ${connectionId})`);
        logger.debug(`SSE connection headers:`, req.headers);
        
        const transport = new SSEServerTransport("/messages", res);
        transports.set(connectionId, transport);
        
        // Add error handler to transport
        const originalOnError = transport.onerror;
        transport.onerror = (error) => {
          logger.error(`SSE transport error (connection ${connectionId}):`, error);
          if (originalOnError) originalOnError(error);
        };
        
        // Add close handler to transport
        const originalOnClose = transport.onclose;
        transport.onclose = () => {
          logger.info(`SSE connection closed (ID: ${connectionId})`);
          transports.delete(connectionId);
          if (originalOnClose) originalOnClose();
        };
        
        // Store client IP for later matching with POST requests
        // @ts-ignore - Adding custom property to response object
        res.sseConnectionId = connectionId;
        
        server.connect(transport).then(() => {
          logger.info(`MCP Server connected to SSE transport (connection ${connectionId})`);
        }).catch((error) => {
          logger.error(`Failed to connect MCP Server to SSE transport (connection ${connectionId}):`, error);
          transports.delete(connectionId);
        });
        
        // Handle client disconnection
        req.on('close', () => {
          logger.info(`Client disconnected from SSE endpoint (connection ${connectionId})`);
          transports.delete(connectionId);
        });
      });
      
      // Messages endpoint
      app.post("/messages", (req, res) => {
        logger.debug(`Received message: ${JSON.stringify(req.body)}`);
        
        // Find the appropriate transport for this client
        // In a production environment, you'd use cookies or headers to match clients
        // For this example, we'll handle only one client at a time using the latest transport
        const connectionIds = Array.from(transports.keys());
        
        if (connectionIds.length > 0) {
          // Use the latest connection - a better approach would be to match by IP or session
          const connectionId = connectionIds[connectionIds.length - 1];
          const transport = transports.get(connectionId);
          
          if (transport) {
            logger.info(`Handling client message via SSE transport (connection ${connectionId})`);
            
            // Important fix: Passing the req.body explicitly to handlePostMessage
            // This addresses a known issue in the MCP SDK
            transport.handlePostMessage(req, res, req.body);
            return;
          }
        }
        
        logger.error(`Received message but no active SSE connection found`);
        res.status(400).json({ error: "No active SSE connection found" });
      });
      
      // Add health check endpoint
      app.get("/health", (req, res) => {
        logger.debug("Health check requested");
        res.status(200).json({ 
          status: "ok",
          activeConnections: transports.size
        });
      });
      
      // Start Express server
      app.listen(PORT, () => {
        logger.info(`Perplexity MCP Server running with SSE transport on port ${PORT}`);
        logger.info(`Connect to SSE endpoint at http://localhost:${PORT}/sse`);
        logger.info(`Messages endpoint at http://localhost:${PORT}/messages`);
      });
    } else {
      // Use traditional STDIO transport
      const transport = new StdioServerTransport();
      
      // Add error handler to transport
      const originalOnError = transport.onerror;
      transport.onerror = (error) => {
        logger.error(`STDIO transport error:`, error);
        if (originalOnError) originalOnError(error);
      };
      
      // Add close handler to transport
      const originalOnClose = transport.onclose;
      transport.onclose = () => {
        logger.info(`STDIO connection closed`);
        if (originalOnClose) originalOnClose();
      };
      
      await server.connect(transport);
      logger.info("Perplexity MCP Server running on stdio");
    }
  } catch (error) {
    logger.error("Failed to start MCP server:", error);
    process.exit(1);
  }
}

main(); 