//starts the dashboard: loads the data, then draws the open part of the page and redraws it whenever something changes
//the code is split up like the python version:
//  settings.js  the filter choices and limits        theme.js   colors for light and dark mode
//  data.js      loads the data, numbers for filters  state.js   what the page remembers and what clicks do
//  charts.js    chart helpers (vega-lite)            format.js  number formatting and small html helpers
//  stats.js     percentiles, skewness, correlation   sections/  one file per part of the page
import { build, load } from "./data.js";
import { onChange, readHash, set, state, ui } from "./state.js";
import { refresh } from "./theme.js";
import * as nav from "./sections/nav.js";
import * as home from "./sections/home.js";
import * as overview from "./sections/overview.js";
import * as daily from "./sections/daily.js";
import * as when from "./sections/when.js";
import * as disrupt from "./sections/disrupt.js";
import * as riders from "./sections/riders.js";
import * as eda from "./sections/eda.js";
import * as footer from "./sections/footer.js";

//what each part of the page shows, top to bottom (only the open part gets drawn)
const VIEWS = {
  home: [home], overview: [overview, daily], when: [when], disrupt: [disrupt], riders: [riders], analysis: [eda], data: [footer],
};

const $ = (id) => document.getElementById(id);
let drawing = false, again = false, lastView = null, lastLab = null, settle = null;

//draws the open part of the page for the current filters
async function render() {
  if (drawing) { again = true; return; } //a click came in while drawing, draw once more after
  drawing = true;
  refresh(); //light or dark colors
  const v = build(); //filtered days and everything the sections need
  const page = $("page");
  const newView = state.view !== lastView;
  const turned = newView || state.lab !== lastLab; //a new part, or a different lab inside the analysis
  const scrollY = turned ? 0 : window.scrollY; //a new part or lab starts at the top
  page.style.minHeight = turned ? "" : page.offsetHeight + "px"; //keeps the page tall while it redraws so it doesnt jump
  //the small journal animations (circles drawing, notes writing in) only play when a part opens, see style.css
  page.classList.toggle("opening", newView);
  page.classList.toggle("turned", turned);
  clearTimeout(settle);
  settle = setTimeout(() => page.classList.remove("opening", "turned"), 1800);
  lastView = state.view;
  lastLab = state.lab;

  nav.render(v, $("side"), render);
  $("filters").hidden = state.view === "home"; //the home page always shows everything
  if (state.view !== "home") overview.renderFilters(v, $("filters"));
  //the overview shows its own message when no days match, the other parts just show nothing
  const parts = state.view === "overview" || state.view === "home" || v.d.length ? VIEWS[state.view] : [];
  if (newView) { page.classList.remove("fade"); void page.offsetWidth; page.classList.add("fade"); } //a quick fade in when a new part opens
  page.innerHTML = parts.map((_, i) => `<div id="p-${i}"></div>`).join("") +
    (parts.length ? "" : `<div class="warn">No days match these filters. Change one of them or click <b>Reset</b>.</div>`);
  $("foot").innerHTML = footer.footerHtml();
  const jobs = parts.map((p, i) => p.render(v, $("p-" + i)));
  const jump = () => window.scrollTo({ top: scrollY, behavior: "instant" }); //straight there, no sliding
  jump();
  try { await Promise.all(jobs); } catch (e) { console.error(e); }

  page.style.minHeight = "";
  if (ui.scrollTo) { $(ui.scrollTo)?.scrollIntoView({ block: "start", behavior: "instant" }); ui.scrollTo = null; } //like after clicking a table row
  else jump();
  drawing = false;
  if (again) { again = false; render(); }
}

async function start() {
  try {
    //waits for the 3 fonts too, so the charts measure their text with the right font the first time
    const fonts = ["600 16px Fraunces", "16px Karla", "700 16px Caveat"].map((f) => document.fonts.load(f).catch(() => {}));
    await Promise.all([load(), ...fonts]);
  } catch (e) {
    $("page").innerHTML = `<div class="warn">Couldn't load the data. If you opened index.html straight from your files, start a small
      web server instead, because browsers block loading data files that way.</div>`;
    return;
  }
  Object.assign(state, readHash()); //opens the part in the address, like #when
  onChange(render);
  window.addEventListener("popstate", () => set(readHash())); //back and forward buttons
  //the filter bar gets a soft shadow once the page scrolls under it
  window.addEventListener("scroll", () => $("filters").classList.toggle("stuck", window.scrollY > 4), { passive: true });
  render();
}

start();
