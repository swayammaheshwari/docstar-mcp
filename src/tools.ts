import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {z} from 'zod'
import type {DocstarClient} from './client.js'

// Page state enum from hitman-api (utils/Enums/page.ts)
const PAGE_STATE = {DRAFT: 1, APPROVED: 2} as const

interface PageSummary {
  id: string
  name: string
  type: number
  parentId?: string
  state?: number
  isPublished?: boolean
  updatedAt?: string
}

const ok = (data: unknown) => ({content: [{type: 'text' as const, text: JSON.stringify(data, null, 2)}]})
const fail = (error: unknown) => ({
  content: [{type: 'text' as const, text: (error as Error).message}],
  isError: true,
})

const safe =
  <A>(fn: (args: A) => Promise<unknown>) =>
  async (args: A) => {
    try {
      return ok(await fn(args))
    } catch (error) {
      return fail(error)
    }
  }

export function registerTools(server: McpServer, api: DocstarClient): void {
  const org = `/orgs/${api.orgId}`

  server.tool(
    'list_collections',
    'List the documentation collections the current user can access in their DocStar organization.',
    {},
    safe(async () => {
      const collections = await api.request<Array<Record<string, unknown>>>('GET', `${org}/collections`)
      return collections.map((c) => ({id: c.id, name: c.name, permission: c.permission, isPublic: c.isPublic}))
    }),
  )

  server.tool(
    'list_pages',
    'List all pages in a collection as a flat list (use parentId to rebuild the tree). type 0 is the invisible root page.',
    {collectionId: z.string().describe('Collection id from list_collections')},
    safe(async ({collectionId}) => {
      const {pages} = await api.request<{pages: PageSummary[]}>('GET', `${org}/collection/${collectionId}/pages`)
      return pages.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        parentId: p.parentId,
        state: p.state,
        isPublished: p.isPublished,
        updatedAt: p.updatedAt,
      }))
    }),
  )

  server.tool(
    'get_page',
    'Get a page with its content.',
    {pageId: z.string()},
    safe(async ({pageId}) => {
      const {page} = await api.request<{page: Record<string, unknown>}>('GET', `${org}/pages/${pageId}`)
      const content = await api.request<{contents: unknown}>('GET', `${org}/pages/${pageId}/content`)
      return {...page, contents: content.contents}
    }),
  )

  server.tool(
    'search_docs',
    'Semantic search over the documentation in one collection.',
    {
      collectionId: z.string(),
      query: z.string().describe('Search text'),
    },
    safe(({collectionId, query}) =>
      api.request('POST', `/internal/search/${collectionId}`, {searchTerm: query}),
    ),
  )

  server.tool(
    'create_page',
    'Create a new page (as a draft) in a collection. Put it under parentPageId, or at the top level of the collection if omitted.',
    {
      collectionId: z.string(),
      name: z.string().min(1),
      contents: z.string().optional().describe('Page content'),
      parentPageId: z.string().optional().describe('Parent page id; defaults to the collection root'),
    },
    safe(async ({collectionId, name, contents, parentPageId}) => {
      let parent = parentPageId
      if (!parent) {
        const {pages} = await api.request<{pages: PageSummary[]}>('GET', `${org}/collection/${collectionId}/pages`)
        parent = pages.find((p) => p.type === 0)?.id
        if (!parent) throw new Error('Could not find the collection root page; pass parentPageId.')
      }

      return api.request('POST', `${org}/pages/${parent}`, {name, contents, state: PAGE_STATE.DRAFT})
    }),
  )

  server.tool(
    'update_page',
    'Update a page name and/or content. The page goes back to draft until published again.',
    {
      pageId: z.string(),
      name: z.string().min(1).optional(),
      contents: z.string().optional(),
    },
    safe(({pageId, name, contents}) => {
      if (name === undefined && contents === undefined) throw new Error('Provide name and/or contents.')
      return api.request('PUT', `${org}/pages/${pageId}`, {name, contents})
    }),
  )

  server.tool(
    'publish_page',
    'Publish a page so it is live on the public docs. Its parent page must already be published.',
    {pageId: z.string()},
    safe(({pageId}) => api.request('PATCH', `${org}/pages/${pageId}/state`, {state: PAGE_STATE.APPROVED})),
  )
}
