#loads the bike sharing csv files and cleans them up for the dashboard and the model
import pandas as pd

DATA_DIR = "bike+sharing+dataset (1)/"

#the dataset readme says 1=spring ... 4=winter but the dates show each code is one season earlier
#(code 1 is dec 21 - mar 20) so these labels go by the actual dates
SEASONS = {1: "Winter", 2: "Spring", 3: "Summer", 4: "Fall"}
WEATHER = {1: "Clear", 2: "Mist/cloudy", 3: "Rain/snow", 4: "Rain/snow"}  #4 is heavy rain, only 3 hours of it so its merged into 3
WEEKDAYS = {0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat"}


#cleans either csv (day or hour, they have the same columns except hr)
def clean(df):
    df = df.copy()
    df["dteday"] = pd.to_datetime(df["dteday"])

    #turns the number codes into labels
    df["season"] = df["season"].map(SEASONS)
    df["weather"] = df["weathersit"].map(WEATHER)
    df["year"] = df["yr"].map({0: 2011, 1: 2012})
    df["weekday"] = df["weekday"].map(WEEKDAYS)

    #one column for working day / weekend / holiday (the dataset puts weekends and holidays together)
    df["day_type"] = "Weekend"
    df.loc[df["workingday"] == 1, "day_type"] = "Working day"
    df.loc[df["holiday"] == 1, "day_type"] = "Holiday"

    #the dataset stores these as 0-1. the readme gives the ranges they were scaled from:
    #temperature -8 to 39 C, feels-like -16 to 50 C, humidity 0 to 100 %, wind 0 to 67 km/h
    #(a day's values are the average of its hours, so the same ranges work for day.csv)
    #then temperature goes to fahrenheit and wind to mph, since thats what people in the us are used to
    df["temp_f"] = (df["temp"] * 47 - 8) * 9 / 5 + 32
    df["feels_like_f"] = (df["atemp"] * 66 - 16) * 9 / 5 + 32
    df["humidity"] = df["hum"] * 100
    df["wind"] = df["windspeed"] * 67 * 0.621371  #mph

    #drops the old columns that got replaced
    return df.drop(columns=["instant", "yr", "weathersit", "temp", "atemp", "hum", "windspeed"])


#daily data, one row per day
def load_day():
    return clean(pd.read_csv(DATA_DIR + "day.csv"))


#hourly data, one row per hour
def load_hour():
    return clean(pd.read_csv(DATA_DIR + "hour.csv"))
