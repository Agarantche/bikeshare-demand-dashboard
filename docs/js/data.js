//loads the data (made by export_data.py) and works out the numbers for the current filters
import { COLS, DISRUPTED, FILTERS } from "./settings.js";
import { match, state } from "./state.js";

//days is one object per day, hours has 24 numbers per day for each rider type (same order as days)
export const DATA = { days: [], hours: {} };

export async function load() {
  const [days, hours] = await Promise.all([
    fetch("data/days.json").then((r) => r.json()),
    fetch("data/hours.json").then((r) => r.json()),
  ]);
  days.forEach((d, i) => { d.i = i; }); //i is the row number, used to find the day's hours
  DATA.days = days;
  DATA.hours = hours;
}

//rentals in hour h of a day, for the rider type the charts use
export function hourOf(d, h, col) {
  return DATA.hours[col][d.i][h];
}

//average of a list of numbers (null if its empty)
export function mean(list, f = (x) => x) {
  return list.length ? list.reduce((s, x) => s + f(x), 0) / list.length : null;
}

//average rentals for each of the 24 hours over a list of days
export function hourlyAverage(days, col) {
  return Array.from({ length: 24 }, (_, h) => mean(days, (d) => hourOf(d, h, col)) ?? 0);
}

//the numbers for the current filters, every section gets them from here
export function build() {
  const col = COLS[state.rider]; //the column the charts use (cnt, registered or casual)
  for (const d of DATA.days) {
    d.act = d[col]; //actual rentals for the picked rider type
    d.exp = d["expected_" + col]; //what the model expected
    d.gap = d.act / d.exp - 1; //how far each day was from expected, -0.5 means 50% below
    d.inView = match(d);
  }
  const d = DATA.days.filter((x) => x.inView); //d is the filtered days
  return {
    col, d, all: DATA.days,
    anyFilter: Object.keys(FILTERS).some((k) => state[k] !== "all"),
    disrupted: d.filter((x) => x.gap <= DISRUPTED), //days more than 50% below expected
  };
}
