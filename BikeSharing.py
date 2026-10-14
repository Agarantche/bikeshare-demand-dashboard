#bike sharing demand dashboard, run with: streamlit run BikeSharing.py
import altair as alt
import pandas as pd
import streamlit as st

from model import add_expected, fit_models, predict
from prep import load_day, load_hour

st.set_page_config(page_title="Bike-Sharing Demand", page_icon="🚲", layout="wide")

#colors for the charts, each category keeps the same color on every chart
BLUE, ORANGE, AQUA, YELLOW = "#2a78d6", "#eb6834", "#1baf7a", "#eda100"
GRAY = "#8a8a8a"
BLUE_RAMP = ["#cde2fb", "#86b6ef", "#3987e5", "#1c5cab", "#0d366b"]  #light to dark blue for the heatmap

#the order categories show up in on charts and filters
YEARS = [2011, 2012]
SEASON_ORDER = ["Winter", "Spring", "Summer", "Fall"]
DAY_TYPES = ["Working day", "Weekend", "Holiday"]
WEATHER_ORDER = ["Clear", "Mist/Cloudy", "Light Rain/Snow"]
WEEKDAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

#color scales that match each category to its color
SEASON_SCALE = alt.Scale(domain=SEASON_ORDER, range=[BLUE, ORANGE, AQUA, YELLOW])
DAY_TYPE_SCALE = alt.Scale(domain=DAY_TYPES, range=[BLUE, ORANGE, AQUA])
WEATHER_SCALE = alt.Scale(domain=WEATHER_ORDER, range=[BLUE, ORANGE, AQUA])
YEAR_SCALE = alt.Scale(domain=["2011", "2012"], range=[BLUE, ORANGE])
USER_SCALE = alt.Scale(domain=["Registered", "Casual"], range=[BLUE, ORANGE])
TREND_SCALE = alt.Scale(domain=["Actual", "Expected"], range=[BLUE, GRAY])
FLAG_SCALE = alt.Scale(domain=["Well below expected", "Well above expected"], range=[ORANGE, AQUA])
DAY_SCALE = alt.Scale(domain=["This day", "Typical similar day"], range=[BLUE, GRAY])

#rider type options in the sidebar and which column each one uses
METRICS = {"All riders": "cnt", "Registered riders": "registered", "Casual riders": "casual"}
#options for the weather scatter plot dropdown
WEATHER_VARS = {
    "Temperature (°C)": "temp_c",
    "Feels-like temperature (°C)": "feels_like_c",
    "Humidity (%)": "humidity",
    "Wind speed": "wind",
}
HOUR_AXIS = alt.Axis(values=list(range(0, 24, 3)), labelExpr="datum.value + ':00'")  #shows hours as 0:00, 3:00...
#each filter: session state key -> (column it filters, default options)
FILTERS = {"years": ("year", YEARS), "seasons": ("season", SEASON_ORDER),
           "day_types": ("day_type", DAY_TYPES), "weathers": ("weather", WEATHER_ORDER)}
FLAG = 0.4  #a day counts as unusual when its 40%+ away from the expected demand


#loads both csv files and adds the model's expected values, cached so it only runs once
@st.cache_data(show_spinner="Loading data and training the model...")
def get_data():
    day = add_expected(load_day())
    day["date_str"] = day["dteday"].dt.strftime("%Y-%m-%d")  #date as text so clicking a day on the chart works
    hour = load_hour()
    hour["date_str"] = hour["dteday"].dt.strftime("%Y-%m-%d")
    return day, hour


#trains the models for the demand planner, also cached
@st.cache_resource
def get_models():
    return fit_models(get_data()[0])


#shows an altair chart at full width
def show(chart, **kwargs):
    return st.altair_chart(chart, width="stretch", **kwargs)


#formats a number as a percent with a + or - sign
def pct(x):
    return f"{x:+.0%}"


#---------- callbacks, these run when something gets clicked ----------

#filters changed from the sidebar or a button, so the clickable charts get a new key
#and start fresh instead of still highlighting the old bars
def refresh_charts():
    st.session_state["chart_rev"] = st.session_state.get("chart_rev", 0) + 1


#sets one or more filters at once, used by the buttons in the day details
def set_filters(**values):
    for key, value in values.items():
        st.session_state[key] = value
    refresh_charts()


#puts every filter back to showing everything
def reset_filters():
    set_filters(**{key: default for key, (_, default) in FILTERS.items()})


#gets what was clicked on a chart
def selected_values(chart_key, param, field):
    state = st.session_state.get(chart_key)
    if not state:
        return []
    return [p[field] for p in state["selection"].get(param, []) if field in p]


#the bars clicked on a chart become the filter, if nothing is clicked the filter goes back to everything
def filter_from_chart(chart_key, param, field, filter_key):
    picked = selected_values(chart_key, param, field)
    st.session_state[filter_key] = picked or FILTERS[filter_key][1]


#clicking a day on the trend chart opens it in the day details
def focus_day_from_chart():
    picked = selected_values("trend_chart", "day_pick", "date_str")
    if picked:
        st.session_state["focus_day"] = picked[0]


#picking a row in the unusual days table opens that day
def focus_day_from_table():
    rows = st.session_state["unusual_table"]["selection"]["rows"]
    if rows:
        st.session_state["focus_day"] = st.session_state["unusual_dates"][rows[0]]


