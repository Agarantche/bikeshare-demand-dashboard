# Bike-Sharing Demand Dashboard

### Data Visualization of Bike-Sharing Demand

**Author:** Adam Garantche  
**Course:** ASCI 2000 – Data Visualization Final Project  
**Date:** October 2026  
**Status:** v4 – website version (runs in the browser on GitHub Pages)  
**Live dashboard:** https://agarantche.github.io/bikeshare-demand-dashboard/

---

## Executive Summary

This project investigates how bike rental demand changes with time of day, season, weather, temperature, type of day and rider type. The analysis uses the Capital Bikeshare **Bike Sharing Dataset** from the UCI Machine Learning Repository: 731 days and 17,379 hours of rentals in Washington, D.C., from 2011 to 2012. The business purpose is to help a bike-share operator plan bike availability, staffing and maintenance around when and why demand rises and falls.

Exploratory data analysis was done with summary statistics and graphs, and the results are presented in an interactive dashboard website that anyone can open in a browser. Daily rentals are spread fairly evenly (mean 4,504, median 4,548), while hourly rentals are strongly right-skewed, so a log scale was used to show quiet and busy hours together. Demand follows a clear commuter rhythm on working days, with peaks at 8:00 and 17:00, and one broad midday peak on weekends. Rentals rise strongly with temperature (r = +0.63), fall by 63% on rain or snow days compared with clear days, and grew 64% from 2011 to 2012.

At first, the season looks like the main driver of demand: Winter averages 2,604 rentals a day, compared with 5,644 in Summer. Further analysis showed that the seasons have very different temperatures, and that warmer days are busier within every season, so much of the seasonal gap comes from temperature. A machine learning model was added to estimate the expected rentals for each day, which makes unusual days stand out, such as Hurricane Sandy (−99%) and Christmas week. The main recommendations are to schedule maintenance in the 3:00–6:00 window and in January, to have bikes in place before the 8:00 and 17:00 peaks, to plan around rain forecasts, and to size the fleet for peak months rather than the average.

---

## 1 Business Problem

### 1.1 Background

Bike-sharing companies face challenges in meeting fluctuating demand for bicycle rentals. Demand can vary by time of day, season, and weather conditions, making it difficult to ensure enough bicycles are available when needed. Underestimating demand can lead to frustrated customers and missed revenue, while overestimating demand can result in unused bicycles and unnecessary operational costs.

This project uses the Capital Bikeshare dataset to create a dashboard that serves as a visual aid for understanding these demand patterns. By displaying rental trends and comparisons, the dashboard helps support decisions about bike availability, resource allocation, and maintenance scheduling.

### 1.2 Business Question

How can a dashboard of historical bike-sharing data help a company understand rental demand in relation to:

1. time of day and season;
2. weather conditions and temperature;
3. working days compared with weekends and holidays; and
4. rental patterns among casual and registered users?

### 1.3 Business Importance

Understanding when rental demand is higher or lower can help bike-sharing companies prepare for busy periods and schedule maintenance during quieter periods. A misleading comparison, such as blaming the season for low demand when temperature is doing most of the work, could lead to poor planning. A dashboard can make these patterns easier to identify and communicate by presenting the data through clear charts and comparisons.

### 1.4 Analytical Objectives

This project will:

1. summarize daily and hourly bike rental counts;
2. identify peak rental hours and seasonal demand patterns;
3. examine how rental counts vary with temperature and weather conditions;
4. compare demand on working days with weekends and holidays;
5. compare rental patterns between casual and registered users; and
6. create a dashboard that clearly communicates these patterns to support decisions about bike availability, resource allocation, and maintenance scheduling.

---

## 2 Data Sources and References

### 2.1 Primary Dataset

