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

//numbered section heading with a line above it and a back to top link
export function section(num, title, id, text) {
  return `<div class="sec" id="${id}"><span class="sec-n">${num}</span>
    <div><div class="sec-k">Section ${num} of 4</div><div class="sec-h">${title}</div></div>
    <a class="sec-top" href="#top">↑ Back to top</a></div><p class="sec-p">${text}</p>`;
}

//report style table like the sample report, with "Table N." above it
export function table(columns, rows, caption) {
  return `<p class="cap">${caption}</p><table class="tbl"><thead><tr>${columns.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

//"Figure N." caption under a chart, plus the paragraph that explains it
export function figureNote(caption, text) {
  return `<p class="cap">${caption}</p><p class="interp">${text}</p>`;
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
