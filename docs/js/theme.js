//colors for the charts in light and dark mode (the page colors are in css/style.css)
//the names are kept from the python version: BLUE is the main chart color (charcoal now),
//ORANGE is the highlight color (red now), AQUA marks good days, YELLOW is a 4th category color
const PALETTE = {
  light: {
    BLUE: "#2b2b2b", ORANGE: "#d1342f", AQUA: "#6c757d", YELLOW: "#c97a76", GRAY: "#c4c4c4",
    FG: "#1a1a1a", MUTED: "#6b6b6b", PANEL: "#ffffff", LINE: "#e4e4e4", HEAD: "#111111", REF: "#a6a6a6",
  },
  dark: {
    BLUE: "#c9ccd1", ORANGE: "#ef4b45", AQUA: "#9aa1a8", YELLOW: "#e08a86", GRAY: "#5c5c5c",
    FG: "#ececec", MUTED: "#9e9e9e", PANEL: "#1c1c1c", LINE: "#2e2e2e", HEAD: "#f5f5f5", REF: "#5a5a5a",
  },
};

//the colors for the current mode, other files read C.BLUE, C.ORANGE...
export let C = PALETTE.light;

export function mode() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

//picks the colors for the mode the page is in
export function refresh() {
  C = PALETTE[mode()];
}

//dark mode button: switches the mode and remembers it in the browser for next time
export function toggleMode() {
  const next = mode() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("bk-theme", next); } catch (e) { /* private window, just dont remember it */ }
  refresh();
}
