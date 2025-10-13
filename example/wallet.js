const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
const { stringToPath } = require('@cosmjs/crypto');
const config = require('./config');

class GaiaWallet {
  constructor() {
    this.wallet = null;
    this.accounts = [];
  }

  /**
   * 从助记词创建钱包
   * @param {string} mnemonic - 助记词
   * @param {string} prefix - 地址前缀，默认为 'cosmos'
   * @returns {Promise<void>}
   */
  async createFromMnemonic(mnemonic, prefix = config.addressPrefix) {
    try {
      this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: prefix,
      });
      this.accounts = await this.wallet.getAccounts();
      console.log(`✅ 钱包创建成功，地址: ${this.accounts[0].address}`);
      return this.wallet;
    } catch (error) {
      console.error('❌ 创建钱包失败:', error.message);
      throw error;
    }
  }

  /**
   * 生成新的助记词和钱包
   * @param {string} prefix - 地址前缀，默认为 'cosmos'
   * @returns {Promise<{wallet: DirectSecp256k1HdWallet, mnemonic: string}>}
   */
  async generateNew(prefix = config.addressPrefix) {
    try {
      const wallet = await DirectSecp256k1HdWallet.generate(24, {
        prefix: prefix,
      });
      const accounts = await wallet.getAccounts();
      const mnemonic = wallet.mnemonic;
      
      console.log(`✅ 新钱包生成成功:`);
      console.log(`📝 助记词: ${mnemonic}`);
      console.log(`🏠 地址: ${accounts[0].address}`);
      
      return { wallet, mnemonic };
    } catch (error) {
      console.error('❌ 生成钱包失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取当前账户信息
   * @returns {Array} 账户列表
   */
  getAccounts() {
    if (!this.accounts || this.accounts.length === 0) {
      throw new Error('钱包未初始化或没有账户');
    }
    return this.accounts;
  }

  /**
   * 获取主账户地址
   * @returns {string} 主账户地址
   */
  getAddress() {
    const accounts = this.getAccounts();
    return accounts[0].address;
  }

  /**
   * 获取钱包实例
   * @returns {DirectSecp256k1HdWallet} 钱包实例
   */
  getWallet() {
    if (!this.wallet) {
      throw new Error('钱包未初始化');
    }
    return this.wallet;
  }

  /**
   * 显示账户信息
   */
  displayAccountInfo() {
    if (!this.accounts || this.accounts.length === 0) {
      console.log('❌ 没有可用的账户');
      return;
    }

    console.log('\n📋 账户信息:');
    this.accounts.forEach((account, index) => {
      console.log(`  ${index + 1}. 地址: ${account.address}`);
      console.log(`     公钥: ${Buffer.from(account.pubkey).toString('hex')}`);
      console.log(`     算法: ${account.algo}`);
    });
  }
}

/**
 * 创建预设账户的便捷函数
 */
class PresetAccounts {
  /**
   * 创建验证者账户
   * @returns {Promise<GaiaWallet>}
   */
  static async createValidator() {
    const wallet = new GaiaWallet();
    await wallet.createFromMnemonic(config.accounts.validator);
    console.log('🔐 验证者账户已加载');
    return wallet;
  }

  /**
   * 创建用户账户
   * @returns {Promise<GaiaWallet>}
   */
  static async createUser() {
    const wallet = new GaiaWallet();
    await wallet.createFromMnemonic(config.accounts.user);
    console.log('👤 用户账户已加载');
    return wallet;
  }

  /**
   * 创建自定义账户
   * @param {string} mnemonic - 助记词
   * @returns {Promise<GaiaWallet>}
   */
  static async createCustom(mnemonic) {
    const wallet = new GaiaWallet();
    await wallet.createFromMnemonic(mnemonic);
    console.log('🔧 自定义账户已加载');
    return wallet;
  }
}

module.exports = {
  GaiaWallet,
  PresetAccounts,
};