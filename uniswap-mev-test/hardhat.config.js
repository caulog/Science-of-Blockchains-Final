require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.g.alchemy.com/v2/FfENQHCqqXpfkE3X50h6XIwXeUdHFFwp",
        blockNumber: 18500000, // or any block with Uniswap txs
      },
    },
  },
};
