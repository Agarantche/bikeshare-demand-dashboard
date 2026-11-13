//draws vega-lite charts (the same chart system altair uses) and the chart helpers the sections share
import { hourExpr } from "./format.js";
import { C, mode } from "./theme.js";

//chart styling that matches the page: karla for the numbers, fraunces for the titles, see-through background, dotted grid lines
function config() {
  return {
    font: "Karla", background: null, view: { stroke: null },
    axis: { labelColor: C.MUTED, titleColor: C.MUTED, gridColor: C.LINE, gridDash: [2, 4], domainColor: C.REF, tickColor: C.REF,
      labelFontSize: 12, titleFontSize: 13, titleFontWeight: 500, labelPadding: 4, titlePadding: 8, tickSize: 4 },
    axisY: { minExtent: 46, domain: false }, //room for numbers like 8,000, no extra line down the side
    //legends: small round keys lined up on the left, the same size as the html legends above the charts
    legend: { labelColor: C.MUTED, titleColor: C.MUTED, labelFontSize: 12, titleFontSize: 12, titleFontWeight: 500,
      symbolType: "circle", symbolSize: 80, symbolStrokeWidth: 0, columnPadding: 14, rowPadding: 6, padding: 2, offset: 10 },
    title: { font: "Fraunces", color: C.HEAD, subtitleFont: "Karla", subtitleColor: C.MUTED, fontSize: 19, fontWeight: 600, anchor: "start",
      subtitleFontSize: 13, offset: 10 },
    header: { labelFont: "Fraunces", labelColor: C.HEAD, labelFontSize: 15, labelFontWeight: 600, titleColor: C.HEAD },
  };
}

//handwritten notes on a chart, in the red pen. use it like { type: "text", ...hand(), align: "left" }
export function hand(size = 19) {
  return { font: "Caveat", fontSize: size, fontWeight: 700, color: C.PEN };
}

//draws a chart into el. onClick gets the data of whatever was clicked (a day, a heatmap cell...)
export async function draw(el, spec, onClick) {
  if (!el) return null;
  const full = { $schema: "https://vega.github.io/schema/vega-lite/v5.json", ...spec, config: config() };
  if (!spec.facet) { //charts fill their card, small multiples set their own width
    full.width = spec.width ?? "container";
    full.autosize = { type: "fit-x", contains: "padding" };
  }
  const res = await vegaEmbed(el, full, { actions: false, renderer: "svg", tooltip: { theme: mode() } });
  if (onClick) {
    res.view.addEventListener("click", (event, item) => {
      if (!item || !item.datum) return;
      onClick(item.datum.datum ?? item.datum); //nearest-point clicks wrap the data one level deeper
    });
  }
  return res.view;
}

//hour axis with a label every 3 hours like 12 AM, 3 AM
const HOUR_AXIS = { values: [0, 3, 6, 9, 12, 15, 18, 21], labelExpr: hourExpr(), title: null, grid: false };

//lines by hour with a hover line that lists every series
//rows are {hr, series, value}, colors is series -> color, dashed is a list of series to draw dashed,
//opacity is series -> how faded the line is, notes are handwritten labels like {hr, value, text} written above that point
export function hourLines(rows, colors, { dashed = [], opacity = {}, ymax = null, height = 230, notes = [] } = {}) {
  const series = Object.keys(colors).filter((s) => rows.some((r) => r.series === s));
  const data = rows.map((r) => ({ ...r, op: opacity[r.series] ?? 1 }));
  const color = { field: "series", type: "nominal", scale: { domain: Object.keys(colors), range: Object.values(colors) }, legend: null };
  const x = { field: "hr", type: "quantitative", axis: HOUR_AXIS, scale: { domain: [0, 23] } };
  const y = { field: "value", type: "quantitative", title: null, axis: { format: ",.0f", tickCount: 4 }, ...(ymax ? { scale: { domain: [0, ymax] } } : {}) };
  return {
    height, data: { values: data },
    layer: [
      { mark: { type: "line", strokeWidth: 2, strokeCap: "round" },
        encoding: { x, y, color, opacity: { field: "op", type: "quantitative", scale: null },
          strokeDash: { condition: { test: `indexof(${JSON.stringify(dashed)}, datum.series) >= 0`, value: [5, 4] }, value: [1, 0] } } },
      { params: [{ name: "hover", select: { type: "point", on: "pointerover", nearest: true, fields: ["hr"], clear: "pointerout" } }],
        transform: [{ pivot: "series", value: "value", groupby: ["hr"] }, { calculate: hourExpr("hr"), as: "time" }],
        mark: { type: "rule", color: C.REF },
        encoding: { x, opacity: { condition: { param: "hover", empty: false, value: 1 }, value: 0 },
          tooltip: [{ field: "time", type: "nominal", title: "Time" }, ...series.map((s) => ({ field: s, type: "quantitative", format: ",.0f" }))] } },
      { mark: { type: "point", filled: true, size: 50 },
        encoding: { x, y, color, opacity: { condition: { param: "hover", empty: false, value: 1 }, value: 0 } } },
      ...(notes.length ? [{ data: { values: notes }, mark: { type: "text", ...hand(), dy: -12 }, encoding: { x, y, text: { field: "text" } } }] : []),
    ],
  };
}

//chart title with a takeaway headline and a smaller line under it, like the sample report
export function titled(spec, title, subtitle = "") {
  return { ...spec, title: { text: title, subtitle } };
}
