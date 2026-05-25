import { getSolarWindsServers, getSolarWindsISPInterfaces } from '@/lib/solarwinds';
import https from 'https';

// We globally mocked fetch in jest.setup.js
const mockFetch = global.fetch as jest.Mock;

describe('SolarWinds Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch servers correctly mapped', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          { NodeName: 'HIDDOR-SVR-01', IPAddress: '10.0.0.1', CPUPercent: 45, MemoryPercent: 60, Status: 'Up' }
        ]
      })
    });

    const res = await getSolarWindsServers('10.36.91.45:17778', 'user', 'pass');
    expect(res).toHaveLength(1);
    expect(res[0].NodeName).toBe('HIDDOR-SVR-01');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('https://10.36.91.45:17778/SolarWinds/InformationService/v3/Json/Query'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': expect.any(String)
        })
      })
    );
  });

  it('should throw an error if API request fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized'
    });

    await expect(getSolarWindsServers('10.36.91.45:17778', 'user', 'pass')).rejects.toThrow('SWIS Query Failed (401): Unauthorized');
  });
});
