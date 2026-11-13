//section 1: when is demand high (the weekday x hour heatmap with its time slot details, and the daily rhythm)
import { draw, hourLines } from "../charts.js";
import { DATA, hourOf, mean } from "../data.js";
import { barList, fdate, fint, fpct, fslot, head, hourExpr, legend, section } from "../format.js";
import { DAY_TYPES, FILTERS, WEEKDAY_NAMES, WEEKDAYS } from "../settings.js";
import { match, openDay, openSlot, set, state, toggle } from "../state.js";
import { C } from "../theme.js";

//the time slot that was open last time, so its details only slide in when a different slot opens
let shown = null;

export function render(v, el) {
  el.innerHTML = section(1, "When do people actually ride?", "sec-when",
    "Commuting shapes the week: working days spike at the morning and evening rush, weekends build to one broad " +
    "afternoon hump. Summer is the strongest season, and 2012 ran well ahead of 2011 in every month.") +
    `<div class="card">${head("The whole week, hour by hour",
      "Average rentals in each hour of each weekday. The stronger the color, the busier the hour. Click a time slot to see what drives it.")}
      <div class="chart" id="heat" style="min-height:250px"></div><div id="slot"></div></div>
    <div class="card">${head("A day in the life: workdays vs days off",
      "Average rentals per hour. Two sharp commuter peaks on working days; one broad midday hump on weekends.")}
      ${legend([[C.BLUE, "Working day", "ln"], [C.YELLOW, "Weekend", "ln"], [C.GRAY, "Holiday", "dash"]])}
      <div class="chart" id="profile" style="min-height:250px"></div></div>`;

  const slotEl = el.querySelector("#slot");
  if (state.slot) renderSlot(v, slotEl);
  else {
    shown = null;
    slotEl.innerHTML = `<div class="hint">Try the strongest cells around 8 AM and 5 PM on weekdays, or the empty early-morning hours.</div>`;
  }

  return Promise.all([
    draw(el.querySelector("#heat"), heatSpec(v), (d) => d.weekday && openSlot(d.weekday, d.hr)),
    draw(el.querySelector("#profile"), profileSpec(v)),
  ]);
}

//average rentals for every weekday and hour, using the filtered days
function heatSpec(v) {
  const cells = [];
  for (const wd of WEEKDAYS) {
    const days = v.d.filter((d) => d.weekday === wd);
    if (!days.length) continue;
    for (let h = 0; h < 24; h++) cells.push({ weekday: wd, hr: h, v: mean(days, (d) => hourOf(d, h, v.col)) });
  }
  const vmax = Math.max(...cells.map((c) => c.v)) || 1;
  for (const c of cells) {
    const busy = Math.sqrt(c.v / vmax) > 0.55; //the busy cells that are mostly filled in
    c.tc = busy ? C.PANEL : C.MUTED; //busy cells get numbers in the card color so they stand out in both modes
    c.label = fint(c.v);
    c.hrs = fslot(c.hr);
    c.sel = state.slot && state.slot[0] === c.weekday && state.slot[1] === c.hr; //the clicked cell gets an outline
  }
  const x = { field: "hr", type: "ordinal", title: null,
    axis: { orient: "top", labelAngle: 0, ticks: false, domain: false, labelOverlap: "greedy", labelExpr: `datum.value % 3 == 0 ? ${hourExpr()} : ''` } };
  const y = { field: "weekday", type: "ordinal", title: null, sort: WEEKDAYS, axis: { ticks: false, domain: false } };
  return { height: 230, data: { values: cells }, layer: [
    //busier hours are less see-through so they look stronger
    { mark: { type: "rect", color: C.BLUE, cornerRadius: 3, stroke: C.FG, cursor: "pointer" },
      encoding: { x, y, opacity: { field: "v", type: "quantitative", scale: { type: "sqrt", domain: [0, vmax], range: [0.03, 1] }, legend: null },
        strokeWidth: { condition: { test: "datum.sel", value: 2 }, value: 0 },
        tooltip: [{ field: "weekday", title: "Day" }, { field: "hrs", title: "Time" }, { field: "v", type: "quantitative", title: "Avg rentals", format: ",.0f" }] } },
    { mark: { type: "text", fontSize: 11 }, encoding: { x, y, text: { field: "label" }, color: { field: "tc", type: "nominal", scale: null } } },
  ] };
}

