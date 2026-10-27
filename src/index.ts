import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import express from 'express'
import {createServer} from './server.js'

const app = express()
app.use(express.json({limit: '10mb'}))

app.get('/health', (_req, res) => {
  res.json({ok: true})
})

// Stateless Streamable HTTP: a fresh server per request, authenticated with the caller's own DocStar token.
app.post('/mcp', async (req, res) => {
  const auth = req.header('authorization') ?? ''
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  const orgId = req.header('x-docstar-org-id') ?? process.env.DOCSTAR_ORG_ID ?? ''

  if (!token) {
    res.status(401).json({jsonrpc: '2.0', error: {code: -32001, message: 'Missing Authorization: Bearer <DocStar token>'}, id: null})
    return
  }

  if (!orgId) {
    res.status(400).json({jsonrpc: '2.0', error: {code: -32002, message: 'Missing org id (X-Docstar-Org-Id header or DOCSTAR_ORG_ID)'}, id: null})
    return
  }

  const server = createServer({token, orgId})

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
    if (!res.headersSent) {
      res.status(500).json({jsonrpc: '2.0', error: {code: -32603, message: 'Internal server error'}, id: null})
    }
  }
})

const methodNotAllowed = (_req: express.Request, res: express.Response) => {
  res.status(405).json({jsonrpc: '2.0', error: {code: -32000, message: 'Method not allowed'}, id: null})
}
app.get('/mcp', methodNotAllowed)
app.delete('/mcp', methodNotAllowed)

const port = Number(process.env.PORT ?? 3100)
app.listen(port, () => console.log(`docstar-mcp listening on :${port}/mcp`))
