import streamlit as st

from prep import load_day, load_hour

st.set_page_config(page_title="Bike-Sharing Demand", layout="wide")

BLUE, ORANGE, AQUA = "#2a78d6", "#eb6834", "#1baf7a"
DAY_TYPES = ["Working day", "Weekend", "Holiday"]
SEASON_ORDER = ["Spring", "Summer", "Fall", "Winter"]
WEATHER_ORDER = ["Clear", "Mist/Cloudy", "Light Rain/Snow"]


@st.cache_data
def get_data():
    return load_day(), load_hour()


day, hour = get_data()

# ---------- Sidebar filters ----------
st.sidebar.header("Filters")
years = st.sidebar.multiselect("Year", [2011, 2012], default=[2011, 2012])
seasons = st.sidebar.multiselect("Season", SEASON_ORDER, default=SEASON_ORDER)
day_types = st.sidebar.multiselect("Day type", DAY_TYPES, default=DAY_TYPES)
weathers = st.sidebar.multiselect("Weather", WEATHER_ORDER, default=WEATHER_ORDER)


def apply_filters(df):
    return df[
        df["year"].isin(years)
        & df["season"].isin(seasons)
        & df["day_type"].isin(day_types)
        & df["weather"].isin(weathers)
    ]


d = apply_filters(day)
h = apply_filters(hour)

if d.empty:
    st.warning("No data matches these filters.")
    st.stop()

# ---------- Overview ----------
st.title("Bike-Sharing Demand Dashboard")
st.caption("Capital Bikeshare, Washington DC, 2011–2012")

busiest_hour = h.groupby("hr")["cnt"].mean().idxmax()
registered_share = d["registered"].sum() / d["cnt"].sum()

c1, c2, c3, c4 = st.columns(4)
c1.metric("Total rentals", f"{d['cnt'].sum():,}")
c2.metric("Average per day", f"{d['cnt'].mean():,.0f}")
c3.metric("Busiest hour", f"{busiest_hour}:00")
c4.metric("Registered users", f"{registered_share:.0%}")

st.subheader("Daily rentals over time")
st.line_chart(d, x="dteday", y="cnt", color=BLUE, x_label="Date", y_label="Rentals")

tab1, tab2, tab3, tab4 = st.tabs(
    ["Time & Season", "Weather", "Working Day vs Weekend", "Casual vs Registered"]
)

# ---------- 1. Time of day and season ----------
with tab1:
    left, right = st.columns(2)
    with left:
        st.subheader("Average rentals by hour")
        by_hour = h.groupby("hr", as_index=False)["cnt"].mean()
        st.line_chart(by_hour, x="hr", y="cnt", color=BLUE, x_label="Hour of day", y_label="Avg rentals")
    with right:
        st.subheader("Average daily rentals by season")
        by_season = d.groupby("season")["cnt"].mean().reindex(SEASON_ORDER).dropna().reset_index()
        st.bar_chart(by_season, x="season", y="cnt", color=BLUE, x_label="Season", y_label="Avg rentals per day", sort=False)

# ---------- 2. Weather and temperature ----------
with tab2:
    left, right = st.columns(2)
    with left:
        st.subheader("Temperature vs daily rentals")
        st.scatter_chart(d, x="temp_c", y="cnt", color=BLUE, x_label="Temperature (°C)", y_label="Rentals per day")
    with right:
        st.subheader("Average hourly rentals by weather")
        by_weather = h.groupby("weather")["cnt"].mean().reindex(WEATHER_ORDER).dropna().reset_index()
        st.bar_chart(by_weather, x="weather", y="cnt", color=BLUE, x_label="Weather", y_label="Avg rentals per hour", sort=False)

# ---------- 3. Working day vs weekend / holiday ----------
with tab3:
    st.subheader("Average rentals by hour and day type")
    by_type = h.pivot_table(index="hr", columns="day_type", values="cnt", aggfunc="mean")
    by_type = by_type[[t for t in DAY_TYPES if t in by_type.columns]]
    colors = [c for t, c in zip(DAY_TYPES, [BLUE, ORANGE, AQUA]) if t in by_type.columns]
    st.line_chart(by_type, color=colors, x_label="Hour of day", y_label="Avg rentals")

# ---------- 4. Casual vs registered ----------
with tab4:
    left, right = st.columns(2)
    with left:
        st.subheader("Average rentals by hour")
        users_hour = h.groupby("hr")[["registered", "casual"]].mean()
        st.line_chart(users_hour, color=[BLUE, ORANGE], x_label="Hour of day", y_label="Avg rentals")
    with right:
        st.subheader("Average daily rentals by day type")
        users_type = d.groupby("day_type")[["registered", "casual"]].mean()
        users_type = users_type.reindex([t for t in DAY_TYPES if t in users_type.index])
        st.bar_chart(users_type, color=[BLUE, ORANGE], x_label="Day type", y_label="Avg rentals per day", stack=False, sort=False)

with st.expander("View filtered data"):
    st.dataframe(d)