//---------- time slot details, open under the heatmap ----------
function renderSlot(v, el) {
  const [wd, h] = state.slot;
  const at = v.d.filter((d) => d.weekday === wd); //the filtered days on that weekday
  let body;
  if (!at.length) {
    body = `<p class="why">No days in the current filter fall on this weekday.</p>`;
  } else {
    const val = mean(at, (d) => hourOf(d, h, v.col)); //average rentals in this slot
    const ratio = val / (mean(v.d, (d) => d.act) / 24); //compared to an average hour
    const ratioTxt = ratio >= 0.1 ? ratio.toFixed(1) : ratio.toFixed(2); //2 decimals for the really quiet hours
    const reg = mean(at, (d) => hourOf(d, h, "registered")), cas = mean(at, (d) => hourOf(d, h, "casual"));
    //same slot split by season and by weather (clicking filters the page)
    const slotRows = (k) => {
      const [col, options] = FILTERS[k];
      return options.map((opt) => {
        const sub = DATA.days.filter((d) => match(d, k) && d.weekday === wd && d[col] === opt);
        const x = sub.length ? mean(sub, (d) => hourOf(d, h, v.col)) : null;
        return { label: opt, value: x || 0, text: fint(x), selected: state[k] === opt, muted: state[k] !== "all" && state[k] !== opt };
      });
    };
    const seasonRows = slotRows("season"), weatherRows = slotRows("weather");
    const mx = Math.max(...seasonRows.map((r) => r.value), ...weatherRows.map((r) => r.value)) || 1; //both lists share one scale
    //links to the busiest and quietest day in this slot
    let extremes = "";
    if (at.length > 1) {
      const hi = at.reduce((a, b) => (hourOf(b, h, v.col) > hourOf(a, h, v.col) ? b : a));
      const lo = at.reduce((a, b) => (hourOf(b, h, v.col) < hourOf(a, h, v.col) ? b : a));
      extremes = `<p class="note">Open the extremes: <button class="link" data-day="${hi.date}">Busiest: ${fdate(hi.date)} (${fint(hourOf(hi, h, v.col))})</button>
        · <button class="link" data-day="${lo.date}">Quietest: ${fdate(lo.date)} (${fint(hourOf(lo, h, v.col))})</button></p>`;
    }
    body = `<p class="why">About ${fint(val)} rentals in this hour on average, ${ratioTxt}× an average hour in this view. ` +
      (ratio >= 2 ? "A peak slot: bikes should be in place before it starts." : ratio <= 0.25 ?
        "One of the quietest slots: a good window for repairs and rebalancing." : "A middling slot.") + `</p>
      <div class="grid3">
        <div><p class="note">Who rides in this slot</p>${barList([
          { label: "Registered", value: reg, text: fint(reg), sub: fpct(reg / (reg + cas || 1)), color: C.BLUE },
          { label: "Casual", value: cas, text: fint(cas), sub: fpct(cas / (reg + cas || 1)), color: C.ORANGE }])}</div>
        <div><p class="note">Same slot by season (rentals per hour)</p>${barList(seasonRows, mx, "season")}</div>
        <div><p class="note">Same slot by weather (rentals per hour)</p>${barList(weatherRows, mx, "weather")}</div>
      </div>${extremes}`;
  }
  const fresh = shown !== `${wd} ${h}`;
  shown = `${wd} ${h}`;
  el.innerHTML = `<div class="detail${fresh ? " enter" : ""}"><div class="detail-h"><span class="h4">${WEEKDAY_NAMES[wd]}, ${fslot(h)}</span>
    <span class="spacer"></span><button class="btn" id="slot-close">Close ×</button></div>${body}</div>`;
  el.querySelector("#slot-close").addEventListener("click", () => set({ slot: null }));
  el.querySelectorAll("button.hb").forEach((b) => b.addEventListener("click", () => toggle(b.dataset.k, b.dataset.v)));
  el.querySelectorAll("[data-day]").forEach((b) => b.addEventListener("click", () =>
    openDay(b.dataset.day, true, "Opened in the daily chart in the Overview")));
}

//average hourly rentals for each day type (skips the day type filter so all 3 lines stay on the chart)
function profileSpec(v) {
  const pool = DATA.days.filter((d) => match(d, "daytype"));
  const rows = [];
  for (const t of DAY_TYPES) {
    const days = pool.filter((d) => d.day_type === t);
    if (!days.length) continue;
    for (let h = 0; h < 24; h++) rows.push({ hr: h, series: t, value: mean(days, (d) => hourOf(d, h, v.col)) });
  }
  //handwritten notes on the two rush hours of the working day line
  const work = rows.filter((r) => r.series === "Working day");
  const peak = (from, to) => work.filter((r) => r.hr >= from && r.hr < to).reduce((a, b) => (b.value > a.value ? b : a));
  const notes = work.length ? [{ ...peak(0, 12), text: "morning rush" }, { ...peak(12, 24), text: "evening rush" }] : [];
  return hourLines(rows, { "Working day": C.BLUE, "Weekend": C.YELLOW, "Holiday": C.GRAY }, { dashed: ["Holiday"], notes });
}
