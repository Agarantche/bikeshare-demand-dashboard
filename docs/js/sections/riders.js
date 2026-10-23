//section 3: who rides (commuters vs leisure riders through the day, on working days and on weekends)
import { draw, hourLines } from "../charts.js";
import { DATA, hourOf, mean } from "../data.js";
import { head, legend, section } from "../format.js";
import { match, state } from "../state.js";
import { C } from "../theme.js";

export function render(v, el) {
  //registered and casual hourly averages for working days and for weekends (skips the day type filter)
  const pool = DATA.days.filter((d) => match(d, "daytype"));
  const panels = {};
  for (const t of ["Working day", "Weekend"]) {
    const days = pool.filter((d) => d.day_type === t);
    panels[t] = days.length ? [].concat(...["registered", "casual"].map((c) =>
      Array.from({ length: 24 }, (_, h) => ({ hr: h, series: c === "registered" ? "Registered" : "Casual", value: mean(days, (d) => hourOf(d, h, c)) })))) : [];
  }
  const top = Math.max(...Object.values(panels).flat().map((r) => r.value)); //both charts use the same scale
  //the rider type thats not picked fades out
  const fade = { Registered: ["all", "registered"].includes(state.rider) ? 1 : 0.2, Casual: ["all", "casual"].includes(state.rider) ? 1 : 0.2 };
  const title = (t) => `<b class="h4" style="font-size:12px">${t}s${state.daytype !== "all" && state.daytype !== t ? " (outside filter)" : ""}</b>`;

  el.innerHTML = section(3, "Who rides?", "sec-riders",
    "Registered members are commuters: their curve is the rush hour. Casual riders are leisure riders who come out " +
    "on warm weekend afternoons, and they are far more sensitive to weather.") +
    `<div class="card">${head("Commuters vs leisure riders through the day", "Average rentals per hour, on one shared scale.")}
      ${legend([[C.BLUE, "Registered", "ln"], [C.ORANGE, "Casual", "ln"]])}
      <div class="grid2"><div>${title("Working day")}<div class="chart" id="r-work" style="min-height:230px"></div></div>
        <div>${title("Weekend")}<div class="chart" id="r-weekend" style="min-height:230px"></div></div></div></div>`;

  const colors = { Registered: C.BLUE, Casual: C.ORANGE };
  return Promise.all([
    panels["Working day"].length && draw(el.querySelector("#r-work"), hourLines(panels["Working day"], colors, { opacity: fade, ymax: top * 1.05, height: 200 })),
    panels["Weekend"].length && draw(el.querySelector("#r-weekend"), hourLines(panels["Weekend"], colors, { opacity: fade, ymax: top * 1.05, height: 200 })),
  ]);
}
