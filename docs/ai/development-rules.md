# AI 开发规则

> 最后更新：2026-06-17（流程预览场景分类与数据流规则）

## 目录边界

- `apps/*` — 活动页应用，每个独立部署，不互相引用
- `packages/*` — 共享包，业务逻辑放在这里，按职责拆分
- `scripts/` — 工程化脚本，不包含业务逻辑

## 活动页内部三层架构

每个活动页 `apps/<campaign>/src/` 内按角色分为三层：

| 目录            | 负责人   | 职责                      | AI 能否修改 |
| --------------- | -------- | ------------------------- | ----------- |
| `designer/`     | 设计师   | 纯视觉组件、展示数据      | ✅ 目标活动内可创建/修改 |
| `runtime/`      | AI       | 连接 store 和视觉组件     | ✅ 主力     |
| `integrations/` | 开发者   | Store / API / 埋点 / 配置 | 按需        |
| `playground/`   | 设计师   | 预览环境、Section 注册、流程预览 | ✅ 按需     |
| `contracts/`    | 所有角色 | 类型定义                  | ✅          |

### AI 修改边界

| 场景                    | 改什么文件                                                  | 禁止做的事                  |
| ----------------------- | ----------------------------------------------------------- | --------------------------- |
| 新 section 视觉 + 数据  | `designer/sections/<Name>/{types,content,index}.tsx` + 条件 `states.tsx` | 不要调用 store 或 API；不要修改 `apps/campaign-template/` 业务实现 |
| 新 section 连接数据     | `runtime/sections/<Name>Container.tsx`                      | 不要改 visual 组件          |
| 新 section 预览注册     | `playground/section-registry.ts` / `playground/scenarios/*` / `playground/phone-preview.tsx` | 不要接入真实 Store 或 API |
| 数据接口变更 / 接口接入 | `designer/sections/<Name>/contract.ts`（动态数据 Section 语义契约）+ `integrations/adapters/` + `integrations/fixtures/` + `runtime/` | 不要直接改 `index.tsx`；不要让 runtime 或 visual 消费 raw DTO |
| 新增 API / Store / 埋点 | `integrations/{store,api,tracking}.ts`                      | 不要绕开 integrations       |
| 设计师调整视觉          | 按用户明确范围修改目标活动的 `designer/sections/*`           | 不要越界修改模板、共享包或未确认的视觉结构 |

## 引用规则

- 所有共享包通过 `@new-type/*` 引用
- 使用 workspace 协议：`"@new-type/utils": "workspace:*"`
- 禁止跨 apps 引用
- packages 之间只向下依赖（utils → request → hooks → headless → ui）

## 文件命名

| 类型                     | 命名规则                                                    | 示例                       |
| ------------------------ | ----------------------------------------------------------- | -------------------------- |
| 设计师 Section（核心文件） | `designer/sections/<Name>/{types,content,index}.tsx`，`states.tsx` 条件必需 | `HeroSection/`             |
| Section 类型接口         | `types.ts` 中 `<Name>Content`                               | `HeroContent`              |
| Section 默认数据         | `content.ts` 中 `defaultContent`                            |                            |
| Section 状态视图         | `states.tsx` 中直接 export                                  | `HeroLoading`, `HeroError` |
| Runtime 容器             | `<Name>Container.tsx`                                       | `HeroContainer.tsx`        |
| Playground 场景          | `playground/scenarios/<name>.ts`                            | `lottery.ts`               |
| Store                    | `integrations/store.ts`                                     |                            |
| Hook                     | `use<Name>.ts`                                              | `useCountdown.ts`          |
| 工具函数                 | 功能名                                                      | `formatDate.ts`            |

## Section 文件约定

每个视觉 section 必须包含核心三文件；仅当存在 required UI 状态时才需要 `states.tsx`：

```txt
designer/sections/HeroSection/
├── types.ts          # 数据接口定义（HeroContent）
├── content.ts        # 默认展示数据（defaultContent）+ 状态声明（supportedStates）+ 交互状态机（stateTransitions）
├── index.tsx         # 纯视觉组件（通过 content props 接收数据）
└── states.tsx        # 条件必需：required UI 状态视图
```

**重要约束**：

- `index.tsx` **禁止** import `useStore`、`createRequest`、`track`（通过 validate #16 分层边界检查检测）
- 所有外部数据通过 `SectionProps<T>` 的 `content` 传入
- 所有外部事件通过 `actions` props 传入（onClick/onSpin/onCrit 等）
- 交互状态机的视觉状态用本地 `useState` 管理，数据状态由 `content` 驱动
- `states.tsx` 只在 `supportedStates` 存在 `{ type: 'ui', required: true }` 时创建，状态视图只接收 `{ message?: string }` 作为 props
- 禁止为了固定文件数量给没有 UI 状态的 Section 生成空状态文件或伪 loading/empty/error

## Runtime Container 模式

每个 visual section 必须有一个对应的 runtime container：

