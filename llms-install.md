# Installing the DocStar MCP server

These steps are for AI agents (such as Cline) setting up this server for a user.

DocStar MCP is a remote server. There is nothing to clone, build or run locally: the client connects to `https://mcp.docstar.io/mcp` over Streamable HTTP.

## 1. Get a DocStar API token
Ask the user for their DocStar API token. It starts with `hm_` and is created in DocStar. The token alone decides which organization is accessed, and the user's existing DocStar permissions apply. Do not invent or guess a token.

## 2. Add the server to the MCP settings
Add this entry to the `mcpServers` object in the MCP settings file (for Cline: `cline_mcp_settings.json`), replacing `hm_xxx` with the user's token:

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

Keep any servers already in the file. The `type` must be `streamableHttp`; this server does not offer the legacy SSE transport.

## 3. Verify
Call the `list_collections` tool. It should return the user's DocStar collections. A `401` error means the `Authorization` header is missing or the token is wrong.

## Tools
`list_collections`, `list_pages`, `get_page`, `search_docs`, `create_page`, `update_page`, `publish_page`
