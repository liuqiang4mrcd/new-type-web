# 端到端实施输出规则

> `designer` agent 的端到端实施范围和输出规范

## 操作范围

`designer` agent 在新活动端到端实施时，操作范围限定在目标活动应用 `apps/<campaign>/src/` 和该活动的 `.feedback/` 记录内，不得越界修改其他活动或共享工程代码。

## 输出语言

- `.feedback/` 下所有需求、结构、设计、组件设计卡、进度账本、验证记录和最终收尾说明默认使用中文。
- 活动页用户可见默认文案默认使用中文；只有用户明确要求英文、多语言或按素材英文还原时，才输出英文或多语言文案。
- 代码标识符、类型名、Section 名、action 名、状态 key、命令、文件路径、CSS/Tailwind 类名和第三方库名按工程惯例保留英文。

| 目录 / 文件 | 职责 | 可操作 |
| --- | --- | --- |
| `designer/sections/` | 视觉 Section 核心文件、展示数据、状态视图 | ✅ 创建/修改 |
| `playground/` | Section 注册、场景、完整页预览联动 | ✅ 创建/修改 |
| `runtime/` | Container、线上渲染顺序、Runtime actions | ✅ 创建/修改 |
| `integrations/store.ts` | SectionState、mock 状态、端到端联动所需本地状态 | ✅ 按需修改 |
| `assets/` | 图片/资源文件 | ✅ 添加 |
| `.feedback/` | 需求、结构、设计、进度和组件设计卡 | ✅ 创建/更新 |

## 禁止操作

- ❌ `integrations/api.ts` / `integrations/tracking.ts` — 真实 API、埋点接入默认归开发者，除非用户明确要求
- ❌ `contracts/` — 类型契约默认只读；只有验证器或已确认方案要求新增通用契约时才可修改
- ❌ `packages/*` — 共享包
- ❌ `scripts/` — 工程化脚本
- ❌ 其他 `apps/*` 活动应用
- ❌ `apps/campaign-template/` 业务实现修改；它只能作为复制源和结构参考

## Section 输出格式

每个视觉 Section 按“核心三文件必需、状态视图条件必需”输出：

```
designer/sections/<Name>/
├── types.ts          # <Name>Content 接口定义
├── content.ts        # defaultContent + supportedStates + stateData + 必要的 stateTransitions
├── index.tsx         # 纯视觉组件，通过 SectionProps<Content> 接收数据
└── states.tsx        # 仅当 supportedStates 存在 required UI 状态时必需
```

约束：

- `index.tsx` 不能 import store、API、埋点，所有数据通过 `content` props 传入
- `types.ts` 中接口名以 `Content` 结尾
- `content.ts` 导出名为 `defaultContent`
- `content.ts` 必须导出 `supportedStates` 和 `stateData`
- 只有 `supportedStates` 中存在 `{ type: 'ui', required: true }` 时，才创建 `states.tsx` 并导出对应 UI 状态组件
- 禁止为了满足固定文件数量而给没有 UI 状态的 Section 生成空 `states.tsx` 或伪 loading/empty/error
- Section 实现必须保留第 2 步 Layout Spec 中声明的关键元素位置、尺寸、间距、对齐、层级和响应规则。
- 交互实现必须以第 2 步 Interaction Spec 为唯一真源，`defaultActions`、`ACTION_WIRING`、`stateTransitions` 和 Runtime actions 命名必须与其一致。
- 若实现时发现 Layout Spec 或 Interaction Spec 无法落地，必须暂停并回到结构规划/设计方案确认，禁止自行改结构或改 action 命名。
- Section 边界必须继承第 2 步“结构归属推理”。同一视觉卡片 / 同一业务闭环内的展示、按钮、领取态和局部切换默认属于同一个 Section；禁止为了让实现更方便而拆出孤立按钮 Section 或孤立状态 Section。

## Layout Spec 保真要求

