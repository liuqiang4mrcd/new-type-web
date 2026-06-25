# new-type-web 项目架构导览

> 面向人类读者的架构说明，最后校准：2026-06-25。

---

## 1. 技术栈

| 层面     | 选型                                    |
| -------- | --------------------------------------- |
| 包管理   | pnpm workspace（`workspace:*` 协议）    |
| 构建编排 | Nx（缓存 + affected builds）            |
| 构建工具 | Vite（library mode 构建共享包）         |
| 框架     | React 18                                |
| 样式     | TailwindCSS + postcss-mobile-forever（px → vw，桌面端 580px 封顶居中） |
| 状态     | Zustand                                 |
| 动效     | Motion for React（`motion/react`，根 package.json 共享）   |
| 测试     | Vitest                                  |
| 语言     | TypeScript                              |

---

## 2. Monorepo 结构

```
new-type-web/
├── apps/                          # 活动页应用（每个独立构建部署）
│   └── campaign-template/         # 活动页模板脚手架
├── packages/                      # 共享包
│   ├── ui/                        # 通用功能组件（Loading/Toast/Modal/LazyImage/Skeleton）
│   ├── hooks/                     # 通用 React Hooks
│   ├── request/                   # 网络请求封装（axios + 拦截器 + 错误处理）
│   ├── utils/                     # 纯工具函数（无外部依赖）
│   ├── analytics/                 # 埋点 SDK
│   ├── headless/                  # 无样式行为组件（Tab 等，样式由消费者控制）
│   └── config/                    # 共享配置（eslint/tsconfig/tailwind/vite preset）
├── scripts/                       # 工程化脚本
│   ├── create-campaign.ts         # 创建新活动页
│   ├── validate-section.ts        # Section 结构验证
│   ├── verify-section.ts          # 单 Section 验证
│   ├── validate-integration.ts    # 接口集成验证
│   └── build-campaign.ts          # 构建指定活动页
├── docs/                          # 文档
│   ├── architecture.md            # 本架构文档
│   ├── campaign-template.md       # 活动页模板说明
│   └── ai/
│       └── README.md              # 自动化开发规则入口
├── pnpm-workspace.yaml
├── nx.json                        # Nx 配置
├── package.json                   # 根 package.json
└── tsconfig.json                  # 根 tsconfig
```

---

## 3. 共享包（packages）设计

### 3.1 包清单

| 包名                    | `package.json` name       | 职责                     | 核心依赖           | 典型导出                                                     |
| ----------------------- | ------------------------- | ------------------------ | ------------------ | ------------------------------------------------------------ |
| `packages/ui`           | `@new-type/ui`            | 通用 UI 组件（缩窄范围） | React, TailwindCSS | Loading, Toast, Modal, LazyImage, Skeleton                   |
| `packages/hooks`        | `@new-type/hooks`         | 通用 React Hooks         | React              | `useCountdown`, `useScrollDirection`, `useShare`, `useWechatShare` |
| `packages/request`      | `@new-type/request`       | 网络请求封装             | axios              | `createRequest()`, 拦截器, 统一错误处理                      |
| `packages/utils`        | `@new-type/utils`         | 纯工具函数               | 无外部依赖         | `formatDate`, `parseUrlParams`, `throttle`, `debounce`, `storage` |
| `packages/analytics`    | `@new-type/analytics`     | 埋点 SDK                 | 无 UI 依赖         | `track()`, `pageView()`, `click()`                           |
| `packages/headless`     | `@new-type/headless`      | 无样式行为组件           | React              | `<Tab.Root>`, `<Tab.List>`, `<Tab.Trigger>`, `<Tab.Content>` |
| `packages/config`       | `@new-type/config`        | 共享配置                 | 无运行时依赖       | eslint 配置、tsconfig、tailwind preset、vite 共享配置        |

### 3.2 依赖关系（仅向下依赖，无循环）

```
headless → react（仅 peer）
ui → headless, hooks
hooks → utils
request → utils
analytics → utils
```

### 3.3 每个包的目录规范

