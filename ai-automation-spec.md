# 南航地图项目 — AI 自动化协作系统

## 项目背景

南航暑期社会实践项目：给南航校园做的一个地图应用。
需要接入 AI 自动化协作系统，实现 GitHub Issue/PR 的自动 triage、回复、分类。

## 可用资源

### API
| 资源 | 地址 | 说明 |
|------|------|------|
| 南航 DeepSeek API | `https://token.nuaa.edu.cn/v1/chat/completions` | OpenAI 兼容接口 |
| 模型 | `deepseek-v4-pro` | 支持 reasoning_content |
| 认证方式 | `Authorization: Bearer sk-xxx` | 南航分配的 API key |

### 硬件环境
| 机器 | 系统 | 角色 |
|------|------|------|
| ThinkBook | Windows 11 + WSL2 Ubuntu 24.04 | 开发机，有 EasyConnect VPN |
| NAS | 飞牛 OS (Linux) | 服务器，Docker 部署，2.5G 网卡 |
| 网络 | 校内/校外 | 校外需 VPN 访问南航内网 API |

### 网络架构（关键）
```
南航内网 API (token.nuaa.edu.cn)
        ↑ 内网 IP: 10.0.241.133
        │
   EasyConnect VPN 隧道
        │
  ┌─────┴─────┐
  │  ThinkBook  │ ← WSL2 Mirror 模式继承 VPN 路由
  │  Windows    │    /etc/hosts: 10.0.241.133 token.nuaa.edu.cn
  └─────┬─────┘
        │ 局域网 / Tailscale
  ┌─────┴─────┐
  │    NAS     │ ← Docker 部署目标
  └───────────┘
```

⚠️ WSL2 DNS 不走 VPN，需手动 hosts 映射内网 IP。
⚠️ Windows 端 Clash Verge / Watt Toolkit 会干扰 EasyConnect 路由。
⚠️ Windows 上 EasyConnect 客户端 UI 可能异常，但内核驱动隧道对 WSL2 可用。

## 参考项目

需要借鉴 OpenClaw 生态中的自动化机器人：

### ClawSweeper
- 仓库：`openclaw/clawsweeper`
- 功能：GitHub 维护机器人，自动 triage Issue/PR
- 核心架构：
  - 定时扫描所有 Issue/PR
  - AI 分析（原版用 Codex + GPT-5.5）
  - 三通道：keep open / proposed close / archived
  - 保守策略：不关 maintainer 创建的，需确认才执行
  - 评论用 marker 标记，避免重复评论

### Clownfish
- 仓库：`openclaw/clownfish`
- 功能：批量解决 Issue 集群
- 与 ClawSweeper 协同：ClawSweeper 识别 → Clownfish 批量实施

### Caclawphony
- 仓库：`openclaw/caclawphony`
- 功能：项目工作自动化，独立实现运行
- 含 PR review、PR cluster 等功能

## 要实现的功能

### Phase 1：基础 Issue/PR Triage
```
GitHub Webhook 事件
        │
        ▼
   提取 Issue/PR 内容
        │
        ▼
   拼 prompt → 调南航 DeepSeek API
        │
        ▼
   AI 返回分析结果（分类/标签/建议回复）
        │
        ▼
   GitHub API 操作（打标签/评论/关 Issue）
```

### Phase 2：ClawSweeper 式完整流水线
- 定时扫描所有 open Issue/PR
- 智能判断哪些该关、哪些该留
- 自动生成关闭建议（需 maintainer 确认）
- PR 自动审查 + 合并建议
- 清理重复/过期评论

### Phase 3：Clownfish 式批量实施
- AI 识别可自动修复的 Issue
- 自动生成修复分支 + PR
- 自动更新已有 PR

### 触发方式
1. **Webhook 实时触发**：新 Issue/PR 立即处理
2. **Cron 定时扫描**：每周全量扫描（ClawSweeper 模式）
3. **手动 `/command` 触发**：通过 Issue 评论指令触发

## 技术实现方案

### 方案 A：GitHub Actions（推荐起步）
```yaml
# .github/workflows/ai-triage.yml
on:
  issues: { types: [opened] }
  pull_request: { types: [opened] }

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: AI Triage
        env:
          NUAA_API_KEY: ${{ secrets.NUAA_API_KEY }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          # 调南航 API 分析
          # 用 gh CLI 操作 Issue/PR
```

**问题**：GitHub Actions runner 无法直接访问南航内网 API。
**解决**：
- 选项1：用 NAS 做 API 代理（SSH 隧道）
- 选项2：不在 Actions 跑，改成 Webhook → NAS 的架构

### 方案 B：NAS 自部署（推荐长期）
```
GitHub Webhook
    │
    ▼
NAS (Docker) ──── HTTP Proxy ──── ThinkBook VPN ──── 南航 API
    │
    ▼
GitHub API (gh CLI)
```

组件：
- **webhook-server**：接收 GitHub Webhook（Node.js/Python）
- **ai-worker**：调南航 API 分析 Issue/PR
- **gh-operator**：通过 gh CLI 或 GitHub API 操作

部署方式：
- Docker Compose
- 或直接跑在 NAS 上

### 方案 C：ThinkBook 直接跑（开发阶段）
用 OpenClaw agent + gh-issues skill + cron 定时任务。
最简单快速验证。

## 南航 API 调用格式

```bash
curl https://token.nuaa.edu.cn/v1/chat/completions \
  -H "Authorization: Bearer $NUAA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-v4-pro",
    "messages": [
      {
        "role": "system",
        "content": "你是一个 GitHub 维护助手。分析 Issue 并输出 JSON：{action, labels, comment, confidence}"
      },
      {
        "role": "user",
        "content": "Issue 标题: xxx\nIssue 内容: xxx"
      }
    ]
  }'
```

响应格式：
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "AI 回复内容",
      "reasoning_content": "推理过程（可选）"
    }
  }],
  "usage": { "prompt_tokens": 7, "completion_tokens": 122, "total_tokens": 129 }
}
```

## 开发环境

- **代码编辑器**：Claude Code（本地 Windows 环境）
- **代码仓库**：GitHub（南航地图项目 repo）
- **测试**：ThinkBook WSL2（可直接调南航 API）
- **部署**：NAS Docker

## 下一步

1. fork clawsweeper 分析代码结构
2. 在南航地图 repo 配置 GitHub Actions + Secrets
3. 写核心 AI triage 脚本（先用 curl 调南航 API 验证）
4. 搭建 NAS 上的 webhook 服务
5. 逐步完善标签体系、回复模板、自动化规则

---

_这份文档是给 Claude Code 看的项目上下文，包含所有必要的环境信息和技术决策。_
