#!/bin/bash

# Gaia 节点智能启动脚本
# 功能：检查端口冲突、重置数据、启动节点

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 gaiad 是否已安装
check_gaiad() {
    log_info "检查 gaiad 是否已安装..."
    if ! command -v gaiad &> /dev/null; then
        log_error "gaiad 未找到，请先运行 'make install' 构建项目"
        exit 1
    fi
    
    local version=$(gaiad version 2>/dev/null || echo "unknown")
    log_success "gaiad 已安装，版本: $version"
}

# 检查并停止占用端口的进程
check_and_kill_ports() {
    log_info "检查端口 26656 和 26657 是否被占用..."
    
    local ports=(26656 26657)
    local killed_any=false
    
    for port in "${ports[@]}"; do
        local pids=$(lsof -ti :$port 2>/dev/null || true)
        if [ -n "$pids" ]; then
            log_warning "端口 $port 被以下进程占用: $pids"
            for pid in $pids; do
                local process_name=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
                log_info "正在停止进程 $pid ($process_name)..."
                kill $pid 2>/dev/null || true
                killed_any=true
            done
        fi
    done
    
    if [ "$killed_any" = true ]; then
        log_info "等待进程完全停止..."
        sleep 2
        
        # 再次检查端口是否已释放
        for port in "${ports[@]}"; do
            local remaining_pids=$(lsof -ti :$port 2>/dev/null || true)
            if [ -n "$remaining_pids" ]; then
                log_warning "端口 $port 仍被占用，强制终止进程..."
                kill -9 $remaining_pids 2>/dev/null || true
            fi
        done
        sleep 1
    fi
    
    log_success "端口检查完成，所有相关端口已释放"
}

# 重置节点数据
reset_node_data() {
    log_info "重置节点数据和区块高度..."
    
    if [ -d "$HOME/.gaia" ]; then
        log_info "发现现有的 .gaia 目录，正在重置..."
        gaiad comet unsafe-reset-all 2>/dev/null || {
            log_warning "使用 gaiad 重置失败，尝试手动删除数据目录..."
            rm -rf "$HOME/.gaia/data" 2>/dev/null || true
        }
    else
        log_info "未发现现有的 .gaia 目录，将进行全新初始化"
    fi
    
    log_success "节点数据重置完成"
}

# 检查配置文件是否存在
check_config() {
    log_info "检查节点配置..."
    
    if [ ! -f "$HOME/.gaia/config/genesis.json" ]; then
        log_warning "未找到 genesis.json，建议运行 single-node.sh 进行初始化"
        read -p "是否现在运行 single-node.sh 进行初始化？(y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [ -f "./contrib/single-node.sh" ]; then
                log_info "运行 single-node.sh 进行初始化..."
                bash ./contrib/single-node.sh
                return 0
            else
                log_error "未找到 single-node.sh 脚本"
                return 1
            fi
        else
            log_warning "跳过初始化，直接启动可能会失败"
        fi
    else
        log_success "配置文件检查完成"
    fi
}

# 启动节点
start_node() {
    log_info "启动 Gaia 节点..."
    log_info "节点将在以下端口运行："
    log_info "  - P2P: 26656"
    log_info "  - RPC: 26657"
    log_info "  - gRPC: 9090"
    log_info "  - API: 1317"
    echo
    log_info "使用 Ctrl+C 停止节点"
    log_info "或在另一个终端运行: pkill gaiad"
    echo
    
    # 启动节点
    gaiad start
}

# 主函数
main() {
    echo "=================================================="
    log_info "Gaia 节点智能启动脚本"
    echo "=================================================="
    
    # 执行检查和准备步骤
    check_gaiad
    check_and_kill_ports
    reset_node_data
    check_config
    
    echo
    log_success "所有准备工作完成，正在启动节点..."
    echo
    
    # 启动节点
    start_node
}

# 信号处理
cleanup() {
    echo
    log_info "收到停止信号，正在清理..."
    # 这里可以添加清理逻辑
    exit 0
}

trap cleanup SIGINT SIGTERM

# 运行主函数
main "$@"