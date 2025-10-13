#!/usr/bin/env node

const { PresetAccounts } = require('./wallet');
const GaiaTransfer = require('./transfer');
const GaiaQuery = require('./query');
const config = require('./config');

/**
 * 完整的 Gaia 交互演示
 */
async function main() {
  console.log('🚀 Gaia CosmJS SDK 演示开始');
  console.log('=' .repeat(50));

  let validatorWallet, userWallet, transfer, query;

  try {
    // 1. 创建钱包
    console.log('\n📝 步骤 1: 创建钱包');
    validatorWallet = await PresetAccounts.createValidator();
    userWallet = await PresetAccounts.createUser();

    validatorWallet.displayAccountInfo();
    userWallet.displayAccountInfo();

    // 2. 连接查询客户端
    console.log('\n🔍 步骤 2: 连接查询客户端');
    query = new GaiaQuery();
    await query.connect();

    // 3. 获取网络状态
    console.log('\n🌐 步骤 3: 获取网络状态');
    await query.getNetworkSummary();

    // 4. 连接转账客户端
    console.log('\n💸 步骤 4: 连接转账客户端');
    transfer = new GaiaTransfer();
    await transfer.connect(validatorWallet.getWallet());

    // 5. 查询初始余额
    console.log('\n💰 步骤 5: 查询初始余额');
    const validatorAddress = validatorWallet.getAddress();
    const userAddress = userWallet.getAddress();

    await transfer.getBalance(validatorAddress);
    await transfer.getBalance(userAddress);

    // 6. 执行转账
    console.log('\n💸 步骤 6: 执行转账');
    const transferAmount = '1000000'; // 1,000,000 stake
    const result = await transfer.send(
      validatorAddress,
      userAddress,
      transferAmount,
      'stake',
      '演示转账 - CosmJS SDK'
    );

    // 7. 查询转账后余额
    console.log('\n💰 步骤 7: 查询转账后余额');
    await transfer.getBalance(validatorAddress);
    await transfer.getBalance(userAddress);

    // 8. 查询交易详情
    console.log('\n📄 步骤 8: 查询交易详情');
    await transfer.getTransaction(result.transactionHash);

    // 9. 获取最新区块信息
    console.log('\n📦 步骤 9: 获取最新区块信息');
    await query.getLatestBlock();

    // 10. 搜索相关交易
    console.log('\n🔍 步骤 10: 搜索相关交易');
    await query.searchTx(`tx.hash='${result.transactionHash}'`);

    console.log('\n✅ 演示完成!');
    console.log('=' .repeat(50));

  } catch (error) {
    console.error('\n❌ 演示过程中发生错误:', error.message);
    console.error('请确保 Gaia 节点正在运行并且可以访问');
  } finally {
    // 清理连接
    if (transfer) {
      transfer.disconnect();
    }
    if (query) {
      query.disconnect();
    }
  }
}

/**
 * 简单转账演示
 */
async function simpleTransferDemo() {
  console.log('💸 简单转账演示');
  console.log('=' .repeat(30));

  try {
    // 创建钱包
    const validatorWallet = await PresetAccounts.createValidator();
    const userWallet = await PresetAccounts.createUser();

    // 连接转账客户端
    const transfer = new GaiaTransfer();
    await transfer.connect(validatorWallet.getWallet());

    // 查询余额
    const validatorAddress = validatorWallet.getAddress();
    const userAddress = userWallet.getAddress();

    console.log('\n转账前余额:');
    await transfer.getBalance(validatorAddress);
    await transfer.getBalance(userAddress);

    // 执行转账
    await transfer.send(
      validatorAddress,
      userAddress,
      '500000',
      'stake',
      '简单转账演示'
    );

    console.log('\n转账后余额:');
    await transfer.getBalance(validatorAddress);
    await transfer.getBalance(userAddress);

    transfer.disconnect();
    console.log('\n✅ 简单转账演示完成!');

  } catch (error) {
    console.error('❌ 转账演示失败:', error.message);
  }
}

/**
 * 查询演示
 */
async function queryDemo() {
  console.log('🔍 查询演示');
  console.log('=' .repeat(20));

  try {
    const query = new GaiaQuery();
    await query.connect();

    await query.getChainId();
    await query.getHeight();
    await query.getNodeStatus();
    await query.getValidators();

    query.disconnect();
    console.log('\n✅ 查询演示完成!');

  } catch (error) {
    console.error('❌ 查询演示失败:', error.message);
  }
}

/**
 * 批量转账演示
 */
async function batchTransferDemo() {
  console.log('📦 批量转账演示');
  console.log('=' .repeat(30));

  try {
    const validatorWallet = await PresetAccounts.createValidator();
    
    // 生成几个新账户作为接收方
    const { GaiaWallet } = require('./wallet');
    const recipients = [];
    
    for (let i = 0; i < 3; i++) {
      const wallet = new GaiaWallet();
      const { wallet: newWallet } = await wallet.generateNew();
      const accounts = await newWallet.getAccounts();
      recipients.push(accounts[0].address);
    }

    const transfer = new GaiaTransfer();
    await transfer.connect(validatorWallet.getWallet());

    const validatorAddress = validatorWallet.getAddress();

    // 准备批量转账
    const transfers = recipients.map((address, index) => ({
      to: address,
      amount: `${(index + 1) * 100000}`, // 100k, 200k, 300k
      denom: 'stake'
    }));

    console.log('\n批量转账前余额:');
    await transfer.getBalance(validatorAddress);

    // 执行批量转账
    await transfer.batchSend(validatorAddress, transfers, '批量转账演示');

    console.log('\n批量转账后余额:');
    await transfer.getBalance(validatorAddress);

    transfer.disconnect();
    console.log('\n✅ 批量转账演示完成!');

  } catch (error) {
    console.error('❌ 批量转账演示失败:', error.message);
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0] || 'main';

switch (command) {
  case 'main':
  case 'demo':
    main();
    break;
  case 'transfer':
    simpleTransferDemo();
    break;
  case 'query':
    queryDemo();
    break;
  case 'batch':
    batchTransferDemo();
    break;
  default:
    console.log('使用方法:');
    console.log('  node demo.js [command]');
    console.log('');
    console.log('可用命令:');
    console.log('  main/demo  - 完整演示 (默认)');
    console.log('  transfer   - 简单转账演示');
    console.log('  query      - 查询演示');
    console.log('  batch      - 批量转账演示');
    break;
}