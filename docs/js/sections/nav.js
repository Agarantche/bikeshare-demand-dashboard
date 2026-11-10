//the sidebar: the menu that opens each part of the page, the dark mode button and the signature
//on a phone it turns into a menu bar across the top (see .side in style.css)
import { go, state } from "../state.js";
import { mode, toggleMode } from "../theme.js";
import { LABS } from "./eda.js";

//the part that was open last time, so the highlighter only swipes across a newly opened one
let shown = null;

//[view, little badge, name in the menu]
const ITEMS = [
  ["home", "⌂", "Home"],
  ["overview", "◉", "Overview"],
  ["when", "1", "When do people ride?"],
  ["disrupt", "2", "What throws it off?"],
  ["riders", "3", "Who's riding?"],
  ["analysis", "4", "Showing my work (labs)"],
  ["data", "≡", "Data table"],
];

export function render(v, el, redraw) {
  const item = ([view, badge, name]) => `<button class="nav-i${state.view === view ? " on" + (view !== shown ? " swipe" : "") : ""}" data-go="${view}">
    <span class="nav-n">${badge}</span><span>${name}</span></button>`;
  //the lab parts show under analysis while its open
  const labs = state.view === "analysis" ? LABS.map(([n, lab, name]) =>
    `<button class="nav-i nav-sub${state.lab === n ? " on" : ""}" data-go="analysis" data-lab="${n}">4.${n} ${name} <small>${lab}</small></button>`).join("") : "";
  const html = ITEMS.map((it) => item(it) + (it[0] === "analysis" ? labs : "")).join("");
  shown = state.view;
  const dark = mode() === "dark";
  el.innerHTML = `<div class="brand"><span class="brand-i">🚲</span><div><b>Bike-share demand</b><small>a ride journal, 2011–2012</small></div></div>
    <nav class="side-nav" aria-label="Parts of the dashboard">${html}</nav>
    <div class="side-foot">
      <button class="btn" id="theme" title="Switch between light and dark mode" aria-label="Switch to ${dark ? "light" : "dark"} mode">${dark ? "☀ Day ride" : "☾ Night ride"}</button>
      <span class="credit">kept by</span><span class="sig">Adam Garantche</span>
    </div>`;
  el.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go, b.dataset.lab ? +b.dataset.lab : null)));
  el.querySelector("#theme").addEventListener("click", () => { toggleMode(); redraw(); }); //no reload needed, filters stay
}
