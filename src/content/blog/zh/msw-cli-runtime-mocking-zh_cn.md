---
title: msw-cli 与 Agent Skills：让 AI Agent 驱动你的 MSW Mock
description: >-
  msw-mcp 入门文的续篇：msw-cli 和 agent skills 给 AI agent 一条基于 shell 的路径，
  用来实时改 MSW handler——面向 AI agent，而不是让人在终端里手敲 handler。
pubDate: '2026-07-10'
heroImage: /msw-cli-agent-skills.jpg
tags:
  - msw
  - mcp
  - cli
  - mocking
  - ai-agents
---

在[上一篇文章](/blog/zh/intro-to-msw-mcp-ai-driven-api-mocking-zh_cn/)里，我介绍了 **msw-mcp**：一个 MCP Server，让 AI agent 能实时改浏览器里 [Mock Service Worker](https://mswjs.io/) 的 handler。

那条路仍然可用。新的变化是：同一套系统多了一条**面向 AI agent** 的路径——**`msw-cli`**，再加上教 AI agent 怎么用它的 **agent skills**。

English version: [English](/blog/en/msw-cli-runtime-mocking/)

## 面向 AI agent 的 msw-cli

`msw-cli` 看起来像普通开发者 CLI。实际使用里，它主要是给 **AI agent** 用的。

在 shell 里手写 MSW handler 很痛苦：长 JS 字符串、引号、转义、编码问题都容易踩坑。人可以跑 `open`、`status` 这类简单命令，但日常改 mock，几乎都是 AI agent 生成 handler，再替你执行 `msw-cli add` / `update` / `remove`。

真正的循环是：

1. 你用自然语言描述接口行为。
2. AI agent 写出 handler，并调用 `msw-cli`。
3. 浏览器里的 MSW worker 实时更新——不用重启，也不用为每次微调去改 mock 文件。

可以把它想成 `playwright-cli`：shell 接口是 AI agent 能稳定调用的契约，skills 则负责把契约教给它们。

## 新增的功能

对 AI agent 驱动的工作流，主要有三点：

1. **`msw-cli`** — 和 MCP 工具一样的 add / update / remove / reset / status，但走 shell 会话。适合 AI agent 有终端权限（Cursor Agent、Claude Code、脚本）时，不必只依赖 MCP。
2. **Sessions（会话）** — `open` → 操作 → `close`，风格接近 `playwright-cli`。AI agent 可以列出、复用各项目的会话，避免重复起 daemon。
3. **Agent skills** — `msw-setup` 和 `msw-cli`，让 AI agent 按正确流程做事（先 setup，再跑运行时命令；临时 mock 不要去改磁盘上的 handlers）。

MCP 工具和 CLI 连的是**同一个** daemon、**同一个**浏览器桥。两者都是给 AI agent 的控制面——按 AI agent 怎么跑来选即可。

## 整体架构

整体可以看成：

```text
  You (natural language)
       |
       v
  AI agent
       |
       +-- MCP tools (msw-mcp) ----+
       |                           |
       +-- Shell (msw-cli) --------+
                                   v
                         MSW daemon (WebSocket)
                                   |
                                   v
                    Browser (@msw-mcp/client + MSW)
```

简单说：

1. 你向 AI agent 提出要改 mock。
2. AI agent 要么调 MCP 工具，要么跑 `msw-cli` 命令。
3. daemon 通过 WebSocket 把变更发出去。
4. 浏览器里的 `@msw-mcp/client` 应用到正在跑的 MSW worker。
5. 下一次匹配的请求就会用上新的 mock。

AI agent 遵循的 CLI 会话循环：

```text
  open  →  add / update / remove / reset  →  status  →  close
```

## 快速上手

先安装一次 CLI（全局或用 `npx`）：

```bash
npm install -g msw-cli
```

### 1. 项目接入（做一次即可）

```bash
msw-cli setup
# 可选：msw-cli setup --framework vite
```

也可以让 AI agent 按 **msw-setup** skill 或 `/msw-setup` 提示来做。指南会安装 `msw` 和 `@msw-mcp/client`，初始化 service worker，建好 `mocks/`，并设置 WebSocket 环境变量（`VITE_MSW_WS_URL`、`NEXT_PUBLIC_MSW_WS_URL` 或 `MSW_WS_URL`）。

如果已经按第一篇文章用 `/msw-setup` 接好了，这一步可以跳过。

### 2. 打开会话

你或 AI agent：

```bash
msw-cli list          # 已有会话就复用
msw-cli open          # 或：msw-cli open --port 6789
```

`open` 会打印 **Port** 和 **WebSocket** 地址。如果端口和 app 配置不一致，改环境变量并刷新页面。

![msw-cli open 与 list 输出](/msw-cli-run-screenshot.png)

### 3. 让 AI agent 在运行时改 mock

你可以说：「把 GET /api/users mock 成返回一个用户列表。」

AI agent 会跑类似命令：

```bash
msw-cli status        # connected 必须是 true
msw-cli add "http.get('/api/users', () => HttpResponse.json([{ id: 1 }]))"
msw-cli update "/api/users" -h "http.get('/api/users', () => HttpResponse.json([{ id: 1, name: 'Ada' }]))"
msw-cli remove "*/api/users"
msw-cli reset
msw-cli close
```

Handler 字符串就是普通 JS。`http`、`graphql`、`HttpResponse`、`bypass`、`passthrough`、`delay` 已经在作用域里，不需要 import。这对 AI agent 生成很容易，人手在 shell 里敲就很别扭。

## Agent skills

安装 skills：

```bash
npx skills add JasonBoy/msw-mcp --skill msw-cli
npx skills add JasonBoy/msw-mcp --skill msw-setup
```

按提示选择安装范围（项目级或全局）。之后 Cursor（以及其他支持的 AI agent）就能发现这些 skill。

它们分别负责：

- **`msw-cli`** — 用 CLI 做运行时 mock 变更
- **`msw-setup`** — 脚手架：MSW + client 桥

这些 skill 会引导 AI agent 养成好习惯：

- 临时改 mock 时，优先用 `msw-cli add` / `update` / `remove`，不要去改磁盘上的 `handlers.ts`
- `open` 之前先跑 `list` / `status`，避免重复起 daemon
- `remove` / `update` 的 pattern 匹配的是 **URL**（不是 `status` 里那种 `METHOD URL`），或用 `-m GET`

你继续用自然语言描述接口；skill 帮 AI agent 选对命令、少踩坑。

## 实用提示

- **默认会持久化**：`open` 后 handler 可以跨刷新保留。用 `--no-persist-handlers` 关掉，或 `--persist-handlers 10` 只保留最近 N 个。
- **`status` 显示 `METHOD URL`**，但 `remove` / `update` 的 pattern 匹配的是 URL。更推荐 `remove "*/api/users"` 或 `remove "*/api/users" -m GET`。
- **如果 `update` 匹配到 0 个 handler**，新 handler 仍会加上（类似 `add`）。AI agent 应修正 pattern，不要再 update 一次，否则容易重复。
- **`--single-client`** 只把命令发给最近连接的那个标签页。

MCP 配置、`/msw-setup` 细节、handler 顺序等，见[入门文](/blog/zh/intro-to-msw-mcp-ai-driven-api-mocking-zh_cn/)。

## 相比其他 mock 方案的优势

很多团队用代理工具（Charles、Proxyman）、API 客户端 mock server（Postman、Apifox），或 `db.json` 这类快速方案。这些场景下也够用。**msw-cli** 和 **msw-mcp** 更适合你的场景：

- **真实 URL 路径** — app 继续请求 `/api/users`，由 MSW 在浏览器里拦截，不必把 `API_URL` 指到单独的 mock server。
- **JavaScript handler** — 用和 app 一样的语言写完整 `Request` / `Response` 逻辑，而不是各工具自己的模板 DSL。
- **不刷新就热更新** — 通过 CLI 或 MCP 改 mock，页面状态还在（表单填了一半、弹窗开着）。纯 MSW 开发时往往要改 `handlers.ts` 再刷新。
- **为 AI agent 设计** — 自然语言 → handler 代码 → 下一次 fetch，不用点代理 GUI，也不用导出 API collection。
- **开发和测试共用一层 mock** — 同一套 MSW handler 还能给 Vitest、Jest、Playwright 用，不必在别的工具里再维护一份 mock。

原生 app、零代码改动的场景，或只做 API 设计阶段的 mock server，代理工具或 Apifox 可能仍然更合适。

## 小结

`msw-mcp` 和 **`msw-cli`** 是同一座实时 MSW 桥上的两套 AI agent 控制面。MCP 适合会 MCP 的 AI agent；CLI 适合会跑 shell 的 AI agent——skills 让这条路径更稳。

你描述 mock，AI agent 去生成并应用，浏览器立刻更新。

仓库：[github.com/JasonBoy/msw-mcp](https://github.com/JasonBoy/msw-mcp)  
文档：[msw-mcp-docs.vercel.app](https://msw-mcp-docs.vercel.app/)

Happy Mocking! 🤡
