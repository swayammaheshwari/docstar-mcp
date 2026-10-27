# docstar-mcp

Remote MCP server (Streamable HTTP) that lets AI clients work with a DocStar workspace. It runs as a Cloudflare Worker and is a thin layer over the DocStar API (hitman-api); it never touches the database. The caller's DocStar API token (`hm_...`) is forwarded on every request, so existing permissions apply and the token alone decides which organization is accessed.

## Tools
| Tool | What it does |
|---|---|
| `list_collections` | Collections the token can access |
| `list_pages` | Flat page list of a collection (use `parentId` for the tree) |
| `get_page` | A page with its content as Markdown |
| `search_docs` | Semantic search in a collection |
| `create_page` | New draft page from Markdown |
| `update_page` | Change name and/or content (Markdown); page goes back to draft |
| `publish_page` | Publish a page (its parent must already be published) |

## Run locally
```bash
npm install
DOCSTAR_API_URL=http://localhost:2000 npm run dev   # http://localhost:3100/mcp
```
The local server also needs the organization: send an `X-Docstar-Org-Id` header or set `DOCSTAR_ORG_ID`.

## Connect from Claude Code
Create an API token in DocStar, then:
```bash
claude mcp add --transport http docstar-workspace https://mcp.docstar.io/mcp \
  --header "Authorization: Bearer hm_xxx"
```
For local testing use `http://localhost:3100/mcp` instead.

## Connect from Cline
Install it from the Cline MCP Marketplace, or open **MCP Servers → Configure MCP Servers** and add this to `cline_mcp_settings.json`:
```json
{
  "mcpServers": {
    "docstar": {
      "type": "streamableHttp",
      "url": "https://mcp.docstar.io/mcp",
      "headers": {
        "Authorization": "Bearer hm_xxx"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```
`type` must be `streamableHttp` (the server has no SSE endpoint). Agent-driven install steps are in [llms-install.md](llms-install.md).

## MCP Registry
The server is listed in the official MCP Registry as `io.github.swayammaheshwari/docstar-mcp`; [server.json](server.json) is the listing. The logo shown there comes from `icons` in `server.json` (an HTTPS URL; the server also reports it in its MCP `serverInfo`). To publish a change, bump `version` in `server.json`, then:
```bash
mcp-publisher login github     # as swayammaheshwari, who owns the io.github.swayammaheshwari namespace
mcp-publisher publish
```

## Roadmap
1. OAuth 2.1 + scopes (needs authorize/token endpoints in hitman-api and a consent screen in hitman-ui)
2. `create_collection`, resources (`docstar://page/{id}`), prompts, higher-level workflow tools