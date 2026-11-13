//the intro page people see first: the question, 4 key findings and buttons into each part
//it always uses all 731 days and all riders, so the findings dont change with the filters
import { DATA, hourlyAverage, mean } from "../data.js";
import { fhour, fint, fpct, fspct } from "../format.js";
import { DISRUPTED } from "../settings.js";
import { go } from "../state.js";
import { corr } from "../stats.js";
import { LABS } from "./eda.js";

export function render(v, el) {
  const days = DATA.days;
  //when: the busiest hour on working days (and the morning peak), and the quietest hour overall
  const work = hourlyAverage(days.filter((d) => d.day_type === "Working day"), "cnt");
  const peak = work.indexOf(Math.max(...work)), morning = work.indexOf(Math.max(...work.slice(0, 12)));
  const all = hourlyAverage(days, "cnt"), quiet = all.indexOf(Math.min(...all));
  //weather: rain or snow vs clear days, and how closely temperature goes with rentals
  const avg = (w) => mean(days.filter((d) => d.weather === w), (d) => d.cnt);
  const rain = avg("Rain/snow") / avg("Clear") - 1;
  const r = corr(days.map((d) => d.temp_f), days.map((d) => d.cnt));
  //disruptions: days far below what the model expected
  const disrupted = days.filter((d) => d.cnt / d.expected_cnt - 1 <= DISRUPTED).length;
  //riders: share of rentals by registered members
  const reg = days.reduce((s, d) => s + d.registered, 0) / days.reduce((s, d) => s + d.cnt, 0);

  const finding = (big, label, text, view, lab, link) => `<div class="find">
    <span class="kpi-l">${label}</span><span class="kpi-v">${big}</span><p>${text}</p>
    <button class="link" data-go="${view}"${lab ? ` data-lab="${lab}"` : ""}>${link} →</button></div>`;

  el.innerHTML = `<div class="hero">
      <div class="sec-k">ASCI 2000 final project · Adam Garantche</div>
      <h1 class="hero-h">When and why do people rent bikes?</h1>
      <p class="hero-p">An interactive look at <b>731 days and 17,379 hours</b> of Capital Bikeshare rentals in Washington, D.C. (2011–2012),
      to help a bike-share operator plan bikes, staff and maintenance around the times and conditions that drive demand.</p>
      <div class="question"><b>The question:</b> how are the time of day, the season, the weather and the type of day related to the number
      of bike rentals, and how do casual and registered riders differ?</div>
      <div class="hero-btns"><button class="btn primary" data-go="overview">Start with the overview →</button>
        <button class="btn" data-go="analysis" data-lab="1">See my work</button></div>
    </div>

    <div class="over">Four things the data told me</div>
    <div class="finds">
      ${finding(fhour(peak), "the rush is real", `The busiest hour on working days, with a second commuter peak at ${fhour(morning)}. The quietest time is around
        ${fhour(quiet)}, with about ${fint(all[quiet])} rentals an hour.`, "when", null, "When do people ride?")}
      ${finding(fspct(rain), "rain ruins everything", `Rain or snow days have ${fpct(Math.abs(rain))} fewer rentals than clear days, and warmer days are busier
        (r = +${r.toFixed(2)}).`, "analysis", 4, "Weather and rentals")}
      ${finding(disrupted, "days that went sideways", "days fell more than 50% below what the model expected for their weather, mostly storms like Hurricane Sandy and holidays.",
        "disrupt", null, "What throws it off?")}
      ${finding(fpct(reg), "mostly commuters", "of rentals are by registered members, who ride at commute times. Casual riders come out on warm weekend afternoons.",
        "riders", null, "Who's riding?")}
    </div>

    <div class="card">
      <p class="sub">How the course labs are used</p>
      <p class="note">The analysis has one part per course lab, each applied to this data. Click one to open it.</p>
      <div class="lab-grid">${LABS.map(([n, lab, name, what]) => `<button class="lab-card" data-go="analysis" data-lab="${n}">
        <span class="pill">${lab}</span><b>4.${n} ${name}</b><small>${what}</small></button>`).join("")}</div>
    </div>`;
  el.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go, b.dataset.lab ? +b.dataset.lab : null)));
  return Promise.resolve();
}
