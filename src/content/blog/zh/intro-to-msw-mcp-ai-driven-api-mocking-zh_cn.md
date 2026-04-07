---
title: msw-mcp 入门：用 AI + MSW 做实时 API Mock
description: >-
  一篇简明技术介绍，讲清 msw-mcp 解决什么问题、如何工作，以及如何快速接入到
  你的前端开发流程中。
pubDate: '2026-04-07'
heroImage: /intro-to-msw-mcp.webp
tags:
  - msw
  - mcp
  - mocking
  - api-testing
  - javascript
---

当前端开发依赖后端接口，而接口又还在变化时，开发效率通常会明显下降。你会不断补临时 mock、改返回结构、重跑页面，然后再改一轮。

**msw-mcp** 的目标就是把这件事变得更快。

[msw-mcp](https://github.com/JasonBoy/msw-mcp) 是一个 MCP Server，它把 AI 助手和 [Mock Service Worker](https://mswjs.io/) 连接起来。简单说，你用自然语言描述接口行为，AI 生成 MSW handler，并通过 WebSocket 实时应用到浏览器里的 mock worker。

## 它解决了什么问题？

很多团队已经在用 MSW，但日常开发还是有这些痛点：

- 每新增一个接口都要手写或调整 handler
- mock 变更后要反复刷新或重启流程
- 异常场景（500、延迟、一次性失败）配置成本高
- 后端协议变化快时，前端 mock 跟进困难

`msw-mcp` 没有替换 MSW，而是在 MSW 之上增加一层 AI 控制能力。你可以通过 MCP 工具快速新增、更新、删除、重置 handler。

## 它是怎么工作的？

核心链路可以理解为 5 步：

1. 你向 AI 提出接口需求。
2. AI 调用 MCP 工具（如 `msw_add_handlers`）。
3. `msw-mcp` Server 接收请求并通过 WebSocket 转发。
4. 浏览器侧 `msw-mcp/client` 桥接层把 handler 注册到 MSW。
5. 后续命中的 HTTP 请求会被新 handler 拦截并返回 mock 数据。

对应的架构是：

- AI Assistant <-> MCP Protocol <-> msw-mcp server <-> WebSocket <-> Browser MSW worker

因为是 WebSocket 实时下发，mock 行为可以在开发过程中快速迭代。

## 快速上手

MCP 配置最简方式：

```json
{
  "mcpServers": {
    "msw-mcp": {
      "command": "npx",
      "args": ["msw-mcp@latest"]
    }
  }
}
```

然后在 MCP 客户端里执行：

```text
/msw-setup
```

这个 prompt 不只是“创建几个文件”，它会先分析你的工程，再按实际栈生成配置。

### `/msw-setup` 支持哪些构建工具

它当前可检测并适配：

- Vite（`vite.config.js/ts`）
- Rspack（`rspack.config.js`）
- Rsbuild（`rsbuild.config.js/ts`）
- Webpack（`webpack.config.js`）

它还会读取 bundler 的公共路径配置（如 `base`、`publicPath`、`assetPrefix`），计算正确的 service worker URL。例如部署在 `/app` 子路径时，会使用 `/app/mockServiceWorker.js`，而不是固定写死 `/mockServiceWorker.js`。

### 它会生成哪些文件和模式

在新项目模式下，它会根据是否使用 TypeScript 选择 `.ts` 或 `.js`，并生成完整 `mocks/` 结构：

- `mocks/handlers.{js|ts}`：基础 handler
- `mocks/browser.{js|ts}`：MSW worker 初始化
- `mocks/index.{js|ts}`：`msw-mcp/client` 桥接入口
- `mocks/types.d.ts`：仅 TS 项目的全局类型声明
- `mocks/custom-handlers/index.example.{js|ts}`：本地自定义示例
- `mocks/custom-handlers/index.{js|ts}`：本地私有 handlers（默认 gitignore）

同时它会：

- 在检测到的 public 目录初始化 `mockServiceWorker.js`
- 更新 `.env` / `.env.local`
- 更新 bundler 配置以暴露前端可读取的 mock 环境变量

如果发现你已经有 `mocks/` 目录，它会进入迁移模式：尽量保留现有 handlers，重点升级到 `msw-mcp/client` 的接入方式，而不是重写你的业务 mock 逻辑。

如果你更希望手动接入：

```bash
npm install -D msw msw-mcp
npx msw init public/ --save
```

```javascript
import { enableMocking } from 'msw-mcp/client';
import { setupWorker } from 'msw/browser';

const worker = setupWorker();

await enableMocking({
  worker,
  wsEnabled: true,
  wsBridgeOptions: { url: 'ws://localhost:6789' },
});
```

## 常见使用方式

常见需求可以直接描述给 AI：

- "创建 GET /users，返回用户列表"
- "把 /users 改成返回 500，用来测错误态 UI"
- "更新 /users 响应，增加 updated 字段"
- "重置当前所有 handler"

底层对应的工具是：

- `msw_add_handlers`
- `msw_update_handlers`
- `msw_remove_handlers`
- `msw_reset_handlers`
- `msw_get_status`

这让你的调试循环变成：描述 -> 应用 -> 验证 -> 微调。

## 实战注意点

有几个点在项目里很关键：

- **handler 顺序会影响结果**：MSW 是 first match wins。
- **具体路由优先于通配路由**：避免被通用规则提前命中。
- **一次性 handler 很实用**：`once: true` 适合首个请求失败这类场景。
- **可选持久化**：`--persist-handlers` 可跨刷新保留规则。
- **建议按 method 精准更新**：同一路由多 method 时更安全。

常用参数：

- `--mock-ws-port=6789`
- `--persist-handlers` 或 `--persist-handlers=10`
- `--single-client`

## 总结

`msw-mcp` 本质上是 MSW 的效率增强层，特别适合需要高频 mock 迭代的团队。

如果你的项目常见场景是前后端并行开发、频繁切换接口返回、快速验证 UI 状态，那么它可以明显减少 mock 维护成本，并提升本地联调效率。

价值很直接：让 mock 跟上你的开发节奏。
