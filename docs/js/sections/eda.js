//section 4: exploratory data analysis, set up like the sample final report's section 5 (here 4.1 to 4.6)
//every chart has a headline title, a "Figure N." caption and a paragraph that explains it
//it uses the filtered days and the picked rider type, so the numbers change with the filters
import { draw, titled } from "../charts.js";
import { DATA, hourOf, mean } from "../data.js";
import { figureNote, fint, section, table } from "../format.js";
import { FILTERS, RIDERS, SEASONS, WEATHERS } from "../settings.js";
import { state } from "../state.js";
import { C } from "../theme.js";
import { corr, histogram, median, percentile, skew } from "../stats.js";

//histogram from values that were already counted into bins (log=true puts it on a log scale)
function hist(values, xTitle, yTitle, bins, log = false) {
  return { data: { values: histogram(values, bins, log) },
    mark: { type: "bar", color: C.BLUE, stroke: C.PANEL, strokeWidth: 0.5 },
    encoding: {
      x: { field: "lo", type: "quantitative", title: xTitle, scale: log ? { type: "log" } : { zero: false }, axis: { format: ",.0f" } },
      x2: { field: "hi" },
      y: { field: "n", type: "quantitative", title: yTitle, axis: { format: ",.0f", tickCount: 5 } }, y2: { datum: 0 }, //bars start at 0
      tooltip: [{ field: "lo", title: "From", format: ",.0f" }, { field: "hi", title: "To", format: ",.0f" }, { field: "n", title: "Count", format: "," }] } };
}

//boxplot of one number split by a category (like the sample's price by cut)
function boxplot(rows, cat, order, value, yTitle, xTitle) {
  return { data: { values: rows },
    mark: { type: "boxplot", size: 46, color: C.BLUE, median: { color: C.PANEL, strokeWidth: 2 }, outliers: { color: C.MUTED, opacity: 0.5 } },
    encoding: { x: { field: cat, type: "nominal", sort: order, title: xTitle, axis: { labelAngle: 0 } },
      y: { field: value, type: "quantitative", title: yTitle, axis: { format: ",.0f" } } } };
}

