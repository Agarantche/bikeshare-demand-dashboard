# Bike-Sharing Demand Dashboard

**Author:** Adam Garantche  
**Date:** October 2, 2026  
**Project Type:** Data Visualization Class Project  
**Status:** v1 – basic dashboard

## Project Overview

This project uses historical Capital Bikeshare data to build a dashboard that visualizes bike rental demand by time, season, weather conditions, and user type. The dashboard serves as a visual aid for identifying demand patterns and supporting decisions about bike availability, resource allocation, and maintenance scheduling.

## Dashboard (v1)

Built with **Python**, **pandas** and **Streamlit**.

- **Summary numbers:** total rentals, average per day, busiest hour, share of registered users
- **Daily rentals over time**
- **Time & Season:** average rentals by hour and by season
- **Weather:** temperature vs daily rentals, average rentals by weather type
- **Working Day vs Weekend:** hourly pattern for working days, weekends and holidays
- **Casual vs Registered:** hourly and day-type comparison of the two user groups
- **Sidebar filters** for year, season, day type and weather, plus a table of the filtered data

## Running the Dashboard

1. Install Python 3.10 or newer.
2. Install the libraries:
   ```bash
   pip install pandas streamlit
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
| `bike+sharing+dataset (1)/` | The dataset: `day.csv` and `hour.csv` |
| `ProjectProposal.pdf` / `.docx` | The project proposal |

## Data

The [Bike Sharing Dataset](https://archive.ics.uci.edu/dataset/275/bike+sharing+dataset) from the UCI Machine Learning Repository covers Capital Bikeshare rentals in Washington DC for 2011–2012.

- `day.csv`: 731 rows, one per day
- `hour.csv`: 17,379 rows, one per hour

`prep.py` makes these changes before charting:

- Replaces codes with labels (seasons, weather, years, weekdays)
- Converts temperature, feels-like temperature, humidity and wind speed from the dataset's 0–1 scale back to real units
- Adds a `day_type` column: Working day, Weekend or Holiday
- Merges weather category 4 (heavy rain, only 3 hours in the data) into light rain/snow

Note: the dataset labels season 1 as "Spring", but it covers roughly late December to March.

**Citation:** Fanaee-T, Hadi, and Gama, Joao, "Event labeling combining ensemble detectors and background knowledge", *Progress in Artificial Intelligence* (2013): pp. 1-15, Springer Berlin Heidelberg, doi:10.1007/s13748-013-0040-3.

## Planned Next Steps

- More interactive charts, such as clicking a chart to filter the dashboard and drilling down into a single day or hour
- More context for the numbers, such as comparisons and averages
- A machine learning model that predicts expected demand from weather and day type

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