#clear button, goes back to the default day
def clear_focus_day():
    st.session_state.pop("focus_day", None)


#clicking a heatmap cell opens that weekday and hour
def focus_slot_from_chart():
    state = st.session_state.get("heatmap")
    picked = state["selection"].get("slot_pick", []) if state else []
    if picked:
        st.session_state["focus_slot"] = (picked[0]["weekday"], int(picked[0]["hr"]))


#---------- chart helpers ----------

#line chart by hour, hovering shows every line's value at that hour
#and clicking the legend highlights one line
def hourly_lines(df, series_col, scale, y_title, height=340, dashed=None):
    hover = alt.selection_point(on="pointerover", nearest=True, fields=["hr"], empty=False)
    legend = alt.selection_point(fields=["series"], bind="legend")
    data = df.rename(columns={series_col: "series"})
    series = [s for s in scale.domain if s in set(data["series"])]

    base = alt.Chart(data).encode(
        x=alt.X("hr:Q", title="Hour of day", axis=HOUR_AXIS, scale=alt.Scale(domain=[0, 23])),
        y=alt.Y("value:Q", title=y_title),
        color=alt.Color("series:N", scale=scale, title=None, legend=alt.Legend(orient="top")),
    )
    #one of the lines can be dashed, used for the "typical day" line
    dash = alt.condition(alt.datum.series == dashed, alt.value([6, 4]), alt.value([1, 0])) if dashed else alt.value([1, 0])
    lines = base.mark_line(strokeWidth=2).encode(
        opacity=alt.condition(legend, alt.value(1), alt.value(0.15)), strokeDash=dash
    ).add_params(legend)
    #dots that show up on the hovered hour
    points = base.mark_point(filled=True, size=70).encode(opacity=alt.condition(hover, alt.value(1), alt.value(0)))
    #vertical line on the hovered hour, its tooltip lists all the lines
    rule = (
        alt.Chart(data)
        .transform_pivot("series", value="value", groupby=["hr"])
        .mark_rule(color="gray")
        .encode(
            x="hr:Q",
            opacity=alt.condition(hover, alt.value(0.4), alt.value(0)),
            tooltip=[alt.Tooltip("hr:Q", title="Hour")]
            + [alt.Tooltip(field=s, type="quantitative", format=",.0f") for s in series],
        )
        .add_params(hover)
    )
    return (lines + points + rule).properties(height=height)


#bar chart, can have a dashed average line (avg) and can be clicked to filter (pick)
def bars(df, x, y, x_title, y_title, color=None, scale=None, sort=None, fmt=",.0f",
         avg=None, pick=None, height=340):
    color_enc = alt.Color(f"{color}:N", scale=scale, legend=None) if color else alt.value(BLUE)
    chart = alt.Chart(df).mark_bar(
        cornerRadiusTopLeft=4, cornerRadiusTopRight=4, width=alt.RelativeBandSize(0.6)
    ).encode(
        x=alt.X(f"{x}:N", title=x_title, sort=sort, axis=alt.Axis(labelAngle=0)),
        y=alt.Y(f"{y}:Q", title=y_title, axis=alt.Axis(format=fmt)),
        color=color_enc,
        tooltip=[alt.Tooltip(f"{x}:N", title=x_title or x.replace("_", " ").title()),
                 alt.Tooltip(f"{y}:Q", title=y_title, format=fmt)],
    )
    if pick:
        #toggle means each click adds or removes a bar, so clicking a bar again un-filters it
        #the chart fades the bars that arent picked by itself so it keeps track of whats clicked
        param = alt.selection_point(name=pick, fields=[x], toggle="true")
        chart = chart.add_params(param).encode(opacity=alt.condition(param, alt.value(1), alt.value(0.25)))
    if avg is not None:
        #dashed line and label for the average
        ref = alt.Chart(pd.DataFrame({"avg": [avg]}))
        chart = (
            chart
            + ref.mark_rule(strokeDash=[4, 4], color=GRAY).encode(y="avg:Q")
            + ref.mark_text(align="right", dy=-7, color=GRAY, x="width").encode(
                y="avg:Q", text=alt.value(f"Average {format(avg, fmt)}"))
        )
    return chart.properties(height=height)


#keeps only the rows that match the sidebar filters
#skip leaves one filter out, so the season chart still shows every season to click on
def apply_filters(df, skip=None):
    mask = pd.Series(True, index=df.index)
    for key, (col, _) in FILTERS.items():
        if col != skip:
            mask &= df[col].isin(st.session_state[key])
    return df[mask]


day_all, hour_all = get_data()
models = get_models()

#---------- sidebar ----------
#first time the page loads every filter starts with everything picked
for key, (_, default) in FILTERS.items():
    st.session_state.setdefault(key, default)

