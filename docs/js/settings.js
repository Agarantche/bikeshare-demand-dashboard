//the fixed choices and limits used all over the dashboard (same as dashboard/settings.py)
export const YEARS = [2011, 2012];
export const SEASONS = ["Winter", "Spring", "Summer", "Fall"];
export const DAY_TYPES = ["Working day", "Weekend", "Holiday"];
export const WEATHERS = ["Clear", "Mist/cloudy", "Rain/snow"];
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAY_NAMES = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

//rider type -> the column it uses
export const RIDERS = { all: "All riders", registered: "Registered", casual: "Casual" };
export const COLS = { all: "cnt", registered: "registered", casual: "casual" };

//each filter: state key -> [column in the data, options, label when nothing is picked]
export const FILTERS = {
  year: ["year", YEARS, "All years"],
  season: ["season", SEASONS, "All seasons"],
  daytype: ["day_type", DAY_TYPES, "All day types"],
  weather: ["weather", WEATHERS, "All weather"],
};

export const DISRUPTED = -0.5; //a day is disrupted when its more than 50% below expected
export const ABOVE = 0.3; //and well above when its more than 30% above
