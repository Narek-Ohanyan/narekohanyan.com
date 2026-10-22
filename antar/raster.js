/* Loads the map's data rasters (region ids, forest cover, elevation) exactly as they were built, and refuses them if anything altered them on the way.

   Why: these files are data, not pictures. A host or CDN that "optimises" images can swap a PNG for a lossy WebP when the browser says it supports it, and
   the values (a region id, 256*R+G metres) are then wrong everywhere. So the files are lossless PNGs stored under a .bin name, fetched as bytes, and compared
   with the Adler-32 checksum written at build time (assets/map/checksums.json, scripts/stamp_map_assets.py). A mismatch throws.

   The PNG is decoded here, in plain JavaScript (inflate + scanline filters), and never drawn on a canvas. Reading pixels back from a canvas is not exact in every
   browser: phone browsers apply colour management to grey images, randomise canvas readback as a privacy measure, or limit canvas memory, and then every value is
   slightly wrong and the checksum (rightly) fails. Decoding the bytes ourselves gives the same numbers on every device.
   adler32() and decodePng() are pure and are tested against zlib and PIL (tests/test_raster.py). */
(function (root) {
  "use strict";
  const build = () => (typeof window !== "undefined" && window.ANTAR_BUILD) || "dev";

  /* Adler-32 over the first `channels` bytes of every RGBA pixel of `d`, in order (the same bytes scripts/stamp_map_assets.py hashes). */
  function adler32(d, channels) {
    let a = 1, b = 0;
    const n = d.length / 4;
    for (let i = 0; i < n; i++) {
      for (let c = 0; c < channels; c++) {
        a += d[i * 4 + c]; if (a >= 65521) a -= 65521;
        b += a; if (b >= 65521) b -= 65521;
      }
    }
    return ((b << 16) | a) >>> 0;
  }

  /* ---- DEFLATE (RFC 1951), after zlib's puff.c: canonical Huffman decoding one bit at a time; the rasters are small, so clarity wins over speed ---- */
  const LBASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
  const LEXT = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
  const DBASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
  const DEXT = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
  const CLORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

  function huffman(lengths, n) {
    const count = new Uint16Array(16), symbol = new Uint16Array(n), offs = new Uint16Array(16);
    for (let i = 0; i < n; i++) count[lengths[i]]++;
    for (let len = 1; len < 15; len++) offs[len + 1] = offs[len] + count[len];
    for (let i = 0; i < n; i++) if (lengths[i]) symbol[offs[lengths[i]]++] = i;
    return { count, symbol };
  }
  let FIXED = null;
  function fixedTables() {
    if (FIXED) return FIXED;
    const l = new Uint8Array(288);
    for (let i = 0; i < 144; i++) l[i] = 8;
    for (let i = 144; i < 256; i++) l[i] = 9;
    for (let i = 256; i < 280; i++) l[i] = 7;
    for (let i = 280; i < 288; i++) l[i] = 8;
    return (FIXED = { lit: huffman(l, 288), dist: huffman(new Uint8Array(30).fill(5), 30) });
  }

  /* Inflates the raw DEFLATE stream in src[start..]; `expected` is a size hint. Returns a Uint8Array. */
  function inflate(src, start, expected) {
    let pos = start || 0, bitBuf = 0, bitCnt = 0;
    let out = new Uint8Array(Math.max(expected || 0, 1024)), op = 0;
    const bits = (need) => {
      let val = bitBuf;
      while (bitCnt < need) {
        if (pos >= src.length) throw new Error("the compressed data ends early");
        val |= src[pos++] << bitCnt; bitCnt += 8;
      }
      bitBuf = val >>> need; bitCnt -= need;
      return val & ((1 << need) - 1);
    };
    const decode = (h) => {
      let code = 0, first = 0, index = 0;
      for (let len = 1; len <= 15; len++) {
        code |= bits(1);
        const c = h.count[len];
        if (code - c < first) return h.symbol[index + (code - first)];
        index += c; first += c; first <<= 1; code <<= 1;
      }
      throw new Error("a bad Huffman code");
    };
    const room = (n) => { if (op + n > out.length) { const g = new Uint8Array(Math.max(out.length * 2, op + n)); g.set(out.subarray(0, op)); out = g; } };
    const codes = (lit, dist) => {
      for (;;) {
        let sym = decode(lit);
        if (sym < 256) { room(1); out[op++] = sym; continue; }
        if (sym === 256) return;
        sym -= 257;
        if (sym >= 29) throw new Error("a bad length code");
        const len = LBASE[sym] + bits(LEXT[sym]), ds = decode(dist);
        if (ds >= 30) throw new Error("a bad distance code");
        const d = DBASE[ds] + bits(DEXT[ds]);
        if (d > op) throw new Error("a distance reaches before the start");
        room(len);
        for (let i = 0; i < len; i++) { out[op] = out[op - d]; op++; }
      }
    };
    let last;
    do {
      last = bits(1);
      const type = bits(2);
      if (type === 0) {
        bitBuf = 0; bitCnt = 0;                                       // stored block: skip to the byte boundary
        if (pos + 4 > src.length) throw new Error("the compressed data ends early");
        const len = src[pos] | (src[pos + 1] << 8), nlen = src[pos + 2] | (src[pos + 3] << 8);
        pos += 4;
        if ((len ^ 0xffff) !== nlen) throw new Error("a stored block with a bad length");
        if (pos + len > src.length) throw new Error("the compressed data ends early");
        room(len); out.set(src.subarray(pos, pos + len), op); op += len; pos += len;
      } else if (type === 1) {
        const f = fixedTables(); codes(f.lit, f.dist);
      } else if (type === 2) {
        const nlen = bits(5) + 257, ndist = bits(5) + 1, ncode = bits(4) + 4;
        if (nlen > 286 || ndist > 30) throw new Error("too many length or distance codes");
        const lengths = new Uint8Array(320);
        for (let i = 0; i < ncode; i++) lengths[CLORDER[i]] = bits(3);
        const lc = huffman(lengths, 19);
        const all = new Uint8Array(320);
        for (let i = 0; i < nlen + ndist;) {
          const sym = decode(lc);
          if (sym < 16) { all[i++] = sym; continue; }
          let prev = 0, rep;
          if (sym === 16) { if (i === 0) throw new Error("a repeat with nothing to repeat"); prev = all[i - 1]; rep = 3 + bits(2); }
          else if (sym === 17) rep = 3 + bits(3); else rep = 11 + bits(7);
          if (i + rep > nlen + ndist) throw new Error("too many code lengths");
          while (rep--) all[i++] = prev;
        }
        codes(huffman(all.subarray(0, nlen), nlen), huffman(all.subarray(nlen, nlen + ndist), ndist));
      } else throw new Error("a bad block type");
    } while (!last);
    return out.subarray(0, op);
  }

  /* ---- PNG: 8-bit, not interlaced, grey / grey+alpha / RGB / RGBA (what the build writes). Returns {w, h, data}, data = RGBA bytes (alpha 255 when the file has none). ---- */
  function decodePng(bytes) {
    const SIG = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < 8; i++) if (bytes[i] !== SIG[i]) throw new Error("not a PNG file");
    let p = 8, w = 0, h = 0, depth = 0, ctype = -1, interlace = 0, haveHdr = false;
    const idat = []; let idatLen = 0;
    while (p + 8 <= bytes.length) {
      const len = ((bytes[p] << 24) | (bytes[p + 1] << 16) | (bytes[p + 2] << 8) | bytes[p + 3]) >>> 0;
      const type = String.fromCharCode(bytes[p + 4], bytes[p + 5], bytes[p + 6], bytes[p + 7]);
      const d = bytes.subarray(p + 8, p + 8 + len);
      p += 12 + len;
      if (type === "IHDR") {
        w = ((d[0] << 24) | (d[1] << 16) | (d[2] << 8) | d[3]) >>> 0; h = ((d[4] << 24) | (d[5] << 16) | (d[6] << 8) | d[7]) >>> 0;
        depth = d[8]; ctype = d[9]; interlace = d[12]; haveHdr = true;
      } else if (type === "IDAT") { idat.push(d); idatLen += d.length; }
      else if (type === "IEND") break;
    }
    if (!haveHdr || !idat.length) throw new Error("a PNG without header or image data");
    const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[ctype];
    if (depth !== 8 || !channels || interlace !== 0) throw new Error(`a PNG this reader does not handle (bit depth ${depth}, colour type ${ctype}, interlace ${interlace})`);
    const z = new Uint8Array(idatLen);
    for (let i = 0, o = 0; i < idat.length; o += idat[i].length, i++) z.set(idat[i], o);
    if ((z[0] & 15) !== 8 || ((z[0] << 8) | z[1]) % 31 !== 0 || (z[1] & 32)) throw new Error("a PNG with an unexpected compression header");
    const stride = w * channels, raw = inflate(z, 2, h * (stride + 1));
    if (raw.length < h * (stride + 1)) throw new Error("a PNG with too little image data");
    const pix = new Uint8Array(h * stride), bpp = channels;
    for (let y = 0; y < h; y++) {
      const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride, up = dst - stride;
      if (f > 4) throw new Error("a PNG with a bad filter type");
      for (let x = 0; x < stride; x++) {
        const a = x >= bpp ? pix[dst + x - bpp] : 0, b = y ? pix[up + x] : 0, c = y && x >= bpp ? pix[up + x - bpp] : 0;
        let v = raw[src + x];
        if (f === 1) v += a;
        else if (f === 2) v += b;
        else if (f === 3) v += (a + b) >> 1;
        else if (f === 4) {
          const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
          v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        }
        pix[dst + x] = v & 255;
      }
    }
    const data = new Uint8Array(w * h * 4);
    for (let i = 0, n = w * h; i < n; i++) {
      const s = i * channels, o = i * 4;
      if (channels === 1) { data[o] = data[o + 1] = data[o + 2] = pix[s]; data[o + 3] = 255; }
      else if (channels === 2) { data[o] = data[o + 1] = data[o + 2] = pix[s]; data[o + 3] = pix[s + 1]; }
      else if (channels === 3) { data[o] = pix[s]; data[o + 1] = pix[s + 1]; data[o + 2] = pix[s + 2]; data[o + 3] = 255; }
      else { data[o] = pix[s]; data[o + 1] = pix[s + 1]; data[o + 2] = pix[s + 2]; data[o + 3] = pix[s + 3]; }
    }
    return { w, h, data };
  }

  let sums = null;
  function checksums() {
    if (!sums) sums = fetch("assets/map/checksums.json?v=" + build()).then((r) => { if (!r.ok) throw new Error("could not load the raster checksums (HTTP " + r.status + ")"); return r.json(); });
    return sums;
  }

  async function decode(url) {
    const r = await fetch(url);
    if (!r.ok) { const e = new Error("could not load " + url + " (HTTP " + r.status + ")"); e.missing = r.status === 404; throw e; }
    const bytes = new Uint8Array(await r.arrayBuffer());
    try { return decodePng(bytes); }
    catch (e) { throw new Error("could not decode " + url + ": " + e.message); }
  }

  /* name: the file under assets/map without extension; channels: 1 for an id/percentage plane, 2 for elevation (R and G). Returns {w, h, data (RGBA)}. */
  async function load(name, channels) {
    const [r, want] = await Promise.all([decode(`assets/map/${name}.bin?v=${build()}`), checksums().then((s) => s[name])]);
    if (want == null) throw new Error(`no checksum is recorded for the raster ${name}`);
    const got = adler32(r.data, channels);
    if (got !== want) throw new Error(`the raster ${name} does not match its checksum (read ${got}, expected ${want}): something between the server and the browser altered the file`);
    return r;
  }

  const api = { adler32, inflate, decodePng, load };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Raster = api;
})(typeof window !== "undefined" ? window : globalThis);