代码输出必须区分关键元素和普通装饰：

- **关键元素**：进度条、主按钮、抽奖入口、领取按钮、弹窗入口、排行榜、任务列表、奖励卡片等，必须按 Layout Spec 保留父级归属、相对顺序、尺寸规则、间距、对齐和层级。
- **普通装饰**：背景光效、金币、丝带、纹理、角标等，可以在不破坏关键元素可读性和点击性的前提下微调。

实现关键布局时必须优先使用明确的布局约束：

- 固定设计稿尺寸在 CSS/Tailwind 中使用 750px 设计稿 px，由 `postcss-mobile-forever` 按 `viewportWidth: 750` 转换为 vw。JS 运行时尺寸使用 `@new-type/utils` 的 `vw()`。
- 重复项使用 grid/flex 明确列数、gap、padding 和对齐。
- 进度条、按钮、卡片等固定格式元素必须给出稳定尺寸或 `min-height`，避免文案、状态和 hover 导致布局跳动。
- 弹窗、浮层、sticky/fixed 元素必须明确层级和定位归属。

禁止事项：

- 禁止把原型图中的关键进度条、按钮、入口或列表当作可自由调整的装饰。
- 禁止因为视觉参考图更好看而改变 Layout Spec 中锁定的模块顺序、父子关系或交互入口位置。
- 禁止只凭自然语言印象重建布局；必须能追溯到结构锁定表中的 Layout Spec。

## Interaction Spec 对齐要求

交互代码输出必须能逐条追溯到 Interaction Spec：

| Interaction Spec 字段 | 代码落点 |
|---|---|
| `actionHandler` | `section-registry.ts` 的 `defaultActions`、Runtime Container actions |
| `targetSection` / `targetChange` | `phone-preview.tsx` 的 `ACTION_WIRING` 和 Runtime Store action 状态更新 |
| `userAction` | 视觉组件 `index.tsx` 中绑定的事件 |
| `mutex` | disabled、loading、spinning、claimed 等互斥逻辑 |
| `closeOrReset` | 弹窗关闭、状态复位或重新进入 idle 的 action |

跨 Section 交互必须同时在 `phone-preview.tsx` 的 `ACTION_WIRING` 和 Runtime Store action 中体现；组件内部交互状态必须在 `content.ts` 的 `stateTransitions` 中体现。所有 TODO 占位必须在最终 4.3 收尾前清除。

Runtime 联动要求：

- 若 Interaction Spec 的 `targetSection` 不是 `self`，或 `targetChange` 会改变其他 Section 的 `content/status`，`integrations/store.ts` 必须声明并实现对应 action，例如 `openRule / closeRule / openReward / closeReward / openCritResult / closeCritResult / openTip / closeTip`。
- Runtime Container 必须将该 Store action 绑定到视觉组件的 `actions` props。`console.log` 只能用于 back/share/recharge 等外部跳转或暂未接入真实能力的非目标状态变化事件。
- `phone-preview.tsx` 的 `ACTION_WIRING` 只负责设计阶段 mock 预览，不能替代 Runtime Store 联动。
- Final Closeout 前必须逐条核对 `defaultActions / ACTION_WIRING / stateTransitions / Store actions / Runtime Container actions`，确保命名和目标变化均与 Interaction Spec 一致。

### 状态声明要求

每个 Section 的 `content.ts` 必须通过 `supportedStates` 声明所有状态：

```typescript
export const supportedStates: StateDeclaration[] = [
  // UI 状态（对应 states.tsx 中独立组件）
  { key: "loading", type: "ui", required: true },
  { key: "empty", type: "ui", required: true },
  { key: "error", type: "ui", required: true },
  // 业务状态（复用主组件，仅换数据）
  { key: "beforeStart", type: "business", required: true },
  { key: "inProgress", type: "business", required: true },
  { key: "ended", type: "business", required: true },
  // 交互状态（本地 useState 管理的视觉阶段，受 stateTransitions 驱动）
  { key: "idle", type: "interaction", required: true },
  { key: "spinning", type: "interaction", required: true },
  { key: "result", type: "interaction", required: true },
] as const;
```

