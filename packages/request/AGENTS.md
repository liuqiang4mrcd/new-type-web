# @new-type/request

统一网络请求封装包，基于 axios，负责 envelope 解包、鉴权 header 注入和认证错误回调。

## 修改边界

- 只维护通用 request client，不写具体 API 路径、活动 DTO、adapter 或业务错误处理。
- 默认 envelope 规则必须保持可配置：`isSuccess`、`getMessage`、`onAuthError`。
- 抛出的错误信息应来自 envelope 或调用方配置，不在包内写活动文案。
- 保持 `raw` axios instance 暴露，便于特殊场景扩展。

## 依赖规则

- 可以依赖 axios。
- 不依赖 React、Zustand、UI、analytics 或任何 app。
- token/header 来源通过 provider 注入，不直接绑定某个登录系统。

## 验证

- 修改后运行：`pnpm --filter @new-type/request build`
- 修改 envelope、拦截器或错误行为时运行/补充：`pnpm --filter @new-type/request test`
