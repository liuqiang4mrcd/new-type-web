# 接口接入规则

> 适用于活动页首版视觉生成完成后的真实接口接入阶段。目标是保证后端数据结构变化不会反向污染 Section 视觉结构。

## 核心原则

接口接入必须以 Section 展示语义为稳定契约：

```txt
API DTO
  -> integrations/api.ts
  -> integrations/adapters/*.ts
  -> integrations/store.ts SectionState<SectionContent>
  -> runtime/sections/*Container.tsx
  -> designer/sections/* 纯视觉组件
```

- `designer/sections/*` 只声明自身需要的展示语义，不声明 API 字段、接口路径或后端 DTO shape。
- `integrations/adapters/*` 负责从 API DTO 映射到 Section Content，并处理校验、状态翻译、降级和错误分类。
- `runtime/sections/*Container.tsx` 只读取 `SectionState`、按 status 渲染、绑定 actions，不允许临时拼接口字段。
- `integrations/store.ts` 的渲染主状态只保存 adapter 输出后的 `SectionState<Content>`；raw DTO 不能进入 runtime/render path。

## Integration Agent 工作流

接口接入由 `agents/integration.md` 负责。它是独立人工入口：Designer Final Closeout 后不会自动继续进入接口接入；只有用户明确提出接口接入、接口联调、adapter、fixture、真实数据 store action、动态 Section contract 校验、`defaultContent` 泄漏检查或 `validate-integration` 相关任务时才触发。

Integration Agent 触发时目标 app 必须已经存在，禁止创建新活动项目，禁止修改 `apps/campaign-template/`。

开始前必须确认：

- 目标 app：`apps/<campaign>/`。
- 接口文档、API 路径/参数/响应说明，或后端提供的响应样例。
- 至少一个 normal response 样例，才能进入 `normal-path`。
- `apps/<campaign>/.feedback/structure.md` 存在，并能识别 `数据来源 = 动态数据` 的 Section。

没有接口文档或响应样例时，只能产出 `skeleton` 预接入骨架，不能标记接口接入完成。

### 权限边界

允许修改：

- `apps/<campaign>/src/integrations/api.ts`
- `apps/<campaign>/src/integrations/store.ts`
- `apps/<campaign>/src/integrations/adapters/*`
- `apps/<campaign>/src/integrations/fixtures/*`
- `apps/<campaign>/src/runtime/sections/*Container.tsx`，仅限数据读取、状态分支和 action 绑定
- `apps/<campaign>/src/activity/types.ts`
- `apps/<campaign>/src/activity/actions.ts`
- `apps/<campaign>/src/activity/reducer.ts`
- `apps/<campaign>/.feedback/integration.md`

默认只读：

- `designer/sections/*/types.ts`
- `designer/sections/*/content.ts`
- `designer/sections/*/index.tsx`
- `designer/sections/*/states.tsx`
- 已有 `designer/sections/*/contract.ts`
- `playground/*`

允许新增：

- 动态 Section 缺失时，可新增 `designer/sections/<Name>/contract.ts`。
- 新增 `contract.ts` 只能依据已确认的 `apps/<campaign>/.feedback/structure.md`、组件设计卡和 `types.ts`，禁止从后端 DTO 反推视觉契约。

禁止修改：

- `apps/campaign-template/`
- `packages/*`
- `designer/sections/*/types.ts`
- `designer/sections/*/content.ts`
- `designer/sections/*/index.tsx`
- `designer/sections/*/states.tsx`
- `playground/`，除非修复其违规接入真实数据流的边界问题

如果接口现实要求改变已有 `contract.ts`、`types.ts` 或用户可见信息结构，必须停止实现并输出契约变更请求，等待用户或 Designer 确认。

### 状态分级

`apps/<campaign>/.feedback/integration.md` 必须记录当前状态：

| 状态 | 含义 |
|---|---|
| `skeleton` | 没有真实接口样例，仅有 contract、adapter 骨架或 placeholder fixture |
| `normal-path` | confirmed/captured normal fixture 接通，normal adapter test 通过，runtime 能显示正常数据，但边界样例不足 |
| `verified` | normal 和至少一个业务边界 fixture 为 confirmed/captured，missing-required / malformed 本地负例通过，runtime 不消费 raw DTO，`validate-integration` 和 `pnpm build` 通过 |
| `blocked` | 缺接口文档、缺样例、鉴权/环境不可用、结构缺失、契约冲突或需要用户确认 |

只有 `verified` 可以称为接口接入完成。后端只提供 normal 样例时，只能称为 `normal-path`。

### 进度账本

