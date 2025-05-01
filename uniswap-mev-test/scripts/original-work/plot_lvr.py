import json
import matplotlib.pyplot as plt

# Load LVR data
with open("lvr-data-batch.json") as f:
    data = json.load(f)

# Skip initial state and extract relevant data
trade_sizes = []
lvrs = []
baseline_price = data[0]["spot_price"]

def compute_lvr(usdc, weth, baseline_price, actual_price):
    v_lp = usdc + (weth * actual_price)
    total_value = usdc + (weth * baseline_price)
    rebalanced_usdc = total_value / 2
    rebalanced_weth = (total_value / 2) / baseline_price
    v_rebalanced = rebalanced_usdc + (rebalanced_weth * actual_price)
    return v_rebalanced - v_lp

for row in data[1:]:
    usdc = row["usdc_reserve"]
    weth = row["weth_reserve"]
    actual_price = row["spot_price"]
    trade_size = row["trade_size_usdc"]
    lvr = compute_lvr(usdc, weth, baseline_price, actual_price)
    
    trade_sizes.append(trade_size)
    lvrs.append(lvr)

# Plot
plt.figure(figsize=(10, 6))
plt.plot(trade_sizes, lvrs, marker='o', linewidth=2, color='purple')
plt.title("LVR (Value Lost by LP) vs Trade Size")
plt.xlabel("Trade Size (USDC)")
plt.ylabel("LVR (USD)")
plt.grid(True)
plt.tight_layout()
plt.savefig("lvr-plot.png")
plt.show()