```
packages/<name>/
├── src/
│   └── index.ts            # 统一导出入口
├── package.json             # name: "@new-type/<name>"
├── tsconfig.json            # extends: "@new-type/config/tsconfig/react.json"
├── vite.config.ts           # Vite library mode 构建
```

> 测试统一使用根目录 `vitest.config.ts`，各包不独立配置。

### 3.4 `@new-type/ui` 范围说明

**仅包含纯功能性、无业务样式的组件**，活动页视觉风格差异大时不强加样式：

| 保留组件       | 原因                     |
| -------------- | ------------------------ |
| Loading        | 通用加载指示器，可配置   |
| Toast          | 轻提示，纯逻辑层         |
| Modal          | 弹窗壳（蒙层/关闭/动画） |
| LazyImage      | 图片懒加载，纯逻辑       |
| Skeleton       | 骨架屏加载占位           |

**不放入的组件**：HeroSection、PrizeCard、Button（各活动用 Tailwind 自实现）

---

## 4. 活动页模板（campaign-template）— 多层协作架构

### 4.1 核心设计原则

活动页代码按**角色职责**分层，各层修改边界清晰：

| 层             | 目录              | 职责                                      |
| -------------- | ----------------- | ----------------------------------------- |
| 视觉层         | `designer/`       | 纯视觉组件、展示数据、各状态视图          |
| 交互内核       | `activity/`       | AppState、actions、reducer，保持纯 TS      |
| 粘合层         | `runtime/`        | 连接 store / activity 和视觉组件、状态路由 |
| 生产逻辑层     | `integrations/`   | Store/API/adapter/fixture/埋点/配置        |
| 预览层         | `playground/`     | 单组件预览、流程预览、完整页面 phone-preview |
| 本地国际化资源 | `i18n/`           | 活动内文案、语言和 RTL 配置                |

### 4.2 目录结构

```
apps/campaign-template/
├── src/
│   ├── main.tsx                     # 入口，?mode=designer → Playground
│   ├── app.tsx                      # 重导出 runtime/app （线上入口）
│   │
│   ├── contracts/                   # 🔷 类型契约（所有角色共享）
│   │   └── section.ts               # SectionStatus, SectionProps, StateViews
│   │
│   ├── activity/                    # 页面内部交互内核（纯 TS）
│   │   ├── types.ts                 # AppState / DomainState / UiState / AppAction
│   │   ├── initial-state.ts         # createInitialAppState
│   │   ├── actions.ts               # 业务 command / action creator
│   │   └── reducer.ts               # 纯状态变更
│   │
│   ├── designer/                    # 🎨 设计师视觉层
│   │   └── sections/
│   │       └── <SectionName>/
│   │           ├── types.ts          # 数据接口定义
│   │           ├── content.ts        # 默认展示数据
│   │           ├── index.tsx         # 纯视觉组件
│   │           └── states.tsx        # 条件必需：loading/empty/error 等 UI 状态视图
│   │
│   ├── runtime/                     # 🤖 AI 粘合层
│   │   ├── app.tsx                  # 线上根组件（store 驱动）
│   │   └── sections/
│   │       └── <Name>Container.tsx   # 状态路由容器
│   │
│   ├── integrations/                # 👨‍💻 开发者生产逻辑层
│   │   ├── store.ts                 # Zustand 外壳，包 activity appState/dispatch
│   │   ├── api.ts                   # API 函数；VITE_USE_MOCK=true 时动态加载 mock
│   │   ├── tracking.ts              # 埋点
│   │   ├── constants.ts             # 活动配置
│   │   ├── adapters/                # DTO → SectionState<Content>
│   │   ├── fixtures/                # 后端样例 / mock JSON + fixture source 记录
│   │   └── mock/                    # mock 唯一运行时入口
│   │
│   ├── i18n/                        # 活动本地国际化资源
│   │   ├── en.ts
│   │   ├── zh.ts
│   │   ├── ar.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── playground/                  # 🔍 设计师预览环境
│   │   ├── index.tsx                # Playground 入口
│   │   ├── SectionPanel.tsx         # hover 状态切换面板
│   │   ├── ScenarioRunner.tsx       # 场景执行器（实况渲染）
│   │   ├── FlowInspector.tsx        # 浮动流程面板（自动播放）
│   │   ├── phone-preview.tsx        # 完整页面手机壳独立入口
│   │   ├── preview-state.ts         # RuntimeViewState 初始化
│   │   ├── section-registry.ts      # Section 注册
│   │   └── scenarios/               # 场景定义
│   │
│   └── index.css                    # Tailwind 入口 + 活动级全局样式
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── postcss.config.js
```