Integration 进度账本写入目标 app：

```txt
apps/<campaign>/.feedback/integration.md
```

推荐格式：

```md
# Integration 进度

- campaign:
- 当前状态: skeleton | normal-path | verified | blocked
- 输入来源:
- 动态 Section 清单:
- adapter 清单:
- fixture 可信度:
- adapter test 结果:
- runtime 联调结果:
- build 结果:
- 阻塞项:
```

### 验证门禁

`validate-integration` 是独立门禁，不并入 `validate-section --all`。

推荐命令形态：

```bash
pnpm validate-integration --campaign <campaign-name>
pnpm validate-integration --campaign <campaign-name> --section <SectionName>
pnpm validate-integration --campaign <campaign-name> --adapter <adapterName>
```

`validate-integration` 至少应覆盖：

- 解析 `apps/<campaign>/.feedback/structure.md` 的动态 Section 清单；缺失或格式不符合 `agents/shared/STRUCTURE_OUTPUT.md` 时失败。
- 检查 `Tab归属 = 跨Section控制` 时存在 `AFFECTED_SECTIONS`。
- 动态 Section 存在 `contract.ts`。
- adapter、fixture 和 adapter test 存在并通过。
- `integrations/`、`activity/`、`runtime/` 不 import `designer/sections/*/content.ts` 或 `defaultContent`。
- runtime/render path 不消费 raw DTO。
- Playground 不 import API、adapter、fixture 或真实数据流。

在脚本尚未实现时，必须手动执行等价检查并在 `apps/<campaign>/.feedback/integration.md` 记录。

## Section 语义契约

当 Section 的 `content` 会被真实业务数据覆盖时，必须提供机器可读的 Section 语义契约：

```txt
designer/sections/<SectionName>/
  types.ts
  content.ts
  contract.ts
```

`contract.ts` 只描述 UI 需要什么展示语义，不描述这些数据从哪个接口字段取得。

示例：

```ts
export const userAssetContract = {
  fields: {
    nickname: {
      required: true,
      kind: 'string',
      display: '用户昵称',
      overflow: { type: 'truncate', max: 12 },
    },
    balanceText: {
      required: true,
      kind: 'string',
      display: '余额展示文案',
    },
    progressPercent: {
      required: true,
      kind: 'number',
      range: [0, 100],
    },
    avatarUrl: {
      required: false,
      kind: 'url',
      fallback: 'defaultAvatar',
    },
  },
} as const;
```

触发规则：

| Section 类型 | 是否需要 `contract.ts` | 是否需要 adapter test |
|---|---:|---:|
| 纯静态 Section | 否 | 否 |
| 动态展示 Section | 是 | 是 |
| 强交互 Section | 是 | 是 |
| 接口结果驱动的弹窗 Section | 是 | 是 |

判定标准：`content` 会被真实业务数据覆盖，就必须有 `contract.ts` 和 adapter test。

组件设计卡中应补充：

```md
- Dynamic data: yes/no
- Semantic contract: required/not required
- Adapter tests: required/not required
```

## Adapter 边界

adapter 允许做：

- 字段改名和结构映射。
- 数字、金额、时间、单位等展示格式化。
- 后端枚举到前端展示语义枚举的翻译。
- 数组裁剪、排序、过滤和空数组归一化。
- optional 字段缺失时使用 adapter 内明确声明的 runtime fallback。
- required 字段缺失时输出 `error / empty / disabled` 等非 ready 状态。

adapter 不允许做：

- 临时发明新的视觉结构或产品决策。
- import 或 spread `designer/sections/*/content.ts` 的 `defaultContent`。
- 把后端字段名、接口路径、DTO shape 写入 Section 契约。
- 把后端 enum/code 直接传入 `designer/sections/*/types.ts`。
- 让 runtime container 读取 raw DTO 后再拼接展示字段。
- 让 visual component 自己判断接口异常或后端业务状态。

硬规则：adapter 可以补字段，不能补产品决策。真实业务能力改变用户可见信息架构时，必须先修改 Section 契约和设计卡。

### defaultContent 边界

`designer/sections/*/content.ts` 的 `defaultContent` 是设计态 / Playground 乐观假数据，只用于：

- 单 Section 视觉开发和状态预览。
- `playground/section-registry.ts`、`SectionPanel`、`phone-preview` 等设计预览。
- 生成 spec test 的默认视觉样例。

真实接口联调、mock API、adapter、store、runtime render path 禁止依赖 `defaultContent`：

