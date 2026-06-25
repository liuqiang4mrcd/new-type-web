# @new-type/config

共享工程配置包，提供 TypeScript、ESLint、Tailwind、Vite campaign base 配置。

## 修改边界

- 只维护跨项目通用配置，不放活动业务逻辑、组件、接口或 runtime 状态。
- 修改 `vite/campaign-base.ts` 时必须考虑所有 `apps/*` 活动都会受影响。
- Tailwind / PostCSS 配置必须保持 750px 设计稿约定，除非同步更新相关文档和验证脚本。
- 导出路径受 `package.json` 的 `exports` 控制；新增配置文件时必须同步维护 exports。

## 依赖规则

- 配置包可以依赖构建工具和插件，不依赖任何 `apps/*` 或业务共享包。
- 避免把 framework runtime 依赖放入配置包；需要 runtime 能力时应放入对应 `packages/*`。

## 验证

- 修改配置后至少运行一个受影响 app 的 build，例如：`pnpm --filter @new-type/campaign-template build`
- 修改 Tailwind / Vite campaign base 时，额外关注移动端 750px px→vw 转换是否仍生效。
