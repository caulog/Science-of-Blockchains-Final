const { ethers } = require("hardhat");
const fs = require("fs");

// Simulate external CEX price with small random shocks
function evolveExternalPrice(currentPrice) {
    const volatility = 0.0015; // Smaller realistic volatility (~0.15% per trade)
    const randomShock = (Math.random() - 0.5) * 2 * volatility;
    return currentPrice * (1 + randomShock);
}

// Calculate AMM price (reserve1 / reserve0) normalized for decimals
function getAMMPrice(reserve0, reserve1) {
    return (reserve1 / reserve0) * 1e6;
}


// Calculate arbitrage opportunity
function computeArbitrageSwap(reserve0, reserve1, externalPrice) {
    const ammPrice = (reserve1 / 1e18) / (reserve0 / 1e6);
    const k = reserve0 * reserve1;
    if (ammPrice > externalPrice) {
        const targetReserve0 = Math.sqrt(k / (externalPrice * 1e6 / 1e18));
        const delta = targetReserve0 - reserve0;
        return { direction: "buyToken0", amount: delta };
    } else if (ammPrice < externalPrice) {
        const targetReserve1 = Math.sqrt(k * (externalPrice * 1e6 / 1e18));
        const delta = targetReserve1 - reserve1;
        return { direction: "buyToken1", amount: delta };
    } else {
        return { direction: "none", amount: 0 };
    }
}

async function main() {
    const [deployer] = await ethers.getSigners();
    const AMM = await ethers.getContractFactory("SimpleAMM");
    const amm = await AMM.deploy();
    await amm.waitForDeployment();
    console.log(`✅ AMM deployed at: ${amm.target}`);

    // Add big initial liquidity
    const initialUSDC = ethers.parseUnits("1000000", 6); // 1 million USDC
    const initialWETH = ethers.parseUnits("500", 18);    // 500 WETH
    await amm.addLiquidity(initialUSDC, initialWETH);
    console.log("✅ Initial liquidity added: 1,000,000 USDC / 500 WETH");

    const data = [];
    let externalPrice = 2000.0; // Start ETH price at $2000

    for (let i = 1; i <= 500; i++) {  // Simulate 500 trades
        // 1. Evolve external price
        externalPrice = evolveExternalPrice(externalPrice);

        // 2. Simulate noise trader swap (between 1000–5000 USDC)
        const noiseTradeAmount = Math.floor(Math.random() * 4000) + 1000;
        const noiseTradeAmountParsed = ethers.parseUnits(noiseTradeAmount.toString(), 6);
        await amm.swap(noiseTradeAmountParsed);

        // 3. Read updated reserves
        let [reserve0, reserve1] = await amm.getReserves();
        reserve0 = Number(ethers.formatUnits(reserve0, 6));  // USDC (6 decimals)
        reserve1 = Number(ethers.formatUnits(reserve1, 18)); // WETH (18 decimals)
        // Don't scale down — use raw BigInt values directly
        let ammPriceFinal = Number(reserve1) / Number(reserve0) * 1e6; // Normalize USDC:ETH price

        // 4. Compute arbitrage opportunity
        const { direction, amount } = computeArbitrageSwap(reserve0 * 1e6, reserve1 * 1e18, externalPrice);

        // 5. Execute arbitrage if amount big enough
        if (direction === "buyToken0" && amount > 1e6) { // > 1 USDC
            await amm.swap(BigInt(Math.floor(amount)));
        } else if (direction === "buyToken1" && amount > 1e12) { // > 0.000001 ETH
            await amm.swapReverse(BigInt(Math.floor(amount)));
        } else if (amount <= 1e6) {
            console.log(`Skipping tiny arbitrage: delta=${amount}`);
        }

        // 6. Read reserves again
        [reserve0, reserve1] = await amm.getReserves();
        reserve0 = Number(ethers.formatUnits(reserve0, 6));
        reserve1 = Number(ethers.formatUnits(reserve1, 18));
        ammPriceFinal = Number(reserve1) / Number(reserve0) * 1e6; // Normalize USDC:ETH price

        const block = await ethers.provider.getBlock("latest");

        data.push({
            tradeNumber: i,
            timestamp: block.timestamp,
            amm_price: ammPriceFinal,
            external_price: externalPrice,
            trade_size: noiseTradeAmount,
        });

        console.log(`Trade ${i}: noise=${noiseTradeAmount}, amm=${ammPriceFinal.toFixed(6)}, external=${externalPrice.toFixed(2)}`);
    }

    fs.writeFileSync("trade_data_fixed.json", JSON.stringify(data, null, 2));
    console.log("✅ trade_data_fixed.json saved with realistic AMM + external price drift");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

