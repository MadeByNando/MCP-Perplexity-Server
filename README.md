# MCP Perplexity Server

A Model Context Protocol (MCP) server that provides integration with the Perplexity API.

## Features

- Integrate with MCP compatible clients like Claude Desktop
- Two main tools:
  - `perplexity-query`: Send direct queries to Perplexity API
  - `perplexity-search`: Perform web searches using Perplexity's search capabilities
- Multiple transport options:
  - STDIO transport for local clients
  - SSE transport for remote clients over HTTP

## Installation

1. Clone this repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file with your Perplexity API key:

   ```bash
   PERPLEXITY_API_KEY=your_api_key_here
   PORT=3000 # Optional: specify the port for SSE transport (default: 3000)
   ```

4. Build the project:

   ```bash
   npm run build
   ```

## Usage

### Using STDIO Transport (Local)

1. Configure Claude Desktop to use this MCP server by adding the following to your `claude_desktop_config.json`:

   ```json
   {
     "mcp_servers": {
       "perplexity-api": {
         "transport": {
           "type": "stdio",
           "command": "node",
           "args": ["/absolute/path/to/mcp-perplexity-server/build/index.js"]
         }
       }
     }
   }
   ```

2. Restart Claude Desktop

3. You can now use the Perplexity tools by typing `/tool`

### Using SSE Transport (Remote)

1. Start the server with SSE transport:

   ```bash
   npm run start:sse
   ```

   This will start the server with SSE transport on the port specified in the `.env` file (default: 3000).

2. Configure any MCP-compatible client to connect to the server using the SSE endpoint:
   - SSE endpoint: `http://your-server-address:3000/sse`
   - Messages endpoint: `http://your-server-address:3000/messages`

3. For Claude Desktop, add the following to your `claude_desktop_config.json`:

   ```json
   {
     "mcp_servers": {
       "perplexity-api-remote": {
         "transport": {
           "type": "sse",
           "url": "http://localhost:3000/sse",
           "messagesUrl": "http://localhost:3000/messages"
         }
       }
     }
   }
   ```

## Available Tools

### perplexity-query

Sends a direct query to the Perplexity API.

Parameters:

- `prompt` (required): The query to send to Perplexity
- `model` (optional): The model to use, either "sonar-pro" or "sonar-reasoning-pro" (default: "sonar-pro")
- `systemPrompt` (optional): A system prompt to set context for the query

### perplexity-search

Performs a web search using Perplexity's search capabilities.

Parameters:

- `query` (required): The search query
- `model` (optional): The model to use, either "sonar-pro" or "sonar-reasoning-pro" (default: "sonar-pro")

## License

MIT
