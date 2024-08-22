const { ethers } = require('ethers');

// ABI encoding
const iface = new ethers.Interface([
    'function createUserAccount(string _userName, uint256 gender)'
]);

// Function parameters
const username = "moh";
const gender = 1;  // Assuming "male" is represented by 1

// Encode the function call
const data = iface.encodeFunctionData('createUserAccount', [username, gender]);

console.log(data);