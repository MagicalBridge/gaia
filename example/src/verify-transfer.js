const GaiaQuery = require('../query');
const GaiaTransfer = require('../transfer');

async function verifyTransfer() {
  console.log('🔍 验证转账结果');
  console.log('================');
  
  try {
    // 连接查询客户端
    const query = new GaiaQuery();
    await query.connect();
    console.log('✅ 已连接到查询节点');
    
    // 连接转账客户端（用于查询余额）
    const transfer = new GaiaTransfer();
    await transfer.connect();
    console.log('✅ 已连接到转账节点');
    
    // 账户地址
    const userAddress = 'cosmos1953q3mxjj2mjstxt7lnhyagrurld2ldxdzlunj';
    const testAddress = 'cosmos1caus3tac7l4ry4wad8ytc628uhljtqecvtydka';
    
    console.log('\n📊 转账后余额:');
    
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
    
    // 查询测试账户余额
    const testBalance = await transfer.getBalance(testAddress);
    console.log(`💰 测试账户 (${testAddress}):`);
    if (testBalance.length > 0) {
      testBalance.forEach(coin => {
        console.log(`  ${coin.amount} ${coin.denom}`);
      });
    } else {
      console.log('  无余额');
    }
    
    // 查询交易详情
    console.log('\n🔍 查询最近的交易:');
    const txHash = '7BB4D4CF96654FB5A89CA9DC63910D04E36E7B237A91F43CD21FD676D3BCAA99';
    try {
      const txDetails = await transfer.getTransaction(txHash);
      console.log(`📄 交易详情 (${txHash}):`);
      console.log(`  高度: ${txDetails.height}`);
      console.log(`  Gas 使用: ${txDetails.gasUsed}`);
      console.log(`  Gas 需要: ${txDetails.gasWanted}`);
      console.log(`  结果: ${txDetails.code === 0 ? '成功' : '失败'}`);
      if (txDetails.events && txDetails.events.length > 0) {
        console.log(`  事件数量: ${txDetails.events.length}`);
      }
    } catch (error) {
      console.log(`❌ 查询交易失败: ${error.message}`);
    }
    
    // 获取网络状态
    console.log('\n🌐 当前网络状态:');
    const status = await query.getNodeStatus();
    console.log(`📏 当前区块高度: ${status.syncInfo.latestBlockHeight}`);
    console.log(`⏰ 最新区块时间: ${new Date(status.syncInfo.latestBlockTime)}`);
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  }
}

// 运行验证
verifyTransfer();