```ts
// runtime/sections/HeroContainer.tsx
// 职责：从 store 读取状态 → 按 status 渲染不同视图
function HeroContainer() {
  const hero = useStore(s => s.hero);
  switch (hero.status) {
    case 'loading': return <HeroLoading />;
    case 'error':   return <HeroError message={hero.error} />;
    case 'empty':   return <HeroEmpty />;
    case 'ready':   return <HeroSection content={hero.content!} />;
  }
}
```

### 接口接入边界

真实接口接入必须遵守 `docs/ai/interface-integration-rules.md`。

- Section 只声明自身需要的展示语义，不声明 API 字段、接口路径或后端 DTO shape。
- 动态数据 Section 必须提供 `contract.ts`，并通过 app-local adapter contract test 验证。
- API DTO 必须先经过 `integrations/adapters/*` 映射成 `SectionState<Content>`，再进入 store 和 runtime。
- runtime container 禁止临时拼接接口字段、解释后端枚举或读取 raw DTO。
- Playground 继续使用 mock content 和 scenario，不接真实 API。

## Playground 访问

设计师预览环境通过 URL 参数激活：

```
http://localhost:5173/?mode=designer
```

此模式下渲染 `playground/index.tsx`，提供：

- `SectionPanel` — 单组件 hover 状态切换 + 交互事件模拟（通过 `defaultActions`）
- `ScenarioRunner` — 场景流程预览（实况渲染 + 自动播放）

### Playground 注册

每个 Section 必须在 `playground/section-registry.ts` 中注册：

```ts
{
  id: 'wheel',
  name: 'WheelSection',
  component: WheelSection,
  defaultContent,
  defaultActions: {               // ← 交互事件的 Playground mock
    onSpin: () => console.log('[Playground] 点击抽奖'),
    onSpinComplete: () => console.log('[Playground] 动画结束'),
  },
  stateViews: { loading: WheelLoading, empty: WheelEmpty, error: WheelError, spinning: WheelSpinning },
}
```

- `defaultActions` 为交互 Section 提供 Playground 中的 console.log 桩函数，使点击事件可观测
- 纯展示 Section 不需要 `defaultActions`

### 流程预览规则

`playground/scenarios/` 的 `流程预览` 是业务流程预览，不是组件目录预览。

#### 场景分类

场景通过 `Scenario.group` 分为两类：

| 类型         | group 值   | 用途                       | 渲染方式                                    |
| ------------ | ---------- | -------------------------- | ------------------------------------------- |
| 整页业务阶段 | `fullpage` | 演示活动整体流程           | 每步渲染 `sections[]` 中所有 Section        |
| 模块局部状态 | `module`   | 聚焦单个组件的多种业务状态 | 每步渲染一个 Section（sections 中一个条目） |

#### 数据结构

```typescript
interface ScenarioStep {
  id: string;
  name: string; // 业务阶段名称
  description?: string;
  sections: Array<{
    sectionId: string; // 对应 section-registry 中的 id
    content?: Record<string, unknown>; // 覆盖 defaultContent 部分字段
    status?: SectionStatus;
  }>;
}
```

**禁止**在 `ScenarioStep` 中使用 `sectionId`/`content`/`status` 顶层单字段——统一使用 `sections[]` 数组。

#### 数据流规则（强制）

- 展示数据 = `{...section.defaultContent, ...step.section.content}`（浅合并）
- **禁止** import `useStore` 或 `integrations/store`——场景数据完全在 Playground 内部自洽
- `ScenarioRunner.tsx` 负责数据合并和渲染，不经过真实 Store
- `phone-preview.tsx` 以 `defaultContent` 作为初始 mock 数据；跨 Section 的弹窗/结果联动只能通过本文件内的 `ACTION_WIRING` 浅合并覆盖，不接入真实 Store。接入接口后完整页面预览切换到 `runtime/app.tsx`

#### 命名要求

- 步骤名称为真实业务阶段，如「活动开始前」「进行中」「结束」「可抽奖」「无次数」「已领取」
- 禁止 Section 清单式命名：`HeroSection -> UserAssetSection -> WheelSection`
- 阶段差异通过 `content` 覆盖表达，不能靠临时文案

> 流程预览的验收要求见 `docs/ai/section-implementation-gate.md` §最终验收。
> `actions` 联动和 `phone-preview.tsx` 的 ACTION_WIRING 细节见 `agents/skills/section-implementation/SKILL.md`。

### 弹窗交互规则

完整页面中的弹窗必须由真实页面入口触发，默认关闭，且可关闭。

必须遵守：

