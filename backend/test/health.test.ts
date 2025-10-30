import httpMocks from 'node-mocks-http';
import app from '../src/app';

describe('GET /api/health', () => {
  it('returns a healthy status', async () => {
    const request = httpMocks.createRequest({
      method: 'GET',
      url: '/api/health',
    });
    const response = httpMocks.createResponse();

    await new Promise<void>((resolve) => {
      response.on('end', () => resolve());
      (app as unknown as { handle: (req: unknown, res: unknown) => void }).handle(request, response);
    });

    expect(response.statusCode).toBe(200);
    expect(response._isJSON()).toBe(true);
    expect(response._getJSONData()).toEqual({ status: 'ok' });
  });
});
