//what the page remembers between clicks (filters, open day, open time slot) and what clicks do
import { FILTERS } from "./settings.js";

//first time the page loads nothing is filtered or open
export const state = { rider: "all", year: "all", season: "all", daytype: "all", weather: "all", openDay: null, slot: null };

//main.js gives us its function that redraws the page
let redraw = () => {};
export function onChange(fn) { redraw = fn; }

//changes some of the state and redraws the page
export function set(patch) {
  Object.assign(state, patch);
  redraw();
}

//clicking something that is already picked turns that filter off again
export function toggle(k, v) {
  set({ [k]: state[k] === String(v) ? "all" : String(v) });
}

//reset button, puts every filter back to all
export function resetFilters() {
  const patch = {};
  for (const k in FILTERS) patch[k] = "all";
  set(patch);
}

export function anyFilter() {
  return Object.keys(FILTERS).some((k) => state[k] !== "all");
}

//true if a day matches the filters, skip leaves one filter out
export function match(d, skip) {
  return Object.entries(FILTERS).every(([k, [col]]) => k === skip || state[k] === "all" || String(d[col]) === state[k]);
}

//where to scroll after the page redraws (main.js reads it), so jumping waits until the page is ready
export const ui = { scrollTo: null };

//opens a day in the day details under the daily chart, scroll=true jumps up to it
export function openDay(date, scroll = false, note = null) {
  if (scroll) ui.scrollTo = "daily";
  set({ openDay: date });
  if (note) toast(note);
}

//opens a weekday and hour under the heatmap
export function openSlot(wd, h) {
  set({ slot: [wd, h] });
}

//small message at the bottom of the screen that fades away
export function toast(text) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2500);
}
