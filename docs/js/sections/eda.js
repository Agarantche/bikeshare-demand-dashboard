//section 4: exploratory data analysis, set up like the sample final report's section 5 (here 4.1 to 4.8)
//each part is one task from the analysis plan and uses what we learned in one course lab (lab 2 to lab 9)
//only one part shows at a time (state.lab), picked with the lab buttons, the sidebar or previous / next
//every chart has a headline title and a "Figure N." caption, with a one line takeaway and the full explanation under "Read more"
//it uses the filtered days and the picked rider type, so the numbers change with the filters
//the buttons above a chart only redraw that chart (and its table and paragraph), not the whole page
import { draw, hand, titled } from "../charts.js";
import { hourOf, mean } from "../data.js";
import { fint, fpct, section, table } from "../format.js";
import { DAY_TYPES, RIDERS, SEASONS, WEATHERS, WEEKDAYS } from "../settings.js";
import { go, state, toggle } from "../state.js";
import { C } from "../theme.js";
import { corr, cut, histogram, kde, median, percentile, skew } from "../stats.js";

//the buttons picked in this section, kept while the filters change
const opt = { unit: "day", bins: "30", scale: "normal", cat: "weather", order: "natural", show: "count", x: "temp_c", alpha: "see",
  trend: "loess", ylog: "normal", group: "season", kind: "box", pct: "count", bars: "stacked", fill: "count" };

//categorical variables with their levels in natural order, filter is the dashboard filter a bar click turns on
const CATS = {
  weather: { col: "weather", levels: WEATHERS, label: "Weather", filter: "weather" },
  season: { col: "season", levels: SEASONS, label: "Season", filter: "season" },
  day_type: { col: "day_type", levels: DAY_TYPES, label: "Day type", filter: "daytype" },
  weekday: { col: "weekday", levels: WEEKDAYS, label: "Weekday", filter: null },
};

//numerical weather variables for the scatterplot
const NUMS = { temp_c: "Temperature (°C)", feels_like_c: "Feels-like temperature (°C)", humidity: "Humidity (%)", wind: "Wind speed (km/h)" };

//demand level made from rentals (thirds of the days in view), an ordered category
const DEMAND = ["Low", "Medium", "High"];

//variables in the correlation matrix
const CORR_VARS = [["temp_c", "Temperature"], ["feels_like_c", "Feels-like"], ["humidity", "Humidity"], ["wind", "Wind"],
  ["casual", "Casual"], ["registered", "Registered"], ["cnt", "All rentals"]];

//the lab that was open last time (for the highlighter swipe on the lab buttons)
let shownLab = null;

//the 8 parts: [number, lab, short name, what it shows, full title] (the sidebar and home page use this too)
export const LABS = [
  [1, "Lab 2", "Variable types", "Which variables are numbers or categories, and the order of their levels", "Understanding the dataset and variable types"],
  [2, "Lab 3", "One number", "Histogram, density curve and boxplot, with bins, zoom and log scale", "One numerical variable: rentals"],
  [3, "Lab 4", "One category", "Frequency tables and bar charts in natural or frequency order", "One categorical variable: how the days are split"],
  [4, "Lab 5", "Two numbers", "Scatterplot with transparency and smooth or straight trend lines", "Two numerical variables: weather and rentals"],
  [5, "Lab 6", "Number by group", "Boxplot, violin, jitter and bar of means, and a confounder", "A numerical variable across categories: rentals by group"],
  [6, "Lab 7", "Two categories", "Two-way table, row and column %, stacked bars and a heatmap", "Two categorical variables: season and weather"],
  [7, "Lab 8", "Grouped number", "cut(temp, 5) vs demand level, count vs proportional bars", "A grouped number and a category: temperature groups and demand"],
  [8, "Lab 9", "Correlation", "Correlation matrix and correlation within each season", "Correlation: how strong are the relationships?"],
];

//colors for ordered categories, light to strong (weather from clear to rain, demand from low to high)
const ramp = () => C.RAMP;

//histogram from values that were already counted into bins
//log=true puts it on a log scale, zoom=[from, to] zooms the x axis without removing any data
function hist(values, xTitle, yTitle, bins, log = false, zoom = null) {
  return { data: { values: histogram(values, bins, log) },
    mark: { type: "bar", color: C.BLUE, stroke: C.PANEL, strokeWidth: 0.5, clip: !!zoom },
    encoding: {
      x: { field: "lo", type: "quantitative", title: xTitle, scale: log ? { type: "log" } : zoom ? { domain: zoom, zero: false } : { zero: false }, axis: { format: ",.0f" } },
      x2: { field: "hi" },
      y: { field: "n", type: "quantitative", title: yTitle, axis: { format: ",.0f", tickCount: 5 } }, y2: { datum: 0 }, //bars start at 0
      tooltip: [{ field: "lo", title: "From", format: ",.0f" }, { field: "hi", title: "To", format: ",.0f" }, { field: "n", title: "Count", format: "," }] } };
}

//boxplot of one number split by a category (like the sample's price by cut)
function boxplot(rows, cat, order, value, yTitle, xTitle) {
  return { data: { values: rows },
    mark: { type: "boxplot", size: 46, color: C.BLUE, median: { color: C.PANEL, strokeWidth: 2 }, outliers: { color: C.ORANGE, opacity: 0.5 } },
    encoding: { x: { field: cat, type: "nominal", sort: order, title: xTitle, axis: { labelAngle: 0 } },
      y: { field: value, type: "quantitative", title: yTitle, axis: { format: ",.0f" } } } };
}

//a row of buttons for one setting, the picked one is pressed
function seg(key, label, options) {
  return `<span class="ctl-g"><span class="ctl-l">${label}</span><span class="seg" role="group" aria-label="${label}">${options.map(([v, text]) =>
    `<button data-o="${key}" data-v="${v}" aria-pressed="${opt[key] === v}">${text}</button>`).join("")}</span></span>`;
}

