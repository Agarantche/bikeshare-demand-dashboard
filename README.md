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

Exploratory data analysis was done with summary statistics and graphs, applying the methods of course Labs 2–9, and the results are presented in an interactive dashboard website that anyone can open in a browser. Daily rentals are spread fairly evenly (mean 4,504, median 4,548), while hourly rentals are strongly right-skewed, so a log scale was used to show quiet and busy hours together. Demand follows a clear commuter rhythm on working days, with peaks at 8:00 and 17:00, and one broad midday peak on weekends. Rentals rise with temperature (a moderate positive correlation, r = +0.63), fall by 63% on rain or snow days compared with clear days, and grew 64% from 2011 to 2012.

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

Every table and figure below is in the dashboard's **Section 4: Exploratory data analysis**, where it updates with the filters, the rider type and the buttons above each chart. Each part is one task from the analysis plan (`AnalysisPlan.docx`) and uses the methods of one course lab, applied to the bike data:

| Part | Plan task | Lab | Methods used |
|---|---|---|---|
| 5.1 | Task 1 | Lab 2 | Statistical type vs stored type, factors, ordered levels |
| 5.2 | Task 2 | Lab 3 | Summary, histogram (15, 30 or 60 bins), density curve, boxplot, zoom, log scale |
| 5.3 | Task 3 | Lab 4 | Frequency and relative frequency, bar charts in natural or frequency order |
| 5.4 | Task 4 | Lab 5 | Scatterplot with transparency, smooth or straight trend line, log scale |
| 5.5 | Task 5 | Lab 6 | Grouped summaries, boxplot, violin, jittered points, bar of means, a confounder |
| 5.6 | Task 6 | Lab 7 | Two-way table, row and column percentages, grouped/stacked/100% bars, heatmap |
| 5.7 | Task 7 | Lab 8 | `cut(temp_c, 5)` vs demand level, count and proportional bars |
| 5.8 | Task 8 | Lab 9 | Correlation matrix, correlation within each season, limits of r |

Tasks 9 and 10 of the plan (rentals by hour and day type, and casual vs registered riders) are dashboard Sections 1 and 3.

### 5.1 Understanding the Dataset and Variable Types

The data has 731 days and 17,379 hours. The primary response variable is the number of rentals (`cnt`), which is also split into `registered` and `casual`. Several categories are stored as numbers in the file (season 1–4, weather 1–4), so they were turned into labelled categories before anything else; otherwise a program would happily report an "average season". The type decides the summary: numbers get quartiles and a mean (5.2), categories get counts (5.3).

*Table 4. Variable types, how the file stores them, and their levels.*

| Variable | Statistical type | Stored in the file as | Levels or unit |
|---|---|---|---|
| `season` | Categorical, ordered by the calendar | Number 1–4 | Winter < Spring < Summer < Fall |
| `weather` (`weathersit`) | Categorical, ordered by how bad it is | Number 1–4 | Clear < Mist/cloudy < Rain/snow |
| `weekday` | Categorical, ordered | Number 0–6 (0 = Sunday) | Mon < Tue < … < Sun |
| `day_type` (made here) | Categorical, not ordered | Made from `holiday` and `workingday` | Working day, Weekend, Holiday |
| `year` | Categorical (2 levels) | Number 0–1 | 2011, 2012 |
| `hr` | Numerical, discrete | Number 0–23 | Hour of the day |
| `temp_c`, `feels_like_c` | Numerical, continuous | Scaled 0–1 (× 41 and × 50) | °C |
| `humidity`, `wind` | Numerical, continuous | Scaled 0–1 (× 100 and × 67) | %, km/h |
| `cnt`, `registered`, `casual` | Numerical, discrete counts | Whole number | Rentals |
| `demand` (made here) | Categorical, ordered | Rentals cut into thirds | Low < Medium < High |
| `temp_group` (made here) | Categorical, ordered | `cut(temp_c, 5)` | 5 equal-width ranges |

The order of the levels matters: weather has a real order from good to bad, but day type does not, since a weekend is not "more" than a holiday.

### 5.2 One Numerical Variable: Rentals

*Table 5. Summary statistics for rentals.*

| Rentals | Minimum | First quartile | Median | Mean | Third quartile | Maximum | Skewness |
|---|---|---|---|---|---|---|---|
| Per day | 22 | 3,152 | 4,548 | 4,504.3 | 5,956 | 8,714 | −0.05 |
| Per hour | 1 | 40 | 142 | 189.5 | 281 | 977 | 1.28 |

Following Lab 3, each distribution is described by its shape, center, spread and unusual values.

