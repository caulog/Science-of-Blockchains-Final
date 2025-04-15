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

async function logAndSave(pair, label) {
  const [reserve0, reserve1] = await pair.getReserves();
  const usdc = formatUSDC(reserve0);
  const weth = formatEther(reserve1);
  const spotPrice = usdc / weth;

  console.log(`📊 ${label}`);
  console.log(`Reserve0 (USDC): ${usdc}`);
  console.log(`Reserve1 (WETH): ${weth}`);
  console.log(`Spot Price (USDC per ETH): ${spotPrice.toFixed(2)}\n`);

  results.push({
    label,
    usdc_reserve: usdc,
    weth_reserve: weth,
    spot_price: spotPrice,
    timestamp: Date.now(),
  });
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

  await logAndSave(pair, "BEFORE ANY TRADES");

  // First swap
  const amount1 = hre.ethers.parseUnits("1000", 6);
  await usdc.approve(router.target, amount1);
  await router.swapExactTokensForETH(
    amount1,
    0,
    [USDC, WETH],
    USDC_WHALE,
    Math.floor(Date.now() / 1000) + 60
  );
  await logAndSave(pair, "AFTER FIRST TRADE");

  // Second (arb) swap
  const amount2 = hre.ethers.parseUnits("2000", 6);
  await usdc.approve(router.target, amount2);
  await router.swapExactTokensForETH(
    amount2,
    0,
    [USDC, WETH],
    USDC_WHALE,
    Math.floor(Date.now() / 1000) + 60
  );
  await logAndSave(pair, "AFTER ARB TRADE");

  // Save to JSON
  const outPath = path.join(__dirname, "lvr-data.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`✅ Logged LVR data to ${outPath}`);

  // Optional: save CSV instead
  /*
  const csv = results.map(row =>
    `${row.label},${row.usdc_reserve},${row.weth_reserve},${row.spot_price},${row.timestamp}`
  );
  const csvOutput = ["label,usdc_reserve,weth_reserve,spot_price,timestamp", ...csv].join("\n");
  fs.writeFileSync(path.join(__dirname, "lvr-data.csv"), csvOutput);
  console.log("✅ CSV saved to lvr-data.csv");
  */
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});

