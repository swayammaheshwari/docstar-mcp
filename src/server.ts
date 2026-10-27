import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {DocstarClient, type DocstarContext} from './client.js'
import {registerTools} from './tools.js'

// Same logo as the MCP Registry listing (server.json `icons`)
export const DOCSTAR_ICON = 'https://stuff.thingsofbrand.com/docstar.io/images/imgd_docstar.png'

export function createServer(ctx: DocstarContext): McpServer {
  const server = new McpServer({
    name: 'docstar-mcp',
    title: 'Docstar',
    version: '0.1.0',
    websiteUrl: 'https://docstar.io',
    icons: [{src: DOCSTAR_ICON, mimeType: 'image/png'}],
  })
  registerTools(server, new DocstarClient(ctx))
  return server
}