- **Daily rentals** are fairly symmetric (**Figure 1**). The mean (4,504) and median (4,548) are close, the middle half of days falls between 3,152 and 5,956 (IQR 2,804), and no days are past the boxplot whiskers (**Figure 3**). The very low days are storms and holidays.
- **Hourly rentals** are strongly right-skewed. Most hours are quiet and a few rush hours are very busy, so the mean (189) is well above the median (142), and 505 hours are boxplot outliers. A log scale spreads out the quiet hours and shows two groups: overnight hours with a few rentals and daytime hours with hundreds.

The density curve (**Figure 2**) shows the same shape without bins. No single graph shows everything: the histogram depends on the bins, the density curve hides the counts and the boxplot hides the shape. Changing the bins, zooming in or using a log scale only changes the picture, never the data, so all reported numbers stay in original rentals.

### 5.3 One Categorical Variable: How the Days Are Split

*Table 6. Frequency and relative frequency of weather, season and day type (days).*

| Variable | Category | Days | Relative frequency | Percent |
|---|---|---|---|---|
| Weather | Clear | 463 | 0.633 | 63.3% |
| Weather | Mist/cloudy | 247 | 0.338 | 33.8% |
| Weather | Rain/snow | 21 | 0.029 | 2.9% |
| Season | Winter | 181 | 0.248 | 24.8% |
| Season | Spring | 184 | 0.252 | 25.2% |
| Season | Summer | 188 | 0.257 | 25.7% |
| Season | Fall | 178 | 0.244 | 24.4% |
| Day type | Working day | 500 | 0.684 | 68.4% |
| Day type | Weekend | 210 | 0.287 | 28.7% |
| Day type | Holiday | 21 | 0.029 | 2.9% |

Clear is the most common weather (63.3% of days), while only 21 days are rain or snow and only 21 are holidays, so averages for those groups rest on few days (**Figure 4**). The seasons are close to equal in size. Weather and season are shown in their natural order (from good to bad weather, and through the calendar); day type has no natural order, so it reads best sorted by frequency.

### 5.4 Two Numerical Variables: Weather and Rentals

In the scatterplot of temperature and daily rentals (**Figure 5**), each point is a day. Transparency shows where days overlap (overplotting), and a smooth trend line shows the form of the relationship.

| Measure | Correlation with daily rentals (r) | Strength |
|---|---|---|
| Temperature (°C) | +0.63 | Moderate positive |
| Feels-like temperature (°C) | +0.63 | Moderate positive |
| Humidity (%) | −0.10 | Very weak |
| Wind speed (km/h) | −0.23 | Weak negative |

Rentals rise as it gets warmer, but the relationship is not perfectly linear: the smooth line flattens and dips on the hottest days, and days at the same temperature still vary a lot. Compared with the straight-line fit, the smooth line shows where a straight line misses. Humidity and wind form wide clouds with only a slight slope, so on their own they say little about rentals, like depth vs price for the diamonds in Lab 5.

### 5.5 A Numerical Variable Across Categories: Rentals by Group

*Table 7. Grouped summaries of daily rentals.*

| Group | Level | Days | Mean | Median | First quartile | Third quartile | IQR |
|---|---|---|---|---|---|---|---|
| Season | Winter | 181 | 2,604 | 2,209 | 1,538 | 3,456 | 1,918 |
| Season | Spring | 184 | 4,992 | 4,942 | 4,003 | 6,377 | 2,374 |
| Season | Summer | 188 | 5,644 | 5,354 | 4,587 | 6,929 | 2,343 |
| Season | Fall | 178 | 4,728 | 4,635 | 3,616 | 5,625 | 2,009 |
| Weather | Clear | 463 | 4,877 | 4,844 | 3,637 | 6,459 | 2,822 |
| Weather | Mist/cloudy | 247 | 4,036 | 4,040 | 2,675 | 5,258 | 2,583 |
| Weather | Rain/snow | 21 | 1,803 | 1,817 | 705 | 2,424 | 1,719 |
| Day type | Working day | 500 | 4,585 | 4,582 | 3,344 | 5,988 | 2,643 |
| Day type | Weekend | 210 | 4,390 | 4,468 | 2,765 | 5,872 | 3,106 |
| Day type | Holiday | 21 | 3,735 | 3,351 | 1,951 | 6,034 | 4,083 |

Summer has the highest median and Winter by far the lowest (**Figure 6**). In Winter the mean is well above the median, a sign of right skew within the season. By weather, mean rentals drop 17% from clear to mist/cloudy days and 63% on rain/snow days. Holidays have the lowest median and the widest spread, but only 21 days. The dashboard shows Figure 6 as a boxplot (medians, IQR, outliers), a violin plot (the shape), jittered points (every day) or a bar of means. The bar of means is the easiest to read but hides the spread, which is why the other three are better.

