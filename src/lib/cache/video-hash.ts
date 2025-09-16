export async function sha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const bytes = new Uint8Array(hashBuffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compute a stable content hash for a video file.
 * Reads up to first `maxBytesToHash` bytes + file size + last `tailBytes` bytes for robustness.
 */
export async function hashVideoFile(file: File, options?: { maxBytesToHash?: number; tailBytes?: number }): Promise<string> {
  const maxBytesToHash = options?.maxBytesToHash ?? 8 * 1024 * 1024; // 8MB head
  const tailBytes = options?.tailBytes ?? 256 * 1024; // 256KB tail
  const size = file.size;

  // Head slice
  const headBlob = file.slice(0, Math.min(size, maxBytesToHash));
  const headBuf = await headBlob.arrayBuffer();

  // Tail slice
  let tailBuf = new ArrayBuffer(0);
  if (size > tailBytes) {
    const tailBlob = file.slice(size - tailBytes, size);
    tailBuf = await tailBlob.arrayBuffer();
  }

  // Combine: [head][size(8)][tail]
  const sizeBuf = new ArrayBuffer(8);
  new DataView(sizeBuf).setBigUint64(0, BigInt(size));

  const total = new Uint8Array(headBuf.byteLength + sizeBuf.byteLength + tailBuf.byteLength);
  total.set(new Uint8Array(headBuf), 0);
  total.set(new Uint8Array(sizeBuf), headBuf.byteLength);
  total.set(new Uint8Array(tailBuf), headBuf.byteLength + sizeBuf.byteLength);

  return sha256(total.buffer);
}


