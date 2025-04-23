import json

# Load synthetic trade data
with open("lvr-data-batch.json") as f:
    data = json.load(f)

# Use the spot price before any trades as the external market price baseline
baseline_price = data[0]["spot_price"]

def compute_lvr(usdc, weth, baseline_price, actual_price):
    """
    LVR = Value of rebalanced LP portfolio (at actual price) 
          minus value of actual LP holdings (at actual price)
    """
    # Actual LP value after trade
    v_lp = usdc + (weth * actual_price)

    # Hypothetical rebalanced LP: 50/50 value split at baseline price
    total_value = usdc + (weth * baseline_price)
    rebalanced_usdc = total_value / 2
    rebalanced_weth = (total_value / 2) / baseline_price

    # Rebalanced portfolio valued at post-trade price
    v_rebalanced = rebalanced_usdc + (rebalanced_weth * actual_price)

    # Loss = what the LP would have had (rebalance) minus what they actually have
    return round(v_rebalanced - v_lp, 6)

# Print table
print("Label\t\t\tTrade Size\tSpot Price\tLVR")
print("-" * 60)
for row in data[1:]:  # skip "INITIAL_STATE"
    usdc = row["usdc_reserve"]
    weth = row["weth_reserve"]
    actual_price = row["spot_price"]
    trade_size = row["trade_size_usdc"]
    lvr = compute_lvr(usdc, weth, baseline_price, actual_price)

    label = row["label"]
    print(f"{label:<20}\t{trade_size:<10}\t{round(actual_price, 2):<10}\t{lvr}")

