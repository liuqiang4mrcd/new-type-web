# 活动页模板说明

> 最后更新：2026-06-25（中性 Scaffold 模板 + i18n / RTL 基础能力）

`apps/campaign-template` 是新活动的最小可运行脚手架，不承载具体业务示例。它只保留中性的 `ScaffoldSection`，用于确认工程链路、Playground 和 runtime 能正常工作。

创建新活动后，必须根据已确认的设计方案和组件设计卡逐个创建真实 Section。禁止把模板中的 scaffold 内容、状态或文案当成业务组件基底。

## 目录结构

```
apps/campaign-template/
├── src/
│   ├── main.tsx                     # 入口，?mode=designer → Playground
│   ├── app.tsx                      # 重导出 runtime/app
│   ├── contracts/
│   │   └── section.ts               # 类型契约
│   ├── activity/                    # 页面内部交互内核（纯 TS）
│   │   ├── types.ts                 # AppState / DomainState / UiState / AppAction
│   │   ├── initial-state.ts         # createInitialAppState
│   │   ├── actions.ts               # 业务 command / action creator
│   │   ├── reducer.ts               # 纯状态变更
│   │
│   ├── designer/sections/           # 🎨 设计师视觉层
│   │   └── ScaffoldSection/         # 中性占位 Section，创建新活动后替换
│   │
│   ├── runtime/                     # 🤖 AI 粘合层
│   │   ├── app.tsx
│   │   └── sections/
│   │       └── ScaffoldContainer.tsx
│   │
│   ├── integrations/                # 👨‍💻 生产逻辑层
│   │   ├── store.ts                 # Zustand 外壳，包 activity appState/dispatch
│   │   ├── api.ts                   # API 函数；VITE_USE_MOCK=true 时动态加载 mock
│   │   ├── adapters/                # DTO → SectionState<Content>
│   │   ├── fixtures/                # 后端样例 / mock JSON + fixture source 记录
│   │   ├── mock/                    # mock 唯一运行时入口
│   │   ├── tracking.ts
│   │   └── constants.ts
│   │
│   ├── i18n/                        # 🌐 活动本地国际化资源
│   │   ├── en.ts                    # 英文文案
│   │   ├── zh.ts                    # 中文文案
│   │   ├── ar.ts                    # 阿拉伯语文案（RTL 示例）
│   │   ├── types.ts                 # I18nMessages / SupportedLang
│   │   └── index.ts                 # 语言选择、文案读取、content factory
│   │
│   └── playground/                  # 🔍 设计师预览
│       ├── index.tsx                # 左主区域 + 右控制面板 flex 布局
│       ├── ControlPanel.tsx         # 右侧控制面板（模式选择/编辑/日志）
│       ├── PhoneFrame.tsx           # 手机壳模拟（iframe 内渲染，vw 正确）
│       ├── SectionPanel.tsx         # 单组件预览（状态切换）
│       ├── ScenarioRunner.tsx       # 流程预览渲染器（props 驱动）
│       ├── FlowInspector.tsx        # 浮动流程面板（可折叠）
│       ├── ContentEditor.tsx        # JSON content 编辑器
│       ├── ActionsLog.tsx           # actions 调用日志
│       ├── phone-preview.tsx        # iframe 独立 entry（?mode=phone-preview）
│       ├── types.ts                 # PlaygroundSection / Scenario / PreviewMode
│       ├── section-registry.ts      # 组件注册
│       └── scenarios/               # 中性预设场景数据
```

## Scaffold 约束

- `ScaffoldSection` 只用于验证模板可运行，不代表任何活动类型。
- 复制模板创建新活动后，应先根据设计方案决定真实 Section 拆分。
- 输出真实 Section 前必须先写组件设计卡，明确作用、展示方式、数据、交互、状态和边界。
- 不要从 scaffold 默认状态推导业务状态；每个 Section 必须独立做状态适配。
- 如果需要业务示例，应放在 `docs/` 或独立示例目录，不应放入 `apps/campaign-template` 复制源。

