# @new-type/request

活动页统一请求客户端。`createRequest()` 默认返回业务 `data`，不把 Axios response 或后端 envelope 暴露给业务代码。

## 基本用法

```ts
import { createRequest } from "@new-type/request";

const request = createRequest({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
});

export function getCampaignInfo() {
  return request.get<CampaignInfoDto>("/campaign/info");
}
```

默认认为 `code === 0 || code === 200` 是成功，并返回 envelope 中的 `data` 字段。需要读取 headers、status 或完整 response 时使用 `raw`：

```ts
const response =
  await request.raw.get<ApiEnvelope<CampaignInfoDto>>("/campaign/info");
```

## Provider

多端差异通过 provider 注入，不在业务项目或 request 包中写死平台 SDK。

```ts
const request = createRequest({
  baseURL,
  getToken: () => bridge.auth.getToken(),
  getHeaders: () => ({
    "X-Device-Id": bridge.device.id,
  }),
  onAuthError: () => bridge.auth.login(),
});
```

Provider 职责边界：

| provider      | 用途                                       |
| ------------- | ------------------------------------------ |
| `getToken`    | 返回当前端的登录 token，可同步或异步       |
| `getHeaders`  | 返回端能力需要追加的 headers，可同步或异步 |
| `onAuthError` | 处理 401，例如唤起登录                     |
| `isSuccess`   | 自定义后端 envelope 成功判断               |
| `getMessage`  | 自定义错误信息提取                         |

`@new-type/request` 不直接依赖 Android、iOS、WebView、小程序或业务 SDK。各端应在 app integration 层传入 provider，保持共享包平台无关。

## 自定义 Envelope

```ts
const request = createRequest({
  isSuccess: (envelope) => envelope.status === "success",
  getMessage: (envelope) => envelope.msg ?? "request failed",
});
```