- **UI 状态**：对应 `states.tsx` 中导出的独立组件（loading/empty/error）
- **业务状态**：输入数据不同但复用主组件（beforeStart/inProgress/ended）
- **交互状态**：组件内部 `useState` 管理的动态 UI 阶段（idle/spinning/result 等），由 `stateTransitions` 驱动转换，必须在 `supportedStates` 中以 `type: 'interaction'` 声明

### 状态转换声明 (stateTransitions)

交互类 Section 必须在 `content.ts` 中声明视觉状态转换图：

```typescript
import type { StateTransition } from "../../../contracts/section";

export const stateTransitions: StateTransition[] = [
  {
    from: "idle",
    to: "spinning",
    trigger: { type: "click", handler: "onSpin" },
  },
  {
    from: "spinning",
    to: "result",
    trigger: { type: "timeout", handler: "onSpinComplete", duration: 3000 },
  },
  {
    from: "result",
    to: "idle",
    trigger: { type: "click", handler: "onReset" },
  },
  {
    from: "spinning",
    to: "idle",
    trigger: { type: "click", handler: "onReset" },
  },
];
```

- `from` / `to` 必须对应 `supportedStates` 中 `type: 'interaction'` 的状态 key
- `trigger.type` 支持: `click`（用户点击）、`timeout`（自动定时）、`swipe`（滑动）、`scroll`（滚动）
- `trigger.handler` 对应 `actions` props 中的回调函数名
- `trigger.duration` 仅用于 `type: 'timeout'`，单位 ms
- 可选 `animation` 字段：`animation?: { type: 'slide' | 'fade' | 'scale', duration: number, easing: string }`，用于声明状态转换时的动效

### 动画落地要求

`stateTransitions.animation` 不是文档说明，必须在视觉组件中真实落地。凡 `content.ts` 声明了动画，`index.tsx` 必须有对应的 DOM / CSS / class / inline style / animation event 绑定，并能从用户操作触发到可见变化。

活动页已内置 Motion for React 时，强交互动效默认优先使用 `motion` 包的 `motion/react`，包括抽奖转盘、翻牌、档位切换、卡片进出场和弹窗入退场。只有 hover、pressed、简单 opacity/transform 过渡或纯装饰微动，才优先使用 CSS transition/keyframes。若不用 `motion/react` 实现强交互动效，组件设计卡必须写明原因。

强交互组件必须额外声明和实现：

- 动画目标：例如转盘盘面、进度条填充、卡片滑动容器；禁止只切换状态但没有任何视觉变化。
- 动画持续时间：实现中的 CSS/JS duration 必须与 `stateTransitions.animation.duration` 保持一致或在组件设计卡中说明差异。
- 结果展示时机：如果动作结束会打开弹窗或切换遮罩，目标弹窗/遮罩不得在动画首帧立即覆盖动画；必须等动画完成或达到可感知时长后再打开。
- 禁用互斥：动画期间按钮应禁用或节流，避免重复触发。

转盘 / 抽奖类组件的硬性规则：

- `spin` 动画必须绑定到转盘盘面或奖品环，不应只改变中心按钮状态。
- 中心按钮是否跟随旋转必须在组件设计卡中明确；默认中心按钮不随盘面旋转。
- 结果弹窗应在旋转动画结束后打开，`Runtime Container` 和 `phone-preview.tsx ACTION_WIRING` 都必须保持同样延迟语义。
- Final Closeout 前必须用浏览器检查：点击抽奖后动画 class/style 生效，动画期间结果弹窗未出现，动画结束后结果弹窗出现。

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

### 完整页预览背景一致性