## 国际化与 RTL

模板默认支持 app-local i18n：

- 默认语言：`en`
- 默认方向：`ltr`
- URL 语言参数：`?lang=en`、`?lang=zh`、`?lang=ar`
- URL 方向覆盖：`?dir=ltr`、`?dir=rtl`
- `ar` 默认推导为 `rtl`

通用 URL 解析能力放在 `@new-type/utils` 的 `parseLocaleSearch`，活动文案只能放在当前 app 的 `src/i18n/`。

`defaultContent` 可以使用默认语言生成静态视觉样例：

```ts
import { DEFAULT_LANG, getI18nMessages } from "../../../i18n";

const scaffoldMessages = getI18nMessages(DEFAULT_LANG).scaffold;

export const defaultContent = {
  title: scaffoldMessages.title,
  description: scaffoldMessages.description,
  checklist: scaffoldMessages.checklist,
};
```

禁止 `defaultContent` 读取 URL、store 或当前 runtime 语言。runtime 需要多语言文案时，由 container / adapter 按 `ui.lang` 生成最终字符串并传给视觉组件。

runtime 根节点会设置：

```tsx
<main lang={lang} dir={textDirection}>
```

并同步 `document.documentElement.lang / dir`。创建真实 Section 时，方向敏感的箭头、进度方向和左右布局必须在组件设计卡中说明 RTL 行为。

## 创建新 Section

### 1. 视觉组件（designer/）

```
designer/sections/<Name>/
├── types.ts          # 定义 <Name>Content 接口
├── content.ts        # export const defaultContent: <Name>Content
├── index.tsx         # 纯视觉组件，Props: SectionProps<<Name>Content>
└── states.tsx        # 条件必需：export required UI 状态组件
```

```ts
// 约束：index.tsx 不能引用 store/api/tracking
// 所有数据通过 content props 传入
```

### 2. 注册到 Playground（playground/）

```
// playground/section-registry.ts 中添加
{
  id: '<name>',
  name: '<Name>Section',
  component: <Name>Section,
  defaultContent,
  stateViews: { /* 只注册 supportedStates 中真实存在的 UI 状态 */ },
}
```

### 2.1 流程预览

`playground/scenarios/` 用于预览真实业务阶段，不用于按 Section 顺序逐个播放。完整页面预览通过 `playground/preview-state.ts` 初始化 `RuntimeViewState`，并复用 runtime container 渲染真实交互链路。

- 推荐步骤：`活动开始前`、`活动进行中`、`活动结束`，或按实际活动补充 `已领取`、`无次数`、`奖励为空` 等阶段。
- 每个步骤可以组合多个 Section，展示该阶段用户实际看到的页面。
- 某阶段无意义的模块可以不显示。
- 禁止把流程预览写成 Section 清单。
- 场景必须使用 `group: 'fullpage' | 'module'` 分类。
- `fullpage` 场景优先描述 `domain/ui` 初始状态，不直接 patch Section content。
- `module` / 单组件视觉预览可以使用 Section content override 或 status override，只用于查看视觉状态，不写回 `AppState`。
- 兼容旧场景时，步骤数据统一写入 `sections[]`，禁止使用顶层 `sectionId` / `content` / `status`。

### 2.2 弹窗触发

完整页面中的弹窗默认关闭，必须由真实页面入口或业务事件打开：

