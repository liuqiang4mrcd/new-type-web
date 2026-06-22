---
name: design-input
description: H5 活动页需求收集、素材分析和结构规划能力模块。用于 designer agent 的第 1-2 步，产出 demand、structure、Layout Spec、Interaction Spec、Effect Spec、不确定项和状态适配分析。
---

# Design Input Skill

用于需求收集、素材分析和结构规划。开始前必须读取：

- `agents/shared/DESIGN.md`
- `agents/shared/DESIGN_INPUT.md`
- `docs/campaign-template.md`

## 第 1 步：需求收集

必须明确并写入 `.feedback/demand.md`：

- 活动类型：抽奖、充值、排行榜、品牌宣传等。
- 输入素材：原型图、视觉参考图、文字描述。
- 视觉约束：品牌色、字体、风格、禁用方向。
- 目标受众和终端：默认移动端 H5。
- 目标 app：新项目为 `apps/<campaign-name>`，未确认时保持 pending。

语言要求：

- `.feedback/demand.md`、`.feedback/structure.md`、`.feedback/progress.md` 和对用户输出的需求/结构方案必须使用中文。
- `Layout Spec`、`Interaction Spec`、`Section`、`actionHandler`、状态 key、文件路径、命令和代码标识符保留英文，不翻译成中文标识符。
- 若素材中存在英文 UI 文案，必须区分“原图文案”和“建议最终文案”；除非用户明确要求英文活动页，最终展示文案默认规划为中文。

写入要求：

- 第 1 步开始时创建或更新 `.feedback/progress.md`。
- 需求摘要确认后写入 `.feedback/demand.md`。
- 更新 `.feedback/progress.md` 的“全局流程”“当前阶段”和“下一步动作”。
- 禁止只在对话中输出内容而不写入文件。

## 第 2 步：素材职责边界

原型图负责结构：

- 页面数量、模块顺序、模块层级。
- 内容类型、元素数量、相对位置。
- 列表、卡片、宫格、轮播、弹窗等结构形态。
- 按钮位置、入口位置、弹窗关系。
- 状态数量与状态切换关系。

视觉参考图负责视觉：

- 配色、质感、字体气质、光影、描边、装饰复杂度、背景氛围。

冲突规则：

- 结构以原型图为准。
- 视觉以视觉参考图和文字描述为准。
- 文字描述与视觉参考图冲突时，文字描述优先。
- 视觉参考图不能改变原型图结构；确需改变时必须先向用户确认。

## 第 2 步：结构规划产物

必须写入 `.feedback/structure.md`，并在新项目模式等待用户确认。

### 结构归属推理（先于 Section 拆分）

在输出 Section 拆分前，必须先判断原型图中关键元素的父级归属，禁止按“看见一个功能就拆一个 Section”的方式机械拆分。

判断顺序：

1. 先识别原型图中的视觉容器：同一张卡片、同一块背景、同一个浮层、同一个转盘、同一个列表容器。
2. 再识别业务闭环：展示信息、按钮入口、按钮状态、领取态、结果触发是否属于同一个业务模块。
3. 最后才决定 Section 边界。

合并原则：

- 同一视觉卡片内的奖励展示、领取按钮、已领取状态、充值按钮、左右切换，默认归属同一个 Section。
- 只有当一个区域具备独立容器、独立滚动、独立弹窗、独立复用价值或跨页面复用需求时，才拆成独立 Section。
- 弹窗可以是独立 Section，但触发弹窗的按钮仍归属其原始业务 Section；不要为了弹窗触发把按钮拆出单独 Section。
- 若一个按钮改变的是本卡片状态并打开弹窗，Section 归属仍是本卡片，Interaction Spec 再记录跨 Section targetChange。

若无法判断父级归属，必须进入 Uncertainty List；禁止在实现阶段临场调整 Section 拆分。

### 原型重复项完整枚举

凡原型图中存在档位、任务、等级、奖励、排行榜、Tab、规则条目、轮播项、列表项等重复结构，必须先做完整枚举表，再抽象成数据结构。

