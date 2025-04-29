import json
import pandas as pd

# === Load Hardhat-generated trade data ===
with open("trade_data.json", "r") as f:
    trades = json.load(f)

df = pd.DataFrame(trades)

# === Toxic trade condition ===
threshold = 0.01     # 1% price deviation
min_size = 5         # min trade size to be considered impactful

df["price_diff"] = abs(df["amm_price"] - df["external_price"])
df["is_toxic"] = (df["price_diff"] > threshold) & (df["trade_size"] > min_size)

# === Summary ===
total = len(df)
toxic = df["is_toxic"].sum()
print(f"Detected {toxic} toxic trades out of {total} ({100*toxic/total:.2f}%)")

# === Save flagged data ===
df.to_csv("toxic_flags.csv", index=False)
print("Saved toxic trade flags to toxic_flags.csv")

