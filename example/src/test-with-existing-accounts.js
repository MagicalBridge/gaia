const GaiaQuery = require('./query');
const GaiaTransfer = require('./transfer');

async function testWithExistingAccounts() {
  console.log('🧪 使用现有账户测试');
  console.log('====================');
  
  try {
    // 连接查询客户端
    const query = new GaiaQuery();
    await query.connect();
    console.log('✅ 已连接到查询节点');
    
    // 连接转账客户端（用于查询余额）
    const transfer = new GaiaTransfer();
    await transfer.connect();
    console.log('✅ 已连接到转账节点');
    
    // 现有账户地址
    const validatorAddress = 'cosmos1n6sznew9qcjdxp6f25h6tjj2szw3dwtu8w0mgq';
    const userAddress = 'cosmos1953q3mxjj2mjstxt7lnhyagrurld2ldxdzlunj';
    
    console.log('\n📊 查询现有账户余额:');
    
    // 查询验证者余额
    const validatorBalance = await transfer.getBalance(validatorAddress);
    console.log(`💰 验证者账户 (${validatorAddress}):`);
    if (validatorBalance.length > 0) {
      validatorBalance.forEach(coin => {
        console.log(`  ${coin.amount} ${coin.denom}`);
      });
    } else {
      console.log('  无余额');
    }
    
    // 查询用户余额
    const userBalance = await transfer.getBalance(userAddress);
    console.log(`💰 用户账户 (${userAddress}):`);
    if (userBalance.length > 0) {
      userBalance.forEach(coin => {
        console.log(`  ${coin.amount} ${coin.denom}`);
      });
    } else {
      console.log('  无余额');
    }
    
    // 获取账户信息
    console.log('\n📋 账户详细信息:');
    try {
      const validatorAccount = await query.getAccount(validatorAddress);
      console.log(`🔍 验证者账户信息:`);
      console.log(`  地址: ${validatorAccount.address}`);
      console.log(`  账户号: ${validatorAccount.accountNumber}`);
      console.log(`  序列号: ${validatorAccount.sequence}`);
    } catch (error) {
      console.log(`❌ 获取验证者账户信息失败: ${error.message}`);
    }
    
    try {
      const userAccount = await query.getAccount(userAddress);
      console.log(`🔍 用户账户信息:`);
      console.log(`  地址: ${userAccount.address}`);
      console.log(`  账户号: ${userAccount.accountNumber}`);
      console.log(`  序列号: ${userAccount.sequence}`);
    } catch (error) {
      console.log(`❌ 获取用户账户信息失败: ${error.message}`);
    }
    
    // 获取网络状态
    console.log('\n🌐 网络状态:');
    const status = await query.getNodeStatus();
    console.log(`🔗 链 ID: ${status.nodeInfo.network}`);
    console.log(`📏 当前区块高度: ${status.syncInfo.latestBlockHeight}`);
    console.log(`⏰ 最新区块时间: ${new Date(status.syncInfo.latestBlockTime)}`);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testWithExistingAccounts();