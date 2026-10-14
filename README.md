# Bike-Sharing Demand Dashboard

**Author:** Adam Garantche  
**Date:** October 2, 2026  
**Project Type:** Data Visualization Class Project  
**Status:** v2 – interactive dashboard with demand model

## Project Overview

This project uses historical Capital Bikeshare data to build a dashboard that visualizes bike rental demand by time, season, weather conditions, and user type. The dashboard serves as a visual aid for identifying demand patterns and supporting decisions about bike availability, resource allocation, and maintenance scheduling.

## Dashboard (v2)

Built with **Python**, **pandas**, **Streamlit**, **Altair** (charts) and **scikit-learn** (demand model).

**Headline numbers with context:** average rentals per day (vs all days), growth from 2011 to 2012, busiest hour (vs an average hour), and "disrupted days" that ran 40%+ below expected.

**Actual vs expected demand:** a daily chart compares real rentals with what the model expected for that day's weather, season and day type. Days far from expected are marked, and known events (Hurricanes Irene and Sandy, the January 2011 snowstorm, Christmas week) are labeled.

**Drill-downs, so one click leads to the next:**
- Click any day on the chart, or a row in the **Unusual days** table, to open that day: actual vs expected, the weather, likely reasons, and its hourly pattern next to a typical similar day. From there, buttons filter the dashboard to days with the same weather or similar days.
- Click a cell in the **weekday × hour heatmap** to break that slot down by weather and rider type.
- Click **season** or **weather** bars to filter the whole dashboard; click again to remove them.

**The story, in four tabs:**
1. **When is demand high?** Weekday × hour heatmap, hourly pattern by day type, seasons and months (with average lines)
2. **What disrupts it?** Weather and temperature effects, and how many rentals the disrupted days cost
3. **Who rides?** Registered (commuter) vs casual (leisure) riders, and who is more weather-sensitive
4. **What should we do?** Recommendations worked out from the data (maintenance windows, peak-hour readiness, weather and growth planning), plus a **demand planner** that predicts rentals for a chosen month, day type, weather and temperature

**Sidebar:** rider type (all / registered / casual), filters for year, season, day type and weather, and a reset button.

## The Demand Model

`model.py` trains a gradient boosting model (scikit-learn) that predicts daily rentals from year, month, weekday, working day/holiday, weather, temperature, humidity and wind speed. There is one model each for all riders, registered riders and casual riders.

- **Fair comparison:** each day's "expected" value comes from a model that never saw that day (5-fold cross-validation).
- **No impossible predictions:** the model predicts on a log scale, so it never predicts fewer than zero rentals.
- **Accuracy:** for all riders, R² ≈ 0.87, typically within about 500 rentals per day.

Run `python model.py` to print the accuracy for each rider type.

## Running the Dashboard

1. Install Python 3.10 or newer.
2. Install the libraries:
   ```bash
   pip install pandas streamlit scikit-learn
   ```
3. From the project folder, start the app:
   ```bash
   streamlit run BikeSharing.py
   ```
4. The dashboard opens in your browser at http://localhost:8501.

Run the command from the project folder, because the app reads the CSV files using a path relative to it.

## Project Files

| File | Purpose |
|---|---|
| `BikeSharing.py` | The Streamlit dashboard |
| `prep.py` | Loads and cleans the data (labels codes, converts units, adds a day-type column) |
| `model.py` | The demand model: expected rentals per day, known events, and predictions for the planner |
| `bike+sharing+dataset (1)/` | The dataset: `day.csv` and `hour.csv` |
| `ProjectProposal.pdf` / `.docx` | The project proposal |

## Data

The [Bike Sharing Dataset](https://archive.ics.uci.edu/dataset/275/bike+sharing+dataset) from the UCI Machine Learning Repository covers Capital Bikeshare rentals in Washington DC for 2011–2012.

- `day.csv`: 731 rows, one per day
- `hour.csv`: 17,379 rows, one per hour

`prep.py` makes these changes before charting:

- Replaces codes with labels (seasons, weather, years, weekdays)
- Corrects the season labels: the dataset's readme says code 1 is spring, but the dates show code 1 covers Dec 21 – Mar 20 (winter), and each code is one season earlier than documented
- Converts temperature, feels-like temperature, humidity and wind speed from the dataset's 0–1 scale back to real units
- Adds a `day_type` column: Working day, Weekend or Holiday
- Merges weather category 4 (heavy rain, only 3 hours in the data) into light rain/snow

**Citation:** Fanaee-T, Hadi, and Gama, Joao, "Event labeling combining ensemble detectors and background knowledge", *Progress in Artificial Intelligence* (2013): pp. 1-15, Springer Berlin Heidelberg, doi:10.1007/s13748-013-0040-3.

## Limitations

- The dataset has no fleet size or station information, so recommendations are about demand, not specific bike counts.
- The demand planner estimates at 2012 demand levels and uses typical humidity and wind.
- Two years of data means rare situations (holidays, extreme weather) have few examples, so expected values for them are less reliable.

## Project Proposal

### 1 Business Problem

#### 1.1 Background

Bike-sharing companies face challenges in meeting fluctuating demand for bicycle rentals. Demand can vary by time of day, season, and weather conditions, making it difficult to ensure enough bicycles are available when needed. Underestimating demand can lead to frustrated customers and missed revenue, while overestimating demand can result in unused bicycles and unnecessary operational costs.

This project will use the Capital Bikeshare dataset to create a dashboard that serves as a visual aid for understanding these demand patterns. By displaying rental trends and comparisons, the dashboard will help support decisions about bike availability, resource allocation, and maintenance scheduling.

#### 1.2 Business Question

How can a dashboard of historical bike-sharing data help a company understand rental demand in relation to:

1. time of day and season;
2. weather conditions and temperature;
3. working days compared with weekends and holidays; and
4. rental patterns among casual and registered users?

#### 1.3 Business Importance

Understanding when rental demand is higher or lower can help bike-sharing companies prepare for busy periods and schedule maintenance during quieter periods. A dashboard can make these patterns easier to identify and communicate by presenting the data through clear charts and comparisons. This visual aid can support more informed planning, improve customer service, and help reduce inefficient use of resources.

#### 1.4 Analytical Objectives

This project will:

1. summarize daily and hourly bike rental counts;
2. identify peak rental hours and seasonal demand patterns;
3. examine how rental counts vary with temperature and weather conditions;
4. compare demand on working days with weekends and holidays;
5. compare rental patterns between casual and registered users; and
6. create a dashboard that clearly communicates these patterns to support decisions about bike availability, resource allocation, and maintenance scheduling.
