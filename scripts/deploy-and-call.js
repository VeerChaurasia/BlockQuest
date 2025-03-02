const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  try {
    // Try to manually load the private key
    let privateKey = "";
    try {
      if (fs.existsSync('./secret.json')) {
        const secretData = fs.readFileSync('./secret.json', 'utf8');
        const secretJson = JSON.parse(secretData);
        
        // Check for different possible key names
        privateKey = secretJson.PRIVATE_KEY || secretJson.PrivateKey || secretJson.privateKey;
        
        if (!privateKey) {
          console.error("Private key not found in secret.json. Available keys:", Object.keys(secretJson).join(", "));
          return;
        }
        
        // Ensure the key has the correct format
        if (privateKey.startsWith("0x")) {
          console.log("Private key has 0x prefix");
        } else {
          privateKey = "0x" + privateKey;
          console.log("Added 0x prefix to private key");
        }
        
        console.log("Private key loaded manually");
      } else {
        console.error("secret.json file not found");
        return;
      }
    } catch (error) {
      console.error("Failed to load private key:", error);
      return;
    }

    // Manually create a wallet/signer from the private key
    const provider = new ethers.JsonRpcProvider('https://rpc.test.btcs.network');
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("Deploying contracts with the account:", wallet.address);
    
    // Deploy Game contract
    const Game = await ethers.getContractFactory("Game", wallet);
    const game = await Game.deploy();
    await game.waitForDeployment();
    const gameAddress = await game.getAddress();
    console.log("Game contract deployed at:", gameAddress);
    
    // Deploy GameGateway contract
    const GameGateway = await ethers.getContractFactory("GameGateway", wallet);
    const gameGateway = await GameGateway.deploy();
    await gameGateway.waitForDeployment();
    const gatewayAddress = await gameGateway.getAddress();
    console.log("GameGateway contract deployed at:", gatewayAddress);
    
    console.log("Deployment completed successfully!");
    
  } catch (error) {
    console.error("Deployment failed:", error);
    console.error(error.stack);
  }
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});