- 规则弹窗由页面中的 `rule` 入口触发，不得在页面底部额外添加浮动 `rule` 调试按钮。
- 奖励弹窗由 `claim`、抽奖完成、领取成功等真实业务事件触发，不得在完整页面中额外显示 `reward / 10% / prop` 调试按钮列表。
- 弹窗关闭按钮必须同时更新 UI 状态，点击后弹窗应从页面消失。
- 单组件预览可以注册默认打开态或 mock actions，以便查看弹窗样式；该逻辑只能存在于 Playground 单组件上下文，不得影响完整页面和 runtime。
- 弹窗单组件预览必须渲染在组件预览框内部，禁止 `fixed inset-0` 覆盖整个 Playground 页面。必须通过 `displayMode: 'inline' | 'overlay'` 字段区分单组件预览与完整页面 runtime。
- 弹窗组件 `types.ts` 中 Content 接口必须包含 `isOpen: boolean` 和 `displayMode?: 'inline' | 'overlay'`。
- 弹窗组件 `index.tsx` 中：
  - `overlay` 模式：`fixed inset-0 z-50 flex items-center justify-center`，遮罩 `onClick` 可关闭
  - `inline` 模式：`relative flex min-h-[420px|300px] w-full items-center justify-center`，保留深色遮罩，遮罩不可点击关闭
  - 内层卡片宽度用 `width: calc(100% - Npx)` + `maxWidth`，禁止用 `w-full mx-[Npx]`（会导致溢出被 `overflow-hidden` 裁剪）
- `SectionPanel` 在单组件预览时自动检测弹窗（`'isOpen' in defaultContent`），注入 `isOpen: true + displayMode: 'inline'`。禁止将 `defaultContent.isOpen` 设为 `true`。
- Runtime/store 可控制 `isOpen`、`variant` 等弹窗状态；视觉组件只能通过 `content` 和 `actions` 接收，不得直接 import store。

建议回归检查：

```bash
# 初始页面不应出现弹窗；点击真实入口后出现；点击关闭后消失
pnpm --filter @new-type/<campaign> build
pnpm validate-section --campaign <campaign> --all
```

## 三层验证体系

每次 Section 生成后必须通过验证，按成本从低到高分层执行：

| 层                     | 工具                          | 覆盖范围                                                               | 触发时机                    |
| ---------------------- | ----------------------------- | ---------------------------------------------------------------------- | --------------------------- |
| Layer 0 — AST 静态检查 | `scripts/validate-section.ts` | 17 项检查：文件完整性、类型声明、状态覆盖、Playground 注册、Runtime 联动、分层边界等 | 每次 Section 改动后立即执行 |
| Layer 1 — 单元测试     | Vitest + jsdom                | 组件渲染、状态转换逻辑、事件处理边界                                   | Section 含交互逻辑时        |
| Layer 2 — 集成测试     | Playwright                    | 交互全链路、动效验证、多 Section 协作                                  | Section 交互逻辑稳定后      |

### Layer 0 验证

```bash
pnpm validate-section --campaign <campaign-name> <SectionName>
```

> 17 项检查清单、单 Section 验证流程和 `--all` 总验收见 `docs/ai/section-implementation-gate.md`。

### 交互状态机与 Actions Props 模式

交互类 Section 的组件架构：

```
index.tsx (纯视觉 + 本地 useState 状态机)
  │
  ├── content props ← content.ts (defaultContent + stateTransitions)
  ├── actions props ← Container 传入 (onClick/onSpin/onCrit 等事件回调)
  │
  └── useState 管理界面状态机（idle→spinning→result 等纯视觉状态）
```

- `index.tsx` 管理的是**视觉状态机**（spinning 动画、slide 动效等），数据状态由 `content` 驱动
- 复杂交互（如 API 调用、数据变更）通过 `actions` 回调通知 Container 层
- `content.ts` 中 `stateTransitions` 声明完整的视觉状态转换图，供验证工具三向校验

## 引用即断言（文件存盘规则）

**任何在对话摘要、Relevant Files、状态记录中列出的文件路径，都必须是已确认存在于磁盘上的真实文件。**

- 在引用文件路径时，必须先写入磁盘，或确认文件已存在
- 禁止在摘要中列出"计划要创建"或"对话中提到过"但未写入的文件路径
- 违反此规则等同于记录不存在的证据

违反案例：

- 对话中输出了 `.feedback/*.md` 的完整内容，但从未写入磁盘 → ❌ 文件不存在
- 在 Relevant Files 中列出 `apps/money-rain/.feedback/demand.md`，但该文件从未被创建 → ❌ 引用不存在文件

## 文档输出语言

AI 生成的文档类内容（README、设计文档、注释、PRD、计划、issue、变更记录等），如无特殊说明，**必须使用中文输出**。

| 内容类型                           | 语言要求                             |
| ---------------------------------- | ------------------------------------ |
| 文档（README、设计文档、规则文件） | 中文（默认）                         |
| 代码注释                           | 中文注释解释逻辑，英文术语按惯例保留 |
| PRD / 技术方案                     | 中文                                 |
| 变更记录 / 更新日志                | 中文                                 |
| Git commit message                 | 英文（遵循 git 惯例）                |
| AI 内部推理 / 思考过程             | 中文                                 |
| 用户明确要求英文的内容             | 按用户要求                           |

## 活动页创建流程

1. 运行 `pnpm create-campaign` 交互式创建
2. 在 `designer/sections/` 下创建 Section 核心文件和必要状态视图
3. 在 `integrations/store.ts` 中添加对应的 store state
4. 在 `runtime/sections/` 下创建 Container
5. 在 `playground/section-registry.ts` 注册新 section
6. 可选：在 `playground/scenarios/` 中添加预览场景