枚举要求：

- 原型中可见的每一项都要记录，不允许只抽样几项作为示例。
- 若原型中有省略号、分页、滚动或截图截断，必须标记“可见项”和“推测项”，并进入 Uncertainty List。
- 枚举表必须包含原图文案 / 数值、顺序、所属容器、是否可交互、触发动作。
- Section 的 `defaultContent` 只能从完整枚举表裁剪或映射，不能凭记忆重建。

### 行为意图推理（先于 Interaction Spec / Effect Spec）

在写 Interaction Spec 和 Effect Spec 前，必须先完成行为意图推理，目标是理解“这个动态元素为什么存在、用户预期看到什么反馈”，而不是靠关键词套规则。

推理步骤：

1. 识别动态线索：箭头、倒计时、进度、公告、广播、抽奖、转盘、领取、弹窗、关闭、刷新、状态标签、数量变化等。
2. 判断动态线索的职责：信息更新、注意力引导、操作反馈、状态解释。
3. 判断表现形态：静态展示、自动轮播、跑马灯、手动切换、动画过渡、延迟结果、遮罩弹窗。
4. 判断节奏和互斥：是否自动播放、是否循环、是否暂停、是否禁用重复点击、弹窗是否等待动画完成。
5. 将结论写入“行为意图推理表”，再落到 Interaction Spec 和 Effect Spec。

行为意图推理表至少包含：

| 字段 | 说明 |
| --- | --- |
| sourceElement | 原型中的动态线索或元素 |
| observedClue | 从原型观察到的线索，而不是最终结论 |
| likelyIntent | 信息更新 / 注意力引导 / 操作反馈 / 状态解释 |
| possibleBehaviors | 静态 / 轮播 / 跑马灯 / 切换 / 动画 / 弹窗等候选 |
| chosenBehavior | 最终选择 |
| reason | 为什么选择该行为 |
| uncertainty | 不确定项；关键不确定必须确认 |

如果行为意图无法稳定判断，必须进入 Uncertainty List；禁止只因为文案含有某个词就强行推断具体效果。

### 结构锁定表

记录：

- 原型图结构。
- 可借鉴的视觉参考内容。
- 禁止改动项。

### Layout Spec

必须包含三类约束。

Section 级：

| 字段 | 说明 |
| --- | --- |
| `order` | 页面自上而下顺序 |
| `section` | Section 名称 |
| `role` | hero / user-info / task-progress / reward-list / cta / modal 等 |
| `container` | full-bleed / card / inline / overlay |
| `width` | 750px 设计稿下宽度规则 |
| `verticalPosition` | 与上一个 Section 的关系和间距 |
| `heightBehavior` | fixed / min-height / content-driven |
| `backgroundOwner` | page / section / card |
| `notes` | 来源或特殊约束 |

关键元素级：

| 字段 | 说明 |
| --- | --- |
| `element` | 元素名称 |
| `parentSection` | 所属 Section |
| `position` | top / center / bottom / left / right / inline / overlay |
| `size` | width / height / min-height，无法精确时记录相对规则 |
| `spacing` | margin / gap / padding |
| `alignment` | left / center / right / space-between |
| `layer` | normal / floating / sticky / fixed / overlay |
| `responsive` | fixed ratio / content wrap / scroll / clamp |
| `mustPreserve` | 是否必须保留 |

普通装饰级：

| 字段 | 说明 |
| --- | --- |
| `element` | 装饰名称 |
| `belongsTo` | 所属页面或 Section |
| `approximatePosition` | 大致位置 |
| `visualRole` | 氛围 / 分隔 / 强调 / 品牌露出 |
| `canAdjust` | 是否允许实现时微调 |

进度条、主按钮、领取按钮、抽奖入口、弹窗入口、任务列表、奖励卡片、排行榜必须作为关键元素，不能降级成普通装饰。

### Interaction Spec

这是交互链路唯一真源。代码中的 `defaultActions`、`ACTION_WIRING`、`stateTransitions` 和 Runtime actions 命名必须与它对齐。

