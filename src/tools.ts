import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {marked} from 'marked'
import {NodeHtmlMarkdown} from 'node-html-markdown'
import {z} from 'zod'
import {DocstarApiError, type DocstarClient} from './client.js'

const htmlToMarkdown = (html: string): string => NodeHtmlMarkdown.translate(html)
const toHtml = (markdown: string): string => marked.parse(markdown, {async: false}) as string

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
    'Get a page with its content as Markdown.',
    {pageId: z.string()},
    safe(async ({pageId}) => {
      const {page} = await api.request<{page: Record<string, unknown>}>('GET', `${org}/pages/${pageId}`)
      let markdown: string | null = null
      try {
        const res = await api.request<{content: Record<string, {html: string}>}>('GET', `/api/page/${pageId}/content`)
        const html = res.content?.[pageId]?.html
        markdown = html ? htmlToMarkdown(html) : null
      } catch (error) {
        if (!(error instanceof DocstarApiError && error.status === 404)) throw error
      }

      return {id: page.id, name: page.name, state: page.state, isPublished: page.isPublished, parentId: page.parentId, markdown}
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
      markdown: z.string().optional().describe('Page content in Markdown'),
      parentPageId: z.string().optional().describe('Parent page id; defaults to the collection root'),
    },
    safe(async ({collectionId, name, markdown, parentPageId}) => {
      let parent = parentPageId
      if (!parent) {
        const {pages} = await api.request<{pages: PageSummary[]}>('GET', `${org}/collection/${collectionId}/pages`)
        parent = pages.find((p) => p.type === 0)?.id
        if (!parent) throw new Error('Could not find the collection root page; pass parentPageId.')
      }

      return api.request('POST', `${org}/pages/${parent}`, {name, contents: markdown === undefined ? undefined : toHtml(markdown), state: PAGE_STATE.DRAFT})
    }),
  )

  server.tool(
    'update_page',
    'Update a page name and/or content (Markdown). The page goes back to draft until published again.',
    {
      pageId: z.string(),
      name: z.string().min(1).optional(),
      markdown: z.string().optional().describe('New page content in Markdown (replaces existing content)'),
    },
    safe(async ({pageId, name, markdown}) => {
      if (name === undefined && markdown === undefined) throw new Error('Provide name and/or markdown.')

      // PUT /pages/:id crashes unless urlName is sent (sanitizeUrl(undefined)), so always resend the current one
      const {page} = await api.request<{page: {name: string; urlName: string}}>('GET', `${org}/pages/${pageId}`)
      const keep = {name: page.name, urlName: page.urlName}

      const result: Record<string, unknown> = {}
      if (markdown !== undefined) {
        const html = toHtml(markdown)
        try {
          // Pages already opened in the editor keep their content in a Yjs doc
          await api.request('POST', `${org}/pages/${pageId}/ydoc`, {html})
          result.content = 'updated'
        } catch (error) {
          // The Yjs doc only exists once the page was opened in the editor; until then content lives in `contents`
          if (!(error instanceof DocstarApiError && /not found in store/i.test(error.message))) throw error
          await api.request('PUT', `${org}/pages/${pageId}`, {...keep, contents: html})
          result.content = 'updated (not yet opened in editor)'
        }
      }

      if (name !== undefined) {
        await api.request('PUT', `${org}/pages/${pageId}`, {...keep, name})
        result.name = name
      }

      return result
    }),
  )

  server.tool(
    'publish_page',
    'Publish a page so it is live on the public docs. Its parent page must already be published.',
    {pageId: z.string()},
    safe(({pageId}) => api.request('PATCH', `${org}/pages/${pageId}/state`, {state: PAGE_STATE.APPROVED})),
  )
}
