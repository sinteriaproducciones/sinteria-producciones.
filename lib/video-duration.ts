// Lectura acotada de metadatos: la duración se verifica desde el archivo recibido.
function mp4Duration(bytes: Uint8Array): number | null {
  const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const type = (start: number) => String.fromCharCode(...bytes.subarray(start, start + 4));
  function boxes(start: number, end: number): number | null {
    let visited = 0;
    while (start + 8 <= end && visited++ < 5000) {
      let size = data.getUint32(start), header = 8;
      if (size === 1) {
        if (start + 16 > end) return null;
        const large = data.getBigUint64(start + 8);
        if (large > BigInt(Number.MAX_SAFE_INTEGER)) return null;
        size = Number(large); header = 16;
      } else if (size === 0) size = end - start;
      if (size < header || start + size > end) return null;
      const name = type(start + 4), body = start + header, limit = start + size;
      if (name === "moov") return boxes(body, limit);
      if (name === "mvhd") {
        const version = bytes[body];
        if (version === 0 && body + 20 <= limit) {
          const scale = data.getUint32(body + 12), ticks = data.getUint32(body + 16);
          return scale && ticks !== 0xffffffff ? ticks / scale : null;
        }
        if (version === 1 && body + 32 <= limit) {
          const scale = data.getUint32(body + 20), ticks = data.getBigUint64(body + 24);
          return scale && ticks <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(ticks) / scale : null;
        }
        return null;
      }
      start += size;
    }
    return null;
  }
  return boxes(0, bytes.length);
}

function webmDuration(bytes: Uint8Array): number | null {
  const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const variable = (start: number, id = false) => {
    if (start >= bytes.length || bytes[start] === 0) return null;
    let length = 1, bit = 0x80;
    while (!(bytes[start] & bit) && length <= 8) { bit >>= 1; length++; }
    if (length > (id ? 4 : 8) || start + length > bytes.length) return null;
    let value = id ? bytes[start] : bytes[start] & (bit - 1);
    let unknown = !id && value === bit - 1;
    for (let i = 1; i < length; i++) { value = value * 256 + bytes[start + i]; unknown = unknown && bytes[start + i] === 255; }
    if (!unknown && !Number.isSafeInteger(value)) return null;
    return { value, length, unknown };
  };
  function elements(start: number, end: number, depth: number): number | null {
    let scale = 1000000, duration: number | null = null, visited = 0;
    while (start < end && visited++ < 5000) {
      const id = variable(start, true); if (!id) return null;
      const size = variable(start + id.length); if (!size) return null;
      const body = start + id.length + size.length, limit = size.unknown ? end : body + size.value;
      if (limit > end || limit <= start) return null;
      if ((id.value === 0x18538067 || id.value === 0x1549a966) && depth < 2) {
        const found = elements(body, limit, depth + 1); if (found !== null) return found;
      } else if (id.value === 0x2ad7b1 && !size.unknown && size.value <= 8) {
        scale = 0; for (let i = body; i < limit; i++) scale = scale * 256 + bytes[i];
      } else if (id.value === 0x4489 && !size.unknown) {
        if (size.value === 4) duration = data.getFloat32(body);
        if (size.value === 8) duration = data.getFloat64(body);
      }
      start = limit;
    }
    return duration !== null ? duration * scale / 1000000000 : null;
  }
  return elements(0, bytes.length, 0);
}

export function videoDuration(buffer: ArrayBuffer, mime: string): number | null {
  try {
    const bytes = new Uint8Array(buffer);
    const seconds = mime === "video/mp4" ? mp4Duration(bytes) : mime === "video/webm" ? webmDuration(bytes) : null;
    return seconds !== null && Number.isFinite(seconds) && seconds > 0 ? seconds : null;
  } catch { return null; }
}
