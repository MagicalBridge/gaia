#!/usr/bin/env node

/**
 * Gaia 节点智能启动脚本 (JavaScript 版本)
 * 功能：检查端口冲突、重置数据、启动节点
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');

// 颜色定义
const colors = {
    RED: '\x1b[0;31m',
    GREEN: '\x1b[0;32m',
    YELLOW: '\x1b[1;33m',
    BLUE: '\x1b[0;34m',
    NC: '\x1b[0m' // No Color
};

// 日志函数
const log = {
    info: (message) => {
        console.log(`${colors.BLUE}[INFO]${colors.NC} ${message}`);
    },
    success: (message) => {
        console.log(`${colors.GREEN}[SUCCESS]${colors.NC} ${message}`);
    },
    warning: (message) => {
        console.log(`${colors.YELLOW}[WARNING]${colors.NC} ${message}`);
    },
    error: (message) => {
        console.log(`${colors.RED}[ERROR]${colors.NC} ${message}`);
    }
};

// 工具函数：执行命令并返回结果
function execCommand(command, options = {}) {
    try {
        const result = execSync(command, { 
            encoding: 'utf8', 
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options 
        });
        return { success: true, output: result };
    } catch (error) {
        return { success: false, error: error.message, output: error.stdout };
    }
}

// 工具函数：检查命令是否存在
function commandExists(command) {
    try {
        execSync(`which ${command}`, { stdio: 'pipe' });
        return true;
    } catch {
        return false;
    }
}

// 工具函数：获取占用端口的进程ID
function getPortPids(port) {
    try {
        const result = execSync(`lsof -ti :${port}`, { encoding: 'utf8', stdio: 'pipe' });
        return result.trim().split('\n').filter(pid => pid);
    } catch {
        return [];
    }
}

// 工具函数：获取进程名称
function getProcessName(pid) {
    try {
        const result = execSync(`ps -p ${pid} -o comm=`, { encoding: 'utf8', stdio: 'pipe' });
        return result.trim();
    } catch {
        return 'unknown';
    }
}

// 工具函数：等待指定时间
function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// 工具函数：用户输入
function askQuestion(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer);
        });
    });
}

// 检查 gaiad 是否已安装
async function checkGaiad() {
    log.info("检查 gaiad 是否已安装...");
    
    if (!commandExists('gaiad')) {
        log.error("gaiad 未找到，请先运行 'make install' 构建项目");
        process.exit(1);
    }
    
    const versionResult = execCommand('gaiad version', { silent: true });
    const version = versionResult.success ? versionResult.output.trim() : 'unknown';
    log.success(`gaiad 已安装，版本: ${version}`);
}

// 检查并停止占用端口的进程
async function checkAndKillPorts() {
    log.info("检查端口 26656 和 26657 是否被占用...");
    
    const ports = [26656, 26657];
    let killedAny = false;
    
    for (const port of ports) {
        const pids = getPortPids(port);
        if (pids.length > 0) {
            log.warning(`端口 ${port} 被以下进程占用: ${pids.join(', ')}`);
            
            for (const pid of pids) {
                const processName = getProcessName(pid);
                log.info(`正在停止进程 ${pid} (${processName})...`);
                
                try {
                    process.kill(parseInt(pid), 'SIGTERM');
                    killedAny = true;
                } catch (error) {
                    log.warning(`无法停止进程 ${pid}: ${error.message}`);
                }
            }
        }
    }
    
    if (killedAny) {
        log.info("等待进程完全停止...");
        await sleep(2);
        
        // 再次检查端口是否已释放
        for (const port of ports) {
            const remainingPids = getPortPids(port);
            if (remainingPids.length > 0) {
                log.warning(`端口 ${port} 仍被占用，强制终止进程...`);
                
                for (const pid of remainingPids) {
                    try {
                        process.kill(parseInt(pid), 'SIGKILL');
                    } catch (error) {
                        log.warning(`无法强制停止进程 ${pid}: ${error.message}`);
                    }
                }
            }
        }
        await sleep(1);
    }
    
    log.success("端口检查完成，所有相关端口已释放");
}

// 重置节点数据
async function resetNodeData() {
    log.info("重置节点数据和区块高度...");
    
    const gaiaDir = path.join(os.homedir(), '.gaia');
    
    if (fs.existsSync(gaiaDir)) {
        log.info("发现现有的 .gaia 目录，正在重置...");
        
        const resetResult = execCommand('gaiad comet unsafe-reset-all', { silent: true });
        if (!resetResult.success) {
            log.warning("使用 gaiad 重置失败，尝试手动删除数据目录...");
            
            const dataDir = path.join(gaiaDir, 'data');
            if (fs.existsSync(dataDir)) {
                try {
                    fs.rmSync(dataDir, { recursive: true, force: true });
                } catch (error) {
                    log.warning(`手动删除数据目录失败: ${error.message}`);
                }
            }
        }
    } else {
        log.info("未发现现有的 .gaia 目录，将进行全新初始化");
    }
    
    log.success("节点数据重置完成");
}

// 检查配置文件是否存在
async function checkConfig() {
    log.info("检查节点配置...");
    
    const genesisPath = path.join(os.homedir(), '.gaia', 'config', 'genesis.json');
    
    if (!fs.existsSync(genesisPath)) {
        log.warning("未找到 genesis.json，建议运行 single-node.sh 进行初始化");
        
        const answer = await askQuestion("是否现在运行 single-node.sh 进行初始化？(y/n): ");
        
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            const singleNodeScript = './contrib/single-node.sh';
            
            if (fs.existsSync(singleNodeScript)) {
                log.info("运行 single-node.sh 进行初始化...");
                const initResult = execCommand(`bash ${singleNodeScript}`);
                
                if (!initResult.success) {
                    log.error("初始化失败");
                    return false;
                }
            } else {
                log.error("未找到 single-node.sh 脚本");
                return false;
            }
        } else {
            log.warning("跳过初始化，直接启动可能会失败");
        }
    } else {
        log.success("配置文件检查完成");
    }
    
    return true;
}

// 启动节点
async function startNode() {
    log.info("启动 Gaia 节点...");
    log.info("节点将在以下端口运行：");
    log.info("  - P2P: 26656");
    log.info("  - RPC: 26657");
    log.info("  - gRPC: 9090");
    log.info("  - API: 1317");
    console.log();
    log.info("使用 Ctrl+C 停止节点");
    log.info("或在另一个终端运行: pkill gaiad");
    console.log();
    
    // 启动节点
    const gaiadProcess = spawn('gaiad', ['start'], {
        stdio: 'inherit',
        shell: true
    });
    
    return gaiadProcess;
}

// 清理函数
function cleanup() {
    console.log();
    log.info("收到停止信号，正在清理...");
    // 这里可以添加清理逻辑
    process.exit(0);
}

// 主函数
async function main() {
    console.log("==================================================");
    log.info("Gaia 节点智能启动脚本 (JavaScript 版本)");
    console.log("==================================================");
    
    try {
        // 执行检查和准备步骤
        await checkGaiad();
        await checkAndKillPorts();
        await resetNodeData();
        
        const configOk = await checkConfig();
        if (!configOk) {
            log.error("配置检查失败，无法启动节点");
            process.exit(1);
        }
        
        console.log();
        log.success("所有准备工作完成，正在启动节点...");
        console.log();
        
        // 启动节点
        const gaiadProcess = await startNode();
        
        // 处理节点进程事件
        gaiadProcess.on('close', (code) => {
            if (code !== 0) {
                log.error(`gaiad 进程退出，退出码: ${code}`);
            } else {
                log.info("gaiad 进程正常退出");
            }
        });
        
        gaiadProcess.on('error', (error) => {
            log.error(`启动 gaiad 失败: ${error.message}`);
            process.exit(1);
        });
        
    } catch (error) {
        log.error(`脚本执行失败: ${error.message}`);
        process.exit(1);
    }
}

// 信号处理
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// 运行主函数
if (require.main === module) {
    main().catch(error => {
        log.error(`未处理的错误: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    checkGaiad,
    checkAndKillPorts,
    resetNodeData,
    checkConfig,
    startNode,
    log
};