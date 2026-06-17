# Designer Agent 反馈机制 — 完整设计方案

> 基于 grilling 共识，2026-06-16

## 1. 问题回顾

设计师 Agent 生成活动页面后存在 4 类问题未被及时捕获：

| # | 问题 | 根因 | 归属层 |
|---|------|------|--------|
| 1 | 首页未更新新组件内容 | Runtime `app.tsx` 缺少 import 和渲染 | Layer 0 静态检查 |
| 2 | 转盘按钮点击不旋转 | `index.tsx` 直接 import store (违规范)，Playground 无 mock actions | Layer 0 + Layer 1 |
| 3 | 档位切换无动效 | 生成时未加入 CSS transition / framer-motion | Layer 1/2 |
| 4 | 首次无左右切换事件 | 缺少校验检查事件绑定 | Layer 0 |

## 2. 架构决策

### 2.1 组件交互模式

**选定：A) actions props 模式**

```
               Playground (mock actions)
                     │
        ┌────────────┴────────────┐
        │   Section(index.tsx)    │
        │   - 本地 useState 管理视觉状态机   │← content + actions props
        │   - 纯视觉，无 store 依赖         │
        └────────────┬────────────┘
                     │ actions
        ┌────────────┴────────────┐
        │  Container / Store      │
        │  - 真实数据 + 副作用      │
        └─────────────────────────┘
```

**规则：**
- **视觉状态机**（spinning/sliding/fading）→ 组件本地 `useState` 管理
- **数据状态**（剩余次数/奖品结果/服务器状态）→ `content` props 流入
- **事件桥接**（点击触发/动画完成通知）→ `actions` 回调
- **禁止** `index.tsx` 直接 `import { useStore }`

### 2.2 复杂状态机处理

```
视觉状态依赖服务器结果时，由 content 驱动：

  点击 GO → 本地 spinning=true (动画开始)
          → actions.onSpin() (通知 store)
          → 3s 后本地 spinning=false (动画结束)
          → 读取 content.prizeResult 展示结果
          → 如需重玩: actions.onReset()
```

Playground 只需切换 `content` 即可模拟不同结果，无需 mock 服务器。

## 3. 状态转换系统

### 3.1 设计阶段：结构锁定表

`designer.md` Step 2 的**交互状态分析**产出转为结构化表格：

| Section | 状态 | 触发条件 | 目标状态 | 动效 | 副作用 |
|---------|------|----------|----------|------|--------|
| WheelSection | idle | 点击 GO 按钮 | spinning | 旋转动画(3s) | 通知 store 扣次数 |
| WheelSection | spinning | 动画结束 | result | — | 读取 content 展示结果 |
| WheelSection | result | 点击关闭 | idle | — | — |

该表格输出到 `structure.md`。

### 3.2 生成阶段：content.ts 结构化声明

扩展 `content.ts`，增加 `stateTransitions` 导出：

```typescript
// contracts/section.ts — 新增类型
export type StateType = 'ui' | 'business' | 'interaction';

export interface StateTransition {
  from: string;
  to: string;
  trigger: {
    type: 'click' | 'timeout' | 'animationend' | 'load' | 'swipe' | 'scroll';
    handler?: string;     // actions.xxx 方法名（click/swipe/scroll 类型必须）
    duration?: number;    // timeout 类型必须
  };
  animation?: {
    type: 'spin' | 'slide' | 'fade' | 'scale' | 'none';
    duration: number;     // 毫秒
    easing?: string;
  };
  description?: string;
}
```

**content.ts 完整示例 (WheelSection)：**

```typescript
import type { StateDeclaration, StateTransition } from '../../../contracts/section';

export const supportedStates: StateDeclaration[] = [
  { key: 'loading',    type: 'ui',          required: true },
  { key: 'empty',      type: 'ui',          required: true },
  { key: 'error',      type: 'ui',          required: true },
  { key: 'idle',       type: 'interaction', required: true },
  { key: 'spinning',   type: 'interaction', required: true },
  { key: 'result',     type: 'interaction', required: true },
] as const;

export const stateTransitions: StateTransition[] = [
  {
    from: 'idle',
    to: 'spinning',
    trigger: { type: 'click', handler: 'onSpin' },
    animation: { type: 'spin', duration: 3000, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
  },
  {
    from: 'spinning',
    to: 'result',
    trigger: { type: 'timeout', duration: 3000 },
  },
  {
    from: 'result',
    to: 'idle',
    trigger: { type: 'click', handler: 'onReset' },
  },
];

export const stateData: Record<string, Partial<WheelContent>> = { /* ... */ };
```

### 3.3 验证阶段：三维校验