- `integrations/adapters/*` 不得 import `designer/sections/*/content.ts`，不得用 `...defaultContent` 补齐接口数据。
- `integrations/mock-data.ts` 应读取 fixture 或显式构造 API DTO；动态时间可在 mock 层 clone fixture 后注入，但不能借用 Section `defaultContent`。
- 完整页面预览使用 `playground/preview-state.ts` 把设计态数据初始化为 `RuntimeViewState`，再复用 `runtime` container 渲染；不要新增 `activity/selectors/*` 或 Playground 专用 `selectXxxSection`。
- `runtime/sections/*Container.tsx` 直接订阅 Zustand 顶层 `sections/domain/ui` 原始字段，只渲染 `section.status === 'ready' && section.content` 的真实内容；缺 content 时不渲染或渲染显式状态视图，不能 fallback 到 `defaultContent`。
- Runtime 中禁止 `useStore((s) => selectXxxSection(s.appState))`；需要组合多个字段时，在 container/hook 中派生。
- 静态文案、按钮名、空态文案如果属于 runtime 体验，必须在 adapter / runtime 显式定义，不能从设计假数据继承。

禁止示例：

```ts
import { defaultContent } from '../../designer/sections/HeroSection/content';

return {
  status: 'ready',
  content: {
    ...defaultContent,
    title: dto.name,
  },
};
```

允许示例：

```ts
return {
  status: 'ready',
  content: {
    title: dto.name,
    subtitle: 'Collect gifts to unlock rewards.',
    dateRange: formatDateRange(dto.start_at, dto.end_at),
    countdown: countdown(dto.end_at, dto.now_timestamp),
    ruleLabel: 'Rules',
    decorations: { showLanterns: true, showGifts: true },
  },
};
```

## 状态和错误策略

接口字段按影响范围分级处理：

| 字段类型 | 示例 | 缺失策略 |
|---|---|---|
| global required | 活动状态、服务端时间、用户资格 | 阻塞整页或主流程 |
| section required | 某 Section 的核心展示字段 | 只阻塞相关 Section |
| optional display | 副标题、头像、装饰标签 | 使用 fallback 或默认内容 |
| layout-driving | 奖励列表、任务列表、档位列表 | 空数组进入 empty，非法项过滤或 error |

page-level adapter 可以输出混合状态：

```ts
{
  header: { status: 'ready', content: headerContent },
  userAsset: { status: 'ready', content: userAssetContent },
  rewardTier: { status: 'error', error: 'missing reward tiers' },
  wheel: { status: 'disabled', content: wheelContent, reason: 'reward data unavailable' },
}
```

错误信息边界：

- 用户可见文案必须是产品确认过的通用文案，如“页面开小差了，请稍后再试”。
- adapter 的技术原因只用于日志、调试或埋点，如 `missing_required_field`、`invalid_enum`。
- 技术错误不得直接展示给用户。

## Adapter 组织方式

adapter 默认放在目标 app 内，不抽共享包：

```txt
apps/<campaign>/src/integrations/
  api.ts
  store.ts
  adapters/
    activityHome.adapter.ts
    userAsset.adapter.ts
    userAsset.adapter.test.ts
  fixtures/
    activity-home.normal.json
    activity-home.no-chance.json
    activity-home.ended.json
    activity-home.malformed.json
    activity-home.fixture.md
```

一个接口影响多个 Section 时，优先使用 page-level adapter：

```txt
getActivityHome()
  -> adaptActivityHome(dto)
  -> {
       userAsset: SectionState<UserAssetContent>,
       rewardTier: SectionState<RewardTierContent>,
       wheel: SectionState<WheelContent>,
       ruleModal: SectionState<RuleModalContent>
     }
```

跨 Section 依赖必须在 page-level adapter 中显式声明和测试，不允许隐式散落在 runtime 或 visual 组件里。

### Query / Action Adapter

有些活动不是一次性首页接口驱动整页，而是由组件或弹窗触发局部查询，例如好友列表、背包、排行榜、抽奖记录、领奖记录。这类数据虽然不一定进入全局 store，也仍然属于 render path。

硬规则：

- API action/query 返回给组件前必须先经过 adapter。
- 组件局部 `useState` 保存的也必须是展示语义数据，不能保存 raw DTO。
- Promise resolve 给组件的数据必须是 adapter 输出结果，不允许组件收到后再解析后端字段。
- action 类接口必须区分 request payload contract、response adapter、side effect refresh。

建议结构：

```txt
apps/<campaign>/src/integrations/
  adapters/
    gardenHome.adapter.ts
    friendsList.adapter.ts
    bag.adapter.ts
    lotteryPools.adapter.ts
    leaderboard.adapter.ts
    plantSeed.adapter.ts
    harvest.adapter.ts
```

