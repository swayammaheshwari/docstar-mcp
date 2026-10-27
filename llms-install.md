# Installing the DocStar MCP server

These steps are for AI agents (such as Cline) setting up this server for a user.

DocStar MCP is a remote server. There is nothing to clone, build or run locally: the client connects to `https://mcp.docstar.io/mcp` over Streamable HTTP. Authentication uses OAuth 2.0, so the user does not need an API token and must not be asked for one.

## 1. Add the server to the MCP settings
Add this entry to the `mcpServers` object in the MCP settings file (for Cline: `cline_mcp_settings.json`):

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

Keep any servers already in the file. The `type` must be `streamableHttp`; this server does not offer the legacy SSE transport. Do not add an `Authorization` header.

## 2. Sign in with OAuth
The first time the client connects, it opens a browser window for the user to sign in to DocStar and approve access. Tell the user to complete the sign-in. The user's existing DocStar permissions apply to everything the server does.

## 3. Verify
Call the `list_collections` tool. It should return the user's DocStar collections. If it fails with an authorization error, ask the user to sign in again (disconnect and reconnect the server in the client's MCP settings).

## Tools
`list_collections`, `list_pages`, `get_page`, `search_docs`, `create_page`, `update_page`, `publish_page`