//correlation with a + or − sign
function sign(x, digits = 3) {
  if (x == null || Number.isNaN(x)) return "—";
  return (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(digits);
}

//how strong a correlation is, in the words we used in lab 9
function strength(r) {
  if (r == null || Number.isNaN(r)) return "no measurable";
  const a = Math.abs(r);
  if (a < 0.2) return "very weak";
  return (a >= 0.7 ? "strong" : a >= 0.4 ? "moderate" : "weak") + (r > 0 ? " positive" : " negative");
}

//shape of a distribution from its skewness
function shapeOf(s) {
  return s > 1 ? "strongly right-skewed" : s > 0.5 ? "right-skewed" : s < -0.5 ? "left-skewed" : "fairly symmetric";
}

//skewness needs at least 3 values, otherwise a dash
const fskew = (s) => (Number.isFinite(s) ? s.toFixed(2) : "—");

const cap1 = (s) => s.replace(/(^|\s)\S/g, (c) => c.toUpperCase());

export function render(v, el) {
  const d = v.d;
  if (!d.length) { el.innerHTML = ""; return Promise.resolve(); }
  const who = state.rider === "all" ? "all" : RIDERS[state.rider].toLowerCase();
  const yLabel = "Rentals per day" + (state.rider === "all" ? "" : ` (${who})`);
  const rows = d.map((x) => ({ date: x.date, act: x.act, temp_c: x.temp_c, feels_like_c: x.feels_like_c, humidity: x.humidity, wind: x.wind,
    season: x.season, weather: x.weather, day_type: x.day_type, weekday: x.weekday }));
  const acts = d.map((x) => x.act);
  //hours that exist in hour.csv (missing hours are 0, but every real hour has at least 1 rental)
  const hourly = d.flatMap((x) => Array.from({ length: 24 }, (_, h) => hourOf(x, h, v.col))).filter((n) => n > 0);
  const realHours = d.flatMap((x) => Array.from({ length: 24 }, (_, h) => hourOf(x, h, "cnt"))).filter((n) => n > 0).length;
  const g = (id) => el.querySelector("#" + id);

  //---------- what the parts share ----------
  const unitVals = () => (opt.unit === "day" ? acts : hourly);
  const unitName = () => opt.unit;
  const unitTitle = () => (opt.unit === "day" ? yLabel : "Rentals per hour" + (state.rider === "all" ? "" : ` (${who})`));
  //frequency of each level of a category (levels with 0 days stay, they are still possible levels)
  const freqOf = (c) => c.levels.map((l) => { const n = d.filter((x) => x[c.col] === l).length; return { cat: String(l), n, p: n / d.length }; });
  //rentals of each level that has days in view
  const groupsOf = (c) => c.levels.map((l) => ({ l, vals: d.filter((x) => x[c.col] === l).map((x) => x.act) })).filter((gr) => gr.vals.length);
  const q = (vals) => ({ q1: percentile(vals, 25), md: median(vals), q3: percentile(vals, 75), m: mean(vals) });

  //season by weather counts (task 6)
  const seasonsIn = SEASONS.filter((s) => d.some((x) => x.season === s));
  const rowTot = {}, colTot = {};
  const two = [];
  for (const s of seasonsIn) for (const [wi, w] of WEATHERS.entries()) {
    const n = d.filter((x) => x.season === s && x.weather === w).length;
    rowTot[s] = (rowTot[s] || 0) + n; colTot[w] = (colTot[w] || 0) + n;
    two.push({ season: s, weather: w, wi, n });
  }
  for (const t of two) { t.rowP = rowTot[t.season] ? t.n / rowTot[t.season] : 0; t.colP = colTot[t.weather] ? t.n / colTot[t.weather] : 0; }
  const cell = (s, w) => two.find((t) => t.season === s && t.weather === w);

  //temperature cut into 5 equal-width groups and the demand level of each day (task 7)
  const { groups: tg, edges } = cut(d.map((x) => x.temp_c), 5);
  const tLabels = edges.slice(0, -1).map((e, i) => `${e.toFixed(1)}–${edges[i + 1].toFixed(1)}°C`);
  const t1 = percentile(acts, 100 / 3), t2 = percentile(acts, 200 / 3);
  const level = (a) => (a <= t1 ? "Low" : a <= t2 ? "Medium" : "High");
  const binned = tLabels.map((lab, gi) => {
    const days = d.filter((_, i) => tg[i] === gi);
    const counts = DEMAND.map((l) => days.filter((x) => level(x.act) === l).length);
    return { lab, gi, n: days.length, counts, share: counts.map((c) => (days.length ? c / days.length : 0)) };
  });

  //correlation of every pair (task 8)
  const cm = [];
  for (const [ka, la] of CORR_VARS) for (const [kb, lb] of CORR_VARS) cm.push({ a: la, b: lb, ka, kb, r: corr(d.map((x) => x[ka]), d.map((x) => x[kb])) });
  const rWith = (k) => corr(d.map((x) => x[k]), acts);

  //---------- the tables that don't change with the buttons ----------
  const t4 = table(["Check", "Result"], [
    ["Days in view (day.csv)", `${d.length.toLocaleString()} of ${v.all.length.toLocaleString()}`],
    ["Hours in view (hour.csv)", realHours.toLocaleString()],
    ["Hours missing (no rentals recorded)", (d.length * 24 - realHours).toLocaleString()],
    ["Original variables", "16 (day.csv), 17 (hour.csv, adds hr)"], ["Missing values", "0"], ["Duplicate rows", "0"],
    ["cnt = casual + registered", "True for every day"]],
    "Table 3. Basic data-quality checks for the days in view.");

  const t5 = table(["Variable", "Statistical type", "Stored in the file as", "Levels or unit"], [
    ["<code>season</code>", "Categorical, ordered by the calendar", "Number 1–4", "Winter &lt; Spring &lt; Summer &lt; Fall"],
    ["<code>weather</code> (weathersit)", "Categorical, ordered by how bad it is", "Number 1–4", "Clear &lt; Mist/cloudy &lt; Rain/snow"],
    ["<code>weekday</code>", "Categorical, ordered", "Number 0–6 (0 = Sunday)", "Mon &lt; Tue &lt; … &lt; Sun"],
    ["<code>day_type</code> (made here)", "Categorical, not ordered", "Made from holiday and workingday", "Working day, Weekend, Holiday"],
    ["<code>year</code>", "Categorical (2 levels)", "Number 0–1", "2011, 2012"],
    ["<code>hr</code>", "Numerical, discrete", "Number 0–23", "Hour of the day"],
    ["<code>temp_c</code>, <code>feels_like_c</code>", "Numerical, continuous", "Scaled 0–1 (× 41 and × 50)", "°C"],
    ["<code>humidity</code>, <code>wind</code>", "Numerical, continuous", "Scaled 0–1 (× 100 and × 67)", "%, km/h"],
    ["<code>cnt</code>, <code>registered</code>, <code>casual</code>", "Numerical, discrete counts", "Whole number", "Rentals"],
    ["<code>demand</code> (made here)", "Categorical, ordered", "Made from rentals, cut into thirds", "Low &lt; Medium &lt; High"],
    ["<code>temp_group</code> (made here)", "Categorical, ordered", "Made from temp_c with cut(temp_c, 5)", "5 equal-width ranges"]],
    "Table 4. Variable types, how the file stores them, and their levels.");

  const statRow = (label, vals) => [label, fint(Math.min(...vals)), fint(percentile(vals, 25)), fint(median(vals)),
    mean(vals).toFixed(1), fint(percentile(vals, 75)), fint(Math.max(...vals)), fskew(skew(vals))];
  const t6 = table(["Rentals", "Minimum", "First quartile", "Median", "Mean", "Third quartile", "Maximum", "Skewness"],
    [statRow("Per day", acts), statRow("Per hour", hourly)], `Table 5. Summary statistics for rentals (${who} riders), like R's summary().`);

  const seasonGroups = SEASONS.map((s) => d.filter((x) => x.season === s)).filter((gr) => gr.length);
  const t11 = table(["Days", "Days in view", "r (temperature, rentals)", "Strength"],
    [["All days in view", d.length, sign(rWith("temp_c"), 2), strength(rWith("temp_c"))],
      ...seasonGroups.map((gr) => { const r = corr(gr.map((x) => x.temp_c), gr.map((x) => x.act)); return [gr[0].season, gr.length, sign(r, 2), strength(r)]; })],
    "Table 10. Correlation between temperature and daily rentals, overall and within each season.");

  const medTemp = {};
  for (const gr of seasonGroups) medTemp[gr[0].season] = median(gr.map((x) => x.temp_c));

  //---------- the page: lab buttons, then only the open part ----------
  const n = state.lab, [, lab, , , title] = LABS[n - 1];
  //the full explanation folds away under "Read more", the one line takeaway (#k) stays visible
  const more = (inner) => `<details class="more"><summary>Read more</summary>${inner}</details>`;
  const CARDS = {
    1: () => `<div class="grid12"><div>${t4}</div><div>${t5}</div></div>
      ${more(`<p class="interp">Each row of <code>day.csv</code> is one day and each row of <code>hour.csv</code> is one hour of a day. The main response
      variable is the number of rentals (<code>cnt</code>, split into <code>registered</code> and <code>casual</code>). Several categories are stored
      as numbers in the file (season 1 to 4, weather 1 to 4), so they were turned into labelled categories before anything else; otherwise
      a program would happily report an "average season". The type decides the summary: numbers get quartiles and a mean (4.2), categories
      get counts (4.3). The order of the levels also matters: weather has a real order from good to bad, but day type does not, since a
      weekend is not "more" than a holiday. Season labels were checked against the dates, because season 1 covers January to March.
      There are no missing values or duplicate rows; the hours missing from <code>hour.csv</code> are hours with no rentals, mostly during
      storms, so no rows were removed.</p>`)}`,
    2: () => `<div class="ctl">${seg("unit", "Rentals", [["day", "Per day"], ["hour", "Per hour"]])}${seg("bins", "Bins", [["15", "15"], ["30", "30"], ["60", "60"]])}${seg("scale", "Histogram", [["normal", "Normal"], ["zoom", "Zoom in"], ["log", "Log scale"]])}</div>
      <div class="chart" id="f1" style="min-height:300px"></div><p class="cap">Figure 1. Histogram of rentals.</p>
      <div class="grid2">
        <div><div class="chart" id="f2" style="min-height:260px"></div><p class="cap">Figure 2. Density curve of rentals.</p></div>
        <div><div class="chart" id="f3" style="min-height:260px"></div><p class="cap">Figure 3. Boxplot of rentals.</p></div>
      </div>${t6}${more(`<p class="interp" id="n2"></p>`)}`,
    3: () => `<div class="ctl">${seg("cat", "Variable", [["weather", "Weather"], ["season", "Season"], ["day_type", "Day type"], ["weekday", "Weekday"]])}${seg("order", "Order", [["natural", "Natural"], ["freq", "By frequency"]])}${seg("show", "Show", [["count", "Counts"], ["pct", "Percent"]])}</div>
      <div class="grid2"><div id="t7"></div><div><div class="chart" id="f4" style="min-height:230px"></div><p class="cap">Figure 4. Bar chart of days in each category.</p></div></div>
      ${more(`<p class="interp" id="n3"></p>`)}`,
    4: () => `<div class="ctl">${seg("x", "X axis", [["temp_c", "Temperature"], ["feels_like_c", "Feels-like"], ["humidity", "Humidity"], ["wind", "Wind"]])}${seg("alpha", "Points", [["solid", "Solid"], ["see", "See-through"]])}${seg("trend", "Trend", [["loess", "Smooth"], ["linear", "Straight"], ["none", "None"]])}${seg("ylog", "Y axis", [["normal", "Normal"], ["log", "Log scale"]])}</div>
      <div class="chart" id="f5" style="min-height:360px"></div><p class="cap">Figure 5. Scatterplot of a weather measure and daily rentals.</p>
      ${more(`<p class="interp" id="n4"></p>`)}`,
    5: () => `<div class="ctl">${seg("group", "Group by", [["season", "Season"], ["weather", "Weather"], ["day_type", "Day type"]])}${seg("kind", "Chart", [["box", "Boxplot"], ["violin", "Violin"], ["jitter", "Jittered points"], ["means", "Bar of means"]])}</div>
      <div class="chart" id="f6" style="min-height:330px"></div><p class="cap">Figure 6. Daily rentals by group.</p>
      <div class="grid2"><div id="t8"></div><div><div class="chart" id="f7" style="min-height:300px"></div><p class="cap">Figure 7. Daily temperature by season.</p></div></div>
      ${more(`<p class="interp" id="n5"></p><p class="interp">Lab 6 warned that a difference between groups does not prove the group causes it, because another
        variable can be behind it (for diamonds, carat explained why Fair cuts cost more). Here temperature plays that role` + (medTemp.Winter != null && medTemp.Summer != null
        ? `: the median Winter day is about ${Math.round(medTemp.Winter)}°C, compared with ${Math.round(medTemp.Summer)}°C in Summer (Figure 7).` : ".") +
        ` Since warmer days have more rentals (4.4), colder temperatures explain much of why Winter is slow. Part 4.8 checks this within each season.</p>`)}`,
    6: () => `<div class="ctl">${seg("pct", "Table", [["count", "Counts"], ["row", "Row %"], ["col", "Column %"]])}${seg("bars", "Chart", [["grouped", "Grouped"], ["stacked", "Stacked"], ["fill", "100% stacked"], ["heat", "Heatmap"]])}</div>
      <div class="grid2"><div id="t9"></div><div><div class="chart" id="f8" style="min-height:300px"></div><p class="cap">Figure 8. Weather by season.</p></div></div>
      ${more(`<p class="interp" id="n6"></p>`)}`,
    7: () => `<p class="note">Temperature is cut into 5 groups of equal width, like R's <code>cut(temp_c, 5)</code>. Demand level: <b>Low</b> (up to
      ${fint(t1)} rentals), <b>Medium</b> (up to ${fint(t2)}) and <b>High</b> (above ${fint(t2)}), the lowest, middle and highest third of the days in view.</p>
      <div class="ctl">${seg("fill", "Bars", [["count", "Counts"], ["fill", "Proportions"]])}</div>
      <div class="grid2"><div>${table(["Temperature group", "Days", "Low", "Medium", "High"],
        binned.map((b) => [b.lab, b.n, ...b.share.map((x) => (b.n ? fpct(x) : "—"))]),
        "Table 9. Demand level by temperature group (row percentages, each row adds to 100%).")}</div>
        <div><div class="chart" id="f9" style="min-height:310px"></div><p class="cap">Figure 9. Demand level by temperature group.</p></div></div>
      ${more(`<p class="interp" id="n7"></p>`)}`,
    8: () => `<div class="grid2"><div><div class="chart" id="f10" style="min-height:340px"></div><p class="cap">Figure 10. Correlation matrix (Pearson r).</p></div>
        <div>${t11}</div></div>
      <div class="chart" id="f11" style="min-height:270px;overflow-x:auto"></div><p class="cap">Figure 11. Temperature and daily rentals within each season.</p>
      ${more(`<p class="interp" id="n8"></p><p class="interp">The scatterplots check what the coefficients say. Within each season warmer days still tend
        to be busier, especially in Winter and Spring. In Summer the trend flattens or dips, because the hottest days lose riders, so a single r understates
        a relationship that first rises and then falls. Much of the seasonal difference comes from temperature, but this is an association in observational
        data: daylight hours, holidays and the 2011 to 2012 growth also differ across the year.</p>`)}`,
  };
  const step = (m, dir) => (m < 1 || m > 8 ? `<span></span>` : `<button class="btn" data-lab="${m}">${dir < 0 ? "‹ " : ""}4.${m} ${LABS[m - 1][2]}${dir > 0 ? " ›" : ""}</button>`);

  const swipe = n !== shownLab; //the highlighter only swipes across a newly opened lab
  shownLab = n;
  el.innerHTML = section(4, "Showing my work", "sec-eda",
    "One part per course lab, applied to the bike data. Pick a lab below; the buttons above a chart change only that chart, and everything follows the filters at the top.",
    "exploratory data analysis") +
  `<div class="lab-tabs" role="tablist">${LABS.map(([m, l, short]) =>
    `<button class="lab-tab${m === n ? " on" + (swipe ? " swipe" : "") : ""}" role="tab" aria-selected="${m === n}" data-lab="${m}"><b>4.${m}</b> ${short}<small>${l}</small></button>`).join("")}</div>
  <div class="card lab-card-open">
    <div class="sub-row"><p class="sub">4.${n} ${title}</p><span class="pill">Task ${n} · ${lab}</span></div>
    <p class="take" id="k">${n === 1 ? "Categories stored as numbers in the file (season, weather) were turned into labelled, ordered levels before any analysis, and there are no missing values or duplicates." : ""}</p>
    ${CARDS[n]()}
    <div class="pager">${step(n - 1, -1)}${step(n + 1, 1)}</div>
  </div>`;
  el.querySelectorAll("[data-lab]").forEach((b) => b.addEventListener("click", () => { go("analysis", +b.dataset.lab); }));

  //---------- each chart, table and paragraph that the buttons redraw ----------
  const parts = {
    //4.2
    f1: () => {
      const log = opt.scale === "log", vals = log ? unitVals().filter((x) => x > 0) : unitVals();
      const zoom = opt.scale === "zoom" ? [Math.min(...vals), percentile(vals, 90)] : null;
      const [t, s] = log ? ["On a Log Scale the Low Values Spread Out", "Same data, each step on the x axis is 10 times the last"]
        : zoom ? ["Zoomed In Without Removing Any Data", `The axis stops at the 90th percentile (${fint(zoom[1])}), every ${unitName()} is still counted`]
        : [`${opt.unit === "day" ? "Daily" : "Hourly"} Rentals Are ${cap1(shapeOf(skew(vals)))}`, `${opt.bins} bins, each bar counts the ${unitName()}s in its range`];
      return draw(g("f1"), { height: 250, ...titled(hist(vals, unitTitle(), `Number of ${unitName()}s`, Number(opt.bins), log, zoom), t, s) });
    },
    f2: () => {
      const vals = unitVals();
      return draw(g("f2"), { height: 200, title: { text: "The Density Curve Smooths Out the Same Shape", subtitle: "No bins to pick, the dashed line is the median" },
        layer: [
          { data: { values: vals.map((x) => ({ x })) }, transform: [{ density: "x", extent: [Math.min(...vals), Math.max(...vals)] }],
            mark: { type: "area", color: C.BLUE, opacity: 0.18, line: { color: C.BLUE, strokeWidth: 2 } },
            encoding: { x: { field: "value", type: "quantitative", title: unitTitle(), axis: { format: ",.0f" }, scale: { zero: false } },
              y: { field: "density", type: "quantitative", title: "Density", axis: { labels: false, ticks: false } } } },
          { data: { values: [{ med: median(vals) }] }, mark: { type: "rule", color: C.ORANGE, strokeWidth: 2, strokeDash: [5, 4] },
            encoding: { x: { field: "med", type: "quantitative" }, tooltip: [{ field: "med", title: "Median", format: ",.0f" }] } }] });
    },
    f3: () => {
      const vals = unitVals(), { q1, q3 } = q(vals);
      return draw(g("f3"), { height: 200, data: { values: vals.map((x) => ({ x })) },
        title: { text: "The Boxplot Shows Center, Spread and Outliers", subtitle: `Box = middle 50% (${fint(q1)} to ${fint(q3)}), red dots = outliers` },
        mark: { type: "boxplot", extent: 1.5, size: 60, color: C.BLUE, median: { color: C.PANEL, strokeWidth: 2 }, outliers: { color: C.ORANGE, opacity: 0.35, size: 14 } },
        encoding: { x: { field: "x", type: "quantitative", title: unitTitle(), axis: { format: ",.0f" }, scale: { zero: false } } } });
    },
    n2: () => {
      const vals = unitVals(), u = unitName(), s = skew(vals), { q1, md, q3, m } = q(vals), iqr = q3 - q1;
      const out = vals.filter((x) => x < q1 - 1.5 * iqr || x > q3 + 1.5 * iqr).length;
      g("k").innerHTML = `${u === "day" ? "Daily" : "Hourly"} rentals are <b>${shapeOf(s)}</b>: the median ${u} has ${fint(md)} rentals and the middle half
        falls between ${fint(q1)} and ${fint(q3)}` + (out ? `, with ${out.toLocaleString()} unusual ${u}s.` : ".");
      g("n2").innerHTML = `Lab 3 describes a distribution by four things. <b>Shape:</b> ${shapeOf(s)} (skewness ${fskew(s)}). ` +
        `<b>Center:</b> the mean is ${fint(m)} and the median ${fint(md)}` + (m > md * 1.1 ? ", so a long right tail pulls the mean up. " : ", close together, so no long tail pulls the mean. ") +
        `<b>Spread:</b> the middle half of the ${u}s is between ${fint(q1)} and ${fint(q3)} rentals (IQR ${fint(iqr)}). <b>Unusual values:</b> ` +
        (out ? `${out.toLocaleString()} ${u}s are past the boxplot whiskers (more than 1.5 × IQR from the box)` : `no ${u}s are past the boxplot whiskers`) +
        (u === "day" ? "; the very low days are mostly storms and holidays, which section 2 looks at. " : ", mostly rush hours on working days. ") +
        "No single graph shows everything: the histogram depends on the number of bins, the density curve hides the counts and the boxplot " +
        "hides the shape. Changing the bins, zooming in or using a log scale only changes the picture, never the data.";
    },
    //4.3
    t7: () => {
      const c = CATS[opt.cat], f = freqOf(c);
      g("t7").innerHTML = table([c.label, "Days", "Relative frequency", "Percent"],
        [...f.map((x) => [x.cat, x.n.toLocaleString(), x.p.toFixed(3), fpct(x.p, 1)]), ["<b>Total</b>", `<b>${d.length.toLocaleString()}</b>`, "<b>1.000</b>", "<b>100.0%</b>"]],
        `Table 6. Frequency and relative frequency of ${c.label.toLowerCase()} (days in view).`);
    },
    f4: () => {
      const c = CATS[opt.cat], f = freqOf(c), pct = opt.show === "pct", field = pct ? "p" : "n";
      const picked = c.filter ? state[c.filter] : "all";
      const top = f.reduce((a, b) => (b.n > a.n ? b : a));
      return draw(g("f4"), { height: 30 * c.levels.length + 20, data: { values: f },
        title: { text: `${top.cat} Is the Most Common ${c.label}`, subtitle: c.filter ? "Click a bar to filter the dashboard by it" : `${pct ? "Percent" : "Number"} of days in each level` },
        encoding: { y: { field: "cat", type: "nominal", sort: opt.order === "natural" ? c.levels.map(String) : "-x", title: null },
          x: { field, type: "quantitative", title: pct ? "Percent of days" : "Number of days", axis: { format: pct ? ".0%" : ",.0f", tickCount: 4 },
            scale: { domain: [0, Math.max(...f.map((x) => x[field])) * 1.18 || 1] } } },
        layer: [
          { mark: { type: "bar", cornerRadiusEnd: 3, cursor: c.filter ? "pointer" : "default" },
            encoding: { color: { condition: { test: `datum.cat === ${JSON.stringify(String(picked))}`, value: C.ORANGE }, value: C.BLUE },
              tooltip: [{ field: "cat", title: c.label }, { field: "n", title: "Days", format: "," }, { field: "p", title: "Percent", format: ".1%" }] } },
          { mark: { type: "text", align: "left", dx: 4, color: C.MUTED, fontSize: 11 }, encoding: { text: { field, type: "quantitative", format: pct ? ".1%" : "," } } }] },
        c.filter ? (x) => x.cat && toggle(c.filter, x.cat) : undefined);
    },
    n3: () => {
      const c = CATS[opt.cat], f = freqOf(c), withDays = f.filter((x) => x.n);
      const top = withDays.reduce((a, b) => (b.n > a.n ? b : a)), low = withDays.reduce((a, b) => (b.n < a.n ? b : a));
      const zeros = f.length - withDays.length;
      const order = c.col === "weather" ? "Weather has a real order from good to bad, so the natural order shows that progression; sorting by frequency answers a different question, which level is most common. "
        : c.col === "day_type" ? "Day type has no natural order (a weekend is not \"more\" than a holiday), so sorting by frequency is the clearer choice here. "
        : `${c.label} levels follow the calendar, so the natural order keeps that order; sorting by frequency ranks them instead. `;
      g("k").innerHTML = `<b>${top.cat}</b> is the most common ${c.label.toLowerCase()} (${fpct(top.p, 1)} of the days) and <b>${low.cat}</b> the least
        common (${low.n.toLocaleString()} days).`;
      g("n3").innerHTML = `The table gives the exact numbers and the chart makes the differences easy to see. <b>${top.cat}</b> is the most common
        ${c.label.toLowerCase()}: ${fpct(top.p, 1)} of the days, a relative frequency of ${top.p.toFixed(3)} (the count divided by the
        ${d.length.toLocaleString()} days). <b>${low.cat}</b> is the least common with ${low.n.toLocaleString()} days` +
        (low.n < 30 ? ", so averages for it rest on few days. " : ". ") + order +
        "Counts and percentages give the same picture, only the axis changes. " +
        (zeros ? `${zeros} level${zeros > 1 ? "s have" : " has"} 0 days because of the filters, but stay${zeros > 1 ? "" : "s"} on the chart since ${zeros > 1 ? "they are" : "it is"} still a possible level. ` : "") +
        (c.filter ? "Click a bar to filter the whole dashboard by that level." : "");
    },
    //4.4
    f5: () => {
      const xf = opt.x, ylog = opt.ylog === "log", data = ylog ? rows.filter((x) => x.act > 0) : rows;
      const r = corr(data.map((x) => x[xf]), data.map((x) => x.act));
      const enc = { x: { field: xf, type: "quantitative", title: NUMS[xf], scale: { zero: false } },
        y: { field: "act", type: "quantitative", title: yLabel + (ylog ? " (log scale)" : ""), axis: { format: ",.0f" }, scale: ylog ? { type: "log" } : { zero: true } } };
      const layer = [{ mark: { type: "circle", size: 30, color: C.BLUE, opacity: opt.alpha === "see" ? 0.3 : 1 },
        encoding: { ...enc, tooltip: [{ field: "date", title: "Date" }, { field: xf, title: NUMS[xf], format: ".1f" }, { field: "act", title: "Rentals", format: "," }] } }];
      if (opt.trend !== "none") layer.push({ transform: [opt.trend === "loess" ? { loess: "act", on: xf, bandwidth: 0.4 } : { regression: "act", on: xf }],
        mark: { type: "line", color: C.ORANGE, strokeWidth: 3 }, encoding: enc });
      //a handwritten note in the empty top right corner, where the hottest days fall short (only true with every day in view)
      if (!v.anyFilter && (xf === "temp_c" || xf === "feels_like_c")) layer.push({
        data: { values: [{ x: Math.max(...data.map((p) => p[xf])), y: Math.max(...data.map((p) => p.act)), text: "too hot to ride? ↓" }] },
        mark: { type: "text", ...hand(21), align: "right", baseline: "top" },
        encoding: { x: { field: "x", type: "quantitative", scale: { zero: false } }, y: { field: "y", type: "quantitative" }, text: { field: "text" } } });
      return draw(g("f5"), { height: 300, data: { values: data },
        title: { text: `${cap1(strength(r))} Relationship Between ${cap1(NUMS[xf].replace(/ \(.*/, ""))} and Rentals`,
          subtitle: `r = ${sign(r, 2)} · each dot is a day` + (opt.trend === "none" ? "" : `, the red line is the ${opt.trend === "loess" ? "smooth" : "straight-line"} trend`) },
        layer });
    },
    n4: () => {
      const rs = Object.keys(NUMS).map((k) => [k, rWith(k)]).filter(([, r]) => !Number.isNaN(r));
      const best = rs.reduce((a, b) => (Math.abs(b[1]) > Math.abs(a[1]) ? b : a)), worst = rs.reduce((a, b) => (Math.abs(b[1]) < Math.abs(a[1]) ? b : a));
      const name = (k) => NUMS[k].replace(/ \(.*/, "").toLowerCase();
      const r = rWith(opt.x), temp = opt.x === "temp_c" || opt.x === "feels_like_c";
      g("k").innerHTML = `<b>${strength(r)[0].toUpperCase() + strength(r).slice(1)}</b> relationship between ${name(opt.x)} and rentals (r = ${sign(r, 2)})` +
        (temp ? ": warmer days are busier, up to a point." : ": on its own it says little about rentals.");
      g("n4").innerHTML = "Each point is one day. " +
        (opt.alpha === "see" ? "The points are see-through, so darker areas show where many days overlap (overplotting); this only changes the picture, not the data. "
          : "With solid points, days on top of each other hide (overplotting); switch to see-through to see where the days pile up. ") +
        `For ${name(opt.x)} the relationship is <b>${strength(r)}</b> (r = ${sign(r, 2)}). ` +
        (temp ? "Rentals rise as it gets warmer, but the smooth line flattens and dips on the hottest days, so the relationship is not perfectly linear, and days at the same temperature still vary a lot. "
          : "The points form a wide cloud with only a slight slope, so this measure says little about rentals on its own. ") +
        (opt.trend === "loess" ? "The smooth line follows the average and can bend, which shows whether a straight line fits. "
          : opt.trend === "linear" ? "The straight line is the best linear fit; compare it with the smooth line to see where a straight line misses. " : "") +
        (opt.ylog === "log" ? "On the log scale the low days spread out, and the order of the days stays the same because a log scale keeps the order. " : "") +
        `Of the four measures, ${name(best[0])} goes with rentals most closely (r = ${sign(best[1], 2)}) and ${name(worst[0])} the least (r = ${sign(worst[1], 2)}).`;
    },
    //4.5
    t8: () => {
      const c = CATS[opt.group];
      g("t8").innerHTML = table([c.label, "Days", "Mean", "Median", "IQR"],
        groupsOf(c).map((gr) => { const s = q(gr.vals); return [gr.l, gr.vals.length.toLocaleString(), fint(s.m), fint(s.md), fint(s.q3 - s.q1)]; }),
        `Table 7. Grouped summaries of daily rentals by ${c.label.toLowerCase()}.`);
    },
    f6: () => {
      const c = CATS[opt.group], grs = groupsOf(c), levels = grs.map((gr) => gr.l), k = levels.length;
      const top = grs.reduce((a, b) => (median(b.vals) > median(a.vals) ? b : a));
      const title = { text: `${top.l} Has the Highest Typical Day`, subtitle: {
        box: "Boxplot: the line is the median, the box the middle 50%, red dots are outliers",
        violin: "Violin: wider means more days at that level, the red line is the median",
        jitter: "Each dot is one day, spread sideways so they don't stack, the red line is the median",
        means: "Bar of means: easy to read, but it hides the spread and the unusual days" }[opt.kind] };
      const meds = grs.map((gr, i) => ({ i, l: gr.l, med: median(gr.vals) }));
      //groups placed at 0, 1, 2... on a number axis, labelled with their names
      const xNum = { type: "quantitative", scale: { domain: [-0.6, k - 0.4] }, title: c.label,
        axis: { values: levels.map((_, i) => i), labelExpr: `${JSON.stringify(levels)}[datum.value]`, grid: false, tickSize: 0 } };
      const yEnc = { type: "quantitative", title: yLabel, axis: { format: ",.0f" } };
      const medRule = { data: { values: meds }, transform: [{ calculate: "datum.i - 0.3", as: "a" }, { calculate: "datum.i + 0.3", as: "b" }],
        mark: { type: "rule", color: C.ORANGE, strokeWidth: 3 },
        encoding: { x: { field: "a", ...xNum }, x2: { field: "b" }, y: { field: "med", ...yEnc }, tooltip: [{ field: "l", title: c.label }, { field: "med", title: "Median", format: ",.0f" }] } };
      let spec;
      if (opt.kind === "box") spec = boxplot(rows, c.col, levels, "act", yLabel, c.label);
      else if (opt.kind === "violin") {
        //density curve of each group (computed in stats.js), mirrored left and right of the group's position
        const lo = Math.min(...acts), hi = Math.max(...acts);
        const shapes = grs.map((gr, i) => {
          const a = Math.min(...gr.vals), b = Math.max(...gr.vals), grid = Array.from({ length: 60 }, (_, j) => a + (b - a) * j / 59);
          return { i, grid, dens: kde(gr.vals, grid) };
        });
        const most = Math.max(...shapes.flatMap((s) => s.dens)) || 1;
        const pts = shapes.flatMap((s) => s.grid.map((y, j) => ({ g: String(s.i), y, x0: s.i - s.dens[j] / most * 0.42, x1: s.i + s.dens[j] / most * 0.42 })));
        spec = { layer: [{ data: { values: pts }, mark: { type: "area", orient: "horizontal", color: C.BLUE, opacity: 0.85 },
          encoding: { y: { field: "y", ...yEnc, scale: { domain: [lo, hi] } }, x: { field: "x0", ...xNum }, x2: { field: "x1" }, detail: { field: "g" } } }, medRule] };
      } else if (opt.kind === "jitter") {
        const pts = rows.map((r) => ({ ...r, jx: levels.indexOf(r[c.col]) + (Math.random() - 0.5) * 0.5 })).filter((r) => r.jx > -1);
        spec = { layer: [{ data: { values: pts }, mark: { type: "circle", size: 22, color: C.BLUE, opacity: 0.45 },
          encoding: { x: { field: "jx", ...xNum }, y: { field: "act", ...yEnc }, tooltip: [{ field: "date", title: "Date" }, { field: "act", title: "Rentals", format: "," }] } }, medRule] };
      } else {
        spec = { data: { values: grs.map((gr) => ({ l: gr.l, m: mean(gr.vals) })) },
          encoding: { x: { field: "l", type: "nominal", sort: levels, title: c.label, axis: { labelAngle: 0 } }, y: { field: "m", ...yEnc, title: "Mean " + yLabel.toLowerCase() } },
          layer: [{ mark: { type: "bar", color: C.BLUE, cornerRadiusEnd: 3, size: 60 }, encoding: { tooltip: [{ field: "l", title: c.label }, { field: "m", title: "Mean", format: ",.0f" }] } },
            { mark: { type: "text", dy: -7, color: C.MUTED, fontSize: 11 }, encoding: { text: { field: "m", format: ",.0f" } } }] };
      }
      return draw(g("f6"), { height: 270, ...spec, title });
    },
    n5: () => {
      const c = CATS[opt.group], grs = groupsOf(c).map((gr) => ({ ...gr, ...q(gr.vals) }));
      const top = grs.reduce((a, b) => (b.md > a.md ? b : a)), low = grs.reduce((a, b) => (b.md < a.md ? b : a));
      const wide = grs.reduce((a, b) => (b.q3 - b.q1 > a.q3 - a.q1 ? b : a)), small = grs.filter((gr) => gr.vals.length < 30);
      const kind = { box: "In the boxplot the line is the median, the box is the IQR (the middle 50% of days) and dots past the whiskers are unusual days. ",
        violin: "The violin shows the shape: it is wider where more days sit, which can show two humps or clusters that a boxplot hides. ",
        jitter: "Every dot is a real day. Jitter moves the dots sideways a little at random so they don't stack on top of each other; with only 731 days no sampling is needed. ",
        means: "A bar of means is easy to read but shows only one number per group. It hides the spread, the shape and the unusual days, which is why the other three charts are better here. " }[opt.kind];
      g("k").innerHTML = grs.length > 1 ? `<b>${top.l}</b> has the highest median (${fint(top.md)} rentals a day) and <b>${low.l}</b> the lowest (${fint(low.md)}).`
        : `Only ${top.l} days are in view (median ${fint(top.md)} rentals a day).`;
      g("n5").innerHTML = (grs.length > 1 ? `<b>${top.l}</b> has the highest median (${fint(top.md)} rentals) and <b>${low.l}</b> the lowest (${fint(low.md)}). ` : "") +
        `${wide.l} has the widest spread (IQR ${fint(wide.q3 - wide.q1)}). ` +
        (grs.every((gr) => Math.abs(gr.m - gr.md) < 0.1 * gr.md) ? "In every group the mean and median are close, so no group has a long tail. " : "In some groups the mean and median differ, a sign of skew within the group. ") +
        kind + (small.length ? `${small.map((gr) => gr.l).join(" and ")} ${small.length > 1 ? "have" : "has"} fewer than 30 days, so ${small.length > 1 ? "their" : "its"} summaries are less certain. ` : "") +
        "These differences are associations in observational data; Figure 7 looks at temperature, a variable that could be behind the season differences.";
    },
    //4.6
    t9: () => {
      const m = opt.pct, f = (x) => (m === "count" ? x.toLocaleString() : fpct(x, 1)), total = d.length;
      const body = seasonsIn.map((s) => [s, ...WEATHERS.map((w) => f(m === "count" ? cell(s, w).n : m === "row" ? cell(s, w).rowP : cell(s, w).colP)),
        `<b>${m === "count" ? rowTot[s].toLocaleString() : m === "row" ? "100.0%" : fpct(rowTot[s] / total, 1)}</b>`]);
      body.push(["<b>Total</b>", ...WEATHERS.map((w) => `<b>${m === "count" ? colTot[w].toLocaleString() : m === "col" ? "100.0%" : fpct(colTot[w] / total, 1)}</b>`),
        `<b>${m === "count" ? total.toLocaleString() : "100.0%"}</b>`]);
      g("t9").innerHTML = table(["Season", ...WEATHERS, "Total"], body, {
        count: "Table 8. Two-way table of days by season and weather.",
        row: "Table 8. Row percentages: of the days in each season, the share with each weather (each row adds to 100%).",
        col: "Table 8. Column percentages: of the days with each weather, the share in each season (each column adds to 100%)." }[m]);
    },
    f8: () => {
      const colorW = { field: "weather", type: "nominal", sort: WEATHERS, scale: { domain: WEATHERS, range: ramp() }, legend: { orient: "top", title: null } };
      const xS = { field: "season", type: "nominal", sort: seasonsIn, title: null, axis: { labelAngle: 0 } };
      const tip = [{ field: "season", title: "Season" }, { field: "weather", title: "Weather" }, { field: "n", title: "Days", format: "," },
        { field: "rowP", title: "Share of the season", format: ".1%" }, { field: "colP", title: "Share of this weather", format: ".1%" }];
      const clear = seasonsIn.map((s) => ({ s, p: cell(s, "Clear").rowP })), worst = clear.reduce((a, b) => (b.p < a.p ? b : a));
      const big = two.reduce((a, b) => (b.n > a.n ? b : a));
      let spec, title;
      if (opt.bars === "heat") {
        const enc = { x: { field: "weather", type: "nominal", sort: WEATHERS, title: null, axis: { labelAngle: 0 } }, y: { field: "season", type: "nominal", sort: seasonsIn, title: null } };
        const maxN = Math.max(...two.map((t) => t.n));
        title = { text: `${big.weather} ${big.season} Days Are the Most Common Combination`, subtitle: "Heatmap: stronger color = more days" };
        spec = { data: { values: two }, encoding: enc, layer: [
          { mark: { type: "rect", stroke: C.PANEL, strokeWidth: 2 }, encoding: { color: { field: "n", type: "quantitative", scale: { range: [C.LINE, C.ORANGE] }, legend: null }, tooltip: tip } },
          { mark: { type: "text", fontSize: 13, fontWeight: 600 }, encoding: { text: { field: "n", type: "quantitative", format: "," },
            color: { condition: { test: `datum.n > ${maxN * 0.55}`, value: C.ON_ACC }, value: C.FG } } }] };
      } else {
        const fill = opt.bars === "fill";
        title = fill ? { text: `${worst.s} Has the Fewest Clear Days`, subtitle: "100% stacked: each bar is a whole season" }
          : opt.bars === "stacked" ? { text: "Clear Days Make Up Most of Every Season", subtitle: "Stacked: the full bar is the season's days" }
          : { text: "Comparing Weather Counts Side by Side", subtitle: "Grouped: one bar per weather type" };
        spec = { data: { values: two }, mark: { type: "bar", cornerRadiusEnd: opt.bars === "grouped" ? 2 : 0 },
          encoding: { x: xS, color: colorW, tooltip: tip, order: { field: "wi" },
            y: { field: "n", type: "quantitative", stack: opt.bars === "grouped" ? null : fill ? "normalize" : "zero", title: fill ? "Share of the season's days" : "Number of days", axis: { format: fill ? ".0%" : ",.0f" } },
            ...(opt.bars === "grouped" ? { xOffset: { field: "weather", sort: WEATHERS } } : {}) } };
      }
      return draw(g("f8"), { height: 250, ...spec, title });
    },
    n6: () => {
      const clear = seasonsIn.map((s) => ({ s, p: cell(s, "Clear").rowP }));
      const best = clear.reduce((a, b) => (b.p > a.p ? b : a)), worst = clear.reduce((a, b) => (b.p < a.p ? b : a));
      const rain = colTot["Rain/snow"] || 0;
      const rainTop = rain ? seasonsIn.map((s) => cell(s, "Rain/snow")).reduce((a, b) => (b.n > a.n ? b : a)) : null;
      const rainRow = rainTop ? rainTop.rowP : 0;
      g("k").innerHTML = seasonsIn.length > 1 ? `<b>${best.s}</b> has the most clear days (${fpct(best.p)}) and <b>${worst.s}</b> the fewest (${fpct(worst.p)}), so ` +
        (best.p - worst.p < 0.1 ? "the weather mix is similar across seasons." : "weather and season are associated.") : "Only one season is in view.";
      g("n6").innerHTML = "Raw counts can mislead: a season with more days has bigger counts anyway, so the row percentages compare the mix fairly. " +
        (seasonsIn.length > 1 ? `<b>${best.s}</b> has the most clear days (${fpct(best.p)} of its days) and <b>${worst.s}</b> the fewest (${fpct(worst.p)}). ` : "") +
        (rainTop && rainTop.n ? `The direction of the percentage matters: ${fpct(rainRow, 1)} of ${rainTop.season} days had rain or snow (row %), but of all
          ${rain} rain/snow days, ${fpct(rainTop.colP)} were in ${rainTop.season} (column %). The two answer different questions because they divide by
          different totals. ` : "") +
        "If season and weather were not associated, every bar in the 100% chart would have the same mix. " +
        (seasonsIn.length > 1 ? (best.p - worst.p < 0.1 ? "Here the mixes are similar, so the association is weak. " : "Here the mix changes from season to season, so weather and season are associated, which means part of a season's low rentals can be a bad-weather effect. ") : "") +
        (rain && rain < 30 ? `Rain/snow has only ${rain} days, so its percentages move a lot with a single day.` : "");
    },
    //4.7
    f9: () => {
      const fill = opt.fill === "fill";
      const data = binned.flatMap((b) => DEMAND.map((l, li) => ({ grp: b.lab, level: l, li, n: b.counts[li], p: b.share[li], tot: b.n })));
      const hi = binned.filter((b) => b.n).map((b) => ({ ...b, h: b.share[2] }));
      const peak = hi.reduce((a, b) => (b.h > a.h ? b : a));
      const text = peak.gi > hi[0].gi ? `High-Demand Days Get More Common as It Warms Up${peak.gi < hi[hi.length - 1].gi ? ", Up to a Point" : ""}` : "Demand Level by Temperature Group";
      const x = { field: "grp", type: "nominal", sort: tLabels, title: "Temperature group", axis: { labelAngle: 0, labelFontSize: 10 } };
      return draw(g("f9"), { height: 250, title: { text, subtitle: fill ? "Proportions: every bar is 100%, n = days in the group" : "Counts: the full bar is the number of days in the group" },
        layer: [
          { data: { values: data }, mark: { type: "bar" },
            encoding: { x, y: { field: "n", type: "quantitative", stack: fill ? "normalize" : "zero", title: fill ? "Share of the days" : "Number of days", axis: { format: fill ? ".0%" : ",.0f" } },
              color: { field: "level", type: "nominal", sort: DEMAND, scale: { domain: DEMAND, range: ramp() }, legend: { orient: "top", title: "Demand level" } },
              order: { field: "li" }, tooltip: [{ field: "grp", title: "Temperature" }, { field: "level", title: "Demand" }, { field: "n", title: "Days", format: "," }, { field: "p", title: "Share of the group", format: ".0%" }] } },
          { data: { values: binned.map((b) => ({ grp: b.lab, n: b.n, lab: "n = " + b.n })) }, mark: { type: "text", dy: -7, fontSize: 11, color: C.MUTED },
            encoding: { x, y: fill ? { datum: 1 } : { field: "n", type: "quantitative" }, text: { field: "lab" } } }] });
    },
    n7: () => {
      const hi = binned.filter((b) => b.n), coldest = hi[0], peak = hi.reduce((a, b) => (b.share[2] > a.share[2] ? b : a));
      const smallest = hi.reduce((a, b) => (b.n < a.n ? b : a)), few = hi.filter((b) => b.n < 30);
      g("k").innerHTML = `High-demand days go from <b>${fpct(coldest.share[2])}</b> in the coldest group to <b>${fpct(peak.share[2])}</b> in the ${peak.lab} group.`;
      g("n7").innerHTML = `In the count chart the full bar is the number of days, so it shows where the days are: the ${smallest.lab} group has only
        ${smallest.n} day${smallest.n === 1 ? "" : "s"}. The proportional chart makes every bar the same height, which makes the mix easy to compare:
        ${fpct(coldest.share[2])} of the days in the coldest group are high-demand days, compared with ${fpct(peak.share[2])} in the ${peak.lab} group. ` +
        (peak !== hi[hi.length - 1] ? "In the hottest group the share drops again, the same dip seen in the scatterplot. " : "") +
        (few.length ? `Read the ${few.map((b) => b.lab).join(" and ")} group${few.length > 1 ? "s" : ""} with care: with fewer than 30 days, one day changes the percentages by
          ${fpct(1 / Math.min(...few.map((b) => b.n)))} or more. ` : "") +
        "The proportional chart hides how many days each bar stands for, so the two charts are best read together.";
    },
  };

  //which parts each row of buttons redraws
  const uses = { unit: ["f1", "f2", "f3", "n2"], bins: ["f1"], scale: ["f1"], cat: ["t7", "f4", "n3"], order: ["f4"], show: ["f4"],
    x: ["f5", "n4"], alpha: ["f5", "n4"], trend: ["f5", "n4"], ylog: ["f5", "n4"], group: ["t8", "f6", "n5"], kind: ["f6", "n5"],
    pct: ["t9"], bars: ["f8"], fill: ["f9"] };
  el.querySelectorAll("[data-o]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.o;
    if (opt[k] === b.dataset.v) return;
    opt[k] = b.dataset.v;
    el.querySelectorAll(`[data-o="${k}"]`).forEach((x) => { x.setAttribute("aria-pressed", x.dataset.v === opt[k]); x.classList.toggle("swipe", x === b); });
    uses[k].forEach((p) => parts[p]());
  }));

  //---------- 4.8: correlation text and the charts that don't change with the buttons ----------
  const names = CORR_VARS.map(([, l]) => l);
  const weather = ["temp_c", "feels_like_c", "humidity", "wind"].map((k) => ({ k, l: CORR_VARS.find(([kk]) => kk === k)[1].toLowerCase(), r: rWith(k) })).filter((x) => !Number.isNaN(x.r));
  const wBest = weather.length ? weather.reduce((a, b) => (Math.abs(b.r) > Math.abs(a.r) ? b : a)) : null;
  Object.assign(parts, {
    f7: () => draw(g("f7"), { height: 230, ...titled(boxplot(rows, "season", SEASONS, "temp_c", "Temperature (°C)", "Season"), "The Seasons Have Very Different Temperatures", "Daily temperature by season") }),
    f10: () => draw(g("f10"), { height: 290, data: { values: cm },
      title: { text: wBest ? `${CORR_VARS.find(([k]) => k === wBest.k)[1]} Has the Strongest Link to Rentals` : "Correlation Matrix", subtitle: "Red = positive, gray = negative, the closer to 0 the fainter" },
      encoding: { x: { field: "a", type: "nominal", sort: names, title: null, axis: { labelAngle: -35 } }, y: { field: "b", type: "nominal", sort: names, title: null } },
      layer: [
        { mark: { type: "rect", stroke: C.PANEL, strokeWidth: 1 }, encoding: { color: { field: "r", type: "quantitative", scale: { domain: [-1, 0, 1], range: [C.BLUE, C.PANEL, C.ORANGE] }, legend: null },
          tooltip: [{ field: "a", title: "Variable" }, { field: "b", title: "With" }, { field: "r", title: "r", format: ".3f" }] } },
        { mark: { type: "text", fontSize: 11 }, encoding: { text: { field: "r", type: "quantitative", format: ".2f" },
          color: { condition: [{ test: "datum.r > 0.55", value: C.ON_ACC }, { test: "datum.r < -0.55", value: C.PANEL }], value: C.FG } } }] }),
    f11: () => {
      const panelW = Math.max(150, Math.floor(((g("f11").clientWidth || 900) - 70) / seasonsIn.length) - 24);
      return draw(g("f11"), { data: { values: rows }, title: { text: "Temperature Still Matters Within Every Season" },
        facet: { column: { field: "season", type: "nominal", sort: SEASONS, title: null } },
        spec: { width: panelW, height: 190, layer: [
          { mark: { type: "circle", size: 18, color: C.BLUE, opacity: 0.4 },
            encoding: { x: { field: "temp_c", type: "quantitative", title: "Temperature (°C)" }, y: { field: "act", type: "quantitative", title: yLabel, axis: { format: ",.0f" } } } },
          { transform: [{ loess: "act", on: "temp_c", groupby: ["season"], bandwidth: 0.6 }], mark: { type: "line", color: C.ORANGE, strokeWidth: 3 },
            encoding: { x: { field: "temp_c", type: "quantitative" }, y: { field: "act", type: "quantitative" } } }] } });
    },
    n8: () => {
      const off = cm.filter((x) => names.indexOf(x.a) < names.indexOf(x.b) && !Number.isNaN(x.r));
      if (!off.length || !wBest) { g("k").innerHTML = "Too few days in view to work out correlations."; return; }
      const strongest = off.reduce((a, b) => (Math.abs(b.r) > Math.abs(a.r) ? b : a));
      const negative = off.reduce((a, b) => (b.r < a.r ? b : a));
      const wZero = weather.reduce((a, b) => (Math.abs(b.r) < Math.abs(a.r) ? b : a));
      const inSeason = seasonGroups.map((gr) => ({ s: gr[0].season, r: corr(gr.map((x) => x.temp_c), gr.map((x) => x.act)) })).filter((x) => !Number.isNaN(x.r));
      const hiS = inSeason.length ? inSeason.reduce((a, b) => (b.r > a.r ? b : a)) : null, loS = inSeason.length ? inSeason.reduce((a, b) => (b.r < a.r ? b : a)) : null;
      const why = (x) => (x.ka === "temp_c" && x.kb === "feels_like_c" ? "they measure nearly the same thing, like a diamond's x, y and z"
        : x.kb === "cnt" && (x.ka === "registered" || x.ka === "casual") ? "all rentals include these rentals, so they rise together by construction" : "these two move together most closely");
      g("k").innerHTML = `<b>${cap1(wBest.l)}</b> goes with rentals most closely (r = ${sign(wBest.r, 2)}, ${strength(wBest.r)})` +
        (inSeason.length > 1 ? `, but the link changes by season: from r = ${sign(hiS.r, 2)} in ${hiS.s} to ${sign(loS.r, 2)} in ${loS.s}.` : ".");
      g("n8").innerHTML = `The diagonal is always 1 because every variable is perfectly correlated with itself, and each value appears twice because
        r(a, b) = r(b, a). The strongest pair is <b>${strongest.a} and ${strongest.b}</b> (r = ${sign(strongest.r, 2)}): ${why(strongest)}. ` +
        (negative.r < 0 ? `The most negative pair is ${negative.a.toLowerCase()} and ${negative.b.toLowerCase()} (r = ${sign(negative.r, 2)}). ` : "") +
        `Of the weather measures, <b>${wBest.l}</b> goes with ${who === "all" ? "" : who + " "}rentals most closely (r = ${sign(wBest.r, 2)}) and ${wZero.l} is closest to zero
        (r = ${sign(wZero.r, 2)}). A value near zero does not prove there is no relationship, only no straight-line one. ` +
        (inSeason.length > 1 ? `The correlation is not the same in every season (Table 10): ${hiS.s} r = ${sign(hiS.r, 2)}, ${loS.s} r = ${sign(loS.r, 2)}. ` : "") +
        "A strong correlation is still not a cause: warmer months also have longer days, school breaks and more tourists, so these numbers describe associations, not controlled effects.";
    },
  });

  //only the open part gets drawn
  const OPEN = { 1: [], 2: ["f1", "f2", "f3", "n2"], 3: ["t7", "f4", "n3"], 4: ["f5", "n4"], 5: ["t8", "f6", "n5", "f7"], 6: ["t9", "f8", "n6"],
    7: ["f9", "n7"], 8: ["f10", "f11", "n8"] };
  return Promise.all(OPEN[n].map((k) => parts[k]()));
}
