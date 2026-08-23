import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAPI } from '@/services/api';
import { uploadImageViaPresignedUrl } from './s3Upload';

vi.mock('@/services/api', () => ({
  fetchAPI: vi.fn(),
}));

const mockedFetchAPI = vi.mocked(fetchAPI);

describe('uploadImageViaPresignedUrl', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockedFetchAPI.mockReset();
  });

  it('requires a tenant for workspace uploads', async () => {
    const file = new File(['image'], 'logo.png', { type: 'image/png' });

    await expect(
      uploadImageViaPresignedUrl(file, 'workspace-logos')
    ).rejects.toThrow('Workspace context is required');
    expect(mockedFetchAPI).not.toHaveBeenCalled();
  });

  it('sends the tenant header for workspace uploads', async () => {
    const file = new File(['image'], 'asset.png', { type: 'image/png' });
    mockedFetchAPI.mockResolvedValue(
      new Response(
        JSON.stringify({
          presignedUrl: 'https://uploads.example/asset',
          fileUrl: 'https://cdn.example/asset.png',
          fileKey: 'assets/tenant-1/asset.png',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 })
    );

    await expect(
      uploadImageViaPresignedUrl(file, 'assets', 'tenant-1')
    ).resolves.toBe('https://cdn.example/asset.png');

    expect(mockedFetchAPI).toHaveBeenCalledWith(
      '/api/storage/generate-upload-url',
      expect.objectContaining({
        headers: { 'x-tenant-id': 'tenant-1' },
      })
    );
  });
});
