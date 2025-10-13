# Gaia CosmJS SDK 示例项目

这个项目演示了如何使用 CosmJS SDK 与 Gaia 单节点进行交互，包括转账、查询区块链状态等操作。

## 📋 项目结构

```
example/
├── package.json          # 项目配置和依赖
├── .env                  # 环境配置文件
├── config.js             # 项目配置模块
├── wallet.js             # 钱包管理模块
├── transfer.js           # 转账功能模块
├── query.js              # 查询功能模块
├── demo.js               # 演示脚本
└── README.md             # 使用文档
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd example
npm install
```

### 2. 启动 Gaia 单节点

在运行示例之前，确保 Gaia 单节点正在运行：

```bash
# 在项目根目录
cd ../contrib
./single-node.sh
```

### 3. 运行演示

```bash
# 完整演示
node demo.js

# 或者指定特定演示
node demo.js transfer  # 简单转账演示
node demo.js query     # 查询演示
node demo.js batch     # 批量转账演示
```

## 📚 模块说明

### 配置模块 (config.js)

管理项目的所有配置，包括：
- 网络配置（RPC 端点、链 ID）
- Gas 配置（默认限制、价格）
- 密钥环配置
- 默认账户助记词

### 钱包模块 (wallet.js)

提供钱包管理功能：

```javascript
const { PresetAccounts, GaiaWallet } = require('./wallet');

// 使用预设账户
const validatorWallet = await PresetAccounts.createValidator();
const userWallet = await PresetAccounts.createUser();

// 创建新钱包
const wallet = new GaiaWallet();
const { wallet: newWallet, mnemonic } = await wallet.generateNew();

// 从助记词恢复钱包
await wallet.createFromMnemonic('your mnemonic here');
```

### 转账模块 (transfer.js)

提供转账相关功能：

```javascript
const GaiaTransfer = require('./transfer');

const transfer = new GaiaTransfer();
await transfer.connect(wallet);

// 单笔转账
await transfer.send(fromAddress, toAddress, '1000000', 'stake', '备注');

// 批量转账
const transfers = [
  { to: 'address1', amount: '1000000', denom: 'stake' },
  { to: 'address2', amount: '2000000', denom: 'stake' }
];
await transfer.batchSend(fromAddress, transfers, '批量转账');

// 查询余额
await transfer.getBalance(address);
await transfer.getBalanceByDenom(address, 'stake');

// 查询交易
await transfer.getTransaction(txHash);
```

### 查询模块 (query.js)

提供区块链状态查询功能：

```javascript
const GaiaQuery = require('./query');

const query = new GaiaQuery();
await query.connect();

// 网络状态
await query.getNodeStatus();
await query.getChainId();
await query.getHeight();

// 区块信息
await query.getLatestBlock();
await query.getBlock(height);

// 账户信息
await query.getAccount(address);

// 验证者信息
await query.getValidators();

// 交易搜索
await query.searchTx("tx.hash='...'");

// 网络摘要
await query.getNetworkSummary();
```

## 🔧 配置说明

### 环境变量 (.env)

```bash
# Gaia 节点配置
RPC_ENDPOINT=http://localhost:26657
REST_ENDPOINT=http://localhost:1317
CHAIN_ID=test-gaia

# Gas 设置
DEFAULT_GAS_LIMIT=200000
DEFAULT_GAS_PRICE=0.025
DEFAULT_FEE_DENOM=stake

# 密钥环设置
KEYRING_BACKEND=test
```

### 默认账户

项目使用 `single-node.sh` 脚本创建的默认账户：
- **validator**: 验证者账户，初始余额 100,000,000,000 stake
- **user**: 普通用户账户，初始余额 100,000,000,000 stake

## 📖 使用示例

### 基本转账示例

```javascript
const { PresetAccounts } = require('./wallet');
const GaiaTransfer = require('./transfer');

async function basicTransfer() {
  // 1. 创建钱包
  const senderWallet = await PresetAccounts.createValidator();
  const receiverWallet = await PresetAccounts.createUser();
  
  // 2. 连接转账客户端
  const transfer = new GaiaTransfer();
  await transfer.connect(senderWallet.getWallet());
  
  // 3. 执行转账
  const result = await transfer.send(
    senderWallet.getAddress(),
    receiverWallet.getAddress(),
    '1000000',  // 1,000,000 stake
    'stake',
    '测试转账'
  );
  
  console.log('转账成功:', result.transactionHash);
  
  // 4. 清理
  transfer.disconnect();
}

basicTransfer().catch(console.error);
```

### 查询示例

```javascript
const GaiaQuery = require('./query');

async function queryExample() {
  const query = new GaiaQuery();
  await query.connect();
  
  // 获取网络状态
  const status = await query.getNodeStatus();
  console.log('当前区块高度:', status.syncInfo.latestBlockHeight);
  
  // 获取最新区块
  const block = await query.getLatestBlock();
  console.log('最新区块包含交易数:', block.txs.length);
  
  query.disconnect();
}

queryExample().catch(console.error);
```

## 🛠️ 故障排除

### 常见问题

1. **连接失败**
   - 确保 Gaia 节点正在运行
   - 检查 RPC 端点配置是否正确
   - 确认端口 26657 没有被占用

2. **转账失败**
   - 检查账户余额是否足够
   - 确认 Gas 设置是否合理
   - 验证地址格式是否正确

3. **查询失败**
   - 确认节点已完全同步
   - 检查查询参数是否正确

### 调试技巧

1. **启用详细日志**
   ```javascript
   // 在代码中添加更多日志输出
   console.log('调试信息:', data);
   ```

2. **检查节点状态**
   ```bash
   # 检查节点是否运行
   curl http://localhost:26657/status
   
   # 检查最新区块
   curl http://localhost:26657/block
   ```

3. **验证账户状态**
   ```bash
   # 使用 gaiad 命令行工具验证
   gaiad query bank balances $(gaiad keys show validator -a --keyring-backend=test)
   ```

## 📝 开发建议

1. **错误处理**: 始终使用 try-catch 包装异步操作
2. **连接管理**: 使用完毕后及时断开连接
3. **Gas 优化**: 根据实际需求调整 Gas 设置
4. **测试**: 在主网使用前充分测试所有功能

## 🔗 相关链接

- [CosmJS 官方文档](https://cosmos.github.io/cosmjs/)
- [Cosmos SDK 文档](https://docs.cosmos.network/)
- [Gaia 项目](https://github.com/cosmos/gaia)

## 📄 许可证

本项目遵循 MIT 许可证。