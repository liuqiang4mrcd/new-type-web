---
name: design-input
description: H5 活动页需求收集、素材分析和结构规划能力模块。用于 designer agent 的第 1-2 步，产出 demand、structure、Layout Spec、Interaction Spec、不确定项和状态适配分析。
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

写入要求：

- 第 1 步开始时创建或更新 `.feedback/progress.md`。
- 需求摘要确认后写入 `.feedback/demand.md`。
- 更新 `.feedback/progress.md` 的 Global Flow、Current phase 和 Next required action。
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
- 新项目模式下，结构锁定表、Layout Spec、Interaction Spec 和关键不确定项已获得用户确认。
