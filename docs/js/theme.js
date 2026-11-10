//colors for the charts in light and dark mode (the page colors are in css/style.css)
//the charts are drawn with the same pens as the journal. the names are kept from the python version:
//BLUE is the main chart color (blue ink), ORANGE is the highlight color (red pen), AQUA marks good days (green pen),
//YELLOW is a 4th category color (amber), GRAY is pencil, PEN is the red used for handwritten notes on the charts
//RAMP is for ordered categories from light to strong (clear -> rain, low -> high demand), ON_ACC is text on the red
const PALETTE = {
  light: {
    BLUE: "#2f4b7c", ORANGE: "#c0392b", AQUA: "#3d8f6a", YELLOW: "#a8690a", GRAY: "#8a8473", PEN: "#b3301f",
    RAMP: ["#a5bbdd", "#4a6aa5", "#c0392b"], ON_ACC: "#ffffff",
    FG: "#2b2a26", MUTED: "#655f52", PANEL: "#fffdf7", LINE: "#e0d9c6", HEAD: "#1c1b18", REF: "#b5ad9c",
  },
  dark: {
    BLUE: "#9db8e8", ORANGE: "#ff8370", AQUA: "#8fd4ae", YELLOW: "#f2c94c", GRAY: "#8f887a", PEN: "#ff9a85",
    RAMP: ["#5d7bb0", "#a9c1ea", "#ff8370"], ON_ACC: "#1d1b18",
    FG: "#f1ead9", MUTED: "#b5ad9c", PANEL: "#282521", LINE: "#423d35", HEAD: "#fffaf0", REF: "#5e574c",
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
  const root = document.documentElement;
  root.classList.add("theme-anim"); //fades the page colors over instead of snapping (see .theme-anim in style.css)
  setTimeout(() => root.classList.remove("theme-anim"), 400);
  root.dataset.theme = next;
  try { localStorage.setItem("bk-theme", next); } catch (e) { /* private window, just dont remember it */ }
  refresh();
}