It would be easy to conclude that the season itself drives demand, but Lab 6 showed that a third variable can be behind a group difference (for diamonds, carat explained why Fair cuts cost more). Here that variable is temperature: the median Winter day is about 12°C, compared with 29°C in Summer (**Figure 7**).

### 5.6 Two Categorical Variables: Season and Weather

*Table 8. Days by season and weather (row percentages in brackets).*

| Season | Clear | Mist/cloudy | Rain/snow | Total |
|---|---|---|---|---|
| Winter | 111 (61.3%) | 66 (36.5%) | 4 (2.2%) | 181 |
| Spring | 113 (61.4%) | 68 (37.0%) | 3 (1.6%) | 184 |
| Summer | 136 (72.3%) | 48 (25.5%) | 4 (2.1%) | 188 |
| Fall | 103 (57.9%) | 65 (36.5%) | 10 (5.6%) | 178 |
| Total | 463 (63.3%) | 247 (33.8%) | 21 (2.9%) | 731 |

Summer has the most clear days (72%) and Fall the fewest (58%) (**Figure 8**). The direction of the percentage matters: 5.6% of Fall days had rain or snow (row percentage), but of all 21 rain/snow days, 48% were in Fall (column percentage). The two answer different questions because they divide by different totals. If season and weather were not associated, every bar in the 100% stacked chart would have the same mix. The mix changes from season to season, so the two are associated, which means part of a season's demand can be a weather effect. The heatmap view shows that clear Summer days are the most common combination.

### 5.7 Temperature Groups and Demand Level

Temperature was cut into 5 equal-width groups (`cut(temp_c, 5)`), and each day was given a demand level from its rentals: Low (up to 3,741), Medium (up to 5,312) and High (above 5,312), the lowest, middle and highest third of the days.

*Table 9. Demand level by temperature group (row percentages, each row adds to 100%).*

| Temperature group | Days | Low | Medium | High |
|---|---|---|---|---|
| 2.4–9.0°C | 42 | 100% | 0% | 0% |
| 9.0–15.6°C | 194 | 66% | 24% | 10% |
| 15.6–22.1°C | 174 | 30% | 37% | 33% |
| 22.1–28.7°C | 194 | 8% | 41% | 51% |
| 28.7–35.3°C | 127 | 3% | 43% | 54% |

High-demand days get more common as it warms up: none of the coldest days are high-demand, compared with 54% of the hottest (**Figure 9**). The rise slows between the two warmest groups, matching the flattening in Figure 5. The count chart shows that the coldest group has only 42 days, while the proportional chart makes the mix easy to compare but hides group size, so the two are read together.

### 5.8 Correlation: How Strong Are the Relationships?

In the correlation matrix (**Figure 10**), the diagonal is 1 and each value appears twice, because r(a, b) = r(b, a). The strongest pair is temperature and feels-like temperature (r = +0.99), which measure nearly the same thing, like a diamond's x, y and z in Lab 9. Of the weather measures, temperature and feels-like temperature go with rentals most closely (r = +0.63) and humidity is closest to zero (r = −0.10). A value near zero does not prove there is no relationship, only no straight-line one.

*Table 10. Correlation between temperature and daily rentals, overall and within each season.*

| Days | Number of days | r (temperature, rentals) | Strength |
|---|---|---|---|
| All days | 731 | +0.63 | Moderate positive |
| Winter | 181 | +0.67 | Moderate positive |
| Spring | 184 | +0.48 | Moderate positive |
| Summer | 188 | −0.03 | Very weak |
| Fall | 178 | +0.40 | Weak positive |

Within each season, warmer days are still busier, especially in Winter and Spring (**Figure 11**). In Summer r is close to zero even though the scatterplot shows a pattern: rentals rise and then fall on the hottest days, and a single r cannot describe a curve.

The apparent "season effect" is therefore largely a temperature effect. The season comparison and the temperature comparison answer different questions: one compares groups of days that have different temperatures, and the other shows how rentals change as it gets warmer. This is still an association in observational data: daylight hours, holidays and the 2011 to 2012 growth also change across the year.

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

Bike rental demand follows clear and predictable patterns: a commuter rhythm on working days, a leisure peak on weekend afternoons, strong growth from 2011 to 2012, and sharp drops in rain or snow. Rentals have a moderate positive association with temperature (r = +0.63), and the low demand in Winter is largely explained by colder temperatures rather than the season itself. The interactive dashboard brings these findings together so that an operator can see when demand is high, what disrupts it, who rides, and what to do about it, and can explore any day or hour in detail.

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
#Table 5: summary statistics
day["cnt"].describe()