`runtime/app.tsx` 和 `playground/phone-preview.tsx` 必须使用同一个页面根背景。新活动从模板复制后，禁止保留模板默认浅灰背景（如 `#f7f8fb` / `bg-white`）作为 `phone-preview` 的 `<main>` 背景，除非该浅色正是已确认视觉方案的页面底色。

实现要求：

- 页面级背景色或背景图应来自 `.feedback/design.md` 的视觉方案。
- 常规访问根容器（通常是 `runtime/app.tsx` 的 `<main>`）和移动端完整页预览根容器（`playground/phone-preview.tsx` 的 `<main>`）必须一致。
- 如果 Section 之间存在 margin、透明区、弹窗关闭后的页面尾部或内容不足一屏，露出的必须是活动页面底色，而不是模板底色或 Playground 外层背景。
- Final Closeout 前必须直接访问 `?mode=phone-preview`，检查 `main` 计算后的 `background-color` 或背景类是否与 runtime 根背景一致。

### 单组件预览完整性

单组件预览是 Section 验收入口，不是装饰性展示。每个 Section 在 `?mode=designer` 的 single 模式中必须满足：

- 组件主体完整可见；超高组件必须在预览区域内可滚动。
- 组件宽度不得依赖整页 viewport 才能显示完整；必要时使用预览容器适配或组件内部 `max-width`。
- fixed / overlay / absolute 元素不得逃逸并遮住整个 Playground，弹窗按 inline/overlay 区分。
- 不得因 Playground 外层 `max-w-lg`、`overflow-hidden` 或卡片边界导致关键按钮、进度条、列表、转盘被裁切。
- 单组件预览失败时，优先调整 Playground 预览容器或 Section 响应约束，而不是降低 Layout Spec 中的关键元素要求。

### 场景分类

场景通过 `Scenario.group` 字段分为两类：

| group      | 类型         | 用途                                                 | 渲染方式                                            | 示例                                |
| ---------- | ------------ | ---------------------------------------------------- | --------------------------------------------------- | ----------------------------------- |
| `fullpage` | 整页业务阶段 | 演示活动整体流程，每步展示用户在该阶段看到的完整页面 | 每步渲染 `sections[]` 中所有 Section，纵向排列      | 活动开始前 / 进行中 / 结束          |
| `module`   | 模块局部状态 | 聚焦验证单个组件的多种业务状态                       | 每步渲染一个 Section（`sections[]` 中只放一个条目） | 可抽奖 / 无次数 / 已领取 / 弹窗打开 |

### 数据结构

```typescript
interface ScenarioStep {
  id: string;
  name: string; // 业务阶段名称，如「等待活动开启」
  description?: string;
  sections: Array<{
    sectionId: string; // 对应 section-registry 中的 id
    content?: Record<string, unknown>; // 覆盖 defaultContent 的字段（浅合并）
    status?: SectionStatus; // 切换到 loading/empty/error 状态视图
  }>;
}

interface Scenario {
  id: string;
  label: string; // 场景名称
  description?: string;
  group: "fullpage" | "module"; // 场景分类
  steps: ScenarioStep[];
  autoPlayDelay?: number;
}
```

### 数据流规则（强制）

- 每个 Section 的最终展示数据通过浅合并生成：`{...defaultContent, ...step.section.content}`。只覆盖需要变化的字段，未覆盖的保持 `defaultContent` 原值。
- **禁止**在场景中 import `useStore`、`integrations/store` 或任何真实数据流模块——场景数据必须全部来自 `defaultContent` + `content` override。
- 场景数据的处理（合并、渲染）全部在 `playground/ScenarioRunner.tsx` 内部自洽完成。
- `phone-preview.tsx`（完整页面预览）永远是设计阶段的 mock 数据排版工具，它以 `defaultContent` 作为初始内容，跨 Section 的弹窗/结果联动只能通过 `ACTION_WIRING` 浅合并覆盖。接入真实接口后，完整页面预览应切换至 `runtime/app.tsx`（真实 Store + Container）。

