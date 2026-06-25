# @new-type/headless

无样式 React 交互组件包。目前提供复合式 `Tab` 组件。

## 修改边界

- 组件只负责行为、状态、键盘交互和 ARIA 语义，不绑定视觉样式或活动主题。
- 不写 Tailwind class、颜色、图片、活动文案或业务逻辑。
- 支持受控和非受控用法；新增组件时必须明确受控状态、默认状态和事件回调。
- 可访问 DOM 处理焦点和键盘行为，但必须保持 React 18 兼容。

## 依赖规则

- 只 peer 依赖 React。
- 不依赖 `@new-type/ui`、`@new-type/hooks`、`@new-type/request` 或任何 app。

## 验证

- 修改后运行：`pnpm --filter @new-type/headless build`
- 行为变化应补测试：`pnpm --filter @new-type/headless test`
