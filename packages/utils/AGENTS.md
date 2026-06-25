# @new-type/utils

通用纯函数工具包。当前按模块拆分为 date、url、i18n、timing、storage、id、viewport，并由 `src/index.ts` 统一 re-export。

## 修改边界

- 只放跨活动可复用的纯工具或极薄浏览器工具，不放 React hook、UI 组件、请求 client、活动文案或业务规则。
- 新增能力优先创建独立模块文件，并从 `src/index.ts` re-export；不要继续把实现堆进 `index.ts`。
- i18n 相关工具只处理 URL / locale / direction 等通用解析，不包含任何 campaign 文案。
- `vw()` 必须保持 750px 设计稿基准，与 `postcss-mobile-forever` 配置一致。

## 依赖规则

- 尽量零运行时依赖。
- 不依赖 React、axios、Zustand、UI 包或任何 app。
- 使用浏览器 API 的工具必须在不可用时安全降级。

## 验证

- 修改后运行：`pnpm --filter @new-type/utils build`
- 新增解析、格式化、防抖节流等逻辑时优先补测试：`pnpm --filter @new-type/utils test`
