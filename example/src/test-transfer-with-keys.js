const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
const { SigningStargateClient } = require('@cosmjs/stargate');
const { GasPrice } = require('@cosmjs/stargate');
const config = require('./config');
const GaiaTransfer = require('./transfer');
const { generateWallet } = require('./wallet');

async function testTransferWithKeys() {
  console.log('🧪 使用实际密钥测试转账');
  console.log('========================');
  
  try {
    // 从gaiad keyring导出的私钥（这里我们需要手动获取）
    // 现在我们先用一个简单的方法：创建新账户并给它转账
    
    // 创建一个新的测试账户
    const testWallet = await DirectSecp256k1HdWallet.generate(12);
    const [testAccount] = await testWallet.getAccounts();
    console.log(`🆕 创建测试账户: ${testAccount.address}`);
    
    // 连接到节点
    const client = await SigningStargateClient.connectWithSigner(
      config.network.rpcEndpoint,
      testWallet,
      {
        gasPrice: GasPrice.fromString("0.025stake")
      }
    );
    console.log('✅ 已连接到 Gaia 节点');
    
    // 现有账户地址（有余额的账户）
    const userAddress = 'cosmos1953q3mxjj2mjstxt7lnhyagrurld2ldxdzlunj';
    
    // 查询初始余额
    console.log('\n📊 转账前余额:');
    const userBalance = await client.getAllBalances(userAddress);
    console.log(`💰 用户账户 (${userAddress}):`);
    userBalance.forEach(coin => {
      console.log(`  ${coin.amount} ${coin.denom}`);
    });
    
    const testBalance = await client.getAllBalances(testAccount.address);
    console.log(`💰 测试账户 (${testAccount.address}):`);
    if (testBalance.length > 0) {
      testBalance.forEach(coin => {
        console.log(`  ${coin.amount} ${coin.denom}`);
      });
    } else {
      console.log('  无余额');
    }
    
    console.log('\n💡 提示: 由于我们没有用户账户的私钥，无法直接转账');
    console.log('💡 建议: 使用 gaiad tx bank send 命令进行转账测试');
    console.log('💡 或者: 导出账户私钥后再进行 JavaScript SDK 转账测试');
    
    // 显示转账命令示例
    console.log('\n📝 CLI 转账命令示例:');
    console.log(`gaiad tx bank send user ${testAccount.address} 1000000stake --keyring-backend=test --chain-id=test-gaia --yes`);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testTransferWithKeys();