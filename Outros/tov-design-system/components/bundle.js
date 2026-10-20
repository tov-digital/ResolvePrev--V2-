/* @ds-bundle: {"format":4,"namespace":"Tov","components":[{"name":"Button"},{"name":"Badge"},{"name":"Avatar"},{"name":"Card"},{"name":"Input"},{"name":"Tabs"},{"name":"StatTile"},{"name":"ProgressBar"},{"name":"ProgressRow"},{"name":"NavItem"},{"name":"Modal"},{"name":"Icon"}]} */
(function () {
  var R = window.React;
  var h = R.createElement;
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(" "); }
  function omit(p, keys) { var o = {}; for (var k in p) if (keys.indexOf(k) < 0) o[k] = p[k]; return o; }

  var PATHS = {
    dashboard: ["M4 4h6v7H4z", "M14 4h6v4h-6z", "M14 12h6v8h-6z", "M4 15h6v5H4z"],
    users: ["M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20", "M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z", "M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35", "M15.5 4.15a3.5 3.5 0 0 1 0 6.7"],
    money: ["M12 3v18", "M16.5 7.5c0-1.7-2-3-4.5-3s-4.5 1.3-4.5 3 2 2.6 4.5 3 4.5 1.3 4.5 3-2 3-4.5 3-4.5-1.3-4.5-3"],
    calendar: ["M5 6h14v14H5z", "M5 10h14", "M9 3v4", "M15 3v4"],
    message: ["M5 5h14v10H9l-4 4z"],
    file: ["M7 3h7l4 4v14H7z", "M14 3v4h4", "M10 12h5", "M10 16h5"],
    folder: ["M3 7h6l2 2h10v10H3z"],
    filter: ["M4 5h16l-6 8v5l-4 2v-7z"],
    plus: ["M12 5v14", "M5 12h14"],
    close: ["M6 6l12 12", "M18 6L6 18"],
    check: ["M5 12.5l4.5 4.5L19 7.5"],
    chevron: ["M7 10l5 5 5-5"],
    logout: ["M15 4h4v16h-4", "M10 8l-4 4 4 4", "M6 12h10"],
    search: ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z", "M20 20l-4-4"]
  };

  function Icon(p) {
    var d = PATHS[p.name] || PATHS.plus;
    return h("svg", { viewBox: "0 0 24 24", width: p.size || 20, height: p.size || 20, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", className: p.className },
      d.map(function (x, i) { return h("path", { key: i, d: x }); }));
  }

  function Button(p) {
    var v = p.variant || "primary";
    var rest = omit(p, ["variant", "size", "icon", "iconOnly", "className", "children"]);
    return h("button", Object.assign({ type: "button" }, rest, {
      className: cx("tv-btn", "tv-btn-" + v, p.size === "sm" && "tv-btn-sm", p.iconOnly && "tv-btn-icon", p.className)
    }), p.icon ? h(Icon, { name: p.icon }) : null, p.iconOnly ? null : p.children);
  }

  function Badge(p) {
    if (p.code) return h("span", { className: cx("tv-code", "tv-badge-" + (p.tone || "neutral"), p.className) }, p.children);
    return h("span", { className: cx("tv-badge", "tv-badge-" + (p.tone || "neutral"), p.dot && "tv-badge-dot", p.className) }, p.children);
  }

  function initials(name) {
    return String(name || "?").trim().split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();
  }
  function Avatar(p) {
    var s = p.size || 40;
    return h("span", { className: cx("tv-avatar", p.tone === "dark" && "tv-avatar-dark", p.className), style: { width: s, height: s, fontSize: Math.round(s * 0.36) }, title: p.name },
      p.src ? h("img", { src: p.src, alt: p.name || "" }) : initials(p.name));
  }

  function Card(p) {
    return h("section", { className: cx("tv-card", p.className), style: p.style },
      (p.title || p.actions) ? h("div", { className: "tv-card-head" },
        h("div", null, p.title ? h("h3", { className: "tv-card-title" }, p.title) : null, p.subtitle ? h("p", { className: "tv-card-sub" }, p.subtitle) : null),
        p.actions || null) : null,
      p.children);
  }

  var uid = 0;
  function Input(p) {
    var id = R.useMemo(function () { return p.id || "tv-in-" + (++uid); }, [p.id]);
    var rest = omit(p, ["label", "hint", "error", "id", "className"]);
    return h("div", { className: cx("tv-field", p.className) },
      p.label ? h("label", { htmlFor: id }, p.label) : null,
      h("input", Object.assign({}, rest, { id: id, className: "tv-input", "aria-invalid": p.error ? "true" : undefined, "aria-describedby": (p.error || p.hint) ? id + "-h" : undefined })),
      (p.error || p.hint) ? h("span", { id: id + "-h", className: cx("tv-hint", p.error && "tv-hint-error") }, p.error || p.hint) : null);
  }

  function Tabs(p) {
    var items = p.items || [];
    var st = R.useState(p.defaultValue || (items[0] && items[0].value));
    var cur = p.value !== undefined ? p.value : st[0];
    function pick(v) { st[1](v); if (p.onChange) p.onChange(v); }
    return h("div", { className: cx("tv-tabs", p.className), role: "tablist" }, items.map(function (it) {
      return h("button", { key: it.value, type: "button", role: "tab", className: "tv-tab", "aria-selected": cur === it.value ? "true" : "false", onClick: function () { pick(it.value); } },
        it.icon ? h(Icon, { name: it.icon, size: 16 }) : null, it.label);
    }));
  }

  function StatTile(p) {
    return h("div", { className: cx("tv-stat", p.tone && p.tone !== "default" && "tv-stat-" + p.tone, p.className) },
      h("span", { className: "tv-stat-label" }, p.label),
      h("span", { className: "tv-stat-value" }, p.value));
  }

  function clamp(n) { n = Number(n) || 0; return Math.max(0, Math.min(100, n)); }
  function ProgressBar(p) {
    var v = clamp(p.value);
    return h("div", { className: cx("tv-progress", p.tone && p.tone !== "brand" && "tv-progress-" + p.tone, p.className), role: "progressbar", "aria-valuenow": v, "aria-valuemin": 0, "aria-valuemax": 100, "aria-label": p.label },
      h("span", { style: { width: v + "%" } }));
  }

  function ProgressRow(p) {
    var pct = p.total ? (p.count / p.total) * 100 : clamp(p.value);
    var shown = pct.toFixed(1).replace(".", ",") + "%";
    return h("div", { className: cx("tv-prow", p.className) },
      h(Badge, { code: true, tone: p.codeTone || "neutral" }, p.code),
      h("div", { style: { minWidth: 0 } }, h("div", { className: "tv-prow-title" }, p.title), p.subtitle ? h("div", { className: "tv-prow-sub" }, p.subtitle) : null),
      h(ProgressBar, { value: pct, tone: p.tone, label: p.title }),
      h("div", { className: "tv-prow-val" }, h("div", { className: "tv-prow-pct" }, shown), p.total ? h("div", { className: "tv-prow-frac" }, p.count + " / " + p.total) : null));
  }

  function NavItem(p) {
    return h("a", { href: p.href || "#", className: cx("tv-nav", p.className), "aria-current": p.active ? "page" : undefined, onClick: p.onClick },
      p.icon ? h(Icon, { name: p.icon }) : null, h("span", null, p.children),
      p.count != null ? h("span", { className: "tv-nav-count" }, p.count) : null);
  }

  function Modal(p) {
    return h("div", { className: "tv-modal-veil", style: p.inline ? null : { position: "fixed", inset: 0, zIndex: 50 } },
      h("div", { className: "tv-modal", role: "dialog", "aria-modal": "true", "aria-label": p.title },
        h("div", { className: "tv-modal-head" }, h("h3", { className: "tv-card-title" }, p.title),
          h(Button, { variant: "ghost", size: "sm", iconOnly: true, icon: "close", "aria-label": "Fechar", onClick: p.onClose })),
        h("div", { className: "tv-modal-body" }, p.children),
        p.footer ? h("div", { className: "tv-modal-foot" }, p.footer) : null));
  }

  window.Tov = Object.assign(window.Tov || {}, {
    Button: Button, Badge: Badge, Avatar: Avatar, Card: Card, Input: Input, Tabs: Tabs, StatTile: StatTile,
    ProgressBar: ProgressBar, ProgressRow: ProgressRow, NavItem: NavItem, Modal: Modal, Icon: Icon
  });
})();
