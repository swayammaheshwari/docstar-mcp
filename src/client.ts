export interface DocstarContext {
  apiUrl: string
  token: string
  orgId: string
}

export class DocstarApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

/** Thin wrapper over the DocStar API. The caller's token is forwarded as-is so the API enforces permissions. */
export class DocstarClient {
  constructor(private ctx: DocstarContext) {}

  get orgId(): string {
    return this.ctx.orgId
  }

  async request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.ctx.apiUrl.replace(/\/$/, '')}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.ctx.token}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    const text = await res.text()
    let data: unknown = text
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      // non-JSON response, keep raw text
    }

    if (!res.ok) {
      const message = typeof data === 'string' ? data : JSON.stringify(data)
      throw new DocstarApiError(res.status, `DocStar API ${res.status}: ${message}`)
    }

    return data as T
  }
}
