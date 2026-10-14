#ml model that predicts how many rentals a day should get from its weather, date and day type
#run python model.py to see how accurate it is
import numpy as np
import pandas as pd
from sklearn.compose import TransformedTargetRegressor
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import KFold, cross_val_predict

#what the model predicts: all riders, registered riders and casual riders (one model each)
TARGETS = ["cnt", "registered", "casual"]
#number columns the model uses
NUMERIC = ["year", "mnth", "workingday", "holiday", "temp_c", "humidity", "wind"]
#text columns the model uses, these get turned into 0/1 columns
CATEGORIES = {
    "weekday": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    "weather": ["Clear", "Mist/Cloudy", "Light Rain/Snow"],
}

#real events behind the biggest gaps between actual and expected rentals
EVENTS = {
    "2011-01-26": "Snowstorm (\"Commutageddon\")",
    "2011-01-27": "Snowstorm aftermath",
    "2011-08-27": "Hurricane Irene",
    "2011-08-28": "Hurricane Irene",
    "2012-10-29": "Hurricane Sandy",
    "2012-10-30": "Hurricane Sandy",
}


#gives the event name for a date, or nothing if there wasnt one
def event_for(date):
    date = pd.Timestamp(date)
    if date.strftime("%Y-%m-%d") in EVENTS:
        return EVENTS[date.strftime("%Y-%m-%d")]
    if date.month == 12 and date.day >= 24:
        return "Christmas holiday week"
    return ""


#builds the table the model learns from
#weekday and weather are text so each option becomes its own 0/1 column (like weather_Clear)
def make_features(df):
    X = df[NUMERIC].astype(float)
    for col, cats in CATEGORIES.items():
        dummies = pd.get_dummies(pd.Categorical(df[col], categories=cats), prefix=col, dtype=float)
        dummies.index = df.index
        X = X.join(dummies)
    return X


#makes a new gradient boosting model
#it predicts on a log scale so it never predicts less than 0 rentals
def new_model():
    booster = GradientBoostingRegressor(n_estimators=300, learning_rate=0.05, max_depth=3, random_state=0)
    return TransformedTargetRegressor(booster, func=np.log1p, inverse_func=np.expm1)


#adds expected_cnt, expected_registered and expected_casual columns plus the event column
#uses 5 fold cross validation so each day is predicted by a model that never saw that day,
#otherwise the model would already know the answer and every day would look normal
def add_expected(day):
    day = day.copy()
    X = make_features(day)
    folds = KFold(5, shuffle=True, random_state=0)
    for target in TARGETS:
        day[f"expected_{target}"] = cross_val_predict(new_model(), X, day[target], cv=folds).clip(min=0)
    day["event"] = day["dteday"].map(event_for)
    return day


#trains one model per target on every day, used by the demand planner
def fit_models(day):
    X = make_features(day)
    return {target: new_model().fit(X, day[target]) for target in TARGETS}


#predicts rentals for one made up day (inputs is a dict with the same columns as the data)
def predict(models, inputs):
    X = make_features(pd.DataFrame([inputs]))
    return {target: max(0.0, float(model.predict(X)[0])) for target, model in models.items()}


#only runs with python model.py, prints how accurate the model is
#r2 is how much of the ups and downs the model explains (1 is perfect)
#typical error is how many rentals off it usually is
if __name__ == "__main__":
    from sklearn.metrics import mean_absolute_error, r2_score

    from prep import load_day

    day = add_expected(load_day())
    for target in TARGETS:
        print(f"{target:>10}: R2 = {r2_score(day[target], day[f'expected_{target}']):.3f}, "
              f"typical error = {mean_absolute_error(day[target], day[f'expected_{target}']):,.0f} rentals/day")
