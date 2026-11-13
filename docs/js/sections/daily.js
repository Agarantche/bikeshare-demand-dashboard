//daily rentals chart (actual vs expected) and the day details that open under it
import { draw, hand } from "../charts.js";
import { DATA, hourOf, mean } from "../data.js";
import { esc, fdate, fhour, fint, fspct, head, hourExpr, legend } from "../format.js";
import { ABOVE, DISRUPTED, MONTHS, RIDERS } from "../settings.js";
import { openDay, set, state } from "../state.js";
import { C } from "../theme.js";

//date text at noon so the browser never shifts it to the day before because of time zones
const noon = (date) => date + "T12:00:00";

//the day that was open last time, so the details only slide in when a different day opens (not on every redraw)
let shown = null;

export function render(v, el) {
  const anyFilter = v.anyFilter;
  el.innerHTML = `<div class="card" id="daily">
    ${head("Every single day, actual vs expected",
      "Expected is what the machine learning model predicts for a day with that weather, temperature, month and day type. Hover for numbers; click any day to see what happened.")}
    ${legend([[C.BLUE, "Actual", "ln"], [C.GRAY, "Expected", "ln"], [C.ORANGE, "Disrupted (&gt;50% below)", ""], [C.AQUA, "Well above (&gt;30%)", ""]]
      .concat(anyFilter ? [[C.BLUE, "Days in your filter", ""]] : []))}
    <div class="chart" id="daily-chart" style="min-height:340px"></div>
    <div id="day-detail"></div></div>`;
  const chartEl = el.querySelector("#daily-chart");
  const jobs = [draw(chartEl, dailySpec(v, chartEl.clientWidth), (d) => d.date && openDay(d.date))];
  if (state.openDay) jobs.push(renderDay(v, el.querySelector("#day-detail")));
  else shown = null;
  return Promise.all(jobs);
}