- `rule` 入口打开规则弹窗。
- `claim`、抽奖完成、领取成功等事件打开奖励或结果弹窗。
- 弹窗关闭按钮必须能关闭弹窗。
- 调试用触发按钮只允许出现在单组件预览或右侧控制区域，禁止出现在完整页面底部。
- 弹窗单组件预览必须限制在组件预览框内部，禁止 fixed 全屏覆盖 Playground。完整页面需要全屏遮罩时，应由 content 字段或预览包装区分 inline / overlay 模式。
- 单组件预览中，`SectionPanel` 会检测 `defaultContent.isOpen` 并注入 `{ isOpen: true, displayMode: 'inline' }`，因此弹窗的 `defaultContent.isOpen` 必须保持 `false`。
- 完整页面预览中，跨 Section 的弹窗/结果联动必须复用 `runtime` container + store；`playground/preview-state.ts` 只负责把设计态数据初始化为 `RuntimeViewState`，禁止新增 `ACTION_WIRING` 式 content patch 表或 `activity/selectors/*`。

### 3. 添加 store 状态（integrations/）

```
// integrations/store.ts 维护顶层 domain / ui / sections + dispatch 外壳
// runtime 中 useStore selector 只能订阅原始字段或 primitive
// playground/preview-state.ts 可使用 defaultContent 初始化 RuntimeViewState
```

### 3.1 Mock 入口

模板只允许一个运行时 mock 入口：

```txt
integrations/mock/index.ts
```

`integrations/api.ts` 通过 `VITE_USE_MOCK === 'true'` 判断是否动态加载 mock：

```ts
async function loadMockApi() {
  return import("./mock");
}
```

约束：

- 只有字符串 `'true'` 启用 mock；其他值都走真实请求。
- 禁止在 `api.ts` 顶层静态 `import './mock'` 或 `import './fixtures/*'`。
- `runtime/`、`activity/`、`playground/` 禁止 import `integrations/mock` 或 `integrations/fixtures`。
- mock 返回接口 DTO data，不返回 adapter 后的 `SectionState`。
- fixture 放在 `integrations/fixtures/`，并用 `*.fixture.md` 标注来源可信度。
- 模板 fixture 必须标注为 `placeholder`，不能作为接口接入完成证据。

### 3.2 请求封装

真实请求统一使用 `@new-type/request`，活动项目不再自建 `fetch/requestJson` 封装。

```ts
import { createRequest } from "@new-type/request";

const request = createRequest({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
});

export function getCampaignInfo() {
  return request.get<CampaignInfoDto>("/campaign/info");
}
```

多端 token、headers、登录失效处理通过 `@new-type/request` 的 provider 注入，详见 `packages/request/README.md`。

### 4. 创建 runtime 容器（runtime/）

```
// runtime/sections/<Name>Container.tsx
// 从 store 读取状态 → 按 status 渲染对应视图
// ready 但无 content 时不渲染或渲染显式状态视图，不要 fallback 到 defaultContent
// 不要在 useStore selector 中调用 projection helper；直接订阅 s.sections.<name> / s.domain / s.ui
```

> `defaultContent` 只用于 `designer/` 视觉默认态和 `playground/` 设计预览。真实接口联调、mock API、adapter、runtime containers 禁止 import `designer/sections/*/content.ts` 或用 `...defaultContent` 补齐数据。

## 引入共享包

```ts
import { useCountdown } from "@new-type/hooks";
import { createRequest } from "@new-type/request";
import { toast } from "@new-type/ui";
import { Tab } from "@new-type/headless";
```

详见 `docs/ai/framework-map.md`。

## 运行方式

```bash
# 线上页面
pnpm dev

# 指定语言 / RTL 调试
pnpm dev  →  http://localhost:5173/?lang=zh
pnpm dev  →  http://localhost:5173/?lang=ar
pnpm dev  →  http://localhost:5173/?lang=en&dir=rtl

# mock 数据调试
VITE_USE_MOCK=true pnpm dev

# 生产构建默认不启用 mock
VITE_USE_MOCK=false pnpm build

# 设计师 Playground（三种预览模式 + 控制面板）
pnpm dev  →  http://localhost:5173/?mode=designer
# 完整页面手机壳独立入口（iframe 用，无需手动访问）
pnpm dev  →  http://localhost:5173/?mode=phone-preview
```
