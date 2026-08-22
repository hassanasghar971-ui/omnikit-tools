/**
 * Pure-JS checksum implementations (no dependencies).
 * SHA-* variants use WebCrypto via the worker/main-thread client.
 */

export function crc32(input: string): string {
  let crc = 0xffffffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, "0");
}

export function adler32(input: string): string {
  let a = 1;
  let b = 0;
  const MOD = 65521;
  for (let i = 0; i < input.length; i++) {
    a = (a + input.charCodeAt(i)) % MOD;
    b = (b + a) % MOD;
  }
  return ((b << 16) | a).toString(16).padStart(8, "0");
}

/* ---- MD5 (RFC 1321) ------------------------------------------------ */

function md5Cycle(w: number[], state: number[]): number[] {
  const a = state[0], b = state[1], c = state[2], d = state[3];
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const K: number[] = [];
  for (let i = 0; i < 64; i++) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0;
  }
  const rotl = (x: number, n: number) => ((x << n) | (x >>> (32 - n))) >>> 0;
  let A = a, B = b, C = c, D = d;
  for (let i = 0; i < 64; i++) {
    let f: number, g: number;
    if (i < 16) {
      f = (B & C) | (~B & D);
      g = i;
    } else if (i < 32) {
      f = (D & B) | (~D & C);
      g = (5 * i + 1) % 16;
    } else if (i < 48) {
      f = B ^ C ^ D;
      g = (3 * i + 5) % 16;
    } else {
      f = C ^ (B | ~D);
      g = (7 * i) % 16;
    }
    const tmp = D;
    D = C;
    C = B;
    B = (B + rotl((A + f + K[i] + w[g]) >>> 0, S[i])) >>> 0;
    A = tmp;
  }
  return [
    (a + A) >>> 0,
    (b + B) >>> 0,
    (c + C) >>> 0,
    (d + D) >>> 0,
  ];
}

export function md5(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const bitLen = bytes.length * 8;
  const withPadLen = (((bytes.length + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(withPadLen + 8);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(withPadLen, bitLen >>> 0, true);
  dv.setUint32(withPadLen + 4, Math.floor(bitLen / 2 ** 32), true);

  let state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  for (let offset = 0; offset < padded.length; offset += 64) {
    const w: number[] = [];
    for (let i = 0; i < 16; i++) {
      w.push(dv.getUint32(offset + i * 4, true));
    }
    state = md5Cycle(w, state);
  }
  return state.map((n) => n.toString(16).padStart(8, "0")).join("");
}
