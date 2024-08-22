const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat")
const {signTypedData} = require('eth-sig-util');
const { signTypedMessage, TypedMessage } = require("eth-sig-util");
const keccak256 = require('keccak256')
// const Tx = require("ethereumjs-tx");
describe("Relay", function () {
  beforeEach(async function () {
    const [owner, otherAccount] = await ethers.getSigners();
    console.log("balance", owner.getBalance)
    this.owner = owner;
    this.otherAccount = otherAccount;

    // Deploy the Forwarder contract
    this.MinimalForwarder = await ethers.getContractFactory("ERC2771Forwarder");
    this.TF = await this.MinimalForwarder.deploy();
    await this.TF.waitForDeployment();
    console.log("Forwarder deployed at:", this.TF.target);

    // Deploy the Recipient contract that uses the forwarder
    this.Recipient = await ethers.getContractFactory("MinimalUserCreator");
    this.R = await this.Recipient.deploy(this.TF.target);
    await this.R.waitForDeployment();
    console.log("MinimalUserCreator deployed at:", this.R.target);
    expect(await this.R.isTrustedForwarder(this.TF.target)).to.equal(true);
    // Send ETH to the forwarder for testing
    const tx = await this.owner.sendTransaction({
      to: this.TF.target,
      value: ethers.parseEther("1.0"),
    });
    await tx.wait(); // Make sure the transaction is confirmed
  });

  describe("Deployment", function () {
    it("Recipient deploys with correct trusted forwarder", async function () {
      const add=await this.R.isTrustedForwarder(this.TF.target);
      console.log(add)
      expect(await this.R.isTrustedForwarder(this.TF.target)).to.equal(true);
    });
  });

  describe("Relay", function () {
    it("Relays", async function () {


      // Encode the called Function and it's parameters 
      let ABI = [
        "function createUserAccount( string memory _userName, uint256 gender)"
      ];
      let iface = new ethers.Interface(ABI);
      iface.encodeFunctionData("createUserAccount", [ "Mohamed", 1 ]);
      const encoded_callData=iface.encodeFunctionData("createUserAccount", [ "Mohamed", 1 ]) ;

      // Construct the Sended Request
      const Req = {
        from: this.otherAccount.address,
        to: this.R.target,
        value: ethers.parseEther("0").toString(),
        gas: 99999999999999,
        nonce: await this.TF.nonces(this.otherAccount.address),
        deadline: Math.floor(Date.now() / 1000) + 3600,
        data: encoded_callData,
      };
      const domain = {
        name: "Forwarder",
        version: "1",
        chainId: 31337,
        verifyingContract: this.TF.target,
      };

      const types = {
        ForwardRequest: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "gas", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      };
      

      // Sign the typed data (EIP712)
      const signature = await this.otherAccount.signTypedData(domain, types, Req);
      console.log("Generated Signature:", signature);
      console.log("Expected Signer Address:", Req.from);
      console.log("Expected target Address:", Req.to);

      // verify the forward request
      const resp = await this.TF.connect(this.otherAccount).verify( {...Req, signature });

      console.log("verifying user signature : "+resp);
      // Execute the forward request (Will be verified first and forwarded)
      const res = await this.TF.connect(this.otherAccount).execute( {...Req, signature });
      console.log("Exexuted Transaction"+ res)
      
    });
  });
});