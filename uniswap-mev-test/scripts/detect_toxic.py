# detect_toxic.py

import json
import pandas as pd

THRESHOLD_PCT = 0.0002  # 0.1% relative price difference
MIN_TRADE_SIZE = 1000  # USDC size

def detect_toxic_trades(df, threshold_pct=THRESHOLD_PCT, min_trade_size=MIN_TRADE_SIZE):
    df["price_diff_pct"] = abs(df["amm_price"] - df["external_price"]) / df["external_price"]
    df["is_toxic"] = (df["price_diff_pct"] > threshold_pct) & (df["trade_size"] > min_trade_size)
    return df

if __name__ == "__main__":
    with open("trade_data_fixed.json", "r") as f:
        trades = json.load(f)

    df = pd.DataFrame(trades)
    df = detect_toxic_trades(df)

    toxic = df["is_toxic"].sum()
    total = len(df)
    print(f"Detected {toxic} toxic trades out of {total} ({100*toxic/total:.2f}%)")

    df.to_csv("toxic_flags.csv", index=False)
    print("Saved toxic trade flags to toxic_flags.csv")