st.sidebar.header("Filters")
metric_label = st.sidebar.radio("Rider type", list(METRICS), help="Applies to every chart except the Who Rides tab.")
m = METRICS[metric_label]  #the column the charts use (cnt, registered or casual)
exp_col = f"expected_{m}"  #the model's expected value for that column
st.sidebar.pills("Year", YEARS, selection_mode="multi", key="years", on_change=refresh_charts)
st.sidebar.pills("Season", SEASON_ORDER, selection_mode="multi", key="seasons", on_change=refresh_charts)
st.sidebar.pills("Day type", DAY_TYPES, selection_mode="multi", key="day_types", on_change=refresh_charts)
st.sidebar.pills("Weather", WEATHER_ORDER, selection_mode="multi", key="weathers", on_change=refresh_charts)
st.sidebar.button("Reset filters", on_click=reset_filters, width="stretch")
st.sidebar.caption("Tip: clicking a season or weather bar also filters the whole dashboard.")

rev = st.session_state.get("chart_rev", 0)
#d is the filtered daily data, h is the filtered hourly data
d = apply_filters(day_all)
h = apply_filters(hour_all)
filtered = len(d) < len(day_all)

st.title("Bike-Sharing Demand Dashboard")
st.caption(
    f"Capital Bikeshare, Washington DC, 2011–2012 · Showing **{metric_label.lower()}** · {len(d):,} of {len(day_all):,} days"
)

#stop here if the filters leave no data
if d.empty:
    st.warning("No data matches these filters. Pick at least one option in each filter, or click **Reset filters**.")
    st.stop()

#---------- top numbers, each one compared to something ----------
d = d.assign(gap=d[m] / d[exp_col] - 1)  #how far each day was from expected, -0.5 means 50% below
by_hour_all = h.groupby("hr")[m].mean()
disrupted = d[d["gap"] <= -FLAG].assign(lost=lambda t: t[exp_col] - t[m])  #days that ran 40%+ below expected
lost = disrupted["lost"].sum()
per_year = d.groupby("year")[m].mean()

c1, c2, c3, c4 = st.columns(4)
c1.metric(
    "Average rentals per day", f"{d[m].mean():,.0f}",
    f"{d[m].mean() / day_all[m].mean() - 1:+.0%} vs all days" if filtered else None, border=True,
    help="Compared with the average across every day in the dataset.",
)
#growth only makes sense with both years, otherwise show the total
if len(per_year) == 2:
    c2.metric("Growth, 2012 vs 2011", pct(per_year[2012] / per_year[2011] - 1),
              f"{per_year[2011]:,.0f} → {per_year[2012]:,.0f} per day", delta_color="off", delta_arrow="off", border=True)
else:
    c2.metric("Total rentals", f"{d[m].sum():,}", border=True)
c3.metric("Busiest hour", f"{by_hour_all.idxmax()}:00",
          f"{by_hour_all.max() / by_hour_all.mean():.1f}× an average hour", delta_color="off", delta_arrow="off", border=True)
c4.metric("Disrupted days", f"{len(disrupted)}", f"-{lost:,.0f} rentals vs expected", border=True,
          help=f"Days that ran {FLAG:.0%}+ below what the model expected for their weather, season and day type.")

#---------- actual vs expected chart, click a day to open it ----------
st.subheader("Daily rentals: actual vs expected")
st.caption(
    "**Expected** is what a machine-learning model predicts from each day's weather, temperature, season and day type. "
    "Marked days ran 40%+ away from it. **Click any day** to see what happened."
)

trend = d[["dteday", "date_str", m, exp_col, "gap", "weather", "temp_c", "event"]].rename(
    columns={m: "Actual", exp_col: "Expected"}
)
#long format so actual and expected can be two lines on one chart
trend_long = trend.melt(["dteday", "date_str"], ["Actual", "Expected"], var_name="series", value_name="rentals")
#the unusual days that get a dot on the chart
flags = trend[trend["gap"].abs() >= FLAG].assign(
    flag=lambda t: t["gap"].map(lambda g: "Well below expected" if g < 0 else "Well above expected")
)
labels = flags[flags["event"] != ""].drop_duplicates("event")  #one text label per event like hurricane sandy

hover_day = alt.selection_point(on="pointerover", nearest=True, fields=["date_str"], empty=False)
day_pick = alt.selection_point(name="day_pick", on="click", nearest=True, fields=["date_str"])
x_date = alt.X("dteday:T", title=None)

trend_lines = alt.Chart(trend_long).mark_line().encode(
    x=x_date, y=alt.Y("rentals:Q", title="Rentals per day"),
    color=alt.Color("series:N", scale=TREND_SCALE, title=None, legend=alt.Legend(orient="top")),
    #expected is a thin faint line underneath, actual is the main line
    strokeWidth=alt.condition(alt.datum.series == "Actual", alt.value(1.5), alt.value(1)),
    opacity=alt.condition(alt.datum.series == "Actual", alt.value(1), alt.value(0.55)),
    order=alt.Order("series:N", sort="descending"),
)
flag_marks = alt.Chart(flags).mark_point(filled=True, size=70).encode(
    x=x_date, y="Actual:Q",
    color=alt.Color("flag:N", scale=FLAG_SCALE, title=None, legend=alt.Legend(orient="top")),
)
event_text = alt.Chart(labels).mark_text(align="left", dx=6, dy=-8, fontSize=11, color=GRAY).encode(
    x=x_date, y="Actual:Q", text="event:N"
)
#invisible layer that handles hovering and clicking on any day
hit_layer = (
    alt.Chart(trend)
    .mark_rule(color="gray", strokeWidth=1)
    .encode(
        x=x_date,
        opacity=alt.condition(hover_day, alt.value(0.4), alt.value(0)),
        tooltip=[
            alt.Tooltip("dteday:T", title="Date", format="%a %b %d, %Y"),
            alt.Tooltip("Actual:Q", format=","),
            alt.Tooltip("Expected:Q", format=",.0f"),
            alt.Tooltip("gap:Q", title="vs expected", format="+.0%"),
            alt.Tooltip("weather:N", title="Weather"),
            alt.Tooltip("temp_c:Q", title="Temp (°C)", format=".1f"),
            alt.Tooltip("event:N", title="Event"),
        ],
    )
    .add_params(hover_day, day_pick)
)
show(
    alt.layer(trend_lines, flag_marks, event_text, hit_layer).resolve_scale(color="independent").properties(height=320),
    key="trend_chart", on_select=focus_day_from_chart, selection_mode=["day_pick"],
)