The analysis uses the **Bike Sharing Dataset**, downloaded from the UCI Machine Learning Repository (https://archive.ics.uci.edu/dataset/275/bike+sharing+dataset). It contains bike rental counts from the Capital Bikeshare system in Washington, D.C., with the weather and calendar information for each period, from January 1, 2011 to December 31, 2012.

*Table 1. Data source information.*

| Item | Description |
|---|---|
| Dataset | Bike Sharing Dataset |
| Source | UCI Machine Learning Repository |
| Original data provider | Capital Bikeshare, Washington, D.C. |
| Time period | January 1, 2011 – December 31, 2012 |
| Files | `day.csv` and `hour.csv` (both used) |
| Observations | 731 days (`day.csv`); 17,379 hours (`hour.csv`) |
| Original variables | 16 (`day.csv`); 17 (`hour.csv`) |
| Date accessed | October 2, 2026 |

**Daily and hourly files.** The two files cover the same two years at different levels of detail. `hour.csv` has one row per hour; `day.csv` has one row per day, where rentals are the day's hourly totals and the weather values are daily averages. `day.csv` drives the daily trend, summary numbers, comparisons and the demand model; `hour.csv` is used wherever time of day matters (heatmap, hourly patterns, single-day view).

### 2.2 Software and Resources

The analysis was done in Python, using pandas for data preparation and scikit-learn for the demand prediction model. The dashboard is a website written in HTML, CSS and JavaScript, with the charts drawn by Vega-Lite (the chart system behind Python's Altair), so it runs in any browser and is hosted for free on GitHub Pages. An earlier version of the dashboard was built with Streamlit. Version control and hosting used Git and GitHub. The analysis was guided by the course data-visualization assignment, the project proposal *Data Visualization of Bike-Sharing Demand*, the course's sample final report, and the reference analysis *Bike Sharing Demand Prediction* by Subhalaxmi Rout on RPubs.

---

## 3 Data Directory

*Table 2. Data directory for the Bike Sharing Dataset.*

| Variable | Type | Role | Description |
|---|---|---|---|
| `cnt` | Numerical | Primary response | Total rentals (`casual` + `registered`) |
| `registered` | Numerical | Response (by rider type) | Rentals by registered members |
| `casual` | Numerical | Response (by rider type) | Rentals by casual (non-member) users |
| `hr` | Numerical (0–23) | Primary explanatory | Hour of the day (`hour.csv` only) |
| `season` | Categorical | Primary explanatory | Season, relabeled by date as Winter, Spring, Summer, Fall* |
| `temp` | Numerical | Primary explanatory | Temperature, normalized (× 41 = °C) |
| `weathersit` | Categorical | Primary explanatory | 1 = Clear, 2 = Mist/cloudy, 3 = Light rain/snow, 4 = Heavy rain/snow |
| `workingday` | Binary | Primary explanatory | 1 if the day is neither a weekend nor a holiday |
| `holiday` | Binary | Supporting | 1 if the day is a public holiday |
| `weekday` | Categorical | Supporting | Day of the week (0 = Sunday … 6 = Saturday) |
| `dteday` | Date | Supporting | Date |
| `yr` | Categorical | Supporting | Year (0 = 2011, 1 = 2012) |
| `mnth` | Numerical (1–12) | Supporting | Month |
| `atemp` | Numerical | Supporting | Feels-like temperature, normalized (× 50 = °C) |
| `hum` | Numerical | Supporting | Humidity, normalized (× 100 = %) |
| `windspeed` | Numerical | Supporting | Wind speed, normalized (× 67 = km/h) |
| `instant` | Numerical | Not used | Record index |

\* The dataset's documentation lists season 1 as spring, but the dates show that code 1 covers December 21 – March 20, so each code was relabeled to the season its dates fall in.

---

## 4 Data Preparation

Both files were loaded with pandas and checked for size, variable types, missing values and duplicates before analysis (`prep.py`). The original rental counts were kept, because their units are meaningful for business interpretation. The following changes were made:

- Codes were replaced with labels (season, weather, year, weekday), and the season labels were corrected by date.
- Temperature, feels-like temperature, humidity and wind speed were converted from the 0–1 scale back to real units (°C, %, km/h).
- A `day_type` variable (Working day, Weekend, Holiday) was created, because the original `workingday` flag groups weekends and holidays together.
- Weather category 4 (heavy rain, only 3 hours in the data) was merged into Rain/snow.
- A log scale was used for selected displays of hourly rentals, where the values are strongly right-skewed.
- A machine learning model added an expected rental count for each day (see Appendix A.6).

*Table 3. Basic data-quality checks.*

| Check | Result |
|---|---|
| Days (`day.csv`) | 731 |
| Hours (`hour.csv`) | 17,379 |
| Hours missing from `hour.csv` | 165 (hours with no recorded rentals) |
| Missing values | 0 |
| Duplicate rows | 0 |
| Daily totals equal the sum of hourly rentals | Yes, for all 731 days |

The 165 missing hours do not indicate an error. They are hours with no rentals recorded, and the largest gaps fall on storm days (Hurricane Sandy on October 29, 2012 is missing 23 of 24 hours), so no rows were removed.

---

## 5 Exploratory Data Analysis

Every figure below is in the dashboard's **Section 4: Exploratory data analysis**, where it updates with the filters and rider type.

### 5.1 Understanding the Dataset

The data has 731 days and 17,379 hours. The primary response variable is the number of rentals (`cnt`), which is also split into `registered` and `casual`. The main explanatory variables are time (hour, weekday, season), weather, temperature, and type of day.

### 5.2 Distribution of Rentals

*Table 4. Summary statistics for rentals.*

| Rentals | Minimum | First quartile | Median | Mean | Third quartile | Maximum |
|---|---|---|---|---|---|---|
| Per day | 22 | 3,152 | 4,548 | 4,504.3 | 5,956 | 8,714 |
| Per hour | 1 | 40 | 142 | 189.5 | 281 | 977 |

Daily rentals are spread fairly evenly: the mean and median are close (skewness −0.05), and the very low days are mostly storms and holidays (**Figure 1**). Hourly rentals are strongly right-skewed (skewness 1.28): most hours are quiet and a few rush hours are very busy, so the mean is well above the median (**Figure 2**). On a log scale, two groups appear: overnight hours with only a few rentals and daytime hours with hundreds (**Figure 3**). The original counts are still used for everything reported in rentals.

### 5.3 Distribution of Weather and Season

*Table 5. Frequency of weather and season (days).*

| Variable | Category | Days | Percentage |
|---|---|---|---|
| Weather | Clear | 463 | 63.3 |
| Weather | Mist/cloudy | 247 | 33.8 |
| Weather | Rain/snow | 21 | 2.9 |
| Season | Winter | 181 | 24.8 |
| Season | Spring | 184 | 25.2 |
| Season | Summer | 188 | 25.7 |
| Season | Fall | 178 | 24.4 |

About 63% of days are clear and only 21 are rain or snow days, so averages for rain/snow rest on few days. The seasons are close to equal in size. Because weather and season are categories, a log transformation does not apply to them.

### 5.4 Relationship Between Rentals and Temperature

*Table 6. Pearson correlations with daily rentals.*

| Measure | Value |
|---|---|
| Temperature (°C) | +0.627 |
| Feels-like temperature (°C) | +0.631 |
| Humidity (%) | −0.101 |
| Wind speed (km/h) | −0.235 |

Rentals have a strong positive association with temperature: warmer days are generally busier (**Figure 4**). The trend is not a straight line; it flattens and dips on the hottest days. Humidity and wind have weaker, negative associations. Days at the same temperature still vary, because season, weather, type of day and the 2011 to 2012 growth also matter.

### 5.5 Rentals by Season and Weather

*Table 7. Rentals and temperature by season.*

| Season | Days | Median rentals | Mean rentals | Median temperature (°C) |
|---|---|---|---|---|
| Winter | 181 | 2,209 | 2,604 | 11.7 |
| Spring | 184 | 4,942 | 4,992 | 23.0 |
| Summer | 188 | 5,354 | 5,644 | 29.3 |
| Fall | 178 | 4,634 | 4,728 | 16.8 |

Winter has a much lower median than the other seasons, and Summer the highest (**Figure 5**). By weather, clear days average 4,877 rentals, mist/cloudy days 4,036 (−17%) and rain/snow days 1,803 (−63%) (**Figure 6**). It would be easy to conclude from Figure 5 alone that the season itself drives demand, but the seasons also differ in temperature.

### 5.6 Is It the Season or the Temperature?

Because temperature is strongly related to rentals, the next step was to check whether temperature differs between seasons. It does: the median Winter day is about 12°C, compared with 29°C in Summer (**Figure 7**). Within each season, warmer days are still busier, especially in Winter and Spring, while in Summer the trend flattens because the hottest days lose riders (**Figure 8**).

The apparent "season effect" is therefore largely a temperature effect. The season comparison and the temperature comparison answer different questions: one compares groups of days that have different temperatures, and the other shows how rentals change as it gets warmer.

---

## 6 Discussion

The most important lesson from this analysis is that a correct chart can still lead to an incomplete conclusion. The comparison by season accurately summarizes the data, but it mixes the effect of the calendar with the effect of temperature, because Winter days are much colder. Looking at a third variable, temperature, explains most of the gap.

The dashboard adds a second way to avoid misleading comparisons: a model that estimates each day's expected rentals from its weather, temperature, month and type of day. Comparing actual with expected rentals separates normal variation from truly unusual days. The biggest shortfalls line up with real events, such as Hurricane Sandy (22 rentals vs about 2,900 expected), Hurricane Irene, the January 2011 snowstorm and Christmas week.

The two rider groups behave differently. Registered members (81% of rentals) are commuters: their pattern has sharp peaks at 8:00 and 17:00 on working days. Casual riders are leisure riders who ride mostly on warm weekend afternoons, making up 32% of weekend and holiday rentals, and they are far more sensitive to bad weather.

---

## 7 Business Recommendations

1. **Schedule maintenance in the quiet windows.** Demand is lowest from 3:00 to 6:00, about 12 rentals an hour (2% of the evening peak). For longer jobs, January is the quietest month (2,176 rentals a day vs 5,772 in June).
2. **Have stations stocked before the commuter peaks.** Working-day demand peaks at 8:00 and 17:00 (about 473 and 524 rentals an hour). Weekends peak later, around 13:00, so rebalancing staff should shift then.
3. **Plan around the weather forecast.** Rain or snow cuts demand by about 63%. On those days, move rebalancing crews onto repairs and expect casual riders to all but disappear.
4. **Size the fleet for the peak, not the average.** Demand grew 64% from 2011 to 2012 (registered +68%, casual +50%), and 2012's busiest month, September, averaged 7,286 rentals a day.
5. **Compare days fairly.** When judging whether a day or period was good or bad, compare it with what its weather and temperature would predict, not just with the overall or seasonal average.

---

## 8 Limitations

This is observational data, so the analysis identifies associations rather than causes. The dataset has no station locations, fleet size, prices or trip details, so recommendations are about overall demand, not specific bike counts or stations. Two years of data means rare situations (holidays, heavy rain, extreme heat) have few examples, so results and model estimates for them are less certain. Temperature, daylight hours, holidays and the system's growth all change together across the year, which makes their separate effects hard to fully isolate. Finally, the data comes from one city in 2011–2012, so the patterns may not hold exactly for other cities or later years.

---

## 9 Conclusion

Bike rental demand follows clear and predictable patterns: a commuter rhythm on working days, a leisure peak on weekend afternoons, strong growth from 2011 to 2012, and sharp drops in rain or snow. Rentals are strongly associated with temperature, and the low demand in Winter is largely explained by colder temperatures rather than the season itself. The interactive dashboard brings these findings together so that an operator can see when demand is high, what disrupts it, who rides, and what to do about it, and can explore any day or hour in detail.

---

## 10 References

Fanaee-T, H. (2013). *Bike Sharing* [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C5W894

Fanaee-T, H., & Gama, J. (2013). Event labeling combining ensemble detectors and background knowledge. *Progress in Artificial Intelligence, 2*(2–3), 113–127. https://doi.org/10.1007/s13748-013-0040-3

Rout, S. (2023). *Bike sharing demand prediction* [R Markdown document]. RPubs. https://rpubs.com/Subhalaxmi/1039182

ASCI 2000 course materials. *Sample Final Project Report: Data Visualization of Diamond Prices.*

---

## 11 Appendix A: Key Python Code

The dashboard code is split into small files (see Appendix B). These excerpts show the main steps in a simplified form.

### A.1 Load and Clean the Data

```python
import pandas as pd

day = pd.read_csv("bike+sharing+dataset (1)/day.csv")
day["dteday"] = pd.to_datetime(day["dteday"])

#codes -> labels (season codes follow the actual dates)
day["season"] = day["season"].map({1: "Winter", 2: "Spring", 3: "Summer", 4: "Fall"})
day["weather"] = day["weathersit"].map({1: "Clear", 2: "Mist/cloudy", 3: "Rain/snow", 4: "Rain/snow"})

#working day / weekend / holiday in one column
day["day_type"] = "Weekend"
day.loc[day["workingday"] == 1, "day_type"] = "Working day"
day.loc[day["holiday"] == 1, "day_type"] = "Holiday"

#0-1 values back to real units
day["temp_c"] = day["temp"] * 41
day["humidity"] = day["hum"] * 100
day["wind"] = day["windspeed"] * 67
```

### A.2 Summary Statistics and Frequency Tables

```python
#Table 4: summary statistics
day["cnt"].describe()

#Table 5: days and percentage in each weather category
counts = day["weather"].value_counts()
pd.DataFrame({"Days": counts, "Percentage": (counts / len(day) * 100).round(1)})

#Table 6: correlation of daily rentals with the weather measurements
day[["cnt", "temp_c", "humidity", "wind"]].corr()["cnt"]

#Table 7: rentals and temperature by season
day.groupby("season").agg(days=("cnt", "size"), median_rentals=("cnt", "median"),
                          mean_rentals=("cnt", "mean"), median_temp=("temp_c", "median"))
```

### A.3 Histogram (Figures 1–3)

```python
import altair as alt

alt.Chart(day).mark_bar().encode(
    x=alt.X("cnt:Q", bin=alt.Bin(maxbins=30), title="Rentals per day"),
    y=alt.Y("count():Q", title="Number of days"),
).properties(title="Daily Rentals Are Spread Fairly Evenly")
```

### A.4 Scatterplot with a Trend Line (Figure 4)

```python
points = alt.Chart(day).mark_circle(opacity=0.45).encode(x="temp_c:Q", y="cnt:Q")
trend = alt.Chart(day).transform_loess("temp_c", "cnt").mark_line(color="orange").encode(x="temp_c:Q", y="cnt:Q")
(points + trend).properties(title="Warmer Days Bring More Riders, Up to a Point")
```

### A.5 Boxplots and Small Multiples (Figures 5–8)

```python
#rentals by season (Figure 5), the same pattern works for weather and temperature
alt.Chart(day).mark_boxplot().encode(
    x=alt.X("season:N", sort=["Winter", "Spring", "Summer", "Fall"]), y="cnt:Q")

#one panel per season with its own trend line (Figure 8)
base = alt.Chart(day).encode(x="temp_c:Q", y="cnt:Q")
panel = alt.layer(base.mark_circle(opacity=0.4),
                  base.transform_loess("temp_c", "cnt", groupby=["season"]).mark_line(color="orange"))
panel.properties(width=230, height=200).facet(column=alt.Column("season:N", sort=["Winter", "Spring", "Summer", "Fall"]))
```

### A.6 Expected Rentals from the Demand Model

```python
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import KFold, cross_val_predict

X = pd.get_dummies(day[["yr", "mnth", "workingday", "holiday", "temp_c", "humidity", "wind", "weather"]])
model = GradientBoostingRegressor(n_estimators=300, learning_rate=0.05, max_depth=3, random_state=0)

#5-fold cross-validation: each day is predicted by a model that never saw that day
day["expected"] = cross_val_predict(model, X, day["cnt"], cv=KFold(5, shuffle=True, random_state=0))
day["vs_expected"] = day["cnt"] / day["expected"] - 1  #-0.5 means 50% below expected
```

The full model in `model.py` also predicts on a log scale (so it never predicts fewer than 0 rentals), adds the weekday, and has separate models for registered and casual riders, which the dashboard uses for the expected line and the disrupted days. For all riders it explains about 87% of the day-to-day variation (R² ≈ 0.87), typically within about 500 rentals a day. Run `python model.py` to print the accuracy.

---

## 12 Appendix B: The Dashboard

### Viewing the Dashboard

Open **https://agarantche.github.io/bikeshare-demand-dashboard/** in any browser. Nothing needs to be installed: the dashboard is a website that runs entirely in the browser.

### How It Works

The work is split between Python and JavaScript:

1. **Python does the analysis once.** `export_data.py` uses `prep.py` to clean the data and `model.py` to work out the expected rentals for every day, then saves the results as two small JSON files in `docs/data/`.
2. **JavaScript draws the page.** `docs/index.html` loads those files, and the code in `docs/js/` does all the filtering, clicking and charts in the browser, so the page responds instantly and needs no server.

### What's on the Page

Built with HTML, CSS, JavaScript and Vega-Lite, in the Poppins font with a charcoal and red color scheme and a dark mode.

- **Filter bar** (stays at the top while scrolling): rider type, year, season, day type, weather, reset and a **dark mode / light mode** button, plus links to each section.
- **Overview:** headline numbers with comparisons, and a daily chart of actual vs expected rentals with disrupted days and known events labeled.
- **Drill-downs:** click any day to open its details (with Prev / Next), and click a heatmap cell to break down that hour of the week (its season and weather lists filter the whole page).
- **Section 1 – When is demand high?** Weekday × hour heatmap (click a cell to break it down) and the daily rhythm by day type.
- **Section 2 – What disrupts it?** The disrupted days table (click a row to open that day).
- **Section 3 – Who rides?** Commuters vs leisure riders through the day, on working days and weekends.
- **Section 4 – Exploratory data analysis:** the report-style tables and Figures 1–8 from Section 5 of this report.
- **Data table:** the filtered days, with a **Download as CSV** button.

### Project Files

| File | Purpose |
|---|---|
| `docs/index.html` | The dashboard page (what GitHub Pages shows) |
| `docs/css/style.css` | Colors and styles for light and dark mode |
| `docs/js/main.js` | Starts the dashboard and redraws it when something changes |
| `docs/js/settings.js` | Filter choices and limits (e.g. what counts as a disrupted day) |
| `docs/js/theme.js` | Chart colors for light and dark mode |
| `docs/js/data.js` | Loads the data and works out the numbers for the current filters |
| `docs/js/state.js` | What the page remembers between clicks, and what each click does |
| `docs/js/charts.js` | Chart helpers (Vega-Lite) |
| `docs/js/format.js` | Number formatting and small HTML helpers (tables, legends, bar lists) |
| `docs/js/stats.js` | Percentiles, skewness, correlation and histogram bins for Section 4 |
| `docs/js/sections/` | One file per part of the page: `overview`, `daily`, `when`, `disrupt`, `riders`, `eda`, `footer` |
| `docs/data/` | `days.json` and `hours.json`, made by `export_data.py` |
| `export_data.py` | Runs the cleaning and the model, and saves the results for the website |
| `prep.py` | Loads and cleans the data |
| `model.py` | The demand model: expected rentals per day, known events, and saving the trained model |
| `bike+sharing+dataset (1)/` | The dataset: `day.csv` and `hour.csv` |
| `ProjectProposal.pdf` | The project proposal |
| `DataSources.docx` | Section 2 (data sources, data directory, references) as a Word document |

---

© 2026 Adam Garantche. All rights reserved.
