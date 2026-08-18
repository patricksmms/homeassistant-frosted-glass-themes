/* Frosted Glass: match room-card icon gutters on stock entity rows.
 * card-mod cannot reliably pierce auto-entities → generic-entity-row shadows.
 */
(() => {
  const TAG = "hui-generic-entity-row";
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

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(CSS);

  const apply = (el) => {
    const root = el?.shadowRoot;
    if (!root || root[FLAG]) return;
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    root[FLAG] = true;
  };

  const walk = (node) => {
    if (!node || node.nodeType !== 1) return;
    if (node.localName === TAG) apply(node);
    if (node.shadowRoot) {
      for (const child of node.shadowRoot.children) walk(child);
    }
    for (const child of node.children) walk(child);
  };

  const hook = () => {
    const Ctor = customElements.get(TAG);
    if (!Ctor || Ctor[FLAG]) return;
    Ctor[FLAG] = true;
    const proto = Ctor.prototype;
    const origConnected = proto.connectedCallback;
    proto.connectedCallback = function connectedCallback() {
      origConnected?.call(this);
      Promise.resolve(this.updateComplete).then(() => apply(this));
    };
    walk(document.documentElement);
  };

  if (customElements.get(TAG)) hook();
  customElements.whenDefined(TAG).then(hook);
})();
