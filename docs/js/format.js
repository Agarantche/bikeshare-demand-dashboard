//number formatting and small html helpers the sections share

//whole number with commas like 4,504 (or a dash if theres no number)
export function fint(x) {
  return x == null || Number.isNaN(x) ? "—" : Math.round(x).toLocaleString("en-US");
}

//percent with a + or − sign like +64%
export function fspct(x) {
  if (x == null || Number.isNaN(x)) return "—";
  const p = Math.round(x * 100);
  return (p > 0 ? "+" : p < 0 ? "−" : "") + Math.abs(p) + "%";
}

//percent with no sign like 81%
export function fpct(x, digits = 0) {
  return x == null || Number.isNaN(x) ? "—" : (x * 100).toFixed(digits) + "%";
}

//date like Oct 29, 2012 (long=true gives Monday, October 29, 2012)
export function fdate(s, long = false) {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", long
    ? { weekday: "long", month: "long", day: "2-digit", year: "numeric", timeZone: "UTC" }
    : { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" });
}

//hour of the day (0 to 23) as a 12-hour time like 8 AM or 5 PM
export function fhour(h) {
  const x = ((h % 24) + 24) % 24;
  return `${x % 12 || 12} ${x < 12 ? "AM" : "PM"}`;
}

//one hour slot like 5–6 PM (or 11 AM–12 PM when it crosses noon)
export function fslot(h) {
  const a = fhour(h), b = fhour(h + 1);
  return a.slice(-2) === b.slice(-2) ? `${a.slice(0, -3)}–${b}` : `${a}–${b}`;
}

//the same 12-hour time as a vega expression, for chart axes and tooltips (field is where the hour is, like "value" or "hr")
export function hourExpr(field = "value") {
  const h = "datum." + field;
  return `(${h} % 12 == 0 ? 12 : ${h} % 12) + (${h} < 12 ? ' AM' : ' PM')`;
}

//makes text safe to put inside html
export function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

//legend made of [color, label, kind] where kind is dot, ln (line), sq (square) or dash
export function legend(items) {
  return `<div class="legend">${items.map(([color, label, kind]) =>
    `<span class="key"><i class="${kind}" style="background:${color};color:${color}"></i>${label}</span>`).join("")}</div>`;
}

//card title with the grey note under it
export function head(title, note, id) {
  return `<div class="h3"${id ? ` id="${id}"` : ""}>${title}</div>${note ? `<p class="note">${note}</p>` : ""}`;
}

//heading at the top of each part of the page, num is the section number (or a small label like "Overview")
//what goes after the section number in the small handwritten line, like "exploratory data analysis"
export function section(num, title, id, text, what = "") {
  const numbered = typeof num === "number";
  return `<div class="sec" id="${id}">${numbered ? `<span class="sec-n">${num}</span>` : ""}
    <div><div class="sec-k">${numbered ? `Section ${num} of 4` : num}${what ? ` · ${what}` : ""}</div><h1 class="sec-h">${title}</h1></div></div>
    ${text ? `<p class="sec-p">${text}</p>` : ""}`;
}

//report style table like the sample report, with "Table N." above it
//columns where every cell is a number (like 4,504 or 63.3% or −0.05) line up on the right
export function table(columns, rows, caption) {
  const isNum = (v) => /^[−+-]?[\d,.]+%?$/.test(String(v).replace(/<[^>]*>/g, "").trim()) || String(v).trim() === "—";
  const num = columns.map((_, j) => rows.length > 0 && rows.every((r) => isNum(r[j])) && !rows.every((r) => String(r[j]).trim() === "—"));
  const cls = (j) => (num[j] ? ` class="num"` : "");
  return `<p class="cap">${caption}</p><table class="tbl"><thead><tr>${columns.map((c, j) => `<th${cls(j)}>${c}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((v, j) => `<td${cls(j)}>${v}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

//bar list rows: label on the left, bar in the middle, number and note on the right
//rows are {label, value, text, sub, color, selected, muted}, clickable rows get data-k and data-v for the click handler
export function barList(rows, max, k) {
  const mx = max || Math.max(...rows.map((r) => r.value || 0)) || 1;
  return `<div class="hb-list">${rows.map((r) => {
    const tag = k ? "button" : "div";
    const cls = `hb${r.selected ? " sel" : ""}${r.muted ? " muted" : ""}`;
    const data = k ? ` data-k="${k}" data-v="${esc(r.label)}"` : "";
    return `<${tag} class="${cls}"${data}><span class="hb-l">${r.label}</span>
      <span class="hb-t"><span class="hb-f" style="display:block;width:${Math.max(0, (r.value || 0) / mx * 100)}%;${r.color ? `background:${r.color}` : ""}"></span></span>
      <span class="hb-v">${r.text}${r.sub ? `<small>${r.sub}</small>` : ""}</span></${tag}>`;
  }).join("")}</div>`;
}
