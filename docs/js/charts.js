//draws vega-lite charts (the same chart system altair uses) and the chart helpers the sections share
import { C, mode } from "./theme.js";

//chart styling that matches the page: poppins font, see-through background, soft grid lines
function config() {
  return {
    font: "Poppins", background: null, view: { stroke: null },
    axis: { labelColor: C.MUTED, titleColor: C.MUTED, gridColor: C.LINE, domainColor: C.LINE, tickColor: C.LINE,
      labelFontSize: 11, titleFontSize: 12, titleFontWeight: 500 },
    axisY: { minExtent: 46 }, //room for numbers like 8,000
    legend: { labelColor: C.MUTED, titleColor: C.MUTED },
    title: { color: C.HEAD, subtitleColor: C.MUTED, fontSize: 16, fontWeight: 600, anchor: "start", subtitleFontSize: 12, offset: 10 },
    header: { labelColor: C.HEAD, labelFontSize: 13, titleColor: C.HEAD },
  };
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

//hour axis with a label every 3 hours like 0:00, 3:00
export const HOUR_AXIS = { values: [0, 3, 6, 9, 12, 15, 18, 21], labelExpr: "datum.value + ':00'", title: null, grid: false };

//lines by hour with a hover line that lists every series
//rows are {hr, series, value}, colors is series -> color, dashed is a list of series to draw dashed,
//opacity is series -> how faded the line is
export function hourLines(rows, colors, { dashed = [], opacity = {}, ymax = null, height = 230 } = {}) {
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
        transform: [{ pivot: "series", value: "value", groupby: ["hr"] }],
        mark: { type: "rule", color: C.REF },
        encoding: { x, opacity: { condition: { param: "hover", empty: false, value: 1 }, value: 0 },
          tooltip: [{ field: "hr", type: "quantitative", title: "Hour" }, ...series.map((s) => ({ field: s, type: "quantitative", format: ",.0f" }))] } },
      { mark: { type: "point", filled: true, size: 50 },
        encoding: { x, y, color, opacity: { condition: { param: "hover", empty: false, value: 1 }, value: 0 } } },
    ],
  };
}

//chart title with a takeaway headline and a smaller line under it, like the sample report
export function titled(spec, title, subtitle = "") {
  return { ...spec, title: { text: title, subtitle } };
}
