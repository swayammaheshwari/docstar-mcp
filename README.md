# docstar-mcp

Remote MCP server (Streamable HTTP) that lets AI clients work with a DocStar workspace. It runs as a Cloudflare Worker and is a thin layer over the DocStar API (hitman-api); it never touches the database. Users sign in with OAuth 2.0, so no API token is needed, and the user's existing DocStar permissions apply to everything the server does.

## Tools
| Tool | What it does |
|---|---|
| `list_collections` | Collections the signed-in user can access |
| `list_pages` | Flat page list of a collection (use `parentId` for the tree) |
| `get_page` | A page with its content as Markdown |
| `search_docs` | Semantic search in a collection |
| `create_page` | New draft page from Markdown |
| `update_page` | Change name and/or content (Markdown); page goes back to draft |
| `publish_page` | Publish a page (its parent must already be published) |

## Authentication
The server uses OAuth 2.0. The first time a client connects, it opens a browser window where you sign in to DocStar and approve access. There are no API keys to create or paste, and no credentials are stored in this repository.

## Connect from Claude Code
```bash
claude mcp add --transport http docstar-workspace https://mcp.docstar.io/mcp
```
Then run `/mcp` inside Claude Code and choose **docstar-workspace** to complete the browser sign-in.

## Connect from Cline
Open **MCP Servers → Configure MCP Servers** and add this to `cline_mcp_settings.json`:
```json
{
  "mcpServers": {
    "docstar": {
      "type": "streamableHttp",
      "url": "https://mcp.docstar.io/mcp",
      "disabled": false,
      "autoApprove": []
    }
  }
}
```
`type` must be `streamableHttp` (the server has no SSE endpoint). Cline opens the DocStar sign-in in your browser on first connect. Agent-driven install steps are in [llms-install.md](llms-install.md).

## Security
- Sign-in uses OAuth 2.0; the server never sees your DocStar password.
- The server is a thin proxy over the DocStar API and never touches the database.
- Your DocStar permissions decide what each tool can read or change.
- Nothing is stored in this repository; no secrets are required to use the hosted server.

## Run locally
```bash
npm install
DOCSTAR_API_URL=http://localhost:2000 npm run dev   # http://localhost:3100/mcp
```
The local server also needs the organization: send an `X-Docstar-Org-Id` header or set `DOCSTAR_ORG_ID`.

## MCP Registry
The server is listed in the official MCP Registry as `io.github.swayammaheshwari/docstar-mcp`; [server.json](server.json) is the listing. The logo shown there comes from `icons` in `server.json` (an HTTPS URL; the server also reports it in its MCP `serverInfo`). To publish a change, bump `version` in `server.json`, then:
```bash
mcp-publisher login github  
mcp-publisher publish
```

## Roadmap
1. OAuth scopes (finer-grained, read-only vs write access)
2. `create_collection`, resources (`docstar://page/{id}`), prompts, higher-level workflow tools

## License
MIT - see [LICENSE](LICENSE).
