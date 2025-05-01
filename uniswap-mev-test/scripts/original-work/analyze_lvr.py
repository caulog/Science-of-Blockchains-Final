import json

# Load synthetic trade data
with open("lvr-data-batch.json") as f:
    data = json.load(f)

baseline_price = data[0]["spot_price"]

def compute_lvr(usdc, weth, baseline_price, actual_price):
    v_lp = usdc + (weth * actual_price)
    total_value = usdc + (weth * baseline_price)
    rebalanced_usdc = total_value / 2
    rebalanced_weth = (total_value / 2) / baseline_price
    v_rebalanced = rebalanced_usdc + (rebalanced_weth * actual_price)
    return round(v_rebalanced - v_lp, 6)

# Store results
output = []

print("Label\t\t\tTrade Size\tSpot Price\tLVR")
print("-" * 60)

for row in data[1:]:  # skip "INITIAL_STATE"
    usdc = row["usdc_reserve"]
    weth = row["weth_reserve"]
    actual_price = row["spot_price"]
    trade_size = row["trade_size_usdc"]
    label = row["label"]
    lvr = compute_lvr(usdc, weth, baseline_price, actual_price)

    print(f"{label:<20}\t{trade_size:<10}\t{round(actual_price, 2):<10}\t{lvr}")

    output.append({
        "label": label,
        "trade_size_usdc": trade_size,
        "spot_price": round(actual_price, 6),
        "lvr": lvr
    })

# Write to JSON
with open("lvr-results.json", "w") as f:
    json.dump(output, f, indent=2)

print("\nResults saved to lvr-results.json")

