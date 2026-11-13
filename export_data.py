#exports the cleaned data and the model's expected rentals to json files for the website in docs/
#run it again with: python export_data.py  (only needed if the data, prep.py or model.py change)
import json
from pathlib import Path

from model import load_or_train
from prep import load_day, load_hour

OUT = Path(__file__).parent / "docs" / "data"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    day = load_or_train(load_day())  #daily data plus the expected rentals (from model_cache if it was trained before)
    day["date"] = day["dteday"].dt.strftime("%Y-%m-%d")

    #one row per day with everything the website needs, numbers rounded so the file stays small
    cols = ["date", "year", "mnth", "season", "weekday", "day_type", "weather", "temp_f", "feels_like_f", "humidity",
            "wind", "cnt", "registered", "casual", "expected_cnt", "expected_registered", "expected_casual", "event"]
    days = day[cols].copy()
    for c in ["temp_f", "feels_like_f", "humidity", "wind"]:
        days[c] = days[c].round(1)
    for c in ["expected_cnt", "expected_registered", "expected_casual"]:
        days[c] = days[c].round(0).astype(int)
    (OUT / "days.json").write_text(json.dumps(days.to_dict(orient="records"), separators=(",", ":")), encoding="utf-8")

    #hourly numbers: for each rider type, one list of 24 hours per day, in the same order as days.json
    #hours missing from hour.csv had no rentals, so they are 0
    hour = load_hour()
    hour["date"] = hour["dteday"].dt.strftime("%Y-%m-%d")
    hours = {}
    for col in ["cnt", "registered", "casual"]:
        grid = hour.pivot_table(index="date", columns="hr", values=col, aggfunc="sum")
        grid = grid.reindex(index=days["date"], columns=range(24)).fillna(0).astype(int)
        hours[col] = grid.values.tolist()
    (OUT / "hours.json").write_text(json.dumps(hours, separators=(",", ":")), encoding="utf-8")

    for f in ["days.json", "hours.json"]:
        print(f"wrote docs/data/{f} ({(OUT / f).stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
