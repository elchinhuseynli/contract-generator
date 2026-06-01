// Helpers for rich-text fields. Fields are authored via TipTap and stored as
// HTML. Everything here is isomorphic (no DOM) so it runs in the browser
// preview, the Node PDF renderer, and the markdown export alike.

const HTML_TAG = /<\/?(p|ul|ol|li|br|strong|em|b|i|u|s|h[1-6]|blockquote|a|span|div)\b[^>]*>/i;

/** True if the string already contains rich-text markup (vs. legacy plain text). */
export function isHtmlContent(s: string | null | undefined): boolean {
  return !!s && HTML_TAG.test(s);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Convert legacy markdown-ish text (paragraphs + `* ` bullets) into HTML. */
export function plainTextToHtml(text: string | null | undefined): string {
  const src = (text ?? "").replace(/\r\n/g, "\n");
  if (!src.trim()) return "";
  const out: string[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) {
      out.push(`<ul>${bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`);
      bullets = [];
    }
  };
  for (const raw of src.split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (/^[*-]\s+/.test(line)) bullets.push(line.replace(/^[*-]\s+/, ""));
    else {
      flush();
      out.push(`<p>${esc(line)}</p>`);
    }
  }
  flush();
  return out.join("");
}

/** Normalise any stored value into editor/render HTML (handles legacy text). */
export function toRichHtml(value: string | null | undefined): string {
  if (!value) return "";
  return isHtmlContent(value) ? value : plainTextToHtml(value);
}

/** Strip rich-text HTML to plain text — used for empty-checks and validation. */
export function richTextToPlain(html: string | null | undefined): string {
  return (html ?? "")
    .replace(/<\/(p|li|h[1-6]|div|ul|ol)>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Defensive sanitiser: drop scripts/styles/iframes, inline event handlers and
 * javascript: URLs. TipTap output is already schema-constrained to a safe set
 * of tags; this is belt-and-braces for the values we inject into preview + PDF.
 */
export function sanitizeRichHtml(html: string | null | undefined): string {
  return (html ?? "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)\b[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');
}

/** Minimal HTML → Markdown for the .md export (p, br, ul/ol/li, strong/em). */
export function htmlToMarkdown(html: string | null | undefined): string {
  let s = sanitizeRichHtml(html ?? "");
  if (!s.trim()) return "";
  s = s.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_m, inner: string) => {
    let n = 0;
    const items = inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_x: string, c: string) => {
      n += 1;
      return `\n${n}. ${c.trim()}`;
    });
    return `\n${items}\n`;
  });
  s = s.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_m, inner: string) => {
    const items = inner.replace(
      /<li[^>]*>([\s\S]*?)<\/li>/gi,
      (_x: string, c: string) => `\n* ${c.trim()}`
    );
    return `\n${items}\n`;
  });
  s = s
    .replace(/<\s*(strong|b)\s*>([\s\S]*?)<\s*\/\s*\1\s*>/gi, "**$2**")
    .replace(/<\s*(em|i)\s*>([\s\S]*?)<\s*\/\s*\1\s*>/gi, "_$2_")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<\/?p[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}
