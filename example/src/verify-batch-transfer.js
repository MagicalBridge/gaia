const GaiaTransfer = require('../transfer');

async function verifyBatchTransfer() {
  console.log('🔍 验证批量转账结果');
  console.log('====================');
  
  try {
    // 连接转账客户端
    const transfer = new GaiaTransfer();
    await transfer.connect();
    console.log('✅ 已连接到转账节点');
    
    // 账户地址
    const userAddress = 'cosmos1953q3mxjj2mjstxt7lnhyagrurld2ldxdzlunj';
    const testAddresses = [
      'cosmos13qlag7gj4y220d2zd2gc5nu9wf46q7drvdpyuw',
      'cosmos17hqymf0nfjs3qq9uyxfummpyzrr7xz5s0v25e2',
      'cosmos1dsvhmt0gfhae3qdznd5kjdljj0xzz4ssng5mmf'
    ];
    
    const expectedAmounts = ['500000', '750000', '1000000'];
    
    console.log('\n📊 批量转账后余额:');
    
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
    
    // 查询所有测试账户余额
    for (let i = 0; i < testAddresses.length; i++) {
      const address = testAddresses[i];
      const expectedAmount = expectedAmounts[i];
      
      console.log(`\n💰 测试账户 ${i + 1} (${address}):`);
      const balance = await transfer.getBalance(address);
      if (balance.length > 0) {
        balance.forEach(coin => {
          console.log(`  ${coin.amount} ${coin.denom}`);
          if (coin.denom === 'stake') {
            if (coin.amount === expectedAmount) {
              console.log(`  ✅ 余额正确 (期望: ${expectedAmount})`);
            } else {
              console.log(`  ❌ 余额不匹配 (期望: ${expectedAmount}, 实际: ${coin.amount})`);
            }
          }
        });
      } else {
        console.log('  无余额');
        if (i < 2) { // 前两个应该有余额
          console.log(`  ❌ 应该有 ${expectedAmount} stake`);
        }
      }
    }
    
    // 计算总转账金额和手续费
    const totalTransferred = expectedAmounts.slice(0, 2).reduce((sum, amount) => sum + parseInt(amount), 0);
    const totalFees = 2 * 200000; // 2笔转账，每笔200000手续费
    const totalDeducted = totalTransferred + totalFees;
    
    console.log('\n📈 转账统计:');
    console.log(`  总转账金额: ${totalTransferred} stake`);
    console.log(`  总手续费: ${totalFees} stake`);
    console.log(`  总扣除金额: ${totalDeducted} stake`);
    console.log(`  成功转账数量: 2/3`);
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  }
}

// 运行验证
verifyBatchTransfer();