#---------- unusual days table and the day details ----------
left, right = st.columns([2, 3])
with left:
    st.subheader("Unusual days")
    #sorted by how many rentals were gained or lost, so a big % on a tiny day doesnt beat a hurricane
    unusual = flags.reindex((flags["Actual"] - flags["Expected"]).abs().sort_values(ascending=False).index).head(15)
    st.session_state["unusual_dates"] = unusual["date_str"].tolist()  #saved so the table click knows which day
    if unusual.empty:
        st.info("No unusual days in the current filters.")
    else:
        st.dataframe(
            unusual.assign(gap=unusual["gap"] * 100)[["dteday", "Actual", "Expected", "gap", "weather", "event"]],
            hide_index=True,
            key="unusual_table",
            on_select=focus_day_from_table,
            selection_mode="single-row",
            column_config={
                "dteday": st.column_config.DateColumn("Date", format="ddd MMM D, YYYY"),
                "Actual": st.column_config.NumberColumn(format="%d"),
                "Expected": st.column_config.NumberColumn(format="%d"),
                "gap": st.column_config.NumberColumn("vs expected", format="%+.0f%%"),
                "weather": "Weather",
                "event": "Event",
            },
        )
        st.caption("Select a row to open that day.")


#writes out the likely reasons a day was off (event, bad weather, cold, hot, humid, holiday)
def explain_day(row, weather_effect):
    reasons = []
    if row["event"]:
        reasons.append(f"**{row['event']}**")
    if row["weather"] != "Clear":
        reasons.append(f"{row['weather'].lower()} weather (usually {weather_effect[row['weather']]:+.0%} vs clear days)")
    if row["temp_c"] < 8:
        reasons.append(f"a cold {row['temp_c']:.0f}°C")
    elif row["temp_c"] > 30:
        reasons.append(f"a hot {row['temp_c']:.0f}°C")
    if row["humidity"] > 85:
        reasons.append(f"{row['humidity']:.0f}% humidity")
    if row["day_type"] == "Holiday":
        reasons.append("a public holiday")
    return ", ".join(reasons)


with right:
    focus = st.session_state.get("focus_day")
    if not focus:
        #if nothing is clicked yet open the day with the biggest loss (hurricane sandy)
        focus = d.loc[(d[m] - d[exp_col]).idxmin(), "date_str"]
    row = day_all.set_index("date_str").loc[focus]
    gap = row[m] / row[exp_col] - 1

    with st.container(border=True):
        st.subheader(pd.Timestamp(focus).strftime("%A, %B %d, %Y"))
        if "focus_day" not in st.session_state:
            st.caption("Showing the biggest loss vs expected. Click the chart or pick a row to change it.")
        k1, k2, k3, k4 = st.columns(4)
        k1.metric("Actual rentals", f"{row[m]:,}")
        k2.metric("Expected", f"{row[exp_col]:,.0f}")
        k3.metric("vs expected", pct(gap))
        k4.metric("Weather", f"{row['temp_c']:.0f}°C", row["weather"], delta_color="off", delta_arrow="off")

        #how much each weather type usually changes demand compared to clear days
        clear_avg = day_all.loc[day_all["weather"] == "Clear", m].mean()
        weather_effect = day_all.groupby("weather")[m].mean() / clear_avg - 1
        why = explain_day(row, weather_effect)
        direction = "below" if gap < 0 else "above"
        st.markdown(
            f"Ran **{abs(gap):.0%} {direction}** what the model expects for a {row['day_type'].lower()} in "
            f"{row['season'].lower()} with this weather." + (f" Likely factors: {why}." if why and gap < 0 else "")
        )

        #this day's hours next to an average day with the same day type, season and year
        this_day = hour_all[hour_all["date_str"] == focus].groupby("hr")[m].sum()
        similar = hour_all[
            (hour_all["day_type"] == row["day_type"]) & (hour_all["season"] == row["season"])
            & (hour_all["year"] == row["year"]) & (hour_all["date_str"] != focus)
        ].groupby("hr")[m].mean()
        profile = pd.concat([
            this_day.rename("value").reset_index().assign(series="This day"),
            similar.rename("value").reset_index().assign(series="Typical similar day"),
        ])
        show(hourly_lines(profile, "series", DAY_SCALE, "Rentals per hour", height=230, dashed="Typical similar day"))

        #buttons that filter the whole dashboard to days like this one
        b1, b2, b3 = st.columns(3)
        b1.button(":material/filter_alt: Same weather", on_click=set_filters, kwargs={"weathers": [row["weather"]]},
                  help=f"Filter the dashboard to all {row['weather']} days", width="stretch")
        b2.button(":material/filter_alt: Similar days", on_click=set_filters,
                  kwargs={"day_types": [row["day_type"]], "seasons": [row["season"]]},
                  help=f"Filter the dashboard to all {row['day_type'].lower()}s in {row['season']}", width="stretch")
        b3.button(":material/close: Clear", on_click=clear_focus_day, help="Go back to the default day", width="stretch")

