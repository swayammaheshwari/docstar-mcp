import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import express from 'express'
import {createServer, jsonRpcError, readToken, type McpConfig} from './server.js'

// Node entry (local dev / container). The Cloudflare Worker entry is src/worker.ts.
const config: McpConfig = {apiUrl: process.env.DOCSTAR_API_URL ?? 'http://localhost:2000'}

const app = express()
app.use(express.json({limit: '10mb'}))

app.get('/health', (_req, res) => {
  res.json({ok: true})
})

// Stateless Streamable HTTP: a fresh server per request, authenticated with the caller's own DocStar token.
app.post('/mcp', async (req, res) => {
  const result = readToken((name) => req.header(name))
  if ('status' in result) {
    res.status(result.status).json(result.body)
    return
  }

  const server = createServer(config, result.token)
  const transport = new StreamableHTTPServerTransport({sessionIdGenerator: undefined})
  res.on('close', () => {
    void transport.close()
    void server.close()
  })

  try {
    await server.connect(transport)
    await transport.handleRequest(req, res, req.body)
  } catch (error) {
    console.error('MCP request failed', error)
    if (!res.headersSent) res.status(500).json(jsonRpcError(-32603, 'Internal server error'))
  }
})

const methodNotAllowed = (_req: express.Request, res: express.Response) => {
  res.status(405).json(jsonRpcError(-32000, 'Method not allowed'))
}
app.get('/mcp', methodNotAllowed)
app.delete('/mcp', methodNotAllowed)

const port = Number(process.env.PORT ?? 3100)
app.listen(port, () => console.log(`docstar-mcp listening on :${port}/mcp`))
