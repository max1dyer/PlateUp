/** Largest picture accepted from the device; the backend's JSON limit allows for it. */
export const MAX_IMAGE_BYTES = 1024 * 1024;

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

/** Reads a chosen picture as a data URL to send to the backend, or rejects with a message. */
export function readImageFile(file: File): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return Promise.reject(new Error('Choose a PNG, JPEG, GIF, or WebP image.'));
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return Promise.reject(new Error('Choose an image smaller than 1 MB.'));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('That image could not be read.'));
    reader.readAsDataURL(file);
  });
}
