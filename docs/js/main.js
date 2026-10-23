//starts the dashboard: loads the data, then draws the page and redraws it whenever something changes
//the code is split up like the python version:
//  settings.js  the filter choices and limits        theme.js   colors for light and dark mode
//  data.js      loads the data, numbers for filters  state.js   what the page remembers and what clicks do
//  charts.js    chart helpers (vega-lite)            format.js  number formatting and small html helpers
//  stats.js     percentiles, skewness, correlation   sections/  one file per part of the page
import { build, load } from "./data.js";
import { onChange, ui } from "./state.js";
import { refresh } from "./theme.js";
import * as overview from "./sections/overview.js";
import * as daily from "./sections/daily.js";
import * as when from "./sections/when.js";
import * as disrupt from "./sections/disrupt.js";
import * as riders from "./sections/riders.js";
import * as eda from "./sections/eda.js";
import * as footer from "./sections/footer.js";

const $ = (id) => document.getElementById(id);
let drawing = false, again = false;

//draws the whole page for the current filters
async function render() {
  if (drawing) { again = true; return; } //a click came in while drawing, draw once more after
  drawing = true;
  refresh(); //light or dark colors
  const v = build(); //filtered days and everything the sections need
  const page = $("page");
  const scrollY = window.scrollY;
  page.style.minHeight = page.offsetHeight + "px"; //keeps the page tall while it redraws so it doesnt jump

  overview.renderHead(v, $("head"));
  overview.renderFilters(v, $("filters"), render);
  //one box per part of the page, in order from top to bottom
  page.innerHTML = overview.overviewHtml(v) +
    (v.d.length ? `<div id="p-daily"></div><div id="p-when"></div><div id="p-disrupt"></div><div id="p-riders"></div><div id="p-eda"></div>` : "") +
    `<div id="p-footer"></div>`;
  const jobs = [];
  if (v.d.length) {
    jobs.push(daily.render(v, $("p-daily")), when.render(v, $("p-when")), disrupt.render(v, $("p-disrupt")),
      riders.render(v, $("p-riders")), eda.render(v, $("p-eda")));
  }
  jobs.push(footer.render(v, $("p-footer")));
  window.scrollTo(0, scrollY);
  try { await Promise.all(jobs); } catch (e) { console.error(e); }

  page.style.minHeight = "";
  if (ui.scrollTo) { $(ui.scrollTo)?.scrollIntoView({ block: "start" }); ui.scrollTo = null; } //like after clicking a table row
  else window.scrollTo(0, scrollY);
  drawing = false;
  if (again) { again = false; render(); }
}

async function start() {
  try {
    await load();
  } catch (e) {
    $("page").innerHTML = `<div class="warn">Couldn't load the data. If you opened index.html straight from your files, start a small
      web server instead (see the README), because browsers block loading data files that way.</div>`;
    return;
  }
  onChange(render);
  render();
}

start();
