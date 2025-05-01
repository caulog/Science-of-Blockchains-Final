import json
import pandas as pd
import matplotlib.pyplot as plt

# === Load new JSON data ===
with open("trade_data_mitigated.json", "r") as f:
    trades = json.load(f)

df = pd.DataFrame(trades)

# === Toxic trades ===
toxic_trades = df[df["toxic_trade"] == True]

# === Toxic trade statistics ===
total_trades = len(df)
toxic_count = len(toxic_trades)
toxic_percent = (toxic_count / total_trades) * 100
print(f"{toxic_count} out of {total_trades} trades were toxic ({toxic_percent:.2f}%)")

# === Plot ===
plt.figure(figsize=(12, 6))
plt.plot(df["tradeNumber"], df["amm_price"], label="AMM Price", color="blue", linewidth=1.5)
plt.plot(df["tradeNumber"], df["external_price"], label="External Price", color="green", linestyle="--", linewidth=1.5)

# Overlay toxic markers on external price
plt.scatter(
    toxic_trades["tradeNumber"],
    toxic_trades["external_price"],
    color="red",
    label="Toxic Trade",
    zorder=5,
    s=40
)

# Style
plt.title("AMM vs External Price with Toxic Trade Markers")
plt.xlabel("Trade Number")
plt.ylabel("Price")
plt.legend()
plt.grid(True)
plt.tight_layout()

# Save and show
plt.savefig("toxic_trade_overlay_external.png")
plt.show()
print("Saved plot as toxic_trade_overlay_external.png")



