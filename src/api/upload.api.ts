import ENV from '@/config/env';

const isRemote = (uri: string) => /^https?:\/\//i.test(uri);

const cloudinaryConfigured = () =>
  !!ENV.CLOUDINARY_CLOUD_NAME && !!ENV.CLOUDINARY_UPLOAD_PRESET;

// Uploads a single local image (file:// URI) to Cloudinary via an unsigned
// preset and returns the hosted https URL.
const uploadOne = async (uri: string): Promise<string> => {
  const formData = new FormData();
  // React Native's fetch accepts this file-shaped object for multipart uploads.
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: `listing-${Date.now()}.jpg`,
  } as unknown as Blob);
  formData.append('upload_preset', ENV.CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${ENV.CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  if (!response.ok) {
    throw new Error(`Cloudinary upload failed (${response.status})`);
  }
  const data = (await response.json()) as { secure_url?: string };
  if (!data.secure_url) {
    throw new Error('Cloudinary response missing secure_url');
  }
  return data.secure_url;
};

/**
 * Turns a mix of local (file://) and already-hosted image URIs into hosted
 * https URLs. Already-remote URIs pass through untouched. If Cloudinary isn't
 * configured, local URIs are dropped (nothing to host them), so the listing
 * simply has no images rather than storing unusable local paths.
 */
export const uploadImages = async (uris: string[]): Promise<string[]> => {
  const results: string[] = [];
  for (const uri of uris) {
    if (isRemote(uri)) {
      results.push(uri);
      continue;
    }
    if (!cloudinaryConfigured()) {
      continue; // no host available — skip local-only images
    }
    try {
      results.push(await uploadOne(uri));
    } catch (error) {
      console.log('[upload] image upload failed, skipping:', error);
    }
  }
  return results;
};