#---------- the story, 4 tabs ----------
tab1, tab2, tab3, tab4 = st.tabs(
    ["① When is demand high?", "② What disrupts it?", "③ Who rides?", "④ What should we do?"]
)

#---------- tab 1: when is demand high ----------
with tab1:
    left, right = st.columns([3, 2])
    with left:
        st.subheader("Demand by weekday and hour")
        st.caption("Click a cell to break it down.")
        #average rentals for every weekday and hour combo
        heat = h.groupby(["weekday", "hr"], as_index=False)[m].mean()
        slot_pick = alt.selection_point(name="slot_pick", fields=["weekday", "hr"], on="click")
        show(
            alt.Chart(heat)
            .mark_rect(cornerRadius=2)
            .encode(
                x=alt.X("hr:O", title="Hour of day", axis=alt.Axis(labelAngle=0, values=list(range(0, 24, 3)))),
                y=alt.Y("weekday:O", title=None, sort=WEEKDAY_ORDER),
                color=alt.Color(f"{m}:Q", title="Avg rentals/hour", scale=alt.Scale(range=BLUE_RAMP)),
                opacity=alt.condition(slot_pick, alt.value(1), alt.value(0.35)),
                tooltip=[
                    alt.Tooltip("weekday:O", title="Day"),
                    alt.Tooltip("hr:O", title="Hour"),
                    alt.Tooltip(f"{m}:Q", title="Avg rentals", format=",.0f"),
                ],
            )
            .add_params(slot_pick)
            .properties(height=320),
            key="heatmap", on_select=focus_slot_from_chart, selection_mode=["slot_pick"],
        )
    with right:
        #breakdown of the clicked cell, starts on the busiest one
        peak = heat.loc[heat[m].idxmax()]
        wd, hr = st.session_state.get("focus_slot", (peak["weekday"], int(peak["hr"])))
        slot = h[(h["weekday"] == wd) & (h["hr"] == hr)]
        with st.container(border=True):
            st.subheader(f"{wd} at {hr}:00")
            if "focus_slot" not in st.session_state:
                st.caption("The busiest slot. Click another cell to compare.")
            if slot.empty:
                st.info("No data for this slot with the current filters.")
            else:
                s1, s2 = st.columns(2)
                s1.metric("Average rentals", f"{slot[m].mean():,.0f}",
                          f"{slot[m].mean() / h[m].mean():.1f}× an average hour", delta_color="off", delta_arrow="off")
                #typical range is the middle half of the values (25th to 75th percentile)
                best = slot.loc[slot[m].idxmax()]
                s2.metric("Typical range", f"{slot[m].quantile(.25):,.0f}–{slot[m].quantile(.75):,.0f}",
                          f"record {best[m]:,} ({best['dteday']:%b %Y})", delta_color="off", delta_arrow="off")
                share = slot["casual"].sum() / slot["cnt"].sum()
                st.markdown(f"**{share:.0%}** of these rentals are casual riders, **{1 - share:.0%}** registered.")
                slot_weather = slot.groupby("weather", as_index=False)[m].mean()
                show(bars(slot_weather, "weather", m, None, "Avg rentals", sort=WEATHER_ORDER, height=170))

    left, right = st.columns([3, 2])
    with left:
        st.subheader("Hourly pattern by day type")
        by_type = h.groupby(["day_type", "hr"], as_index=False)[m].mean().rename(columns={m: "value"})
        show(hourly_lines(by_type, "day_type", DAY_TYPE_SCALE, "Avg rentals per hour", height=300))
        #finds the peak hour for each day type
        peaks = by_type.loc[by_type.groupby("day_type")["value"].idxmax()].set_index("day_type")["hr"]
        st.caption(" · ".join(f"**{t}** peaks at {peaks[t]}:00" for t in DAY_TYPES if t in peaks))
    with right:
        st.subheader("Average daily rentals by season")
        #season filter is skipped here so every season stays on the chart to click
        season_base = apply_filters(day_all, skip="season")
        by_season = season_base.groupby("season", as_index=False)[m].mean()
        show(
            bars(by_season, "season", m, None, "Avg rentals per day", color="season", scale=SEASON_SCALE,
                 sort=SEASON_ORDER, avg=season_base[m].mean(), pick="season_pick", height=300),
            key=f"season_chart_{rev}", selection_mode=["season_pick"],
            on_select=lambda: filter_from_chart(f"season_chart_{rev}", "season_pick", "season", "seasons"),
        )
        st.caption("Click seasons to filter the dashboard; click again to remove one. "
                   "Seasons follow the calendar, e.g. Winter = Dec 21 – Mar 20.")

    #2011 and 2012 bars next to each other for every month
    st.subheader("Average daily rentals by month")
    monthly = d.groupby(["year", "mnth"], as_index=False)[m].mean()
    monthly["month"] = monthly["mnth"].map(lambda i: MONTHS[i - 1])
    monthly["year"] = monthly["year"].astype(str)
    show(
        alt.Chart(monthly)
        .mark_bar(cornerRadiusTopLeft=3, cornerRadiusTopRight=3)
        .encode(
            x=alt.X("month:N", title=None, sort=MONTHS, axis=alt.Axis(labelAngle=0)),
            xOffset="year:N",
            y=alt.Y(f"{m}:Q", title="Avg rentals per day"),
            color=alt.Color("year:N", scale=YEAR_SCALE, title=None, legend=alt.Legend(orient="top")),
            tooltip=["month:N", "year:N", alt.Tooltip(f"{m}:Q", title="Avg rentals per day", format=",.0f")],
        )
        .properties(height=260)
    )

