//section 2: what disrupts it (the disrupted days table, clicking a row opens that day)
import { esc, fdate, fint, fspct, head, section } from "../format.js";
import { openDay } from "../state.js";

export function render(v, el) {
  const worst = [...v.disrupted].sort((a, b) => a.gap - b.gap); //worst day first
  const rows = worst.map((d) => `<tr data-day="${d.date}"><td>${fdate(d.date)}</td><td>${d.event ? esc(d.event) : "—"}</td>
    <td>${d.weather}</td><td class="num">${fint(d.act)}</td><td class="num">${fint(d.exp)}</td><td class="num bad-text">${fspct(d.gap)}</td></tr>`).join("");
  el.innerHTML = section(2, "What disrupts it?", "sec-disrupt",
    "A short list of storms and holiday days makes up most of the shortfall against expected. " +
    "How weather and temperature affect a normal day is covered in Section 4.") +
    `<div class="card">${head("Disrupted days", "Days more than 50% below expected, worst first. Click a row to open that day in the Overview.")}
      ${worst.length ? `<div class="tbl-wrap"><table class="tbl click"><thead><tr><th>Date</th><th>Event</th><th>Weather</th>
        <th class="num">Rentals</th><th class="num">Expected</th><th class="num">vs expected</th></tr></thead><tbody>${rows}</tbody></table></div>`
        : `<p class="note">No disrupted days match the current filters.</p>`}</div>`;
  el.querySelectorAll("tr[data-day]").forEach((tr) => tr.addEventListener("click", () =>
    openDay(tr.dataset.day, true, "Opened in the daily chart in the Overview")));
  return Promise.resolve();
}
