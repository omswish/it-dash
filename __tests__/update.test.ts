if (typeof (global as any).Headers === 'undefined') {
  (global as any).Headers = class MockHeaders {
    getSetCookie() { return []; }
    get() { return null; }
    set() {}
    append() {}
  };
}

if (typeof (global as any).Request === 'undefined') {
  (global as any).Request = class MockRequest {
    private bodyText: string;
    constructor(input: any, init?: any) {
      this.bodyText = init?.body || '';
    }
    async json() {
      return JSON.parse(this.bodyText);
    }
  };
}

if (typeof (global as any).Response === 'undefined') {
  (global as any).Response = class MockResponse {
    headers = new (global as any).Headers();
    body: any;
    status: number;
    constructor(body: any, init?: any) {
      this.body = body;
      this.status = init?.status || 200;
    }
    static json(body: any, init?: any) {
      const res = new MockResponse(body, init);
      return res;
    }
    async json() {
      return this.body;
    }
  };
}

import fs from 'fs';

const { POST } = require('@/app/api/update/route');

jest.mock('fs');


describe('Update API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully handle status updates and write them to the mock database', async () => {
    const mockDb = {
      configs: {
        symphony: { connected: false, status: 'idle', statusMessage: '' },
        nutanix: { connected: false, status: 'idle', statusMessage: '' },
        solarwinds: { connected: false, status: 'idle', statusMessage: '' }
      },
      symphony: {},
      servers: [],
      networks: []
    };

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockDb));
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

    const mockRequestPayload = {
      symphony: {
        incidents: 15,
        requests: 30,
        status: 'active',
        statusMessage: 'Scraped successfully via Edge Extension'
      }
    };

    const request = new Request('http://localhost:3000/api/update', {
      method: 'POST',
      body: JSON.stringify(mockRequestPayload)
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(fs.writeFileSync).toHaveBeenCalled();
  });
});