### 命名要求

- 步骤名称必须表达真实用户阶段，例如「活动开始前」「活动进行中」「活动结束」「可抽奖」「无抽奖次数」「已领取」。
- 每个步骤可以渲染一个或多个 Section，以复现该阶段用户实际看到的页面组合。
- 某个阶段没有业务意义的模块可以不显示；禁止为了凑流程把所有 Section 按目录顺序逐个播放一遍。
- 业务阶段差异优先通过 `content` 覆盖表达（如倒计时归零、按钮禁用、空数据、已领取态），不能靠临时文案解释。

错误示例：

- `Hero -> UserAsset -> RewardTier -> Wheel` 这种 Section 清单式步骤命名。

正确示例：

- 整页场景：`等待活动开启 -> 充值选档/领取/抽奖 -> 活动结束`。
- 模块场景：`可抽奖 -> 抽奖动画 -> 无抽奖次数` / `未领取 -> 已领取 -> 不可领取`。

## 弹窗交互输出

弹窗必须服务于页面真实交互链路，不能成为页面中的孤立调试入口。

要求：

- 规则弹窗、奖励弹窗、提示弹窗等默认必须关闭。
- 完整页面中的弹窗必须由真实页面按钮或业务事件触发，例如头图 `rule` 按钮打开规则弹窗、`claim` 打开奖励弹窗、抽奖完成打开结果弹窗。
- 弹窗打开后必须提供可点击关闭入口，关闭后应从完整页面中消失。
- 禁止在完整页面底部或任意无关位置额外添加 `rule / reward / prop / 10%` 等调试按钮列表。
- 弹窗 Section 可以在单组件预览中注册默认打开态，或在右侧单组件控制区域通过 content/actions 触发，方便设计师查看样式；该预览入口不得泄漏到完整页面。
- 弹窗单组件预览必须渲染在组件预览框内部，禁止使用 `fixed inset-0` 覆盖整个 Playground 页面。需要通过 `displayMode: 'inline' | 'overlay'` 字段区分预览态和完整页面态。
- 弹窗组件实现要点：
  - `types.ts` 中 Content 接口必须包含 `isOpen: boolean` 和 `displayMode?: 'inline' | 'overlay'`。
  - `index.tsx` 入口守卫：`if (!content.isOpen) return null;`
  - `overlay` 模式（完整页面）：外层容器使用 `fixed inset-0 z-50 flex items-center justify-center`，遮罩 `onClick` 可关闭弹窗。
  - `inline` 模式（单组件预览）：外层容器使用 `relative flex min-h-[420px|300px] w-full items-center justify-center`，同样保留深色遮罩背景；遮罩 `onClick` **不应关闭弹窗**，防止预览时意外消失。
  - 内层弹窗卡片**必须使用 `width: calc(100% - {左右margin之和}px)` + `maxWidth` 属性**，例如 `width: calc(100% - 60px); maxWidth: 670px;`。**禁止使用 `w-full mx-[30px]` 组合**——`w-full`（100%宽）+ `mx-[30px]`（左右各30px margin）会导致内容宽度溢出父容器（总宽 = 100% + 60px），被 `SectionPanel` 的 `overflow-hidden` 裁剪。
- `SectionPanel`（`playground/SectionPanel.tsx`）在单组件预览中必须自动检测弹窗类 Section：
  - 检测方式：判断 `section.defaultContent` 中是否存在 `isOpen` 字段
  - 检测到弹窗后自动注入：`{ ...baseContent, isOpen: true, displayMode: 'inline' }`
  - 禁止为了预览而将 `defaultContent.isOpen` 硬编码为 `true`
- 若弹窗逻辑由 runtime/store 控制，视觉组件只通过 `content.isOpen` 和 `actions.onClose*` 接收状态与事件，不应直接 import store。
