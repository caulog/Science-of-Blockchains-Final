// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleAMM {
    uint256 public reserve0;
    uint256 public reserve1;

    function addLiquidity(uint256 amount0, uint256 amount1) external {
        reserve0 += amount0;
        reserve1 += amount1;
    }

    function swap(uint256 amountIn) external {
        // Swap token0 → token1
        reserve0 += amountIn;
        reserve1 = reserve1 * reserve0 / (reserve0 - amountIn);
    }

    function swapReverse(uint256 amountIn) external {
        // Swap token1 → token0
        reserve1 += amountIn;
        reserve0 = reserve0 * reserve1 / (reserve1 - amountIn);
    }

    function getReserves() external view returns (uint256, uint256) {
        return (reserve0, reserve1);
    }
}