#Table 6: days and relative frequency in each weather category
counts = day["weather"].value_counts()
pd.DataFrame({"Days": counts, "Relative frequency": (counts / len(day)).round(3)})

#Figure 10: correlation matrix of the weather measurements and rentals
day[["temp_c", "atemp", "humidity", "wind", "casual", "registered", "cnt"]].corr()

#Table 7: grouped summaries by season
day.groupby("season").agg(days=("cnt", "size"), median_rentals=("cnt", "median"),
                          mean_rentals=("cnt", "mean"), median_temp=("temp_c", "median"))
```

### A.3 Histogram (Figure 1)

```python
import altair as alt

alt.Chart(day).mark_bar().encode(
    x=alt.X("cnt:Q", bin=alt.Bin(maxbins=30), title="Rentals per day"),
    y=alt.Y("count():Q", title="Number of days"),
).properties(title="Daily Rentals Are Fairly Symmetric")
```

### A.4 Scatterplot with a Trend Line (Figure 5)

```python
points = alt.Chart(day).mark_circle(opacity=0.3)  #see-through points for overplotting.encode(x="temp_c:Q", y="cnt:Q")
trend = alt.Chart(day).transform_loess("temp_c", "cnt").mark_line(color="orange").encode(x="temp_c:Q", y="cnt:Q")
(points + trend).properties(title="Moderate Positive Relationship Between Temperature and Rentals")
```

### A.5 Boxplots and Small Multiples (Figures 6, 7 and 11)

```python
#rentals by season (Figure 6), the same pattern works for weather and temperature (Figure 7)
alt.Chart(day).mark_boxplot().encode(
    x=alt.X("season:N", sort=["Winter", "Spring", "Summer", "Fall"]), y="cnt:Q")

#one panel per season with its own trend line (Figure 11)
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

Built with HTML, CSS, JavaScript and Vega-Lite, in the Poppins font with a navy, steel blue, light blue and coral color palette ("Harbor", text colors adjusted where needed to pass the WCAG AA contrast check) and a dark mode.

A **sidebar menu** opens one part of the dashboard at a time, so there is no long page to scroll; on a phone it becomes a menu bar across the top. Each part has its own address (like `#when` or `#analysis-3`), so the browser's back button works and a link can open a specific part. The **filter bar** (rider type, year, season, day type, weather and reset) stays at the top of every part except Home, and the **dark mode / light mode** button is in the sidebar.

- **Home:** the research question, four key findings, and one button per course lab.
- **Overview:** headline numbers with comparisons, and a daily chart of actual vs expected rentals with disrupted days and known events labeled. Click any day to open its details (with Prev / Next).
- **Section 1 – When is demand high?** Weekday × hour heatmap (click a cell to break it down; its season and weather lists filter the whole page) and the daily rhythm by day type.
- **Section 2 – What disrupts it?** The disrupted days table (click a row to open that day in the Overview).
- **Section 3 – Who rides?** Commuters vs leisure riders through the day, on working days and weekends.
- **Section 4 – Analysis (course labs):** the tables and Figures 1–11 from Section 5 of this report, one lab at a time (Labs 2–9) with Previous / Next. Each part shows a one-line takeaway, with the full explanation under **Read more**. Buttons above each chart switch between the views compared in the labs, such as the number of bins, boxplot vs violin vs jittered points, or count vs proportional bars.
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
| `docs/js/stats.js` | Percentiles, skewness, correlation, histogram bins, `cut()` groups and density curves for Section 4 |
| `docs/js/sections/` | One file per part of the page: `nav` (sidebar), `home`, `overview`, `daily`, `when`, `disrupt`, `riders`, `eda`, `footer` (data table and footer) |
| `docs/data/` | `days.json` and `hours.json`, made by `export_data.py` |
| `export_data.py` | Runs the cleaning and the model, and saves the results for the website |
| `prep.py` | Loads and cleans the data |
| `model.py` | The demand model: expected rentals per day, known events, and a cache so it only retrains when something changes |
| `bike+sharing+dataset (1)/` | The dataset: `day.csv` and `hour.csv` |
| `ProjectProposal.pdf` | The project proposal |
| `DataSources.docx` | Section 2 (data sources, data directory, references) as a Word document |
| `AnalysisPlan.docx` | Task outline and analysis plan: research questions, data preparation, Tasks 1–10 and the lab application table |

---

© 2026 Adam Garantche. All rights reserved.
