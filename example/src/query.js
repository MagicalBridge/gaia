const { StargateClient } = require('@cosmjs/stargate');
const { Tendermint34Client } = require('@cosmjs/tendermint-rpc');
const config = require('./config');

class GaiaQuery {
  constructor() {
    this.client = null;
    this.tmClient = null;
  }

  /**
   * 连接到 Gaia 节点
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      // 连接 Stargate 客户端
      this.client = await StargateClient.connect(config.network.rpcEndpoint);
      
      // 连接 Tendermint 客户端
      this.tmClient = await Tendermint34Client.connect(config.network.rpcEndpoint);
      
      console.log(`✅ 已连接到查询节点: ${config.network.rpcEndpoint}`);
    } catch (error) {
      console.error('❌ 连接查询节点失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取节点状态
   * @returns {Promise<Object>} 节点状态信息
   */
  async getNodeStatus() {
    if (!this.tmClient) {
      throw new Error('请先连接到节点');
    }

    try {
      const status = await this.tmClient.status();
      
      console.log('\n🌐 节点状态:');
      console.log(`  节点 ID: ${status.nodeInfo.id}`);
      console.log(`  链 ID: ${status.nodeInfo.network}`);
      console.log(`  版本: ${status.nodeInfo.version}`);
      console.log(`  最新区块高度: ${status.syncInfo.latestBlockHeight}`);
      console.log(`  最新区块时间: ${status.syncInfo.latestBlockTime}`);
      console.log(`  同步状态: ${status.syncInfo.catchingUp ? '同步中' : '已同步'}`);
      
      return status;
    } catch (error) {
      console.error('❌ 获取节点状态失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取最新区块信息
   * @returns {Promise<Object>} 最新区块信息
   */
  async getLatestBlock() {
    if (!this.client) {
      throw new Error('请先连接到节点');
    }

    try {
      const height = await this.client.getHeight();
      const block = await this.client.getBlock(height);
      
      console.log('\n📦 最新区块信息:');
      console.log(`  区块高度: ${block.header.height}`);
      console.log(`  区块哈希: ${block.id}`);
      console.log(`  时间戳: ${block.header.time}`);
      console.log(`  交易数量: ${block.txs.length}`);
      console.log(`  提议者: ${block.header.proposerAddress}`);
      
      return block;
    } catch (error) {
      console.error('❌ 获取最新区块失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取指定高度的区块
   * @param {number} height - 区块高度
   * @returns {Promise<Object>} 区块信息
   */
  async getBlock(height) {
    if (!this.client) {
      throw new Error('请先连接到节点');
    }

    try {
      const block = await this.client.getBlock(height);
      
      console.log(`\n📦 区块信息 (高度: ${height}):`);
      console.log(`  区块哈希: ${block.id}`);
      console.log(`  时间戳: ${block.header.time}`);
      console.log(`  交易数量: ${block.txs.length}`);
      console.log(`  提议者: ${block.header.proposerAddress}`);
      
      return block;
    } catch (error) {
      console.error(`❌ 获取区块 ${height} 失败:`, error.message);
      throw error;
    }
  }

  /**
   * 获取链信息
   * @returns {Promise<Object>} 链信息
   */
  async getChainId() {
    if (!this.client) {
      throw new Error('请先连接到节点');
    }

    try {
      const chainId = await this.client.getChainId();
      console.log(`🔗 链 ID: ${chainId}`);
      return chainId;
    } catch (error) {
      console.error('❌ 获取链 ID 失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取当前区块高度
   * @returns {Promise<number>} 当前区块高度
   */
  async getHeight() {
    if (!this.client) {
      throw new Error('请先连接到节点');
    }

    try {
      const height = await this.client.getHeight();
      console.log(`📏 当前区块高度: ${height}`);
      return height;
    } catch (error) {
      console.error('❌ 获取区块高度失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取账户信息
   * @param {string} address - 账户地址
   * @returns {Promise<Object>} 账户信息
   */
  async getAccount(address) {
    if (!this.client) {
      throw new Error('请先连接到节点');
    }

    try {
      const account = await this.client.getAccount(address);
      
      if (!account) {
        console.log(`❌ 账户不存在: ${address}`);
        return null;
      }

      console.log(`\n👤 账户信息 (${address}):`);
      console.log(`  账户号: ${account.accountNumber}`);
      console.log(`  序列号: ${account.sequence}`);
      console.log(`  公钥: ${account.pubkey ? Buffer.from(account.pubkey.value).toString('hex') : '未设置'}`);
      
      return account;
    } catch (error) {
      console.error('❌ 获取账户信息失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取验证者列表
   * @returns {Promise<Array>} 验证者列表
   */
  async getValidators() {
    if (!this.tmClient) {
      throw new Error('请先连接到节点');
    }

    try {
      const validators = await this.tmClient.validatorsAll();
      
      console.log(`\n🏛️ 验证者列表 (共 ${validators.validators.length} 个):`);
      validators.validators.forEach((validator, index) => {
        console.log(`  ${index + 1}. 地址: ${validator.address}`);
        console.log(`     投票权重: ${validator.votingPower}`);
        if (validator.pubkey && validator.pubkey.value) {
          console.log(`     公钥: ${Buffer.from(validator.pubkey.value).toString('hex')}`);
        } else {
          console.log(`     公钥: 未知`);
        }
      });
      
      return validators.validators;
    } catch (error) {
      console.error('❌ 获取验证者列表失败:', error.message);
      throw error;
    }
  }

  /**
   * 搜索交易
   * @param {string} query - 搜索查询
   * @returns {Promise<Array>} 交易列表
   */
  async searchTx(query) {
    if (!this.client) {
      throw new Error('请先连接到节点');
    }

    try {
      const txs = await this.client.searchTx(query);
      
      console.log(`\n🔍 交易搜索结果 (查询: ${query}):`);
      console.log(`  找到 ${txs.length} 笔交易`);
      
      txs.forEach((tx, index) => {
        console.log(`  ${index + 1}. 哈希: ${tx.hash}`);
        console.log(`     高度: ${tx.height}`);
        console.log(`     状态: ${tx.code === 0 ? '成功' : '失败'}`);
      });
      
      return txs;
    } catch (error) {
      console.error('❌ 搜索交易失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取网络信息摘要
   * @returns {Promise<Object>} 网络摘要信息
   */
  async getNetworkSummary() {
    try {
      console.log('\n📊 网络信息摘要:');
      
      const [status, chainId, height, validators] = await Promise.all([
        this.getNodeStatus(),
        this.getChainId(),
        this.getHeight(),
        this.getValidators()
      ]);

      const summary = {
        chainId,
        height,
        nodeId: status.nodeInfo.id,
        version: status.nodeInfo.version,
        validatorCount: validators.length,
        syncStatus: status.syncInfo.catchingUp ? '同步中' : '已同步',
        latestBlockTime: status.syncInfo.latestBlockTime
      };

      console.log('\n📋 摘要:');
      Object.entries(summary).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });

      return summary;
    } catch (error) {
      console.error('❌ 获取网络摘要失败:', error.message);
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
    }
    if (this.tmClient) {
      this.tmClient.disconnect();
      this.tmClient = null;
    }
    console.log('🔌 已断开查询节点连接');
  }
}

module.exports = GaiaQuery;