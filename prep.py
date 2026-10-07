import pandas as pd

DATA_DIR = "bike+sharing+dataset (1)/"

SEASONS = {1: "Spring", 2: "Summer", 3: "Fall", 4: "Winter"}
WEATHER = {1: "Clear", 2: "Mist/Cloudy", 3: "Light Rain/Snow", 4: "Light Rain/Snow"}  # 4 is too rare, merged into 3
WEEKDAYS = {0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat"}


def clean(df):
    df = df.copy()
    df["dteday"] = pd.to_datetime(df["dteday"])

    # codes -> labels
    df["season"] = df["season"].map(SEASONS)
    df["weather"] = df["weathersit"].map(WEATHER)
    df["year"] = df["yr"].map({0: 2011, 1: 2012})
    df["weekday"] = df["weekday"].map(WEEKDAYS)

    # working day / weekend / holiday
    df["day_type"] = "Weekend"
    df.loc[df["workingday"] == 1, "day_type"] = "Working day"
    df.loc[df["holiday"] == 1, "day_type"] = "Holiday"

    # normalized values -> real units
    df["temp_c"] = df["temp"] * 41
    df["feels_like_c"] = df["atemp"] * 50
    df["humidity"] = df["hum"] * 100
    df["wind"] = df["windspeed"] * 67

    return df.drop(columns=["instant", "yr", "weathersit", "temp", "atemp", "hum", "windspeed"])


def load_day():
    return clean(pd.read_csv(DATA_DIR + "day.csv"))


def load_hour():
    return clean(pd.read_csv(DATA_DIR + "hour.csv"))
