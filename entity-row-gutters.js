/* Frosted Glass: entity-row gutters + clock frameless rules.
 * card-mod cannot reliably pierce auto-entities / battery-state shadows,
 * and it overwrites better-moment-card's own card_mod.
 */
(() => {
  const FLAG = "_fgPad20";

  const ROW_CSS = `
    .info {
      padding-left: 10px !important;
      padding-inline-start: 10px !important;
    }
    state-badge {
      flex: 0 0 36px !important;
    }
  `;

  const BATTERY_ENTITY_CSS = `
    :host {
      padding-inline-end: 12px !important;
      box-sizing: border-box;
    }
    .icon {
      flex: 0 0 36px !important;
      margin-right: 10px !important;
      margin-inline-end: 10px !important;
      line-height: 36px !important;
    }
    .name {
      margin-left: 0 !important;
      margin-inline-start: 0 !important;
      margin-right: 0 !important;
      margin-inline-end: 0 !important;
    }
    .state {
      padding-inline-end: 0 !important;
      margin-inline-end: 0 !important;
    }
  `;

  const BATTERY_CARD_CSS = `
    .card-content {
      padding-inline-start: 12px !important;
      padding-inline-end: 0 !important;
      padding-left: 12px !important;
      padding-right: 0 !important;
    }
  `;

  const ENTITIES_CARD_CSS = `
    .card-content,
    #states {
      padding-inline-start: 12px !important;
      padding-inline-end: 12px !important;
      padding-left: 12px !important;
      padding-right: 12px !important;
    }
  `;

  const HA_CARD_SLOT_CSS = `
    ::slotted(.card-content),
    ::slotted(#states) {
      padding-inline-start: 12px !important;
      padding-inline-end: 12px !important;
      padding-left: 12px !important;
      padding-right: 12px !important;
    }
  `;

  const CLOCK_CSS = `
    ha-card {
      background: transparent !important;
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
      padding: 0 !important;
      --ha-card-box-shadow: none !important;
      --ha-card-border-width: 0 !important;
      --ha-card-border-color: transparent !important;
      --ha-card-glass-inset-shadow: none !important;
    }
    ha-card::before {
      content: none !important;
      display: none !important;
      box-shadow: none !important;
    }
  `;

  const SHADOW_CSS = {
    "hui-generic-entity-row": ROW_CSS,
    "template-entity-row": ROW_CSS,
    "battery-state-entity": BATTERY_ENTITY_CSS,
    "battery-state-card": BATTERY_CARD_CSS,
    "hui-entities-card": ENTITIES_CARD_CSS,
  };

  const sheets = {};
  try {
    for (const [tag, css] of Object.entries(SHADOW_CSS)) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      sheets[tag] = sheet;
    }
  } catch (_e) {
    /* use <style> tags */
  }

  const adopt = (root, css, sheet) => {
    if (!root || root[FLAG]) return;
    if (sheet) {
      try {
        root.adoptedStyleSheets = [...(root.adoptedStyleSheets || []), sheet];
        root[FLAG] = true;
        return;
      } catch (_e) {
        /* fall through */
      }
    }
    const style = document.createElement("style");
    style.textContent = css;
    root.appendChild(style);
    root[FLAG] = true;
  };

  const padBox = (node, start, end) => {
    if (!node || node.nodeType !== 1) return;
    node.style.setProperty("padding-left", `${start}px`, "important");
    node.style.setProperty("padding-right", `${end}px`, "important");
    node.style.setProperty("padding-inline-start", `${start}px`, "important");
    node.style.setProperty("padding-inline-end", `${end}px`, "important");
    node.style.setProperty("box-sizing", "border-box");
  };

  const pierceHaCard = (card) => {
    const root = card?.shadowRoot;
    if (!root) return;
    adopt(root, HA_CARD_SLOT_CSS, null);
  };

  const applyShadow = (el) => {
    const css = SHADOW_CSS[el.localName];
    const root = el?.shadowRoot;
    if (!css || !root) return;
    adopt(root, css, sheets[el.localName]);

    if (el.localName === "battery-state-card") {
      const card = root.querySelector("ha-card");
      pierceHaCard(card);
      padBox(root.querySelector(".card-content"), 12, 0);
      padBox(el, 0, 0);
    }
    if (el.localName === "hui-entities-card") {
      const card = root.querySelector("ha-card");
      pierceHaCard(card);
      padBox(root.querySelector("#states"), 12, 12);
      padBox(root.querySelector(".card-content"), 12, 12);
    }
    if (el.localName === "battery-state-entity") {
      padBox(el, 0, 12);
    }
  };

  const applyClock = (el) => {
    if (!el || el[FLAG]) return;
    el[FLAG] = true;
    const style = document.createElement("style");
    style.textContent = CLOCK_CSS;
    el.appendChild(style);
    const card = el.querySelector("ha-card");
    if (!card) return;
    card.style.setProperty("background", "transparent", "important");
    card.style.setProperty("box-shadow", "none", "important");
    card.style.setProperty("border", "none", "important");
    card.style.setProperty("margin", "0", "important");
    card.style.setProperty("padding", "0", "important");
    card.style.setProperty("--ha-card-box-shadow", "none");
    card.style.setProperty("--ha-card-border-width", "0");
    card.style.setProperty("--ha-card-border-color", "transparent");
    card.style.setProperty("--ha-card-glass-inset-shadow", "none");
  };

  const apply = (el) => {
    if (!el || el.nodeType !== 1) return;
    if (el.localName === "better-moment-card") applyClock(el);
    else applyShadow(el);
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
      apply(node);
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

  const TAGS = [...Object.keys(SHADOW_CSS), "better-moment-card"];

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