### 4.3 数据流

```
                    designer/
                   components (纯视觉)
                        ↑  content props
                        │
integrations/  ───→  activity/  ───→  runtime/  ───→  UI (ui 包)
 store/api              reducer          containers
 adapters               actions          (状态路由)
 tracking
```

- 视觉组件只通过 `content` props 接收数据，不直接引用 store 或 API
- `integrations/store.ts` 使用 Zustand 暴露顶层 `domain / ui / sections`，其中 `sections` 保存 adapter 输出后的 `SectionState<Content>`
- Runtime container 负责：用 Zustand hook selector 直接订阅 `s.sections.<name>`、`s.domain.*`、`s.ui.*` 等原始字段 → 选择渲染 designer 组件或状态视图
- Runtime container 禁止把 projection helper 作为 Zustand hook selector；需要组合多个字段时，在 container/hook 中派生 ViewModel
- 开发者修改 `integrations/` 不影响 `designer/` 的视觉代码

### 4.4 入口路由

```
main.tsx
  ├── ?mode=designer  →  playground/     ← 设计师预览
  └── (无参数)         →  runtime/app     ← 线上正式页面
```

---

## 5. 工程化脚本

### 5.1 create-campaign.ts

```bash
pnpm create-campaign <campaign-name>
```

创建新活动页，基于 `campaign-template` 复制。新建活动必须落在 `apps/<campaign-name>/`，禁止直接在 `apps/campaign-template/` 中做业务实现。

### 5.2 build-campaign.ts

```bash
pnpm --filter @new-type/<campaign-name> build
```

构建指定活动页。根目录 `pnpm build` 仍用于 Nx affected 构建。

### 5.3 验证脚本

```bash
pnpm --silent verify-section --campaign <campaign-name> <SectionName>
pnpm validate-section --campaign <campaign-name> --all
pnpm validate-integration --campaign <campaign-name>
```

验证脚本用于检查 Section 结构、单 Section 闭环和接口集成边界。

---

## 6. 共享配置包（packages/config）

```
packages/config/
├── eslint/
│   ├── base.js
│   └── react.js
├── tsconfig/
│   ├── base.json
│   └── react.json
├── tailwind/
│   └── preset.js              # Tailwind 预设（主题色、移动端断点配置）
├── vite/
│   └── campaign-base.ts       # Vite 共享配置（含 postcss-mobile-forever）
└── package.json
```

---

## 7. 命名规范

| 层级              | 规范                            | 示例                           |
| ----------------- | ------------------------------- | ------------------------------ |
| 共享包名          | `@new-type/<name>`              | `@new-type/request`            |
| 活动应用目录      | `campaign-<year>-<event>`       | `campaign-2026-new-year`       |
| 设计师 Section    | `<Name>Section` 结尾            | `HeroSection.tsx`              |
| 设计师组件        | 功能名                          | `CountdownTimer`               |
| 状态视图          | `<Status>State` / 直接导出函数  | `HeroLoading`, `PrizeEmpty`    |
| Runtime 容器      | `<Name>Container` 结尾          | `HeroContainer.tsx`            |
| content 数据      | `content.ts` + `defaultContent` | `defaultContent`               |
| types 接口        | `types.ts` + `<Name>Content`    | `HeroContent`                  |

---

## 8. 相关文档

| 文件 | 用途 |
| --- | --- |
| `docs/campaign-template.md` | 活动页模板结构、运行方式和模板约束 |
| `docs/ai/README.md` | 自动化开发规则入口 |
| `docs/ai/framework-map.md` | 共享包引用地图 |
