# 设计输出规则

> 设计师的操作范围和输出规范

## 操作范围

设计师的操作范围限定在活动应用 `apps/<campaign>/src/` 下的特定目录，不得越界修改其他层级的代码。

| 目录 | 职责 | 可操作 |
|------|------|--------|
| `designer/sections/` | 视觉 Section 四文件 | ✅ 创建/修改 |
| `playground/` | 预览环境注册 | ✅ 注册新 Section |
| `assets/` | 图片/资源文件 | ✅ 添加 |

## 禁止操作

- ❌ `integrations/` — 生产逻辑层（Store/API/埋点），归开发者
- ❌ `runtime/` — AI 粘合层容器
- ❌ `contracts/` — 类型契约（只读，不可修改）
- ❌ `packages/*` — 共享包
- ❌ `scripts/` — 工程化脚本

## Section 输出格式

每个视觉 section 严格按四文件模式输出：

```
designer/sections/<Name>/
├── types.ts          # <Name>Content 接口定义
├── content.ts        # export const defaultContent: <Name>Content
├── index.tsx         # 纯视觉组件，通过 SectionProps<Content> 接收数据
└── states.tsx        # [可选] <Name>Loading / <Name>Empty / <Name>Error
```

约束：
- `index.tsx` 不能 import store、API、埋点，所有数据通过 `content` props 传入
- `types.ts` 中接口名以 `Content` 结尾
- `content.ts` 导出名为 `defaultContent`

### 状态声明要求

每个 Section 的 `content.ts` 必须通过 `supportedStates` 声明所有状态：

```typescript
export const supportedStates: StateDeclaration[] = [
  // UI 状态（对应 states.tsx 中独立组件）
  { key: 'loading', type: 'ui', required: true },
  { key: 'empty',   type: 'ui', required: true },
  { key: 'error',   type: 'ui', required: true },
  // 业务状态（复用主组件，仅换数据）
  { key: 'beforeStart', type: 'business', required: true },
  { key: 'inProgress',  type: 'business', required: true },
  { key: 'ended',       type: 'business', required: true },
  // 交互状态（本地 useState 管理的视觉阶段，受 stateTransitions 驱动）
  { key: 'idle',     type: 'interaction', required: true },
  { key: 'spinning', type: 'interaction', required: true },
  { key: 'result',   type: 'interaction', required: true },
] as const;
```

- **UI 状态**：对应 `states.tsx` 中导出的独立组件（loading/empty/error）
- **业务状态**：输入数据不同但复用主组件（beforeStart/inProgress/ended）
- **交互状态**：组件内部 `useState` 管理的动态 UI 阶段（idle/spinning/result 等），由 `stateTransitions` 驱动转换，必须在 `supportedStates` 中以 `type: 'interaction'` 声明

### 状态转换声明 (stateTransitions)

交互类 Section 必须在 `content.ts` 中声明视觉状态转换图：

```typescript
import type { StateTransition } from '../../../contracts/section';

export const stateTransitions: StateTransition[] = [
  { from: 'idle', to: 'spinning', trigger: { type: 'click', handler: 'onSpin' } },
  { from: 'spinning', to: 'result', trigger: { type: 'timeout', handler: 'onSpinComplete', duration: 3000 } },
  { from: 'result', to: 'idle', trigger: { type: 'click', handler: 'onReset' } },
  { from: 'spinning', to: 'idle', trigger: { type: 'click', handler: 'onReset' } },
];
```

- `from` / `to` 必须对应 `supportedStates` 中 `type: 'interaction'` 的状态 key
- `trigger.type` 支持: `click`（用户点击）、`timeout`（自动定时）、`swipe`（滑动）、`scroll`（滚动）
- `trigger.handler` 对应 `actions` props 中的回调函数名
- `trigger.duration` 仅用于 `type: 'timeout'`，单位 ms
- 可选 `animation` 字段：`animation?: { type: 'slide' | 'fade' | 'scale', duration: number, timing: string }`，用于声明状态转换时的动效

## Playground 注册

创建 section 后，必须在 `playground/section-registry.ts` 中注册：

```ts
{
  id: 'wheel',
  name: 'WheelSection',
  component: WheelSection,
  defaultContent,
  defaultActions: {                 // ← 交互事件桩函数，使 Playground 可测试
    onSpin: () => console.log('[Playground] 点击抽奖'),
    onSpinComplete: () => console.log('[Playground] 动画结束'),
    onReset: () => console.log('[Playground] 重置'),
  },
  stateViews: { loading: WheelLoading, empty: WheelEmpty, error: WheelError, spinning: WheelSpinning },
}
```

- `defaultActions`: 为交互 Section 提供 Playground 环境中的 console.log 桩函数。纯展示 Section 不需要此字段。
- `stateViews`: 覆盖 `supportedStates` 中所有 `type: 'ui'` 的状态。`type: 'interaction'` 的状态有独立视图组件时也建议注册。

## Playground 流程预览

`playground/scenarios/` 中的流程预览必须表达活动的业务阶段，而不是 Section 目录顺序。

要求：
- 流程步骤应命名为真实用户阶段，例如「活动开始前」「活动进行中」「活动结束」「已领取」「无抽奖次数」「奖励为空」。
- 每个步骤可以渲染一个或多个 Section，以复现该阶段用户实际看到的页面组合。
- 某个阶段没有业务意义的模块可以不显示；禁止为了凑流程把所有 Section 逐个播放一遍。
- 业务阶段差异优先通过 `content` / `store` / `status` 表达，例如倒计时、按钮文案、禁用态、空态、已结束态。
- 流程预览必须在设计确认和最终验收时检查，确保步骤名称、展示内容和用户路径一致。

错误示例：
- `Hero -> UserAsset -> RewardTier -> Wheel` 这种 Section 清单式流程。

正确示例：
- `活动开始前 -> 活动进行中 -> 活动结束`。
- `未登录 -> 已登录未参与 -> 可领取 -> 已领取`。

## 弹窗交互输出

弹窗必须服务于页面真实交互链路，不能成为页面中的孤立调试入口。

要求：
- 规则弹窗、奖励弹窗、提示弹窗等默认必须关闭。
- 完整页面中的弹窗必须由真实页面按钮或业务事件触发，例如头图 `rule` 按钮打开规则弹窗、`claim` 打开奖励弹窗、抽奖完成打开结果弹窗。
- 弹窗打开后必须提供可点击关闭入口，关闭后应从完整页面中消失。
- 禁止在完整页面底部或任意无关位置额外添加 `rule / reward / prop / 10%` 等调试按钮列表。
- 弹窗 Section 可以在单组件预览中注册默认打开态，或在右侧单组件控制区域通过 content/actions 触发，方便设计师查看样式；该预览入口不得泄漏到完整页面。
- 弹窗单组件预览必须渲染在组件预览框内部，禁止使用 `fixed inset-0` 覆盖整个 Playground 页面。需要通过 `displayMode: 'inline' | 'overlay'` 或同等字段区分预览态和完整页面态。
- 若弹窗逻辑由 runtime/store 控制，视觉组件只通过 `content.isOpen` 和 `actions.onClose*` 接收状态与事件，不应直接 import store。