function dailySpec(v, widthPx) {
  //every day goes on the chart, the filter only fades the line and adds dots
  const D = v.all.map((d) => ({ date: d.date, dt: noon(d.date), act: d.act, exp: d.exp, gap: d.gap, weather: d.weather,
    temp: d.temp_f, day_type: d.day_type, event: d.event, year: d.year, inView: d.inView }));
  const ymax = Math.max(...D.map((d) => Math.max(d.act, d.exp))); //highest point on the chart
  const lanes = [ymax * 1.30, ymax * 1.19, ymax * 1.08]; //3 rows of labels above the lines
  const yScale = { domain: [0, ymax * 1.33] }; //extra room at the top for the labels
  const ticks = []; for (let t = 0; t <= ymax; t += ymax > 4000 ? 2000 : 500) ticks.push(t);
  const xAxis = { format: "%b %Y", tickCount: 8, grid: false, title: null };
  const yAxis = { values: ticks, format: ",.0f", title: null };
  const x = { field: "dt", type: "temporal", axis: xAxis };
  const y = { field: "act", type: "quantitative", scale: yScale, axis: yAxis };

  //the dots only go on days that match the filters
  const V = D.filter((d) => d.inView);
  const flags = V.filter((d) => d.gap <= DISRUPTED || d.gap >= ABOVE)
    .map((d) => ({ ...d, fcolor: d.gap <= DISRUPTED ? C.ORANGE : C.AQUA, fsize: d.gap <= DISRUPTED ? 55 : 35 }));

  //labels: one per event (on its worst day), plus the best and the lowest day in view
  const labels = [];
  const groups = {};
  for (const d of V.filter((d) => d.event)) {
    const k = d.event + " " + d.year;
    if (!groups[k] || d.act < groups[k].act) groups[k] = d;
  }
  for (const d of Object.values(groups)) labels.push({ row: d, text: d.event + (d.event === "Christmas week" ? " " + d.year : ""), strong: false });
  if (V.length) {
    const best = V.reduce((a, b) => (b.act > a.act ? b : a)), low = V.reduce((a, b) => (b.act < a.act ? b : a));
    labels.push({ row: best, text: `Best day · ${fint(best.act)}`, strong: true });
    const lowLabel = labels.find((l) => l.row.date === low.date);
    if (lowLabel) lowLabel.text += ` · ${fint(low.act)}`;
    else labels.push({ row: low, text: `Lowest day · ${fint(low.act)}`, strong: true });
  }
  //puts each label in the first row where it doesnt overlap (~7.5px per letter). labels on the left half
  //start at their day and labels on the right half end at their day, so none run off the edge
  const width = Math.max(300, (widthPx || 900) - 60);
  const t0 = Date.parse(D[0].dt), span = Date.parse(D[D.length - 1].dt) - t0;
  const ends = lanes.map(() => -1e9);
  const ann = [];
  for (const l of labels.sort((a, b) => a.row.date.localeCompare(b.row.date))) {
    const cx = (Date.parse(l.row.dt) - t0) / span * width;
    const tw = l.text.length * 7.5;
    const align = cx < width / 2 ? "left" : "right";
    const left = align === "left" ? cx : cx - tw;
    const lane = ends.findIndex((e) => e + 8 < left); //first row with room
    if (lane < 0) continue; //no room in any row, skip this label
    ends[lane] = left + tw;
    ann.push({ date: l.row.date, dt: l.row.dt, align, lane: lanes[lane], top: lanes[lane] - ymax * 0.02,
      bottom: l.row.act + ymax * 0.03, text: l.text, strong: l.strong });
  }

  //the chart is built in layers stacked on top of each other
  const layers = [
    { data: { values: D }, mark: { type: "line", color: C.BLUE, strokeWidth: 1.25, opacity: anyFilterOpacity(v) }, encoding: { x, y } },
    { data: { values: D }, mark: { type: "line", color: C.GRAY, strokeWidth: 1.5, opacity: 0.9 },
      encoding: { x, y: { field: "exp", type: "quantitative", scale: yScale, axis: yAxis } } },
  ];
  if (v.anyFilter) layers.push({ data: { values: V }, mark: { type: "circle", color: C.BLUE, size: 14, opacity: 1 }, encoding: { x, y } });
  layers.push({ data: { values: flags }, mark: { type: "circle", opacity: 1, stroke: C.PANEL, strokeWidth: 1 },
    encoding: { x, y, color: { field: "fcolor", type: "nominal", scale: null }, size: { field: "fsize", type: "quantitative", scale: null } } });
  if (ann.length) {
    //dashed lines from the labels down to their day, then the label text in handwriting
    layers.push({ data: { values: ann }, mark: { type: "rule", color: C.PEN, opacity: 0.6, strokeDash: [2, 3] },
      encoding: { x, y: { field: "top", type: "quantitative", scale: yScale, axis: yAxis }, y2: { field: "bottom" } } });
    for (const strong of [false, true]) {
      for (const align of ["left", "right"]) {
        const part = ann.filter((a) => a.strong === strong && a.align === align);
        if (part.length) layers.push({ data: { values: part },
          mark: { type: "text", ...hand(strong ? 21 : 19), align, dx: align === "left" ? 4 : -4, baseline: "bottom" },
          encoding: { x, y: { field: "lane", type: "quantitative", scale: yScale, axis: yAxis }, text: { field: "text" } } });
      }
    }
  }
  //the open day gets a dark line and a ring
  const open = D.find((d) => d.date === state.openDay);
  if (open) {
    layers.push({ data: { values: [{ ...open, top: ymax * 1.05 }] }, mark: { type: "rule", color: C.FG, strokeWidth: 1.5 },
      encoding: { x, y: { field: "top", type: "quantitative", scale: yScale, axis: yAxis }, y2: { datum: 0 } } });
    layers.push({ data: { values: [open] }, mark: { type: "point", color: C.FG, size: 110, strokeWidth: 2, filled: false }, encoding: { x, y } });
  }
  //invisible layer on every day that handles hovering and clicking
  layers.push({ data: { values: D },
    params: [{ name: "hover", select: { type: "point", on: "pointerover", nearest: true, fields: ["date"], clear: "pointerout" } }],
    mark: { type: "rule", color: C.REF, cursor: "pointer" },
    encoding: { x, opacity: { condition: { param: "hover", empty: false, value: 1 }, value: 0 },
      tooltip: [{ field: "dt", type: "temporal", title: "Date", format: "%a %b %d, %Y" }, { field: "event", title: "Event" },
        { field: "act", type: "quantitative", title: "Actual", format: ",.0f" }, { field: "exp", type: "quantitative", title: "Expected", format: ",.0f" },
        { field: "weather", title: "Weather" }, { field: "temp", type: "quantitative", title: "Temp (°F)", format: ".0f" },
        { field: "day_type", title: "Day type" }] } });
  return { height: 320, layer: layers };
}

//the actual line fades when a filter is set, so the filter dots stand out
function anyFilterOpacity(v) { return v.anyFilter ? 0.22 : 0.95; }