示例：

```ts
async function fetchFriendsList(page: number): Promise<SectionState<FriendListContent>> {
  const response = await requestFriendsList(page);
  return adaptFriendsList(response.data);
}
```

不允许：

```ts
fetchFriendsList(1).then((data) => {
  setPageOptions({
    list: data.list,
    has_more: data.has_more,
  });
});
```

允许：

```ts
fetchFriendsList(1).then((state) => {
  if (state.status === 'ready') {
    setPageOptions(state.content);
  }
});
```

对强交互 action，例如种植、采摘、抽奖：

```txt
request adapter
  UI action input -> API payload

response adapter
  API response -> action result semantic state

refresh policy
  action success 后刷新哪些 SectionState 或 query content
```

action 成功后需要刷新多个模块时，刷新策略应集中写在 integrations 层，不要由 visual component 串联多个 API。

## Fixture 规则

接口接入阶段优先使用后端样例 JSON。fixture 必须在目标 app 内维护，并标注来源和可信等级。

建议文件：

```txt
apps/<campaign>/src/integrations/fixtures/
  activity-home.normal.json
  activity-home.no-chance.json
  activity-home.ended.json
  activity-home.missing-required.json
  activity-home.malformed.json
  activity-home.fixture.md
```

`activity-home.fixture.md` 示例：

```md
## Fixture Sources

| file | source | confidence | owner | updatedAt | usage |
|---|---|---|---|---|---|
| activity-home.normal.json | backend provided sample | confirmed | @be | 2026-06-22 | contract test |
| activity-home.no-chance.json | AI placeholder | placeholder | - | 2026-06-22 | local dev only |
```

可信等级：

| confidence | 含义 | 可否作为接入完成证据 |
|---|---|---:|
| placeholder | AI 或前端手写占位样例 | 否 |
| confirmed | 后端文档、接口平台样例或后端确认样例 | 是 |
| captured | dev/staging 真实抓包响应 | 是 |

没有后端确认或真实抓包来源的 fixture，只能用于开发占位，不能作为接口接入完成证据。

## Adapter Contract Test

每个动态 Section 或 page-level adapter 必须有 adapter contract test。测试只断言 adapter 输出的 `SectionState<Content>`，不把后端字段名当作 UI 契约的一部分。

最低覆盖：

| 用例 | 期望 |
|---|---|
| normal | 返回 `ready` 和完整 Content |
| missing required | 返回 `error / disabled`，不能伪造 `ready` |
| optional missing | 返回 `ready` 和 fallback |
| empty business | 返回 `empty / disabled` |
| malformed | 返回 `error` |
| overflow | 裁剪、过滤或格式化符合 Section 契约 |

后端只提供 normal 样例时，只能标记“normal path 接通”，不能标记接口接入完成。

接口接入完成定义：

- normal fixture 达到 `confirmed` 或 `captured`，且 adapter test 通过。
- 至少一个业务边界 fixture 达到 `confirmed` 或 `captured`，且 adapter test 通过。
- missing-required / malformed 本地负例测试通过。
- runtime/render path 只消费 `SectionState<Content>`，不消费 raw DTO。

## Playground 和 Runtime 边界

Playground 继续使用 mock content 和 scenario，不接真实 API：

- `?mode=designer` 只用于设计验收、状态覆盖、视觉回归。
- `playground/scenarios/*` 不 import `integrations/store` 或真实 API。
- 真实接口联调用 runtime app，或另建可选 integration mode。

禁止为了接口接入把 Playground 改成依赖真实网络环境。

## 接入检查清单

接口接入 PR 或任务收尾前必须检查：

- 动态 Section 有 `contract.ts`。
- adapter 位于目标 app 的 `integrations/adapters/`。
- adapter test 覆盖 normal、required 缺失、optional 缺失、业务空态或禁用态、malformed。
- fixtures 位于目标 app 的 `integrations/fixtures/`，并有 fixture source 记录。
- store 顶层 `sections` 保存 `SectionState<Content>`，顶层 `domain/ui` 保存交互事实，不把 raw DTO 暴露给 runtime/render path。
- `integrations/`、`activity/`、`runtime/` 不 import `designer/sections/*/content.ts`；`defaultContent` 只留在 `designer/` 和 `playground/`。
- runtime container 没有解释后端字段、后端枚举或拼接展示文案。
- visual component 没有 import API、store、tracking，也没有后端字段或后端 enum。
- 只有 normal 样例时，结论写为“normal path 接通”，不写“接口接入完成”。
