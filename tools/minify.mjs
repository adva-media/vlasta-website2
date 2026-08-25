/* Conservative minifiers used by tools/build.mjs. No parser, no deps. */

export function minifyCss(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  let q = 0; /* 0 code, 34 ", 39 ', 42 comment */
  while (i < n) {
    const c = src.charCodeAt(i);
    if (q === 42) {
      if (c === 42 && src.charCodeAt(i + 1) === 47) { q = 0; i += 2; continue; }
      i++; continue;
    }
    if (q) {
      out += src[i];
      if (c === q && src[i - 1] !== '\\') q = 0;
      i++; continue;
    }
    if (c === 47 && src.charCodeAt(i + 1) === 42) { q = 42; i += 2; continue; }
    if (c === 34 || c === 39) { q = c; out += src[i]; i++; continue; }
    if (c <= 32) {
      const prev = out.charCodeAt(out.length - 1);
      const next = src.charCodeAt(i + 1);
      i++;
      if (!out.length) continue;
      while (i < n && src.charCodeAt(i) <= 32) i++;
      const nx = i < n ? src[i] : '';
      if (prev === 59 || prev === 123 || prev === 125 || prev === 58 || prev === 44) continue;
      if (nx === '{' || nx === '}' || nx === ';' || nx === ':' || nx === ',') continue;
      out += ' ';
      continue;
    }
    out += src[i];
    i++;
  }
  return out.replace(/;}/g, '}').trim();
}

export function minifyJs(src) {
  /* Strip /* * / comments only — this file does not put those sequences in strings. */
  return src.replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';
}
