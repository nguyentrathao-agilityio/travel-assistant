const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Encodes raw PCM bytes to base64 without relying on `btoa`, which isn't guaranteed on Hermes. */
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let result = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const byte1 = bytes[i];
    const byte2 = bytes[i + 1];
    const byte3 = bytes[i + 2];

    result += BASE64_CHARS[byte1 >> 2];
    result += BASE64_CHARS[((byte1 & 0x03) << 4) | (byte2 === undefined ? 0 : byte2 >> 4)];
    result +=
      byte2 === undefined
        ? '='
        : BASE64_CHARS[((byte2 & 0x0f) << 2) | (byte3 === undefined ? 0 : byte3 >> 6)];
    result += byte3 === undefined ? '=' : BASE64_CHARS[byte3 & 0x3f];
  }

  return result;
};
