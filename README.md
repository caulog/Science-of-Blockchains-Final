# Science of Blockchains Final – Synthetic MEV Simulation (Step 2)

This repo simulates synthetic Uniswap v2 transactions on a forked Ethereum mainnet using Hardhat. It captures reserve data and spot prices before and after swaps to support Loss-Versus-Rebalancing (LVR) metric analysis as discussed in [Tim Roughgarden's paper](https://arxiv.org/pdf/2208.06046.pdf).

## Requirements

- Node.js v18 (recommended via [nvm](https://github.com/nvm-sh/nvm))
- Alchemy or Infura Mainnet API key
- Hardhat + Ethers v6

## Setup Instructions

```bash
git clone https://github.com/caulog/Science-of-Blockchains-Final.git
cd Science-of-Blockchains-Final/uniswap-mev-test
npm install
```

Create a `.env` file in the root of your project and include:

```
ALCHEMY_KEY=your-alchemy-api-key-here
```

## Hardhat Configuration

Update your `hardhat.config.js`:

```js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
        blockNumber: 18500000
      }
    }
  }
};
```

## Run the Batch Simulation

```bash
npx hardhat run scripts/simulate-lvr-multiple.js
```

This script will:

- Fork mainnet at a specific block
- Impersonate a real USDC whale
- Execute 10 swaps with increasing trade sizes (500–100,000 USDC)
- Record Uniswap v2 USDC/WETH pool reserves and spot price at each step
- Export a dataset for LVR metric analysis

## Output Example

The script saves results to:

```
scripts/lvr-data-batch.json
```

Sample format:

```json
[
  {
    "label": "AFTER_TRADE_1000",
    "trade_size_usdc": 1000,
    "usdc_reserve": 25851953.185562,
    "weth_reserve": 14089.547799646185,
    "spot_price": 1834.83,
    "timestamp": 1713210000000
  }
]
```

## Next Steps

You can now use this dataset to:

- Compute **Loss-Versus-Rebalancing (LVR)** as a measure of MEV loss
- Compare LP loss vs. arbitrage gain across trade sizes
- Visualize MEV trends across different synthetic workloads
- Support testing of **Uniswap v4 hooks** for MEV mitigation (Phase 2)

## References

- [Automated Market Making and Loss-Versus-Rebalancing (Tim Roughgarden)](https://arxiv.org/pdf/2208.06046.pdf)
- [Uniswap v2 Docs](https://docs.uniswap.org/protocol/V2)
- [Hardhat Docs](https://hardhat.org)
