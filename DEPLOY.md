# Deploying docstar-mcp to Cloudflare

Production runs as the Cloudflare Worker `docstar-mcp`, served at `https://mcp.docstar.io/mcp` and calling `https://api.docstar.io`. Config is in [wrangler.jsonc](wrangler.jsonc) (`env.production`).

## One-time setup
1. Log in to Cloudflare with the account that owns the `docstar.io` zone:
   ```bash
   npx wrangler login
   npx wrangler whoami      # confirm the right account
   ```
2. Install dependencies and check the build:
   ```bash
   npm install
   npm run typecheck
   ```

## Deploy
```bash
npm run deploy             # = wrangler deploy --env production
```
The `routes` entry in `wrangler.jsonc` (`mcp.docstar.io`, `custom_domain: true`) makes Wrangler create the DNS record and certificate for `mcp.docstar.io` in the `docstar.io` zone. Do not create that DNS record by hand first; an existing record for `mcp` blocks the custom domain. If `mcp.docstar.io` already has a DNS record, delete it, then deploy.

## Verify
```bash
curl https://mcp.docstar.io/health                       # {"ok":true}
curl -s -X POST https://mcp.docstar.io/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'    # 401: token missing (expected)
curl -s -X POST https://mcp.docstar.io/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -H 'authorization: Bearer hm_xxx' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_collections","arguments":{}}}'
```
Then add it to Claude Code (see README) and ask it to list your collections.

## Logs and rollback
```bash
npx wrangler tail --env production          # live logs
npx wrangler deployments list --env production
npx wrangler rollback --env production      # back to the previous version
```

## Changing the API URL
Edit `env.production.vars.DOCSTAR_API_URL` in `wrangler.jsonc` and redeploy. There are no secrets: users send their own `hm_` token on each request, and the Worker stores nothing.

## Adding a dev environment later
Add an `env.dev` block to `wrangler.jsonc` with `name: "docstar-mcp-dev"`, `vars.DOCSTAR_API_URL: "https://dev-api.docstar.io"` and a `mcp-dev.docstar.io` route, then run `npx wrangler deploy --env dev`.
