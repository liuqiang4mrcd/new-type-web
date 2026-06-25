# @new-type/analytics

轻量埋点工具包，提供 `track`、`pageView`、`click` 和可替换的 `setReportHandler`。

## 修改边界

- 只维护通用埋点发送能力，不写具体活动的事件字典、业务字段或页面流程。
- 默认实现可以读取浏览器环境信息，但必须在 SSR / 测试环境中安全降级。
- 对外 payload 类型必须保持稳定；新增字段优先放入 `properties`，谨慎修改 `AnalyticsPayload` 顶层结构。
- 不依赖 React、Zustand、UI 包或具体 app。

## 依赖规则

- 可使用浏览器原生能力：`navigator.sendBeacon`、`fetch`、`window`、`document`，但访问前必须做环境判断。
- 不引入请求包；埋点发送与业务 API 请求保持独立。

## 验证

- 修改后运行：`pnpm --filter @new-type/analytics build`
- 如新增行为分支，补充或运行：`pnpm --filter @new-type/analytics test`
