import { arrayBufferToBase64 } from '../voice';

const toArrayBuffer = (bytes: number[]): ArrayBuffer => new Uint8Array(bytes).buffer;

test('encodes an empty buffer to an empty string', () => {
  expect(arrayBufferToBase64(toArrayBuffer([]))).toBe('');
});

test('pads a single trailing byte with ==', () => {
  expect(arrayBufferToBase64(toArrayBuffer([77]))).toBe('TQ==');
});

test('pads two trailing bytes with =', () => {
  expect(arrayBufferToBase64(toArrayBuffer([77, 97]))).toBe('TWE=');
});

test('encodes a full triplet with no padding', () => {
  expect(arrayBufferToBase64(toArrayBuffer([77, 97, 110]))).toBe('TWFu');
});

test('encodes multiple triplets plus a padded remainder', () => {
  const bytes = Array.from('Hello, World!').map((char) => char.charCodeAt(0));

  expect(arrayBufferToBase64(toArrayBuffer(bytes))).toBe(Buffer.from(bytes).toString('base64'));
});

test('encodes max-value bytes', () => {
  expect(arrayBufferToBase64(toArrayBuffer([255, 255, 255]))).toBe('////');
});

test('matches Buffer output for arbitrary byte lengths', () => {
  for (let length = 0; length < 10; length += 1) {
    const bytes = Array.from({ length }, (_, index) => (index * 37) % 256);

    expect(arrayBufferToBase64(toArrayBuffer(bytes))).toBe(Buffer.from(bytes).toString('base64'));
  }
});
