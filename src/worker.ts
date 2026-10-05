import {WebStandardStreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import {createServer, jsonRpcError, readToken, type McpConfig} from './server.js'

// Cloudflare Worker entry. Deploy with `npm run deploy` (see DEPLOY.md).
interface Env {
  DOCSTAR_API_URL: string
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {status, headers: {'content-type': 'application/json'}})

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const {pathname} = new URL(request.url)

    if (pathname === '/health') return json({ok: true})
    if (pathname !== '/mcp') return json({error: 'Not found'}, 404)
    if (request.method !== 'POST') return json(jsonRpcError(-32000, 'Method not allowed'), 405)

    const config: McpConfig = {apiUrl: env.DOCSTAR_API_URL}
    const result = readToken((name) => request.headers.get(name))
    if ('status' in result) return json(result.body, result.status)

    const server = createServer(config, result.token)
    const transport = new WebStandardStreamableHTTPServerTransport({sessionIdGenerator: undefined, enableJsonResponse: true})
    await server.connect(transport)
    return transport.handleRequest(request)
  },
}
