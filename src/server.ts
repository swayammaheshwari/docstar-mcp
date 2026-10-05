import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {DocstarClient} from './client.js'
import {registerTools} from './tools.js'

export interface McpConfig {
  apiUrl: string
}

// hitman-api resolves the organization from the hm_ token and ignores the :orgId URL segment for API tokens,
// so the token alone decides which org is accessed. A fixed placeholder fills the URL segment.
export const ORG_PLACEHOLDER = 'current'

export const jsonRpcError = (code: number, message: string) => ({jsonrpc: '2.0', error: {code, message}, id: null})

/** Reads the caller's DocStar API token from the Authorization header; returns an error payload when missing. */
export function readToken(
  header: (name: string) => string | null | undefined,
): {token: string} | {status: number; body: unknown} {
  const token = (header('authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return {status: 401, body: jsonRpcError(-32001, 'Missing Authorization: Bearer <DocStar token>')}
  return {token}
}

export function createServer(config: McpConfig, token: string): McpServer {
  const server = new McpServer({name: 'docstar-mcp', version: '0.1.0'})
  registerTools(server, new DocstarClient({apiUrl: config.apiUrl, token, orgId: ORG_PLACEHOLDER}))
  return server
}
