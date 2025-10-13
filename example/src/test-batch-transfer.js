const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
const GaiaTransfer = require('./transfer');

async function testBatchTransfer() {
  console.log('🧪 批量转账测试');
  console.log('================');
  
  try {
    // 创建多个测试账户
    const testWallet1 = await DirectSecp256k1HdWallet.generate(12);
    const [testAccount1] = await testWallet1.getAccounts();
    
    const testWallet2 = await DirectSecp256k1HdWallet.generate(12);
    const [testAccount2] = await testWallet2.getAccounts();
    
    const testWallet3 = await DirectSecp256k1HdWallet.generate(12);
    const [testAccount3] = await testWallet3.getAccounts();
    
    console.log(`🆕 创建测试账户1: ${testAccount1.address}`);
    console.log(`🆕 创建测试账户2: ${testAccount2.address}`);
    console.log(`🆕 创建测试账户3: ${testAccount3.address}`);
    
    // 连接转账客户端
    const transfer = new GaiaTransfer();
    await transfer.connect();
    console.log('✅ 已连接到转账节点');
    
    // 现有账户地址（有余额的账户）
    const userAddress = 'cosmos1953q3mxjj2mjstxt7lnhyagrurld2ldxdzlunj';
    
    // 查询初始余额
    console.log('\n📊 批量转账前余额:');
    const userBalance = await transfer.getBalance(userAddress);
    console.log(`💰 用户账户 (${userAddress}):`);
    userBalance.forEach(coin => {
      console.log(`  ${coin.amount} ${coin.denom}`);
    });
    
    // 准备批量转账数据
    const batchTransfers = [
      {
        toAddress: testAccount1.address,
        amount: '500000',
        denom: 'stake'
      },
      {
        toAddress: testAccount2.address,
        amount: '750000',
        denom: 'stake'
      },
      {
        toAddress: testAccount3.address,
        amount: '1000000',
        denom: 'stake'
      }
    ];
    
    console.log('\n💸 准备批量转账:');
    batchTransfers.forEach((transfer, index) => {
      console.log(`  ${index + 1}. 到 ${transfer.toAddress}: ${transfer.amount} ${transfer.denom}`);
    });
    
    console.log('\n💡 提示: 由于我们没有用户账户的私钥，无法直接进行批量转账');
    console.log('💡 建议: 使用多个 gaiad tx bank send 命令进行批量转账测试');
    
    // 显示批量转账命令示例
    console.log('\n📝 CLI 批量转账命令示例:');
    batchTransfers.forEach((transfer, index) => {
      console.log(`# 转账 ${index + 1}`);
      console.log(`gaiad tx bank send user ${transfer.toAddress} ${transfer.amount}${transfer.denom} --keyring-backend=test --chain-id=test-gaia --fees=200000stake --yes`);
    });
    
    console.log('\n🔍 执行后可以使用以下命令验证结果:');
    batchTransfers.forEach((transfer, index) => {
      console.log(`gaiad query bank balances ${transfer.toAddress}`);
    });
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testBatchTransfer();