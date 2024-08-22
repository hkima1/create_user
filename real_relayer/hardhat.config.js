require("@nomicfoundation/hardhat-toolbox");

require("dotenv").config();
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.21",
  settings: {
    viaIR: true,
  },
  defender: {
    apiKey: process.env.DEFENDER_API_KEY ,
    apiSecret: process.env.DEFENDER_API_SECRET,
  },
  networks: {
    holesky: {
      url: 'https://ethereum-holesky.publicnode.com/',
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  
};
