//colors for the charts in light and dark mode (the page colors are in css/style.css)
//the names are kept from the python version: BLUE is the main chart color (steel blue in light mode, light blue in dark),
//ORANGE is the highlight color (coral), AQUA marks good days (green), YELLOW is a 4th category color (a deeper coral)
//RAMP is for ordered categories from light to strong (clear -> rain, low -> high demand), ON_ACC is text on coral
const PALETTE = {
  light: {
    BLUE: "#3d5a80", ORANGE: "#ee6c4d", AQUA: "#3a9b7a", YELLOW: "#d4573a", GRAY: "#7d8999",
    RAMP: ["#98c1d9", "#3d5a80", "#ee6c4d"], ON_ACC: "#1b2230",
    FG: "#293241", MUTED: "#55606f", PANEL: "#ffffff", LINE: "#d7e3e8", HEAD: "#1b2230", REF: "#9aa7b5",
  },
  dark: {
    BLUE: "#98c1d9", ORANGE: "#ee6c4d", AQUA: "#7fd1ae", YELLOW: "#f59a82", GRAY: "#7f8ca0",
    RAMP: ["#6b8bb3", "#98c1d9", "#ee6c4d"], ON_ACC: "#1b2230",
    FG: "#e0fbfc", MUTED: "#a9b8c6", PANEL: "#293241", LINE: "#3a465a", HEAD: "#f4feff", REF: "#56637a",
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
