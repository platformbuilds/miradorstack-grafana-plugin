import { of, throwError } from 'rxjs';

import { SchemaApi, SchemaApiError } from './schema';

jest.mock('@grafana/runtime', () => ({
  getBackendSrv: jest.fn(),
}));

const { getBackendSrv } = jest.requireMock('@grafana/runtime') as {
  getBackendSrv: jest.Mock;
};

describe('SchemaApi', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    getBackendSrv.mockReturnValue({ fetch: fetchMock });
  });

  it('requests log schema list', async () => {
    const payload = { fields: [] };
    fetchMock.mockReturnValue(of({ data: payload }));

    const api = new SchemaApi('datasource-uid');
    await expect(api.listLogFields()).resolves.toEqual(payload);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/api/datasources/uid/datasource-uid/resources/schema/logs',
      })
    );
  });

  it('encodes resource identifiers when fetching individual entries', async () => {
    const payload = { name: 'trace id', type: 'keyword' };
    fetchMock.mockReturnValue(of({ data: payload }));

    const api = new SchemaApi('ds-uid');
    await expect(api.getLogField('trace id')).resolves.toEqual(payload);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/api/datasources/uid/ds-uid/resources/schema/logs/trace%20id',
      })
    );
  });

  it('saves log fields via POST', async () => {
    const payload = { name: 'service', type: 'keyword' };
    fetchMock.mockReturnValue(of({ data: payload }));

    const api = new SchemaApi('ds');
    await expect(api.saveLogField(payload)).resolves.toEqual(payload);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/api/datasources/uid/ds/resources/schema/logs',
        data: payload,
      })
    );
  });

  it('wraps upstream failures in SchemaApiError', async () => {
    fetchMock.mockReturnValue(
      throwError(() => ({ status: 502, data: { error: 'upstream failure' } }))
    );

    const api = new SchemaApi('ds-uid');
    await expect(api.listMetrics()).rejects.toEqual(
      expect.objectContaining<SchemaApiError>({
        message: 'upstream failure',
        status: 502,
      })
    );
  });
});