#---------- tab 2: what disrupts demand ----------
with tab2:
    left, right = st.columns([2, 3])
    with left:
        st.subheader("Average daily rentals by weather")
        #weather filter is skipped here so every weather type stays on the chart to click
        weather_base = apply_filters(day_all, skip="weather")
        by_weather = weather_base.groupby("weather", as_index=False)[m].mean()
        show(
            bars(by_weather, "weather", m, None, "Avg rentals per day", sort=WEATHER_ORDER,
                 avg=weather_base[m].mean(), pick="weather_pick", height=360),
            key=f"weather_chart_{rev}", selection_mode=["weather_pick"],
            on_select=lambda: filter_from_chart(f"weather_chart_{rev}", "weather_pick", "weather", "weathers"),
        )
        st.caption("Click weather types to filter the dashboard; click again to remove one.")
        w = by_weather.set_index("weather")[m]
        if {"Clear", "Light Rain/Snow"} <= set(w.index):
            st.info(
                f"Rain or snow cuts demand by **{1 - w['Light Rain/Snow'] / w['Clear']:.0%}** vs a clear day"
                + (f"; mist/cloud by **{1 - w['Mist/Cloudy'] / w['Clear']:.0%}**." if "Mist/Cloudy" in w else ".")
            )
    with right:
        st.subheader("Weather conditions vs daily rentals")
        x_label = st.selectbox("Compare daily rentals with", list(WEATHER_VARS))
        x_col = WEATHER_VARS[x_label]
        pick_season = alt.selection_point(fields=["season"], bind="legend")  #click a season in the legend to highlight it
        scatter = (
            alt.Chart(d)
            .mark_circle(size=55)
            .encode(
                x=alt.X(f"{x_col}:Q", title=x_label, scale=alt.Scale(zero=False)),
                y=alt.Y(f"{m}:Q", title="Rentals per day"),
                color=alt.Color("season:N", scale=SEASON_SCALE, title=None, legend=alt.Legend(orient="top")),
                opacity=alt.condition(pick_season, alt.value(0.85), alt.value(0.08)),
                tooltip=[
                    alt.Tooltip("dteday:T", title="Date", format="%b %d, %Y"),
                    "season:N", "weather:N",
                    alt.Tooltip(f"{x_col}:Q", title=x_label, format=".1f"),
                    alt.Tooltip(f"{m}:Q", title="Rentals", format=","),
                ],
            )
            .add_params(pick_season)
        )
        #smooth trend line through the dots
        trend_line = (
            alt.Chart(d).transform_loess(x_col, m, bandwidth=0.5)
            .mark_line(color="gray", strokeWidth=2, strokeDash=[6, 4])
            .encode(x=f"{x_col}:Q", y=f"{m}:Q")
        )
        show((scatter + trend_line).properties(height=320))
        st.caption(f"Dashed line = overall trend. Correlation: **{d[x_col].corr(d[m]):+.2f}**. "
                   "Click a season in the legend to highlight it.")

    #how many rentals the disrupted days lost each month, split by weather
    st.subheader("Where the lost rentals went")
    if disrupted.empty:
        st.info("No disrupted days in the current filters.")
    else:
        lost_month = (
            disrupted.assign(month=disrupted["dteday"].dt.to_period("M").dt.to_timestamp())
            .groupby(["month", "weather"], as_index=False)["lost"].sum()
        )
        show(
            alt.Chart(lost_month).mark_bar(cornerRadiusTopLeft=3, cornerRadiusTopRight=3).encode(
                x=alt.X("yearmonth(month):T", title=None),
                y=alt.Y("lost:Q", title="Rentals lost vs expected", stack=True),
                color=alt.Color("weather:N", scale=WEATHER_SCALE, title=None, legend=alt.Legend(orient="top")),
                tooltip=[alt.Tooltip("yearmonth(month):T", title="Month", format="%b %Y"), "weather:N",
                         alt.Tooltip("lost:Q", title="Rentals lost", format=",.0f")],
            ).properties(height=240)
        )
        by_cause = disrupted.groupby("weather")["lost"].sum()
        st.caption(
            f"{len(disrupted)} disrupted days cost about **{lost:,.0f} rentals**; "
            f"**{by_cause.idxmax().lower()}** days account for {by_cause.max() / by_cause.sum():.0%} of the loss."
        )

