require('dotenv').config();
const { defender } = require('hardhat');
//const { DefenderRelayProvider, DefenderRelaySigner } = require('defender-relay-client/lib/ethers');
const { ethers, upgrades } = require('hardhat');
//const { Defender } = require('@openzeppelin/defender-sdk');


async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Address of the ERC2771Forwarder contract (replace with actual address)

  // Deploy the MyToken contract
  const ERC2771Forwarder = await ethers.getContractFactory("ERC2771Forwarder");
  const ERCForwarder = await ERC2771Forwarder.deploy();
  await ERCForwarder.waitForDeployment()

  console.log("Waiting for deployment to complete...");
 // await minimalUserCreator.deployed()
  console.log("ERC2771Forwarder deployed to:", ERCForwarder.target);

  const CreateUser= await ethers.getContractFactory("MinimalUserCreator");
  const CreateUsers= await CreateUser.deploy(ERCForwarder.target);
  await CreateUsers.waitForDeployment(); // Ensure the contract is fully deployed
  console.log("MinimalUserCreator deployed at:", CreateUsers.target);
  console.log(deployer.address)
  const tx = await CreateUsers.createUserAccount("username", 1);
  console.log(tx)
 /*const add=0x;
  const tx1 = await CreateUsers.getUser(add);
  console.log(tx1)*/
  }

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });