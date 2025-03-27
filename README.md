# MCP Perplexity Server

A Model Context Protocol (MCP) server that provides integration with the Perplexity API using the OpenAI SDK.

## Features

- Integrate with MCP compatible clients like Claude Desktop
- Two main tools:
  - `perplexity-query`: Send direct queries to Perplexity API
  - `perplexity-search`: Perform web searches using Perplexity's search capabilities
- Multiple transport options:
  - STDIO transport for local clients
  - SSE transport for remote clients over HTTP
- Uses OpenAI SDK with custom base URL for Perplexity API
- Detailed logging for debugging with levels: debug, info, error

## Installation

1. Clone this repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file with your Perplexity API key:

   ```bash
   cp .env.example .env
   ```

   Then edit the `.env` file to add your Perplexity API key and customize other settings as needed:

   ```bash
   nano .env
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

   This will start the server with SSE transport on the port specified in the `.env` file (default: 3002).

2. Configure any MCP-compatible client to connect to the server using the SSE endpoint:
   - SSE endpoint: `http://your-server-address:3002/sse`
   - Messages endpoint: `http://your-server-address:3002/messages`

3. For Claude Desktop, add the following to your `claude_desktop_config.json`:

   ```json
   {
     "mcp_servers": {
       "perplexity-api-remote": {
         "transport": {
           "type": "sse",
           "url": "http://localhost:3002/sse",
           "messagesUrl": "http://localhost:3002/messages"
         }
       }
     }
   }
   ```

### Using with Cursor

1. Ensure that the server is running with SSE transport as described above.

2. In Cursor, navigate to Settings > MCP.

3. Add a new MCP server configuration using the following example in your `mcp.json`:

   ```json
   {
     "mcpServers": {
       "perplexity-mcp-server": {
         "url": "http://localhost:3002/sse"
       }
     }
   }
   ```

4. Save the configuration and refresh the connection if necessary.

5. You can now use the Perplexity tools within Cursor by accessing the MCP features.

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

## Logging and Debugging

- The server provides detailed logging for debugging purposes.
- Log levels include debug, info, and error, which help in tracking the server's operations and troubleshooting issues.

## Docker Deployment

Pour un déploiement facile sur un VPS ou tout serveur disposant de Docker, vous pouvez utiliser l'image Docker publiée.

### Option 1: Déploiement ultra-simplifié (recommandé)

1. Exécutez cette commande sur votre serveur:

   ```bash
   curl -fsSL https://raw.githubusercontent.com/madebynando/mcp-perplexity-server/main/deploy.sh | bash
   ```

2. Naviguez vers le répertoire créé:

   ```bash
   cd mcp-perplexity-deployment
   ```

3. Éditez le fichier `.env` pour ajouter votre clé API Perplexity:

   ```bash
   nano .env
   ```

   Un fichier `.env.example` est également disponible comme référence pour toutes les options de configuration possibles:

   ```bash
   curl -L https://raw.githubusercontent.com/madebynando/mcp-perplexity-server/main/.env.example -o .env.example
   ```

4. Démarrez le serveur:

   ```bash
   docker-compose up -d
   ```

Le serveur sera accessible à l'adresse `http://votre-ip-serveur:3002/sse`.

### Option 2: Installation manuelle

1. Créez un fichier `docker-compose.yml` sur votre serveur avec le contenu suivant:

   ```yaml
   version: '3.8'

   services:
     mcp-perplexity-server:
       image: madebynando/mcp-perplexity-server:latest
       container_name: mcp-perplexity-server
       restart: unless-stopped
       ports:
         - "3002:3002"
       environment:
         - PERPLEXITY_API_KEY=${PERPLEXITY_API_KEY}
         - PORT=3002
       volumes:
         - perplexity_logs:/app/logs
       networks:
         - mcp-network

   networks:
     mcp-network:
       driver: bridge

   volumes:
     perplexity_logs:
   ```

2. Téléchargez le fichier `.env.example` et utilisez-le comme modèle pour créer votre fichier `.env`:

   ```bash
   curl -L https://raw.githubusercontent.com/madebynando/mcp-perplexity-server/main/.env.example -o .env.example
   cp .env.example .env
   ```

   Éditez ensuite le fichier `.env` pour ajouter votre clé API Perplexity et personnaliser les autres paramètres si nécessaire:

   ```bash
   nano .env
   ```

3. Démarrez le serveur:

   ```bash
   docker-compose up -d
   ```

### Gestion du conteneur Docker

- Pour consulter les logs:
  ```bash
  docker-compose logs -f
  ```

- Pour arrêter le serveur:
  ```bash
  docker-compose down
  ```

- Pour redémarrer le serveur:
  ```bash
  docker-compose restart
  ```

## License

MIT
