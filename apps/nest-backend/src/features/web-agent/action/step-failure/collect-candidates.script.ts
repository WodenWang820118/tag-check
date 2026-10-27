/**
 * The page script that lists what a failed step could have meant. It is a
 * source string, not a function: the backend bundle compiles functions to
 * ES5 with helpers the page does not have (see AGENTS.md).
 *
 * It returns the page's URL, title and viewport and, in document order, up
 * to `limit` visible elements a person can act on, each with its role, name,
 * identifying attributes, box and the CSS selectors that match only it.
 */
export function collectCandidatesSource(limit: number): string {
  return `(() => {
  const LIMIT = ${Math.max(0, Math.floor(limit))};
  const QUERY = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, label, [role], [onclick], [tabindex]:not([tabindex="-1"]), [data-testid], [contenteditable="true"]';
  const ROLE_BY_TAG = { a: 'link', button: 'button', select: 'combobox', textarea: 'textbox', summary: 'button' };
  const ROLE_BY_INPUT = { button: 'button', submit: 'button', reset: 'button', image: 'button', checkbox: 'checkbox', radio: 'radio', range: 'slider', search: 'searchbox' };
  const ATTRIBUTES = ['id', 'name', 'type', 'href', 'data-testid', 'aria-label', 'placeholder', 'title'];

  const clean = (value) => (value || '').replace(/\\s+/g, ' ').trim();
  const cut = (value) => (value.length > 100 ? value.slice(0, 99) + '\\u2026' : value);
  const quoted = (value) => '"' + value.replace(/["\\\\]/g, '\\\\$&') + '"';
  const byAttribute = (name, value) => '[' + name + '=' + quoted(value) + ']';

  const isVisible = (element) => {
    const box = element.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) return false;
    const style = getComputedStyle(element);
    return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) !== 0;
  };

  const roleOf = (element) => {
    const given = clean(element.getAttribute('role'));
    if (given) return given.split(' ')[0];
    const tag = element.tagName.toLowerCase();
    if (tag === 'input') {
      return ROLE_BY_INPUT[(element.getAttribute('type') || 'text').toLowerCase()] || 'textbox';
    }
    return ROLE_BY_TAG[tag] || null;
  };

  const nameOf = (element) => {
    const labelledBy = clean(element.getAttribute('aria-labelledby'))
      .split(' ')
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .map((node) => node.textContent)
      .join(' ');
    const labels = element.labels ? Array.from(element.labels).map((label) => label.textContent).join(' ') : '';
    const image = element.querySelector ? element.querySelector('img[alt]') : null;
    const tag = element.tagName.toLowerCase();
    const buttonValue = tag === 'input' && ['button', 'submit', 'reset'].includes(element.type) ? element.value : '';
    const names = [
      element.getAttribute('aria-label'),
      labelledBy,
      labels,
      element.getAttribute('alt'),
      buttonValue,
      element.innerText,
      image ? image.getAttribute('alt') : '',
      element.getAttribute('title'),
      element.getAttribute('placeholder')
    ];
    for (const name of names) {
      const text = clean(name);
      if (text) return cut(text);
    }
    return '';
  };

  const matchesOnly = (selector, element) => {
    try {
      const found = document.querySelectorAll(selector);
      return found.length === 1 && found[0] === element;
    } catch (error) {
      return false;
    }
  };

  const pathOf = (element) => {
    const parts = [];
    let node = element;
    while (node && node.nodeType === 1 && node !== document.documentElement) {
      const tag = node.tagName.toLowerCase();
      if (node !== element) {
        const hook = node.getAttribute('data-testid');
        if (hook) { parts.unshift(byAttribute('data-testid', hook)); break; }
        if (node.id) { parts.unshift('#' + CSS.escape(node.id)); break; }
      }
      const parent = node.parentElement;
      if (!parent) { parts.unshift(tag); break; }
      const same = Array.from(parent.children).filter((child) => child.tagName === node.tagName);
      parts.unshift(same.length > 1 ? tag + ':nth-of-type(' + (same.indexOf(node) + 1) + ')' : tag);
      node = parent;
    }
    return parts.join(' > ');
  };

  const selectorsOf = (element) => {
    const tag = element.tagName.toLowerCase();
    const selectors = [];
    const add = (selector) => {
      if (selector && !selectors.includes(selector) && matchesOnly(selector, element)) selectors.push(selector);
    };
    const hook = element.getAttribute('data-testid');
    if (hook) add(byAttribute('data-testid', hook));
    if (element.id) add('#' + CSS.escape(element.id));
    for (const name of ['name', 'aria-label', 'placeholder', 'title']) {
      const value = element.getAttribute(name);
      if (value) add(tag + byAttribute(name, value));
    }
    const href = element.getAttribute('href');
    if (tag === 'a' && href) add('a' + byAttribute('href', href));
    if (selectors.length < 2) add(pathOf(element));
    return selectors;
  };

  const attributesOf = (element) => {
    const attributes = {};
    for (const name of ATTRIBUTES) {
      const value = element.getAttribute(name);
      if (value) attributes[name] = cut(value);
    }
    return attributes;
  };

  const visible = Array.from(document.querySelectorAll(QUERY)).filter(isVisible);
  const candidates = visible.slice(0, LIMIT).map((element, index) => {
    const box = element.getBoundingClientRect();
    return {
      index,
      tag: element.tagName.toLowerCase(),
      role: roleOf(element),
      name: nameOf(element),
      attributes: attributesOf(element),
      box: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) },
      selectors: selectorsOf(element)
    };
  });
  return {
    url: location.href,
    title: document.title,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    candidatesFound: visible.length,
    candidates
  };
})()`;
}
