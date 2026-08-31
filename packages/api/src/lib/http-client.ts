export interface HttpClientOptions extends RequestInit {
  url: string;
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Orval's mutator target (see orval.config.ts). Generated hooks call this instead
 * of axios/fetch directly, so auth headers and the base URL live in one place.
 */
export async function httpClient<T>({ url, params, ...init }: HttpClientOptions): Promise<T> {
  const query = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params).filter((entry): entry is [string, string] => entry[1] !== undefined),
      ).toString()
    : '';

  const response = await fetch(`${url}${query}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });

  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${url} failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
