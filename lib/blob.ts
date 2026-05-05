import { put, list, del } from '@vercel/blob'

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN

if (!BLOB_READ_WRITE_TOKEN) {
  throw new Error('BLOB_READ_WRITE_TOKEN is not set')
}

export async function uploadImage(file: File, path: string): Promise<string> {
  const blob = await put(path, file, {
    access: 'public',
    token: BLOB_READ_WRITE_TOKEN,
  })
  return blob.url
}

export async function uploadImageBuffer(
  buffer: Buffer,
  path: string,
  contentType: string
): Promise<string> {
  const blob = await put(path, buffer as any, {
    access: 'public',
    token: BLOB_READ_WRITE_TOKEN,
    contentType,
  })
  return blob.url
}

export async function deleteImage(url: string): Promise<void> {
  try {
    await del(url, { token: BLOB_READ_WRITE_TOKEN })
  } catch (error) {
    console.error('Error deleting image:', error)
  }
}

export async function listImages(prefix?: string) {
  return list({ prefix, token: BLOB_READ_WRITE_TOKEN })
}

