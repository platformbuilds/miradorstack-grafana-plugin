import { MiradorAPIClient, MiradorAPIError } from '../MiradorAPIClient';

const BASE_URL = 'https://mirador.example.com';

describe('MiradorAPIClient', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    (globalThis as any).fetch = jest.fn();
  });

  it('attaches headers and payload for logs query', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (key: string) => (key.toLowerCase() === 'content-type' ? 'application/json' : null),
      } as Headers,
      json: async () => ({ results: [], total: 0, took: 0 }),
    });

    const client = new MiradorAPIClient({
      baseUrl: BASE_URL,
      bearerToken: 'secret',
      tenantId: 'tenant-1',
    });

    await client.queryLogs({ query: 'service:payments' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/api/v1/logs/query`);
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify({ query: 'service:payments' }));

    const headerRecord = init?.headers as Record<string, string>;
    expect(headerRecord['Authorization']).toBe('Bearer secret');
    expect(headerRecord['X-Mirador-Tenant']).toBe('tenant-1');
  });

  it('throws MiradorAPIError on non-ok response', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: {
        get: (key: string) => (key.toLowerCase() === 'content-type' ? 'text/plain' : null),
      } as Headers,
      text: async () => 'bad request',
    });

    const client = new MiradorAPIClient({ baseUrl: BASE_URL });

    await expect(client.testConnection()).rejects.toEqual(new MiradorAPIError(400, 'bad request'));
  });

  it('times out requests', async () => {
    jest.useFakeTimers();
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockImplementation((_url, init) => {
      const signal = init?.signal as AbortSignal | undefined;
      return new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    });

    const client = new MiradorAPIClient({ baseUrl: BASE_URL, timeoutMs: 10 });
    const requestPromise = client.testConnection();

    jest.advanceTimersByTime(20);
    await expect(requestPromise).rejects.toEqual(
      new MiradorAPIError(408, 'Mirador API request timed out')
    );

    jest.useRealTimers();
  });
});
