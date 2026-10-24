/**
 * Element ids for a page's headings, in order, for the "On This Page" links.
 *
 * Letters of every script are kept, so Japanese and Chinese headings get
 * their own ids instead of all collapsing to `-`. A repeated id gets a `-2`,
 * `-3`… suffix, so every id is unique; a heading without letters or digits
 * becomes `section`.
 */
export function buildHeadingIds(texts: readonly string[]): string[] {
  const used = new Set<string>();
  return texts.map((text) => {
    const base =
      text
        .trim()
        .toLowerCase()
        .replaceAll(/[^\p{L}\p{N}_]+/gu, '-')
        .replaceAll(/^-|-$/g, '') || 'section';
    let id = base;
    for (let n = 2; used.has(id); n++) {
      id = `${base}-${n}`;
    }
    used.add(id);
    return id;
  });
}
