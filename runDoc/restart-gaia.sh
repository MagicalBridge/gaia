#!/bin/bash

# Gaia 节点快速重启脚本
# 用于开发时快速重启节点

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 Gaia 节点快速重启${NC}"
echo "================================"

# 1. 停止现有进程
echo -e "${YELLOW}⏹️  停止现有 gaiad 进程...${NC}"
pkill gaiad 2>/dev/null || true
sleep 2

# 2. 重置数据
echo -e "${YELLOW}🗑️  重置节点数据...${NC}"
gaiad comet unsafe-reset-all >/dev/null 2>&1

# 3. 启动节点
# echo -e "${GREEN}🚀 启动节点...${NC}"
# echo "================================"
# gaiad start