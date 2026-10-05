# docstar-mcp

Remote MCP server (Streamable HTTP) that lets AI clients work with a DocStar workspace. It is a thin layer over the DocStar API (hitman-api) and never touches the database; the caller's DocStar API token (`hm_...`) is forwarded so existing permissions apply.

## Tools
`list_collections`, `list_pages`, `get_page`, `search_docs`, `create_page`, `update_page`, `publish_page`

## Run
```bash
cp .env.example .env   # set DOCSTAR_API_URL
npm install
npm run dev
```

## Connect from Claude Code
```bash
claude mcp add --transport http docstar http://localhost:3100/mcp \
  --header "Authorization: Bearer hm_xxx" \
  --header "X-Docstar-Org-Id: <orgId>"
```

## Roadmap
1. OAuth 2.1 + scopes (needs authorize/token endpoints in hitman-api and a consent screen in hitman-ui)
2. `create_collection`, resources (`docstar://page/{id}`), prompts, higher-level workflow tools
