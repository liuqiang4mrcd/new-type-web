# @new-type/ui

通用有样式 UI 组件包，提供 Loading、Toast、Modal、LazyImage、Skeleton 等基础组件。

## 修改边界

- 只放跨活动通用 UI，不放具体活动视觉主题、业务文案、接口请求或 Zustand store。
- 组件 API 应小而稳定，优先通过 props 接收文案、颜色、尺寸和行为。
- 需要全局副作用的组件（如 Modal 锁 body 滚动、Toast 全局入口）必须在卸载时清理。
- 新组件应兼顾移动端 H5 使用场景，避免固定桌面尺寸。

## 依赖规则

- peer 依赖 React / React DOM。
- 可使用 Tailwind utility class，但不要依赖某个 campaign 的全局样式。
- 复杂无样式行为优先放 `@new-type/headless`，UI 包只负责包装呈现。

## 验证

- 修改后运行：`pnpm --filter @new-type/ui build`
- 视觉或交互变化需要在使用方页面或最小示例中手动检查。