export function render(v, el) {
  const d = v.d;
  if (!d.length) { el.innerHTML = ""; return Promise.resolve(); }
  const who = state.rider === "all" ? "all" : RIDERS[state.rider].toLowerCase();
  const yLabel = "Rentals per day" + (state.rider === "all" ? "" : ` (${who})`);
  const rows = d.map((x) => ({ date: x.date, act: x.act, temp: x.temp_c, season: x.season, weather: x.weather }));
  const acts = d.map((x) => x.act);

  //---------- 4.1 understanding the dataset ----------
  //hours that exist in hour.csv (missing hours are 0, but every real hour has at least 1 rental)
  const hourly = d.flatMap((x) => Array.from({ length: 24 }, (_, h) => hourOf(x, h, v.col))).filter((n) => n > 0);
  const realHours = d.flatMap((x) => Array.from({ length: 24 }, (_, h) => hourOf(x, h, "cnt"))).filter((n) => n > 0).length;
  const t3 = table(["Check", "Result"], [
    ["Days in view (day.csv)", `${d.length.toLocaleString()} of ${v.all.length.toLocaleString()}`],
    ["Hours in view (hour.csv)", realHours.toLocaleString()],
    ["Hours missing (no rentals recorded)", (d.length * 24 - realHours).toLocaleString()],
    ["Original variables", "16 (day.csv), 17 (hour.csv, adds hr)"], ["Missing values", "0"], ["Duplicate rows", "0"]],
    "Table 3. Basic data-quality checks for the days in view.");

  //---------- 4.2 distribution of rentals ----------
  const statRow = (label, vals) => [label, fint(Math.min(...vals)), fint(percentile(vals, 25)), fint(median(vals)),
    mean(vals).toFixed(1), fint(percentile(vals, 75)), fint(Math.max(...vals))];
  const t4 = table(["Rentals", "Minimum", "First quartile", "Median", "Mean", "Third quartile", "Maximum"],
    [statRow("Per day", acts), statRow("Per hour", hourly)], `Table 4. Summary statistics for rentals (${who} riders).`);

  //---------- 4.3 distribution of weather and season ----------
  const counts = [];
  for (const [k, label] of [["weather", "Weather"], ["season", "Season"]]) {
    const [col, options] = FILTERS[k];
    for (const opt of options) {
      const n = d.filter((x) => x[col] === opt).length;
      counts.push([label, opt, n.toLocaleString(), (n / d.length * 100).toFixed(1)]);
    }
  }
  const clearShare = d.filter((x) => x.weather === "Clear").length / d.length;
  const rainN = d.filter((x) => x.weather === "Rain/snow").length;

  //---------- 4.4 relationship between rentals and temperature ----------
  const r = (f) => corr(d.map(f), acts);
  const t6 = table(["Measure", "Value"], [
    ["Temperature (°C)", sign(r((x) => x.temp_c))], ["Feels-like temperature (°C)", sign(r((x) => x.feels_like_c))],
    ["Humidity (%)", sign(r((x) => x.humidity))], ["Wind speed (km/h)", sign(r((x) => x.wind))],
    ["Median temperature (°C)", median(d.map((x) => x.temp_c)).toFixed(1)], ["Median rentals per day", fint(median(acts))]],
    "Table 6. Pearson correlations with daily rentals, and medians.");
  const rTemp = r((x) => x.temp_c);

  //---------- 4.5 rentals by season and weather ----------
  const t7 = table(["Season", "Days", "Median rentals", "Mean rentals", "Median temperature (°C)"],
    SEASONS.map((s) => d.filter((x) => x.season === s)).filter((g) => g.length).map((g) =>
      [g[0].season, g.length.toLocaleString(), fint(median(g.map((x) => x.act))), fint(mean(g, (x) => x.act)), median(g.map((x) => x.temp_c)).toFixed(1)]),
    "Table 7. Rentals and temperature by season.");
  const medTemp = {};
  for (const s of SEASONS) { const g = d.filter((x) => x.season === s); if (g.length) medTemp[s] = median(g.map((x) => x.temp_c)); }

  el.innerHTML = section(4, "Exploratory data analysis", "sec-eda",
    "A closer, report-style look at the data behind the dashboard, set up like the course's sample final report: how " +
    "rentals are distributed, how the categories are split, and which relationships hold up. Everything here follows the " +
    "filters and rider type at the top.") +
  `<div class="card"><p class="sub">4.1 Understanding the dataset</p>${t3}
    <p class="interp">Each row of <code>day.csv</code> is one day and each row of <code>hour.csv</code> is one hour of a day. The main
    response variable is the number of rentals (<code>cnt</code>, split into <code>registered</code> and <code>casual</code>). The main
    explanatory variables are time (hour, weekday, season), weather and temperature. There are no missing values or duplicate rows;
    the hours missing from <code>hour.csv</code> are hours with no rentals, mostly during storms, so no rows were removed.</p></div>

  <div class="card"><p class="sub">4.2 Distribution of rentals</p>${t4}
    <div class="grid2">
      <div><div class="chart" id="f1" style="min-height:330px"></div>${figureNote("Figure 1. Distribution of daily rentals.",
        `Daily rentals have no long tail: the mean (${fint(mean(acts))}) and the median (${fint(median(acts))}) are close
        (skewness ${skew(acts).toFixed(2)}). The very low days on the left are mostly storms and holidays, which section 2 looks at.`)}</div>
      <div><div class="chart" id="f2" style="min-height:330px"></div>${figureNote("Figure 2. Distribution of hourly rentals.",
        `Hourly rentals are very different: most hours are quiet and a small number of rush hours are very busy, so the mean
        (${fint(mean(hourly))}) is well above the median (${fint(median(hourly))}). This right skew makes the low end hard to see.`)}</div>
    </div>
    <div class="chart" id="f3" style="min-height:310px"></div>${figureNote("Figure 3. Distribution of hourly rentals on a log scale.",
      "The log scale does not make the distribution normal, and it does not need to be for exploration. It spreads out the quiet hours " +
      "so the two groups are visible: overnight hours with only a few rentals, and daytime hours with hundreds. The original counts are " +
      "still used for everything reported in rentals.")}</div>

  <div class="card"><p class="sub">4.3 Distribution of weather and season</p>
    ${table(["Variable", "Category", "Days", "Percentage"], counts, "Table 5. Frequency of weather and season (days in view).")}
    <p class="interp">About ${Math.round(clearShare * 100)}% of the days are clear and only ${rainN} are rain or snow days, so averages for
    rain/snow rest on few days. The four seasons are close to equal in size. Because weather and season are categories, a log
    transformation does not apply to them.</p></div>

  <div class="card"><p class="sub">4.4 Relationship between rentals and temperature</p>
    <div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr))">${"<div>" + t6 + "</div>"}
      <div><div class="chart" id="f4" style="min-height:370px"></div></div></div>
    ${figureNote("Figure 4. Relationship between temperature and daily rentals.",
      `Rentals have a strong positive association with temperature (r = ${sign(rTemp, 2)}): warmer days are generally busier. The trend is
      not a straight line, though. It flattens and dips on the hottest days, so very hot weather also keeps some riders away. Humidity and
      wind have weaker, negative associations. Days at the same temperature still vary a lot, because season, weather, day type and the
      2011 to 2012 growth also matter.`)}</div>

  <div class="card"><p class="sub">4.5 Rentals by season and weather</p>${t7}
    <div class="grid2">
      <div><div class="chart" id="f5" style="min-height:350px"></div>${figureNote("Figure 5. Distribution of daily rentals by season.",
        "Winter has a much lower median than the other seasons, and Summer the highest. It would be easy to conclude that the season itself " +
        "drives demand, but the seasons also differ in temperature, which section 4.4 showed is strongly related to rentals.")}</div>
      <div><div class="chart" id="f6" style="min-height:350px"></div>${figureNote("Figure 6. Distribution of daily rentals by weather.",
        "Clear days have the highest median and rain/snow days by far the lowest. The rain/snow box is based on only a few days, so its " +
        "exact level is less certain than the others.")}</div>
    </div></div>

  <div class="card"><p class="sub">4.6 Is it the season or the temperature?</p>
    <p class="interp">Because temperature is strongly related to rentals, the next step is to check whether temperature differs between the
    seasons, and whether warmer days are busier within each season too.</p>
    <div class="chart" id="f7" style="min-height:330px"></div>${figureNote("Figure 7. Distribution of daily temperature by season.",
      "Temperatures differ a lot by season" + (medTemp.Winter != null && medTemp.Summer != null
        ? `: the median Winter day is about ${Math.round(medTemp.Winter)}°C, compared with ${Math.round(medTemp.Summer)}°C in Summer.` : ".") +
      " Since warmer days have more rentals, colder temperatures explain much of why Winter is slow.")}
    <div class="chart" id="f8" style="min-height:280px;overflow-x:auto"></div>${figureNote("Figure 8. Temperature and daily rentals within each season.",
      "Within each season, warmer days still tend to be busier, especially in Winter and Spring. In Summer the trend flattens or dips, " +
      "because the hottest days lose riders. So the low Winter numbers are not only about the calendar: much of the seasonal difference " +
      "comes from temperature. This is an association in observational data, not proof that temperature alone causes the change; " +
      "daylight hours, holidays and the 2011 to 2012 growth also differ across the year.")}</div>`;

  //---------- the charts ----------
  const g = (id) => el.querySelector("#" + id);
  const scatter = { mark: { type: "circle", size: 28, color: C.BLUE, opacity: 0.45 },
    encoding: { x: { field: "temp", type: "quantitative", title: "Temperature (°C)" },
      y: { field: "act", type: "quantitative", title: yLabel, axis: { format: ",.0f" } },
      tooltip: [{ field: "date", title: "Date" }, { field: "temp", title: "Temp (°C)", format: ".1f" }, { field: "act", title: "Rentals", format: "," }] } };
  //small multiples: one panel per season, each with its own trend line (like the sample's price vs carat within each cut)
  const seasonsIn = SEASONS.filter((s) => d.some((x) => x.season === s));
  const panelW = Math.max(160, Math.floor(((g("f8").clientWidth || 900) - 70) / seasonsIn.length) - 24);
  return Promise.all([
    draw(g("f1"), { height: 260, ...titled(hist(acts, yLabel, "Number of days", 30), "Daily Rentals Are Spread Fairly Evenly", "Most days fall between about 2,000 and 8,000 rentals") }),
    draw(g("f2"), { height: 260, ...titled(hist(hourly, "Rentals per hour", "Number of hours", 40), "Hourly Rentals Are Strongly Right-Skewed", "Many quiet hours, a few very busy rush hours") }),
    draw(g("f3"), { height: 240, ...titled(hist(hourly, "Rentals per hour (log scale)", "Number of hours", 40, true), "On a Log Scale the Quiet and Busy Hours Both Show Up", "Two humps: overnight hours and daytime hours") }),
    draw(g("f4"), { height: 300, data: { values: rows }, title: { text: "Warmer Days Bring More Riders, Up to a Point", subtitle: "Each dot is a day, the red line is the overall trend" },
      layer: [scatter, { transform: [{ loess: "act", on: "temp", bandwidth: 0.4 }], mark: { type: "line", color: C.ORANGE, strokeWidth: 3 },
        encoding: { x: { field: "temp", type: "quantitative" }, y: { field: "act", type: "quantitative" } } }] }),
    draw(g("f5"), { height: 280, ...titled(boxplot(rows, "season", SEASONS, "act", yLabel, "Season"), "Winter Stands Out as the Slow Season", "Daily rentals by season") }),
    draw(g("f6"), { height: 280, ...titled(boxplot(rows, "weather", WEATHERS, "act", yLabel, "Weather"), "Rain and Snow Cut Rentals Sharply", "Daily rentals by weather") }),
    draw(g("f7"), { height: 260, ...titled(boxplot(rows, "season", SEASONS, "temp", "Temperature (°C)", "Season"), "The Seasons Have Very Different Temperatures", "Daily temperature by season") }),
    draw(g("f8"), { data: { values: rows }, title: { text: "Temperature Still Matters Within Every Season" },
      facet: { column: { field: "season", type: "nominal", sort: SEASONS, title: null } },
      spec: { width: panelW, height: 200, layer: [
        { mark: { type: "circle", size: 18, color: C.BLUE, opacity: 0.4 },
          encoding: { x: { field: "temp", type: "quantitative", title: "Temperature (°C)" }, y: { field: "act", type: "quantitative", title: yLabel, axis: { format: ",.0f" } } } },
        { transform: [{ loess: "act", on: "temp", groupby: ["season"], bandwidth: 0.6 }], mark: { type: "line", color: C.ORANGE, strokeWidth: 3 },
          encoding: { x: { field: "temp", type: "quantitative" }, y: { field: "act", type: "quantitative" } } }] } }),
  ]);
}

//correlation with a + or − sign
function sign(x, digits = 3) {
  return (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(digits);
}
