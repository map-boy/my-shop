// FILE: src/lib/upload.ts
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export interface UploadResult {
  url: string;
  path: string;
}

/** Uploads a file to Cloud Storage and reports progress 0-100. */
export function uploadFile(
  file: File,
  folder = 'products',
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
  const task = uploadBytesResumable(ref(storage, path), file, {
    cacheControl: 'public,max-age=31536000',
    contentType: file.type,
  });

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => resolve({ url: await getDownloadURL(task.snapshot.ref), path }),
    );
  });
}

export async function removeFile(path: string): Promise<void> {
  try {
    await deleteObject(ref(storage, path));
  } catch {
    /* already gone — nothing to do */
  }
}