校验脚本读取 `stateTransitions`，从三个维度验证：

1. **声明完整性** — 所有 from/to 的 state key 都在 supportedStates 中
2. **状态可达性** — 从初始状态出发，所有状态都能通过转换链到达（graph traversal）
3. **实现一致性** — 每个 transition 在 `index.tsx` 中有对应的 handler 实现

## 4. 三层验证体系

### Layer 0: 静态 AST 检查（毫秒级）

在现有 `validate-section.ts` 基础上新增检查项：

| # | 检查项 | 当前状态 | 新增 | 检测方式 |
|---|--------|----------|------|----------|
| 1 | Section 文件完整性 | ✅ 已有 | — | `types/content/index` 文件存在性；`states` 按 UI 状态条件验证 |
| 2 | supportedStates 声明 | ✅ 已有 | — | AST 解析 |
| 3 | stateData 声明 | ✅ 已有 | — | AST 解析 |
| 4 | UI 状态组件覆盖 | ✅ 已有 | — | AST 解析 |
| 5 | 业务状态数据覆盖 | ✅ 已有 | — | AST 解析 |
| 6 | Playground 注册 | ✅ 已有 | — | AST 解析 |
| 7 | stateViews 对齐 | ✅ 已有 | — | AST 解析 |
| 8 | Runtime Container | ✅ 已有 | — | 文件存在性 |
| 9 | Container 路由完整性 | ✅ 已有 | — | AST 解析 |
| 10 | Store 对齐 | ✅ 已有 | — | AST 解析 |
| **11** | **Runtime 注册** | ❌ 缺失 | ✅ | AST：检查 Container 被 app.tsx import+渲染 |
| **12** | **状态转换声明** | ❌ 缺失 | ✅ | AST：stateTransitions 导出存在 |
| **13** | **声明完整性** | ❌ 缺失 | ✅ | stateTransitions 引用的 key 都在 supportedStates 中 |
| **14** | **状态可达性** | ❌ 缺失 | ✅ | 从初始状态做图遍历，所有状态可达 |
| **15** | **事件绑定检查** | ❌ 缺失 | ✅ | onClick/onChange → actions?.xxx 或 setXxx；禁止 useStore |
| **16** | **分层违规检查** | ❌ 缺失 | ✅ | index.tsx 不得 import store/api/tracking |

### Layer 1: 单元交互验证（秒级）

- **工具**: Vitest + jsdom
- **模式**: 对每个 Section 的交互态做隔离渲染 + 点击断言
- **数据源**: `stateTransitions` 定义驱动测试生成

```typescript
// 以 WheelSection 为例，验证脚本自动生成如下测试：
test('idle → spinning: click GO button triggers spinning state', () => {
  render(<WheelSection content={idleContent} actions={mockActions} />);
  fireEvent.click(screen.getByText('GO'));
  expect(screen.getByTestId('wheel')).toHaveClass('animate-spin-wheel');
  expect(mockActions.onSpin).toHaveBeenCalled();
});
```

### Layer 2: 集成交互验证（分钟级）

- **工具**: Playwright + Playground
- **模式**: 启动 dev server，在 Playground 中渲染 Section，点击交互，断言 DOM
- **覆盖**: 全链路（包括 runtime container 加载、store 数据流转）

## 5. Playground 增强

### 5.1 defaultActions 注册

`section-registry.ts` 增加 `defaultActions` 字段：

```typescript
export interface PlaygroundSection {
  id: string;
  name: string;
  component: ComponentType<any>;
  defaultContent: Record<string, unknown>;
  defaultActions?: Record<string, unknown>;  // ← 新增
  stateViews: Partial<Record<SectionStatus, ComponentType>>;
}
```

注册示例：

```typescript
{
  id: 'wheel',
  name: 'WheelSection',
  component: WheelSection,
  defaultContent: wheelContent,
  defaultActions: {
    onSpin: () => console.log('[Playground] spinning started'),
    onReset: () => console.log('[Playground] reset'),
  },
  stateViews: { loading: WheelLoading, empty: WheelEmpty, error: WheelError },
}
```

### 5.2 SectionPanel 支持交互状态切换

当前 SectionPanel 只支持 4 种状态切换（loading/ready/empty/error），改造为：

```
状态切换按钮动态生成，基于 supportedStates 中 type='interaction' 的 key
```

### 5.3 场景覆盖自动检查

验证脚本新增检查：每个注册的 Section，scenarios 中至少有一个步骤覆盖其 `sectionId`。

## 6. Designer Agent 工作流更新

### 6.1 当前流程（问题）

```
Step 4: 批量生成所有 Section → 手工验证 → 暴露问题
```

