# new-type-web 项目架构设计

> 基于 [需求.md](../需求.md) 生成的项目架构文档
> 日期：2026-06-12（v4，通用依赖提至根 package.json 共享）

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
│   └── build-campaign.ts          # 构建指定活动页
├── docs/                          # 文档
│   ├── architecture.md            # 本架构文档
│   └── ai/
│       ├── development-rules.md   # AI 开发规则（AI 读取）
│       └── framework-map.md       # 共享包引用地图（AI 读取）
│   └── campaign-template.md       # 活动页模板说明
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
└── vitest.config.ts         # 测试配置
```

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

## 4. 活动页模板（campaign-template）— 三层协作架构

### 4.1 核心设计原则

活动页代码按**角色职责**分为三层，各层修改边界清晰：

| 层           | 目录              | 负责人   | 职责                                 |
| ------------ | ----------------- | -------- | ------------------------------------ |
| 视觉层       | `designer/`       | 设计师   | 纯视觉组件、展示数据、各状态视图     |
| 粘合层       | `runtime/`        | AI       | 连接 store 和视觉组件、状态路由      |
| 生产逻辑层   | `integrations/`   | 开发者   | Store/API/埋点/配置                  |

### 4.2 目录结构

```
apps/campaign-template/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx                     # 入口，?mode=designer → Playground
│   ├── app.tsx                      # 重导出 runtime/app （线上入口）
│   │
│   ├── contracts/                   # 🔷 类型契约（所有角色共享）
│   │   └── section.ts               # SectionStatus, SectionProps, StateViews
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
│   │   ├── store.ts                 # Zustand 全局状态
│   │   ├── api.ts                   # API 封装
│   │   ├── tracking.ts              # 埋点
│   │   └── constants.ts             # 活动配置
│   │
│   ├── playground/                  # 🔍 设计师预览环境
│   │   ├── index.tsx                # Playground 入口
│   │   ├── SectionPanel.tsx         # hover 状态切换面板
│   │   ├── ScenarioRunner.tsx       # 场景执行器（实况渲染）
│   │   ├── FlowInspector.tsx        # 浮动流程面板（自动播放）
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
integrations/  ───→  runtime/  ───→  UI (ui 包)
 store/api              containers
 tracking               (状态路由)
```

- 视觉组件只通过 `content` props 接收数据，不直接引用 store 或 API
- Runtime container 负责：从 store 读取状态 → 选择渲染 designer 组件或状态视图
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
pnpm create-campaign
```

交互式创建新活动页，基于 `campaign-template` 复制：
1. 输入活动名称（如 `campaign-2026-new-year`）
2. 自动在 `apps/` 下生成目录
3. 替换 `package.json` 中的 name
4. 生成三层目录骨架

### 5.2 build-campaign.ts

```bash
pnpm build --filter=@new-type/campaign-2026-new-year
```

通过 Nx affected 机制只构建变更的活动页和依赖包。

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

## 8. 文档体系

| 文件                           | 读者      | 用途                             |
| ------------------------------ | --------- | -------------------------------- |
| `docs/architecture.md`         | 人类 + AI | 项目整体架构理解                 |
| `docs/ai/development-rules.md` | AI        | AI 辅助开发时的约束规则          |
| `docs/ai/framework-map.md`     | AI        | 共享包引用地图（什么功能用哪个包） |
| `docs/campaign-template.md`    | AI + 人类 | 活动页模板说明                   |

---

## 9. 协作边界（AI 必须理解）

| 场景                           | 应修改的目录              | 不应修改的目录          |
| ------------------------------ | ------------------------- | ----------------------- |
| 设计师调整视觉布局             | `designer/sections/*`     | `integrations/`         |
| 开发者接入真实 API             | `integrations/api.ts`     | `designer/`（只改 content） |
| AI 为新 section 创建数据连接   | `runtime/sections/*`      | `designer/` 视觉文件    |
| 设计师修改默认展示数据         | `content.ts`              | 不动组件逻辑            |
| 添加新状态视图（loading 等）   | `states.tsx`              | 不动 store              |
| 抽奖逻辑改为真实 API           | `integrations/store.ts`   | 不动 visual             |

---

## 10. AI 友好设计原则

1. **目录即职责**：`designer/` / `runtime/` / `integrations/` / `playground/` 各自独立，AI 根据任务选择目录
2. **Section 文件模式**：`types.ts + content.ts + index.tsx` 为核心文件，`states.tsx` 仅在存在 required UI 状态时创建，AI 可预测文件位置和接口
3. **容器模式**：每个 visual section 对应一个 runtime container，AI 只需改 container 来调整数据流
4. **文档内置**：架构文档、AI 规则、包引用地图都在仓库内，AI 启动时读取
5. **命名可推断**：Container 结尾表示 runtime 粘合层，Section 结尾表示视觉组件
6. **Playground 即契约**：场景定义文件就是开发者的需求文档，AI 读取场景即可理解需要的状态分支