#---------- tab 3: who rides ----------
with tab3:
    #monthly totals for registered and casual riders
    users_monthly = (
        d.set_index("dteday")[["registered", "casual"]].resample("MS").sum().reset_index()
        .melt("dteday", var_name="user", value_name="rentals")
    )
    users_monthly = users_monthly[users_monthly["rentals"] > 0]  #drops months the filters removed
    users_monthly["user"] = users_monthly["user"].str.capitalize()

    st.subheader("Monthly rentals by user type")
    show(
        alt.Chart(users_monthly).mark_area(opacity=0.85).encode(
            x=alt.X("yearmonth(dteday):T", title=None),
            y=alt.Y("rentals:Q", title="Rentals per month", stack=True),
            color=alt.Color("user:N", scale=USER_SCALE, title=None, legend=alt.Legend(orient="top")),
            order=alt.Order("user:N", sort="descending"),
            tooltip=[alt.Tooltip("yearmonth(dteday):T", title="Month", format="%b %Y"), "user:N",
                     alt.Tooltip("rentals:Q", title="Rentals", format=",")],
        ).properties(height=260)
    )

    left, right = st.columns([3, 2])
    with left:
        st.subheader("Commuters vs leisure riders")
        type_pick = st.segmented_control("Day type", ["All"] + DAY_TYPES, default="All", key="user_day_type")
        hh = h if type_pick in (None, "All") else h[h["day_type"] == type_pick]
        if hh.empty:
            st.warning("No hours match this day type with the current filters.")
        else:
            users_hour = hh.groupby("hr", as_index=False)[["registered", "casual"]].mean().melt(
                "hr", var_name="user", value_name="value")
            users_hour["user"] = users_hour["user"].str.capitalize()
            show(hourly_lines(users_hour, "user", USER_SCALE, "Avg rentals per hour", height=300))
    with right:
        #how much each rider type drops in bad weather compared to clear days
        st.subheader("Who is weather-sensitive?")
        clear = d[d["weather"] == "Clear"][["registered", "casual"]].mean()
        sens = (
            d[d["weather"] != "Clear"].groupby("weather")[["registered", "casual"]].mean() / clear - 1
        ).reset_index().melt("weather", var_name="user", value_name="change")
        sens["user"] = sens["user"].str.capitalize()
        if sens.empty or clear.isna().any():
            st.info("Include clear days and at least one other weather type to compare.")
        else:
            show(
                alt.Chart(sens).mark_bar(cornerRadius=3).encode(
                    x=alt.X("weather:N", title=None, sort=WEATHER_ORDER, axis=alt.Axis(labelAngle=0)),
                    xOffset="user:N",
                    y=alt.Y("change:Q", title="Change vs clear days", axis=alt.Axis(format="%")),
                    color=alt.Color("user:N", scale=USER_SCALE, title=None, legend=alt.Legend(orient="top")),
                    tooltip=["weather:N", "user:N", alt.Tooltip("change:Q", title="vs clear days", format="+.0%")],
                ).properties(height=300)
            )

    reg_share = d["registered"].sum() / d["cnt"].sum()
    off_days = d[d["day_type"] != "Working day"]
    off_casual = off_days["casual"].sum() / off_days["cnt"].sum() if not off_days.empty else 0
    st.info(
        f"Registered riders make up **{reg_share:.0%}** of rentals and follow the 8:00 and 17:00 commute. "
        f"Casual riders are **{off_casual:.0%}** of weekend and holiday rentals, ride mostly midday, "
        "and drop off much more sharply in bad weather."
    )

