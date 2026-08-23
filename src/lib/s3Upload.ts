import { fetchAPI } from '@/services/api';

export type UploadFolder = 'avatars' | 'workspace-logos' | 'assets';

const IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export async function uploadImageViaPresignedUrl(
  file: File,
  folder: UploadFolder,
  tenantId?: string
): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type as (typeof IMAGE_TYPES)[number])) {
    throw new Error(
      'Invalid file type. Only JPEG, PNG, WEBP and GIF are supported.'
    );
  }

  if (folder !== 'avatars' && !tenantId?.trim()) {
    throw new Error('Workspace context is required for this upload.');
  }

  const urlRes = await fetchAPI('/api/storage/generate-upload-url', {
    method: 'POST',
    headers:
      folder === 'avatars'
        ? undefined
        : {
            'x-tenant-id': tenantId!.trim(),
          },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      folder,
    }),
  });

  if (!urlRes.ok) {
    const body = (await urlRes.json().catch(() => null)) as {
      detail?: string;
    } | null;
    throw new Error(body?.detail || 'Failed to generate upload URL');
  }

  const { presignedUrl, fileUrl } = (await urlRes.json()) as {
    presignedUrl: string;
    fileUrl: string;
    fileKey: string;
  };

  const s3Res = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!s3Res.ok) {
    throw new Error('Failed to upload file to storage');
  }

  return fileUrl;
}