### 6.2 新流程（垂直切片）

```
Step 4-1: 选择第一个 Section（按结构锁定表顺序）
Step 4-2: 生成该 Section 核心文件和必要状态视图
Step 4-3: 注册到 Playground + Runtime
Step 4-4: 自动运行 validate（Layer 0 → Layer 1）
Step 4-5: 失败 → 自修复 → 回到 4-4
Step 4-6: 通过 → 确认 → 进入下一个 Section
Step 4-7: 全部完成后运行 Layer 2（Playwright 全量集成验证）
```

Agent 每个 Section 生成后的自检流程：

```
1. content.ts → 写 supportedStates + stateTransitions + stateData
2. types.ts → 定义 Content 接口 + Actions 接口（如果有交互）
3. index.tsx → 实现视觉状态机（useState）+ 绑定 actions
4. 注册 section-registry.ts
5. 注册 runtime/app.tsx + runtime/sections/Container
6. 运行 pnpm validate <section> --layer=0
7. 如果失败 → 读取报告 → 修复 → 回到第 6 步
8. 如果通过 → 继续下一个 Section
```

## 7. 实施优先级

### Phase 1（核心链路）

| 序号 | 任务 | 依赖 |
|------|------|------|
| 1.1 | 扩展 contracts/section.ts：StateType + StateTransition | — |
| 1.2 | 更新 validate checks.ts：新增 #11-#15 检查 | 1.1 |
| 1.3 | Playground SectionPanel 支持 defaultActions props | — |
| 1.4 | 重写 WheelSection：去 useStore + actions props + local state machine | 1.1, 1.3 |
| 1.5 | 重写 CritSection：去 useStore + actions props | 1.1, 1.3 |
| 1.6 | RewardTierSection：补 stateTransitions + 动画 | 1.1 |
| 1.7 | 更新 designer.md 工作流 | 1.0-1.6 |

### Phase 2（验证增强）

| 序号 | 任务 | 依赖 |
|------|------|------|
| 2.1 | Vitest + jsdom 测试框架集成 | — |
| 2.2 | 自动生成 Layer 1 测试用例（基于 stateTransitions） | 1.1, 2.1 |
| 2.3 | validate 脚本支持 `--campaign` 参数（非硬编码 template） | — |

### Phase 3（集成自动化）

| 序号 | 任务 | 依赖 |
|------|------|------|
| 3.1 | Playwright 集成 | 2.2 |
| 3.2 | CI 门禁集成 | 3.1 |
| 3.3 | 其他 campaign 存量代码迁移 | 1.4, 1.5 |

## 8. 校验规则详细说明

### 8.1 状态可达性算法

```typescript
function checkStateReachability(
  states: StateDeclaration[],
  transitions: StateTransition[],
): string[] {
  // 1. 找到初始状态（首个 type='interaction' 或 from 不在任何 to 中的状态）
  const initialState = findInitialState(states, transitions);
  
  // 2. BFS 从初始状态遍历转换图
  const visited = new Set<string>();
  const queue = [initialState];
  while (queue.length > 0) {
    const current = queue.shift()!;
    visited.add(current);
    for (const t of transitions.filter(t => t.from === current)) {
      if (!visited.has(t.to)) queue.push(t.to);
    }
  }
  
  // 3. 检查所有 interaction 状态是否可达
  const interactionStates = states
    .filter(s => s.type === 'interaction')
    .map(s => s.key);
  
  return interactionStates.filter(s => !visited.has(s));
}
```

### 8.2 事件绑定检查 AST 规则

```typescript
// 搜索 index.tsx 中的事件绑定模式

// ✅ 合法绑定:
// onClick={actions?.onSpin}           → actions 模式
// onClick={() => setXxx(...)}          → useState 模式
// onClick={handleClick} 且 handleClick 使用 actions 或 setXxx

// ❌ 非法绑定:
// import { useStore } from '...'      → 直接 import store
// onClick={() => useStore(...)}        → store 调用
// onClick={someStoreAction}            → store action 引用

// ❌ 缺失绑定:
// onClick={undefined}                  → 事件无绑定
// 交互状态转换图中定义的 trigger.type='click' 无对应 onClick
```

## 9. 新项目创建时的默认流程

未来 `pnpm create-campaign` 或 designer agent 新建活动时：

1. 复制 `campaign-template` 到 `apps/<campaign-name>`
2. 自动包含 Layer 0 验证配置
3. 每个 Section 的生成遵循 `generate → validate → fix → next` 流程
4. 完成后 `pnpm validate-all` 通过才视为完成

---

> **下一个步骤**：确认本设计文档，然后进入 Phase 1 的实施计划细化。