#---------- tab 4: what should we do ----------
with tab4:
    st.subheader("Recommendations from the data")
    st.caption("Worked out from the filtered data. The dataset has no fleet or station information, "
               "so these are about demand, not bike counts.")

    #numbers the recommendations are based on
    work = h[h["day_type"] == "Working day"].groupby("hr")[m].mean()  #working day average per hour
    off = h[h["day_type"] != "Working day"].groupby("hr")[m].mean()  #weekend and holiday average per hour
    month_avg = d.groupby("mnth")[m].mean()
    temp_band = pd.cut(d["temp_c"], [-10, 10, 20, 30, 45], labels=["below 10°C", "10–20°C", "20–30°C", "above 30°C"])
    by_temp = d.groupby(temp_band, observed=True)[m].mean()

    r1, r2 = st.columns(2)
    with r1.container(border=True):
        st.markdown("#### 🔧 Schedule maintenance")
        if len(work) == 24:
            #finds the quietest 3 hours in a row on working days
            end = work.rolling(3).sum().idxmin()
            st.markdown(
                f"Working days are quietest **{end - 2}:00–{end + 1}:00**, carrying only "
                f"**{work.loc[end - 2:end].sum() / work.sum():.1%}** of the day's rentals."
            )
        if len(month_avg) > 1:
            low = month_avg.nsmallest(2).index
            st.markdown(
                f"The slowest months are **{MONTHS[low[0] - 1]}** and **{MONTHS[low[1] - 1]}** "
                f"({month_avg[low].mean() / month_avg.mean() - 1:+.0%} vs the average month), "
                "the best time for big repairs."
            )
    with r2.container(border=True):
        st.markdown("#### 🚲 Have bikes ready for the peaks")
        if len(work) == 24:
            #busiest morning hour and busiest afternoon/evening hour
            morning, evening = work.loc[:11].idxmax(), work.loc[12:].idxmax()
            rush = work.loc[[7, 8, 9, 16, 17, 18, 19]].sum() / work.sum()
            st.markdown(
                f"On working days demand peaks at **{morning}:00** and **{evening}:00**; the morning and evening rush "
                f"(7–9 and 16–19) covers **{rush:.0%}** of the day. Rebalance bikes before these windows."
            )
        if len(off) == 24:
            st.markdown(f"Weekends and holidays peak around **{off.idxmax()}:00**, with steady demand from late morning to evening.")
    r3, r4 = st.columns(2)
    with r3.container(border=True):
        st.markdown("#### 🌦️ Plan around weather")
        if {"Clear", "Light Rain/Snow"} <= set(w.index):
            st.markdown(f"Expect about **{1 - w['Light Rain/Snow'] / w['Clear']:.0%} fewer rentals** on rain or snow days, "
                        "which makes them good days for unplanned repairs.")
        if len(by_temp) > 1:
            st.markdown(
                f"Demand is highest at **{by_temp.idxmax()}** ({by_temp.max():,.0f}/day) and lowest "
                f"at **{by_temp.idxmin()}** ({by_temp.min():,.0f}/day)."
            )
    with r4.container(border=True):
        st.markdown("#### 📈 Plan for growth")
        if len(per_year) == 2:
            st.markdown(
                f"Daily demand grew **{per_year[2012] / per_year[2011] - 1:+.0%}** from 2011 to 2012. "
                "If that continues, peak-hour capacity is the first thing to run short."
            )
        else:
            st.markdown("Select both years to see growth.")
        st.markdown(f"Casual riders are **{1 - reg_share:.0%}** of rentals and mostly ride at weekends, "
                    "a natural target for leisure promotions.")

    #demand planner, pick a day and weather and the model predicts the rentals
    st.subheader("Demand planner")
    st.caption("Pick a day and the forecast weather. The model estimates rentals at 2012 levels and spreads them across the day.")
    p1, p2, p3, p4 = st.columns(4)
    month = p1.selectbox("Month", MONTHS, index=5)
    p_type = p2.selectbox("Day type", DAY_TYPES)
    p_weather = p3.selectbox("Weather", WEATHER_ORDER)
    p_temp = p4.slider("Temperature (°C)", -5, 40, 22)

    #turns the picks into the inputs the model needs, humidity and wind use their usual values
    mnth = MONTHS.index(month) + 1
    inputs = {
        "year": 2012, "mnth": mnth, "workingday": int(p_type == "Working day"), "holiday": int(p_type == "Holiday"),
        "temp_c": p_temp, "humidity": day_all["humidity"].median(), "wind": day_all["wind"].median(),
        "weekday": {"Working day": "Wed", "Weekend": "Sat", "Holiday": "Mon"}[p_type], "weather": p_weather,
    }
    pred = predict(models, inputs)
    #real days from 2012 with the same month and day type, to compare the prediction to
    typical = day_all[(day_all["year"] == 2012) & (day_all["mnth"] == mnth) & (day_all["day_type"] == p_type)]["cnt"]

    q1, q2, q3 = st.columns(3)
    q1.metric("Expected rentals", f"{pred['cnt']:,.0f}",
              f"{pred['cnt'] / typical.mean() - 1:+.0%} vs a typical {p_type.lower()} in {month} 2012" if len(typical) else None,
              border=True)
    q2.metric("Registered", f"{pred['registered']:,.0f}", border=True)
    q3.metric("Casual", f"{pred['casual']:,.0f}", border=True)

    #spreads the predicted day total across the hours using the usual hourly pattern for that day type
    shape = hour_all[hour_all["day_type"] == p_type].groupby("hr")[["registered", "casual"]].mean()
    shape = shape / shape.sum()  #share of the day's rentals that happen in each hour
    plan = pd.DataFrame({"Registered": shape["registered"] * pred["registered"], "Casual": shape["casual"] * pred["casual"]})
    plan = plan.reset_index().melt("hr", var_name="user", value_name="rentals")
    show(
        alt.Chart(plan).mark_area(opacity=0.85).encode(
            x=alt.X("hr:Q", title="Hour of day", axis=HOUR_AXIS, scale=alt.Scale(domain=[0, 23])),
            y=alt.Y("rentals:Q", title="Expected rentals per hour", stack=True),
            color=alt.Color("user:N", scale=USER_SCALE, title=None, legend=alt.Legend(orient="top")),
            order=alt.Order("user:N", sort="descending"),
            tooltip=[alt.Tooltip("hr:Q", title="Hour"), "user:N",
                     alt.Tooltip("rentals:Q", title="Expected rentals", format=",.0f")],
        ).properties(height=260)
    )
    peak_hr = plan.groupby("hr")["rentals"].sum()
    st.info(f"Busiest hour: **{peak_hr.idxmax()}:00** with about **{peak_hr.max():,.0f} rentals**.")

#---------- raw data ----------
with st.expander("View filtered data"):
    st.dataframe(d, hide_index=True)
    st.download_button("Download as CSV", d.to_csv(index=False), "bike_sharing_filtered.csv", "text/csv")
