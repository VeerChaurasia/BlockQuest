require('@nomicfoundation/hardhat-toolbox');

const fs = require('fs');

let privateKey = "";
try {
  privateKey = JSON.parse(fs.readFileSync('./secret.json', 'utf8')).PrivateKey;
} catch (error) {
  console.error("Error loading secret.json:", error);
}

module.exports = {
  defaultNetwork: 'testnet',

  networks: {
    hardhat: {},
    testnet: {
      url: 'https://rpc.test.btcs.network',
      accounts: privateKey ? [privateKey] : [],
      chainId: 1115,
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.8.19',
        settings: {
          evmVersion: 'paris',
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  paths: {
    sources: './contracts',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    timeout: 20000,
  },
};
