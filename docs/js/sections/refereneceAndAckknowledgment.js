//state resources writtern materials writen and any contributions to the project
//the references page: where the data came from, what the analysis leaned on, the tools and who did the work
import { section } from "../format.js";

//a link that opens in a new tab
const link = (url) => `<a href="${url}" target="_blank" rel="noopener">${url.replace(/^https:\/\//, "")}</a>`;

//apa style, one list per card
const DATA = [
  `Fanaee-T, H. (2013). <i>Bike Sharing</i> [Dataset]. UCI Machine Learning Repository. ${link("https://doi.org/10.24432/C5W894")}`,
  `Fanaee-T, H., &amp; Gama, J. (2013). Event labeling combining ensemble detectors and background knowledge.
    <i>Progress in Artificial Intelligence, 2</i>(2–3), 113–127. ${link("https://doi.org/10.1007/s13748-013-0040-3")}`,
  `Capital Bikeshare. <i>System data</i> (the original trip records the dataset was built from). ${link("https://capitalbikeshare.com/system-data")}`,
];

const WRITTEN = [
  `Rout, S. (2023). <i>Bike sharing demand prediction</i> [R Markdown document]. RPubs. ${link("https://rpubs.com/Subhalaxmi/1039182")}`,
  `ASCI 2000 course materials. <i>Sample Final Project Report: Data Visualization of Diamond Prices.</i>`,
  `ASCI 2000 course labs 1–10 (the methods used in "Showing my work" and in the written report).`,
];

//[name, what it did here, link]
const TOOLS = [
  ["Python, pandas", "cleaning the data and working out the numbers", "https://pandas.pydata.org"],
  ["scikit-learn", "the expected-rentals model (gradient boosting)", "https://scikit-learn.org"],
  ["Vega-Lite 5.23 and Vega-Embed 6.29", "drawing every chart on this site", "https://vega.github.io/vega-lite/"],
  ["R and ggplot2 (tidyverse)", "the R Markdown version of the labs and the written report", "https://www.tidyverse.org"],
  ["Google Fonts: Fraunces, Karla, Caveat", "the headings, body text and handwritten notes", "https://fonts.google.com"],
  ["Git, GitHub and GitHub Pages", "version history and hosting this site", "https://pages.github.com"],
];

export function render(v, el) {
  const list = (items) => `<ol class="refs">${items.map((r) => `<li>${r}</li>`).join("")}</ol>`;
  el.innerHTML = section("References", "Sources and thanks", "sec-refs",
    "Where the data came from, the written materials that shaped the analysis, and the tools used to build this journal.") +
    `<div class="card"><h3 class="h3">Data</h3>${list(DATA)}
      <p class="note">The dataset adds weather from freemeteo.com and the D.C. holiday schedule to the Capital Bikeshare records.
      The storm days marked on the charts (the January 2011 snowstorm, Hurricane Irene and Hurricane Sandy) match the events
      labelled by Fanaee-T and Gama.</p></div>
    <div class="card"><h3 class="h3">Written materials</h3>${list(WRITTEN)}</div>
    <div class="card"><h3 class="h3">Software and tools</h3>
      <ul class="refs tools">${TOOLS.map(([name, what, url]) => `<li><b>${name}</b>: ${what}. ${link(url)}</li>`).join("")}</ul></div>
    <div class="card"><h3 class="h3">Contributions</h3>
      <p>This is an individual project by Adam Garantche for ASCI 2000. There were no group members.</p></div>`;
  return Promise.resolve();
}
