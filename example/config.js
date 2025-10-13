require('dotenv').config();

const config = {
  // 网络配置
  network: {
    rpcEndpoint: process.env.RPC_ENDPOINT || 'http://localhost:26657',
    restEndpoint: process.env.REST_ENDPOINT || 'http://localhost:1317',
    chainId: process.env.CHAIN_ID || 'test-gaia',
  },

  // Gas 配置
  gas: {
    defaultLimit: parseInt(process.env.DEFAULT_GAS_LIMIT) || 200000,
    defaultPrice: parseFloat(process.env.DEFAULT_GAS_PRICE) || 0.025,
    feeDenom: process.env.DEFAULT_FEE_DENOM || 'stake',
  },

  // 密钥环配置
  keyring: {
    backend: process.env.KEYRING_BACKEND || 'test',
  },

  // 默认账户助记词
  accounts: {
    validator: process.env.VALIDATOR_MNEMONIC,
    user: process.env.USER_MNEMONIC,
  },

  // 常用地址前缀
  addressPrefix: 'cosmos',
};

module.exports = config;