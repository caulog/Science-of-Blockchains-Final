const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const ROUTER = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d";
const USDC_WHALE = "0x55fe002aeff02f77364de339a1292923a15844b8";
const PAIR = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc";

const results = [];

function formatEther(val) {
  return parseFloat(hre.ethers.formatUnits(val.toString(), 18));
}
function formatUSDC(val) {
  return parseFloat(hre.ethers.formatUnits(val.toString(), 6));
}

async function logReserves(pair, label, tradeSize) {
  const [reserve0, reserve1] = await pair.getReserves();
  const usdc = formatUSDC(reserve0);
  const weth = formatEther(reserve1);
  const spotPrice = usdc / weth;

  results.push({
    label,
    trade_size_usdc: tradeSize,
    usdc_reserve: usdc,
    weth_reserve: weth,
    spot_price: spotPrice,
    timestamp: Date.now(),
  });

  console.log(`${label}`);
  console.log(`USDC Reserve: ${usdc}`);
  console.log(`WETH Reserve: ${weth}`);
  console.log(`Spot Price: ${spotPrice.toFixed(2)}\n`);
}

async function main() {
  const [funder] = await hre.ethers.getSigners();
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [USDC_WHALE],
  });
  const whale = await hre.ethers.getSigner(USDC_WHALE);

  await funder.sendTransaction({
    to: USDC_WHALE,
    value: hre.ethers.parseEther("1.0"),
  });

  const usdc = await hre.ethers.getContractAt("IERC20", USDC, whale);
  const router = await hre.ethers.getContractAt("IUniswapV2Router02", ROUTER, whale);
  const pair = await hre.ethers.getContractAt("IUniswapV2Pair", PAIR);

  await logReserves(pair, "INITIAL_STATE", 0);

  const tradeSizes = [500, 1000, 2000, 4000, 8000, 16000, 32000, 50000, 75000, 100000]; // in USDC

  for (const size of tradeSizes) {
    const amount = hre.ethers.parseUnits(size.toString(), 6);
    await usdc.approve(router.target, amount);
    await router.swapExactTokensForETH(
      amount,
      0,
      [USDC, WETH],
      USDC_WHALE,
      Math.floor(Date.now() / 1000) + 60
    );
    await logReserves(pair, `AFTER_TRADE_${size}`, size);
  }

  const outPath = path.join(__dirname, "lvr-data-batch.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`Batch LVR data saved to ${outPath}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

