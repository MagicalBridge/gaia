const { SigningStargateClient, GasPrice } = require('@cosmjs/stargate');
const { coins } = require('@cosmjs/amino');
const config = require('./config');

class GaiaTransfer {
  constructor() {
    this.client = null;
    this.gasPrice = GasPrice.fromString(`${config.gas.defaultPrice}${config.gas.feeDenom}`);
  }

  /**
   * 连接到 Gaia 节点
   * @param {DirectSecp256k1HdWallet} wallet - 钱包实例
   * @returns {Promise<void>}
   */
  async connect(wallet) {
    try {
      this.client = await SigningStargateClient.connectWithSigner(
        config.network.rpcEndpoint,
        wallet,
        {
          gasPrice: this.gasPrice,
        }
      );
      console.log(`✅ 已连接到 Gaia 节点: ${config.network.rpcEndpoint}`);
      console.log(`🔗 链 ID: ${config.network.chainId}`);
    } catch (error) {
      console.error('❌ 连接节点失败:', error.message);
      throw error;
    }
  }

  /**
   * 执行转账
   * @param {string} fromAddress - 发送方地址
   * @param {string} toAddress - 接收方地址
   * @param {string} amount - 转账金额
   * @param {string} denom - 代币单位，默认为 'stake'
   * @param {string} memo - 备注信息
   * @returns {Promise<Object>} 交易结果
   */
  async send(fromAddress, toAddress, amount, denom = config.gas.feeDenom, memo = '') {
    if (!this.client) {
      throw new Error('请先连接到节点');
    }

    try {
      console.log(`\n💸 准备转账:`);
      console.log(`  从: ${fromAddress}`);
      console.log(`  到: ${toAddress}`);
      console.log(`  金额: ${amount} ${denom}`);
      console.log(`  备注: ${memo || '无'}`);

      const sendAmount = coins(amount, denom);
      
      const result = await this.client.sendTokens(
        fromAddress,
        toAddress,
        sendAmount,
        'auto',
        memo
      );

      console.log(`✅ 转账成功!`);
      console.log(`  交易哈希: ${result.transactionHash}`);
      console.log(`  区块高度: ${result.height}`);
      console.log(`  Gas 使用: ${result.gasUsed}/${result.gasWanted}`);

      return result;
    } catch (error) {
      console.error('❌ 转账失败:', error.message);
      throw error;
    }
  }

  /**
   * 批量转账
   * @param {string} fromAddress - 发送方地址
   * @param {Array} transfers - 转账列表 [{to, amount, denom}]
   * @param {string} memo - 备注信息
   * @returns {Promise<Array>} 交易结果列表
   */
  async batchSend(fromAddress, transfers, memo = '') {
    if (!this.client) {
      throw new Error('请先连接到节点');
    }

    console.log(`\n📦 准备批量转账 (${transfers.length} 笔):`);
    const results = [];

    for (let i = 0; i < transfers.length; i++) {
      const transfer = transfers[i];
      console.log(`\n  ${i + 1}/${transfers.length}:`);
      
      try {
        const result = await this.send(
          fromAddress,
          transfer.to,
          transfer.amount,
          transfer.denom || config.gas.feeDenom,
          memo
        );
        results.push({ success: true, result });
      } catch (error) {
        console.error(`    ❌ 第 ${i + 1} 笔转账失败:`, error.message);
        results.push({ success: false, error: error.message });
      }

      // 添加延迟避免过快发送
      if (i < transfers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n📊 批量转账完成: ${successCount}/${transfers.length} 成功`);

    return results;
  }

  /**
   * 查询账户余额
   * @param {string} address - 账户地址
   * @returns {Promise<Array>} 余额列表
   */
  async getBalance(address) {
    if (!this.client) {
      throw new Error('请先连接到节点');
    }

    try {
      const balance = await this.client.getAllBalances(address);
      console.log(`\n💰 账户余额 (${address}):`);
      
      if (balance.length === 0) {
        console.log('  无余额');
      } else {
        balance.forEach(coin => {
          console.log(`  ${coin.amount} ${coin.denom}`);
        });
      }

      return balance;
    } catch (error) {
      console.error('❌ 查询余额失败:', error.message);
      throw error;
    }
  }

  /**
   * 查询特定代币余额
   * @param {string} address - 账户地址
   * @param {string} denom - 代币单位
   * @returns {Promise<string>} 余额数量
   */
  async getBalanceByDenom(address, denom) {
    if (!this.client) {
      throw new Error('请先连接到节点');
    }

    try {
      const balance = await this.client.getBalance(address, denom);
      console.log(`💰 ${denom} 余额: ${balance.amount}`);
      return balance.amount;
    } catch (error) {
      console.error('❌ 查询余额失败:', error.message);
      throw error;
    }
  }

  /**
   * 查询交易详情
   * @param {string} txHash - 交易哈希
   * @returns {Promise<Object>} 交易详情
   */
  async getTransaction(txHash) {
    if (!this.client) {
      throw new Error('请先连接到节点');
    }

    try {
      const tx = await this.client.getTx(txHash);
      
      if (!tx) {
        console.log(`❌ 未找到交易: ${txHash}`);
        return null;
      }

      console.log(`\n📄 交易详情 (${txHash}):`);
      console.log(`  区块高度: ${tx.height}`);
      console.log(`  Gas 使用: ${tx.gasUsed}/${tx.gasWanted}`);
      console.log(`  状态: ${tx.code === 0 ? '成功' : '失败'}`);
      
      if (tx.rawLog) {
        console.log(`  日志: ${tx.rawLog}`);
      }

      return tx;
    } catch (error) {
      console.error('❌ 查询交易失败:', error.message);
      throw error;
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
      console.log('🔌 已断开节点连接');
    }
  }
}

module.exports = GaiaTransfer;