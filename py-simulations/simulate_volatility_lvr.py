import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Parameters
num_steps = 1000   # Number of "blocks" or time steps
initial_price = 1800  # Start ETH price in USD
mu = 0.0002        # Drift
sigma = 0.01       # Volatility (standard deviation of returns)
dt = 1             # 1 block per step
np.random.seed(42) # For reproducibility

# Simulate price path using geometric Brownian motion
log_returns = np.random.normal(loc=mu*dt, scale=sigma*np.sqrt(dt), size=num_steps)
prices = initial_price * np.exp(np.cumsum(log_returns))

# Compute rolling volatility (standard deviation of log returns)
rolling_window = 50  # blocks
rolling_vol = pd.Series(log_returns).rolling(window=rolling_window).std() * np.sqrt(rolling_window)

# Simulate marginal liquidity (example: proportional to price^1.5)
marginal_liquidity = 2 * (prices ** 1.5)

# Compute LVR at each step
# Basic LVR = Value difference between current reserves and ideal rebalance (assuming Uniswap x*y=k invariant)
lvr = []
for i in range(num_steps):
    if i == 0:
        lvr.append(0)
        continue
    external_price_now = prices[i]
    baseline_price = prices[i-1]
    
    # Imagine the AMM was lagging behind the external price movement
    # LP actual = stayed at baseline price
    # LP rebalanced = adapted to external price
    
    lp_value = 1 + (1 * baseline_price / baseline_price)  # normalized to 2 units
    rebalance_value = 1 + (1 * baseline_price / external_price_now)
    lvr.append(rebalance_value - lp_value)

# Save results
df = pd.DataFrame({
    "step": np.arange(num_steps),
    "price": prices,
    "log_return": log_returns,
    "rolling_volatility": rolling_vol,
    "marginal_liquidity": marginal_liquidity,
    "lvr": lvr
})

output_path = "../py-simulations/lvr-rolling-output.csv"
df.to_csv(output_path, index=False)

print(f"Rolling simulation saved to {output_path}")

