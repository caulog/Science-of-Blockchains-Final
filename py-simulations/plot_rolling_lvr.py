import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("../py-simulations/lvr-rolling-output.csv")

# Price over time
plt.figure(figsize=(10,5))
plt.plot(df["step"], df["price"])
plt.title("Synthetic Price Path")
plt.xlabel("Step (Block)")
plt.ylabel("Price (USD)")
plt.grid()
plt.show()

# LVR over time
plt.figure(figsize=(10,5))
plt.plot(df["step"], df["lvr"])
plt.title("LVR (Loss vs Rebalance) Over Time")
plt.xlabel("Step (Block)")
plt.ylabel("LVR (Normalized)")
plt.grid()
plt.show()

