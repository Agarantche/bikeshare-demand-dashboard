//the filter bar at the top, and the overview: the summary sentence, the 4 number cards (the daily chart is daily.js)
import { mean, hourlyAverage } from "../data.js";
import { fint, fspct, fpct, section } from "../format.js";
import { FILTERS, RIDERS } from "../settings.js";
import { resetFilters, set, state } from "../state.js";

//average per day in each year and the growth from 2011 to 2012
function perYear(days) {
  const out = {};
  for (const y of [2011, 2012]) out[y] = mean(days.filter((d) => d.year === y), (d) => d.act);
  out.yoy = out[2011] && out[2012] ? out[2012] / out[2011] - 1 : null;
  return out;
}

//filter bar: rider type buttons, one dropdown per filter, reset, how many days are showing
export function renderFilters(v, el) {
  const seg = Object.entries(RIDERS).map(([k, label]) =>
    `<button data-rider="${k}" aria-pressed="${state.rider === k}">${label}</button>`).join("");
  const selects = Object.entries(FILTERS).map(([k, [, options, allLabel]]) =>
    `<select class="sel${state[k] !== "all" ? " on" : ""}" data-k="${k}" aria-label="${allLabel}">
      <option value="all">${allLabel}</option>${options.map((o) => `<option ${String(o) === state[k] ? "selected" : ""}>${o}</option>`).join("")}
    </select>`).join("");
  el.innerHTML = `<div class="seg" role="group" aria-label="Rider type">${seg}</div>${selects}
    <button class="btn" id="reset" ${v.anyFilter ? "" : "disabled"}>Reset</button>
    <span class="showing">${v.anyFilter ? `Showing ${v.d.length.toLocaleString()} of ${v.all.length.toLocaleString()} days` : "Showing all 731 days"}</span>`;

  el.querySelectorAll("[data-rider]").forEach((b) => b.addEventListener("click", () => set({ rider: b.dataset.rider })));
  el.querySelectorAll("select").forEach((s) => s.addEventListener("change", () => set({ [s.dataset.k]: s.value })));
  el.querySelector("#reset").addEventListener("click", resetFilters);
}

//the overview heading, the summary sentence and the 4 number cards
export function render(v, el) {
  const d = v.d;
  if (!d.length) {
    el.innerHTML = section("Overview", "The whole picture at a glance", "sec-overview", "") +
      `<div class="warn">No days match these filters. Change one of them or click <b>Reset</b>.</div>`;
    return Promise.resolve();
  }
  const py = perYear(d);
  const hourly = hourlyAverage(d, v.col);
  const peak = hourly.indexOf(Math.max(...hourly));
  const ratio = Math.max(...hourly) / mean(hourly);
  //registered share of rides (casual share if casual riders are picked)
  const shareCol = state.rider === "casual" ? "casual" : "registered";
  const share = (days) => days.length ? days.reduce((s, x) => s + x[shareCol], 0) / days.reduce((s, x) => s + x.cnt, 0) : null;
  const lost = v.disrupted.reduce((s, x) => s + (x.exp - x.act), 0);
  const total = d.reduce((s, x) => s + x.act, 0);
  const yoyChip = py.yoy != null ? `<span class="chip ${py.yoy >= 0 ? "good" : "bad"}">${fspct(py.yoy)}</span>` : "";
  const text = `Bikes average <b>${fint(mean(d, (x) => x.act))}</b> rentals a day in this view` +
    (py.yoy != null ? ` (${fspct(py.yoy)} in 2012 vs 2011)` : "") + `, busiest at <b>${peak}:00</b>. Capital Bikeshare, Washington DC, 2011–2012.`;

  el.innerHTML = section("Overview", "The whole picture at a glance", "sec-overview", text) + `
  <div class="kpis">
    <div class="kpi"><span class="kpi-l">Average rentals per day</span><span class="kpi-v">${fint(mean(d, (x) => x.act))}</span>
      <span class="kpi-s">2011 → 2012: ${fint(py[2011])} → ${fint(py[2012])} ${yoyChip}</span></div>
    <div class="kpi"><span class="kpi-l">Busiest hour</span><span class="kpi-v">${peak}:00</span>
      <span class="kpi-s">${ratio.toFixed(1)}× an average hour</span></div>
    <div class="kpi"><span class="kpi-l">${shareCol === "casual" ? "Casual" : "Registered"} share of rides</span><span class="kpi-v">${fpct(share(d))}</span>
      <span class="kpi-s">Working days <b>${fpct(share(d.filter((x) => x.day_type === "Working day")))}</b> · weekends <b>${fpct(share(d.filter((x) => x.day_type === "Weekend")))}</b></span></div>
    <div class="kpi"><span class="kpi-l">Disrupted days (&gt;50% below expected)</span><span class="kpi-v">${v.disrupted.length}</span>
      <span class="kpi-s">≈ ${fint(lost)} rentals lost · <span class="chip bad">${fpct(lost / total, 1)}</span> of all rentals</span></div>
  </div>`;
  return Promise.resolve();
}
