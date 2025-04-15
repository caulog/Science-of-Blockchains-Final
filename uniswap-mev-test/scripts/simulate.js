const hre = require("hardhat");

const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const UNISWAP_V2_ROUTER = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d";
const USDC_WHALE = "0x55fe002aeff02f77364de339a1292923a15844b8";

async function main() {
  const [funder] = await hre.ethers.getSigners();

  // Impersonate whale
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [USDC_WHALE],
  });
  const whale = await hre.ethers.getSigner(USDC_WHALE);

  // Fund whale with ETH for gas
  await funder.sendTransaction({
    to: USDC_WHALE,
    value: hre.ethers.parseEther("1.0"),
  });

  // Load contracts
  const usdc = await hre.ethers.getContractAt("IERC20", USDC, whale);
  const router = await hre.ethers.getContractAt("IUniswapV2Router02", UNISWAP_V2_ROUTER, whale);

  // Approve router
  const amountIn = hre.ethers.parseUnits("1000", 6); // 1000 USDC
  await usdc.approve(router.target, amountIn);
  console.log("✅ Approved Uniswap V2 Router");

  // Swap USDC for ETH
  const tx = await router.swapExactTokensForETH(
    amountIn,
    0, // accept any amount of ETH
    [USDC, WETH],
    USDC_WHALE,
    Math.floor(Date.now() / 1000) + 60 * 10
  );
  await tx.wait();

  console.log("✅ Swap complete");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});

