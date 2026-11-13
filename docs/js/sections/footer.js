//the data table page (with a csv download) and the footer with the copyright under every page
import { esc, section } from "../format.js";

//columns shown in the table and the csv
const COLUMNS = ["date", "season", "weekday", "day_type", "weather", "temp_f", "humidity", "wind", "cnt", "registered", "casual",
  "expected_cnt", "event"];

export function render(v, el) {
  const rows = v.d.map((d) => `<tr>${COLUMNS.map((c) => `<td>${esc(d[c])}</td>`).join("")}</tr>`).join("");
  el.innerHTML = section("Data", "The raw notes", "sec-data",
    `The ${v.d.length.toLocaleString()} days that match the filters, one row per day, with the model's expected rentals.`) +
    `<div class="card"><p><button class="btn" id="csv">Download as CSV</button></p>
      <div class="tbl-wrap" style="max-height:70vh"><table class="tbl"><thead><tr>${COLUMNS.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>
    </div>`;
  //csv download made in the browser from the filtered days
  el.querySelector("#csv").addEventListener("click", () => {
    const quote = (x) => (/[",\n]/.test(String(x)) ? `"${String(x).replace(/"/g, '""')}"` : x);
    const csv = [COLUMNS.join(","), ...v.d.map((d) => COLUMNS.map((c) => quote(d[c])).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "bike_sharing_filtered.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000); //give the download a moment before cleaning up
  });
  return Promise.resolve();
}

//the footer under every page
export function footerHtml() {
  return `<footer class="footer">
      <span class="sig">Adam Garantche</span>
      <span>© ${new Date().getFullYear()} Adam Garantche. All rights reserved.</span>
      <span>Data: Capital Bikeshare via the <a href="https://archive.ics.uci.edu/dataset/275/bike+sharing+dataset" target="_blank" rel="noopener">UCI Machine Learning Repository</a></span>
    </footer>`;
}
