/* Frosted Glass: match room-card icon gutters on entity rows.
 * card-mod cannot reliably pierce auto-entities → generic-entity-row shadows.
 * Also styles template-entity-row so transit cards keep 10px/36px if theme row CSS drops.
 */
(() => {
  const TAGS = new Set([
    "hui-generic-entity-row",
    "template-entity-row",
  ]);
  const FLAG = "_frostedGlassGutters";
  const CSS = `
    .info {
      padding-left: 10px !important;
      padding-inline-start: 10px !important;
    }
    state-badge {
      flex: 0 0 36px !important;
    }
  `;

  let sheet;
  try {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(CSS);
  } catch (_e) {
    sheet = null;
  }

  const apply = (el) => {
    const root = el?.shadowRoot;
    if (!root || root[FLAG]) return;
    if (sheet) {
      try {
        root.adoptedStyleSheets = [...(root.adoptedStyleSheets || []), sheet];
        root[FLAG] = true;
        return;
      } catch (_e) {
        /* fall through to a <style> tag */
      }
    }
    const style = document.createElement("style");
    style.textContent = CSS;
    root.appendChild(style);
    root[FLAG] = true;
  };

  const observe = (root) => {
    if (!root || root[FLAG + "Obs"]) return;
    root[FLAG + "Obs"] = true;
    new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const n of m.addedNodes) walk(n);
      }
    }).observe(root, { childList: true, subtree: true });
  };

  const walk = (node) => {
    if (!node) return;
    if (node.nodeType === 1) {
      if (TAGS.has(node.localName)) apply(node);
      if (node.shadowRoot) {
        observe(node.shadowRoot);
        walk(node.shadowRoot);
      }
      for (const child of node.children || []) walk(child);
      return;
    }
    if (node.nodeType === 11) {
      observe(node);
      for (const child of node.children || []) walk(child);
    }
  };

  const hookTag = (tag) => {
    const Ctor = customElements.get(tag);
    if (!Ctor || Ctor[FLAG]) return;
    Ctor[FLAG] = true;
    const proto = Ctor.prototype;
    const origConnected = proto.connectedCallback;
    proto.connectedCallback = function connectedCallback() {
      origConnected?.call(this);
      const go = () => apply(this);
      const done = this.updateComplete;
      if (done && typeof done.then === "function") done.then(go);
      else Promise.resolve().then(go);
    };
  };

  const hook = () => {
    for (const tag of TAGS) hookTag(tag);
    walk(document.documentElement);
  };

  const origAttach = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function attachShadow(init) {
    const root = origAttach.call(this, init);
    observe(root);
    return root;
  };

  hook();
  for (const tag of TAGS) {
    customElements.whenDefined(tag).then(hook);
  }
  new MutationObserver(() => walk(document.documentElement)).observe(
    document.documentElement,
    { childList: true, subtree: true }
  );
})();