//---------- day details, opens under the chart ----------
function renderDay(v, el) {
  const days = DATA.days;
  const i = days.findIndex((d) => d.date === state.openDay);
  if (i < 0) return null;
  const o = days[i];
  const col = v.col;

  //the sentence explaining the day
  const gap = o.gap, w = o.weather.toLowerCase(), s = o.season.toLowerCase(), t = o.day_type.toLowerCase();
  let why;
  if (gap < -0.5) why = `${Math.round(Math.abs(gap) * 100)}% below what a ${w} ${s} ${t} normally brings` +
    (o.event ? ` — ${o.event}.` : ". Something beyond the weather kept riders away.");
  else if (gap < -0.15) why = `${Math.round(Math.abs(gap) * 100)}% below expected` +
    (o.event ? ` — ${o.event}.` : o.weather === "Rain/snow" ? ", with rain or snow during the day." : ".");
  else if (gap > 0.3) why = `${Math.round(gap * 100)}% above expected — a standout day for its season and weather.`;
  else why = "A normal day: within the usual range of what was expected.";

  //compares temperature and humidity with the rest of that month
  const month = days.filter((d) => d.year === o.year && d.mnth === o.mnth);
  const mt = mean(month, (d) => d.temp_f), mh = mean(month, (d) => d.humidity);
  const tempWord = o.temp_f > mt + 5 ? "warm for the month" : o.temp_f < mt - 5 ? "cold for the month" : "normal for the month";
  const humWord = o.humidity > mh + 12 ? "more humid than usual" : o.humidity < mh - 12 ? "drier than usual" : "usual for the month";
  const allGap = o.cnt / o.expected_cnt - 1;
  const gapColor = allGap < -0.15 ? "var(--bad)" : allGap > 0.15 ? "var(--ok)" : "var(--fg)";
  const riderWord = state.rider === "all" ? "all" : RIDERS[state.rider].toLowerCase();

  const fresh = shown !== o.date;
  shown = o.date;
  el.innerHTML = `<div class="detail${fresh ? " enter" : ""}">
    <div class="detail-h"><span class="h4">${fdate(o.date, true)}</span>${o.event ? `<span class="pill">${esc(o.event)}</span>` : ""}
      <span class="note" style="margin:0">${o.day_type} · ${o.season}</span><span class="spacer"></span>
      <button class="btn" id="dd-prev" ${i === 0 ? "disabled" : ""}>‹ Prev</button>
      <button class="btn" id="dd-next" ${i === days.length - 1 ? "disabled" : ""}>Next ›</button>
      <button class="btn" id="dd-close">Close ×</button></div>
    <p class="why">${why}</p>
    <div class="stats">
      <div class="stat"><span class="stat-l">All rentals</span><span class="stat-v">${fint(o.cnt)}</span>
        <span class="stat-s">expected ${fint(o.expected_cnt)} · <b style="color:${gapColor}">${fspct(allGap)}</b></span></div>
      <div class="stat"><span class="stat-l">Registered</span><span class="stat-v">${fint(o.registered)}</span><span class="stat-s">expected ${fint(o.expected_registered)}</span></div>
      <div class="stat"><span class="stat-l">Casual</span><span class="stat-v">${fint(o.casual)}</span><span class="stat-s">expected ${fint(o.expected_casual)}</span></div>
      <div class="stat"><span class="stat-l">Weather</span><span class="stat-v" style="font-size:16px">${o.weather}</span>
        <span class="stat-s">${Math.round(o.temp_f)}°F (feels ${Math.round(o.feels_like_f)}°F) · ${tempWord}</span></div>
      <div class="stat"><span class="stat-l">Humidity · wind</span><span class="stat-v" style="font-size:16px">${Math.round(o.humidity)}% · ${Math.round(o.wind)} mph</span>
        <span class="stat-s">${humWord}</span></div>
    </div>
    ${legend([[C.BLUE, `This day (${riderWord} riders)`, "sq"], [C.GRAY, `Typical ${MONTHS[o.mnth - 1]} ${o.year} ${t}`, "ln"]])}
    <div class="chart" id="dd-chart" style="min-height:200px"></div></div>`;

  el.querySelector("#dd-prev").addEventListener("click", () => set({ openDay: days[i - 1].date }));
  el.querySelector("#dd-next").addEventListener("click", () => set({ openDay: days[i + 1].date }));
  el.querySelector("#dd-close").addEventListener("click", () => set({ openDay: null }));

  //this day's hours as bars, a typical day like it (same month, year and day type) as a line
  const same = days.filter((d) => d.year === o.year && d.mnth === o.mnth && d.day_type === o.day_type && d.date !== o.date);
  const H = Array.from({ length: 24 }, (_, h) => ({ hr: h, time: fhour(h), day: hourOf(o, h, col), typ: mean(same, (d) => hourOf(d, h, col)) ?? 0 }));
  const hx = { field: "hr", type: "ordinal", title: null, axis: { labelAngle: 0, labelExpr: `datum.value % 3 == 0 ? ${hourExpr()} : ''` } };
  const tip = [{ field: "time", type: "nominal", title: "Time" }, { field: "day", type: "quantitative", title: "This day", format: ",.0f" },
    { field: "typ", type: "quantitative", title: "Typical", format: ",.0f" }];
  return draw(el.querySelector("#dd-chart"), { height: 180, data: { values: H }, layer: [
    { mark: { type: "bar", color: C.BLUE, cornerRadius: 3 }, encoding: { x: hx, y: { field: "day", type: "quantitative", title: null, axis: { format: ",.0f", tickCount: 3 } }, tooltip: tip } },
    { mark: { type: "line", color: C.GRAY, strokeWidth: 2, strokeCap: "round" }, encoding: { x: hx, y: { field: "typ", type: "quantitative", title: null } } },
  ] });
}