| 字段 | 说明 |
| --- | --- |
| `id` | 稳定编号，如 I01 |
| `triggerSection` | 触发 Section |
| `element` | 触发元素 |
| `userAction` | click / swipe / scroll / timeout |
| `actionHandler` | 代码 action 回调名 |
| `targetSection` | 目标 Section，无跨 Section 目标写 self |
| `targetChange` | 目标状态或 content 变化 |
| `closeOrReset` | 关闭、复位或回退方式 |
| `mutex` | 禁用、互斥或节流条件 |

### Effect Spec

Effect Spec 是用户可见效果的设计锁定表，用于补足 Interaction Spec 只描述“动作和目标”但不描述“用户看见的过程”的问题。凡存在点击、切换、抽奖、领取、弹窗、进度推进、倒计时、滚动、展开收起、禁用态变化等效果，都必须写入 Effect Spec。

| 字段 | 说明 |
| --- | --- |
| `id` | 稳定编号，如 E01，建议与 Interaction Spec id 对齐 |
| `source` | 对应的 Interaction Spec id、状态变化或业务阶段 |
| `section` | 发生效果的 Section |
| `trigger` | 用户动作或业务触发，如 click / timeout / dataChange |
| `firstFrame` | 触发后第一帧用户看到什么 |
| `duringEffect` | 动画、过渡、禁用、加载或视觉反馈期间用户看到什么 |
| `endState` | 效果结束后用户看到什么状态 |
| `targetTiming` | 跨 Section 目标变化何时发生，如 immediately / afterAnimation / afterDelay |
| `blockingOverlay` | 是否有弹窗、遮罩、跳转覆盖当前效果；若有，说明出现时机 |
| `mutex` | 效果期间是否禁用按钮、节流、阻止重复触发 |
| `previewParity` | `runtime` 与 `phone-preview` 是否必须一致，以及一致点 |

强交互组件的 Effect Spec 必须明确：

- 动画目标是不是关键元素本身。例如转盘应说明“盘面旋转”，不是只说明“点击暴击”。
- 弹窗或结果态是否等待动画结束后出现。
- 禁用态或无机会态是否仍允许点击。
- `phone-preview` 和 Runtime 的表现是否一致。

如果无法从原型图判断效果过程，必须进入 Uncertainty List 或向用户确认；禁止在实现阶段临场脑补关键效果。

### Uncertainty List

以下不确定时必须暂停确认：

- Section 边界或关键元素归属不清楚。
- 关键元素顺序、父级、间距不清楚。
- fixed / sticky / scroll / overlay 行为不清楚。
- 弹窗触发、关闭、目标状态不清楚。
- 多状态差异不清楚。
- 关键元素是否必须保留不清楚。

所有关键不确定项必须在第 3.5 步设计方案审批前解决，或明确标记为用户接受的实现假设。

## 状态适配分析

每个 Section 必须先判断组件类型，再声明状态；禁止默认套用 loading / empty / error / ready。

| Section 类型 | UI 状态 | business 状态 | interaction 状态 |
| --- | --- | --- | --- |
| 静态展示 / 规则弹窗 | 通常无 loading / empty / error | 按活动阶段可选 | open / closed 等真实交互 |
| 数据列表 / 奖励列表 | 按数据源决定 | beforeStart / inProgress / ended | 展开、筛选、翻页等 |
| 强交互组件 / 转盘 / 领取 | 按数据源决定 | 按活动阶段声明 | 必须声明并提供 stateTransitions |
| 纯视觉装饰 | 通常无 | 通常无 | 通常无 |

只有 `supportedStates` 中声明为 `type: 'ui'` 且 `required: true` 的状态，才需要 `states.tsx`、`stateViews` 和 Container 状态分支。

## 交付检查

- `.feedback/demand.md` 已存盘。
- `.feedback/structure.md` 已存盘。
- `.feedback/progress.md` 已更新。
- 新项目模式下，结构锁定表、Layout Spec、Interaction Spec、Effect Spec 和关键不确定项已获得用户确认。
