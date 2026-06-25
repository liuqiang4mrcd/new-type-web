# @new-type/hooks

通用 React Hooks 包，放跨活动可复用的浏览器/交互 hooks。

## 修改边界

- 只放通用 hook，不放活动业务状态、接口 DTO、Section content 组装或具体文案。
- Hook 必须处理浏览器 API 缺失场景，避免 SSR / 测试环境直接崩溃。
- effect 必须正确清理定时器、事件监听和外部订阅。
- 返回值应稳定、类型清晰；避免在 hook 内隐藏复杂业务副作用。

## 依赖规则

- 只 peer 依赖 React。
- 通用纯函数优先放 `@new-type/utils`，不要为了非 React 逻辑新增 hook。
- 不依赖 app、runtime store、request 或 UI 包。

## 验证

- 修改后运行：`pnpm --filter @new-type/hooks build`
- 时间、滚动、分享等行为变化应补测试或手动说明验证方式。
