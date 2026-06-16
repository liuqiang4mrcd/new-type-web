# AI 开发规则

> 最后更新：2026-06-16（反馈机制 Phase 1 — 交互状态机 + Actions Props + 三层验证）

## 目录边界

- `apps/*` — 活动页应用，每个独立部署，不互相引用
- `packages/*` — 共享包，业务逻辑放在这里，按职责拆分
- `scripts/` — 工程化脚本，不包含业务逻辑

## 活动页内部三层架构

每个活动页 `apps/<campaign>/src/` 内按角色分为三层：

| 目录             | 负责人   | 职责                     | AI 能否修改 |
| ---------------- | -------- | ------------------------ | ----------- |
| `designer/`      | 设计师   | 纯视觉组件、展示数据     | 仅 content  |
| `runtime/`       | AI       | 连接 store 和视觉组件    | ✅ 主力     |
| `integrations/`  | 开发者   | Store / API / 埋点 / 配置 | 按需        |
| `playground/`    | 设计师   | 预览环境                 | ❌          |
| `contracts/`     | 所有角色 | 类型定义                 | ✅          |

### AI 修改边界

| 场景                           | 改什么文件                                      | 禁止做的事               |
| ------------------------------ | ----------------------------------------------- | ------------------------ |
| 新 section 视觉 + 数据          | `designer/sections/<Name>/{types,content,index,states}.tsx` | 不要调用 store 或 API    |
| 新 section 连接数据             | `runtime/sections/<Name>Container.tsx`          | 不要改 visual 组件       |
| 数据接口变更                   | `types.ts`（改接口）+ `runtime/`（改容器）         | 不要直接改 index.tsx     |
| 新增 API / Store / 埋点         | `integrations/{store,api,tracking}.ts`           | 不要绕开 integrations    |
| 设计师调整视觉                  | 不动，由设计师手动改                             | AI 绝不自动改 designer 代码 |

## 引用规则

- 所有共享包通过 `@new-type/*` 引用
- 使用 workspace 协议：`"@new-type/utils": "workspace:*"`
- 禁止跨 apps 引用
- packages 之间只向下依赖（utils → request → hooks → headless → ui）

## 文件命名

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 设计师 Section（四文件） | `designer/sections/<Name>/{types,content,index,states}.tsx` | `HeroSection/` |
| Section 类型接口 | `types.ts` 中 `<Name>Content` | `HeroContent` |
| Section 默认数据 | `content.ts` 中 `defaultContent` | |
| Section 状态视图 | `states.tsx` 中直接 export | `HeroLoading`, `HeroError` |
| Runtime 容器 | `<Name>Container.tsx` | `HeroContainer.tsx` |
| Playground 场景 | `playground/scenarios/<name>.ts` | `lottery.ts` |
| Store | `integrations/store.ts` | |
| Hook | `use<Name>.ts` | `useCountdown.ts` |
| 工具函数 | 功能名 | `formatDate.ts` |

## Section 四文件约定

每个视觉 section 必须包含四个文件：

```txt
designer/sections/HeroSection/
├── types.ts          # 数据接口定义（HeroContent）
├── content.ts        # 默认展示数据（defaultContent）+ 状态声明（supportedStates）+ 交互状态机（stateTransitions）
├── index.tsx         # 纯视觉组件（通过 content props 接收数据）
└── states.tsx        # [可选] loading/empty/error 状态视图
```

**重要约束**：
- `index.tsx` **禁止** import `useStore`、`createRequest`、`track`（通过 validate #16 分层边界检查检测）
- 所有外部数据通过 `SectionProps<T>` 的 `content` 传入
- 所有外部事件通过 `actions` props 传入（onClick/onSpin/onCrit 等）
- 交互状态机的视觉状态用本地 `useState` 管理，数据状态由 `content` 驱动
- `states.tsx` 中的状态视图只接收 `{ message?: string }` 作为 props

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

## 三层验证体系

每次 Section 生成后必须通过验证，按成本从低到高分层执行：

| 层 | 工具 | 覆盖范围 | 触发时机 |
|----|------|---------|---------|
| Layer 0 — AST 静态检查 | `scripts/validate-section.ts` | 16 项检查：文件完整性、类型声明、状态覆盖、Playground 注册、分层边界等 | 每次 Section 改动后立即执行 |
| Layer 1 — 单元测试 | Vitest + jsdom | 组件渲染、状态转换逻辑、事件处理边界 | Section 含交互逻辑时 |
| Layer 2 — 集成测试 | Playwright | 交互全链路、动效验证、多 Section 协作 | Section 交互逻辑稳定后 |

### Layer 0 验证

```bash
# 验证单个 Section
pnpm validate-section --campaign <campaign-name> <SectionName>

# 示例
pnpm validate-section --campaign campaign-2026-money-rain WheelSection
```

16 项检查清单：

| # | 检查项 | 说明 |
|---|--------|------|
| 1 | 四文件完整性 | types/content/index/states 是否存在 |
| 2 | supportedStates 声明 | content.ts 中是否导出了 supportedStates |
| 3 | stateData 声明 | content.ts 中是否导出了 stateData |
| 4 | UI 状态组件覆盖 | states.tsx 是否导出了所有 required UI 组件 |
| 5 | 业务状态数据覆盖 | stateData 是否包含所有 required 业务状态 |
| 6 | 反向一致性 | stateData 的 key 都在 supportedStates 中声明 |
| 7 | Playground 注册 | section-registry.ts 中已注册 |
| 8 | stateViews 对齐 | 注册项的 stateViews 覆盖所有 UI 状态 |
| 9 | Runtime Container | runtime/sections/ 下有对应 Container |
| 10 | Container 路由完整性 | Container switch 覆盖 loading/empty/error/ready |
| 11 | Store 对齐 | store 中有 SectionState<NameContent> |
| 12 | Runtime 注册 | runtime/app.tsx 中已 import 并渲染 Container |
| 13 | stateTransitions 声明 | 交互 Section 已声明状态转换 |
| 14 | 声明完整性 | stateTransitions 的 from/to 均在 supportedStates 中 |
| 15 | 状态可达性 | 从初始状态出发，所有交互状态可达 |
| 16 | 分层边界检查 | index.tsx 未违规 import useStore/API/埋点 |

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

## 活动页创建流程

1. 运行 `pnpm create-campaign` 交互式创建
2. 在 `designer/sections/` 下创建 Section 四文件
3. 在 `integrations/store.ts` 中添加对应的 store state
4. 在 `runtime/sections/` 下创建 Container
5. 在 `playground/section-registry.ts` 注册新 section
6. 可选：在 `playground/scenarios/` 中添加预览场景
