# 设计素材输入规则

用于所有需要根据设计图创建、复用或修改 H5 活动项目的 skill。开始分析设计素材前必须先加载本文档。

## 强制基础规范

必须同时加载并遵守 `agents/shared/DESIGN.md`。

`DESIGN.md` 是所有 H5 活动页设计与实现的基础规范和设计底线，优先级高于具体风格表达。原型图、视觉参考图和文字描述可以决定页面结构、视觉方向和局部表现，但不能突破 `DESIGN.md` 中关于移动端 H5、可读性、可点击性、布局安全区、模块边界、750px 设计稿 px 写法与 px→vw 适配、工程可落地性的要求。

当没有视觉参考图且没有文字描述时，使用 `DESIGN.md` 中的默认视觉方向。

## 素材类型

### 原型图（页面结构）

- 定义页面结构：模块划分、模块顺序、元素数量、位置和页面关系。
- 典型特征：线框风格、占位符方块、结构性标注文字。
- 原型图中的文字通常是结构说明，不作为最终文案；颜色和样式不作为视觉参考。

### 视觉参考图（视觉风格）

- 定义视觉方向：配色方案、整体风格、质感、氛围和图形语言。
- 典型特征：真实配色、纹理、完整视觉效果。

### 文字描述（可选补充）

- 设计师通过文字补充活动主题、风格关键词、配色偏好、业务限制等。
- 如果设计师没有提供，主动询问是否需要补充。

## 优先级规则

1. 页面结构以原型图为准。
2. 视觉风格以视觉参考图 + 文字描述为准。
3. 当视觉参考图与文字描述冲突时，文字描述优先。
4. 所有输入都必须受「强制基础规范」约束。
5. 对视觉方向、页面结构或关键交互不确定时，暂停并向设计师确认，禁止自行猜测。

## 原型图与参考图职责边界

### 原型图 = 信息架构与交互结构，必须严格遵守

原型图决定：

- 页面数量、模块顺序、模块层级。
- 每个模块的内容类型、元素数量、相对位置。
- 列表、卡片、宫格、轮播、弹窗等结构形态。
- 按钮位置、入口位置、弹窗关系。
- 状态数量与状态切换关系。

禁止因为视觉参考图而改变原型图中的结构形态。

例如：原型图是「充值档位卡 + 奖励宫格 + 左右箭头」，不能因为参考图里有纵向 level 任务列表，就改成纵向任务列表。

### 视觉参考图 = 视觉表现，只能套用到原型结构上

视觉参考图决定：

- 配色。
- 材质质感。
- 字体气质。
- 光影、描边、装饰复杂度。
- 背景氛围。
- 按钮、卡片、弹窗的视觉风格。

视觉参考图不能决定：

- 模块是否增删。
- 模块顺序。
- 列表变宫格、宫格变列表、轮播变纵向列表。
- 奖励数量、按钮位置、弹窗关系。

### 冲突处理

当视觉参考图的视觉结构与原型图结构不一致时：

1. 结构一律按原型图。
2. 只提取视觉参考图的颜色、质感、装饰语言。
3. 如果认为视觉参考图中的结构更适合，必须先向设计师确认，不能自行替换。

## 原型图信息抽取规则

为了减少从原型图/参考图到代码生成过程中的信息丢失，结构分析不能只停留在自然语言描述。凡是提供原型图，必须在第 2 步结构规划中把原型图信息转成以下 5 类结构化产物：

1. **Layout Spec（几何锁定表）**：锁定结构、布局、尺寸、间距、对齐和层级。
2. **Interaction Spec（交互链路表）**：锁定入口、动作、目标 Section、状态变化和互斥规则。
3. **Effect Spec（效果锁定表）**：锁定触发后用户实际看到的第一帧、过渡过程、结束状态、弹窗遮挡时机和预览一致性。
4. **Uncertainty List（不确定项清单）**：列出无法从原型图稳定判断的关键布局、交互或效果问题，并向设计师确认。
5. **Image Asset Inventory（图片资产清单）**：锁定头像、礼物、奖品、道具、主视觉、背景、装饰和图标的来源、字段名、渲染方式、占位图和 fallback。

这些产物是后续组件设计卡和代码实现的输入，不是可选说明。凡素材中出现图片类元素，还必须输出 **Image Asset Inventory**，否则不得进入实现阶段。

### Layout Spec（几何锁定表）

Layout Spec 采用“关键元素强约束 + 普通装饰弱约束”。

#### Section 级约束

每个 Section 必须记录：

| 字段 | 说明 |
|---|---|
| `order` | 页面自上而下的顺序 |
| `section` | Section 名称 |
| `role` | hero / user-info / task-progress / reward-list / cta / modal 等 |
| `container` | full-bleed / card / inline / overlay |
| `width` | 750px 设计稿下的宽度规则 |
| `verticalPosition` | 与上一个 Section 的关系和间距 |
| `heightBehavior` | fixed / min-height / content-driven |
| `backgroundOwner` | page / section / card |
| `notes` | 结构来源或特殊约束 |

#### 关键元素级约束

进度条、主按钮、抽奖入口、领取按钮、弹窗入口、排行榜、任务列表、奖励卡片等关键元素必须记录：

| 字段 | 说明 |
|---|---|
| `element` | 元素名称 |
| `parentSection` | 所属 Section |
| `position` | top / center / bottom / left / right / inline / overlay |
| `size` | width / height / min-height，无法精确时记录相对规则 |
| `spacing` | margin / gap / padding |
| `alignment` | left / center / right / space-between |
| `layer` | normal / floating / sticky / fixed / overlay |
| `responsive` | fixed ratio / content wrap / scroll / clamp |
| `mustPreserve` | 是否为必须保留的结构 |

#### 普通装饰级约束

背景光效、金币、丝带、纹理、角标等普通装饰只需要记录：

| 字段 | 说明 |
|---|---|
| `element` | 装饰名称 |
| `belongsTo` | 所属页面或 Section |
| `approximatePosition` | 大致位置 |
| `visualRole` | 氛围 / 分隔 / 强调 / 品牌露出 |
| `canAdjust` | 是否允许实现时微调 |

禁止把关键元素降级成普通装饰。比如原型图上的进度条、领取按钮、弹窗入口必须进入关键元素级约束。

### Interaction Spec（交互链路表）

Interaction Spec 是交互链路的唯一真源。代码中的 `defaultActions`、`preview-state`、`stateTransitions` 和 Runtime actions 命名必须与 Interaction Spec 对齐。

每条交互链路必须记录：

| 字段 | 说明 |
|---|---|
| `id` | 稳定编号，如 I01 |
| `triggerSection` | 触发方 Section |
| `element` | 触发元素 |
| `userAction` | click / swipe / scroll / timeout 等 |
| `actionHandler` | 代码中的 action 回调名 |
| `targetSection` | 目标 Section，没有跨 Section 目标时写 self |
| `targetChange` | 目标状态或 content 变化 |
| `closeOrReset` | 关闭、复位或回退方式 |
| `mutex` | 禁用、互斥或节流条件 |

### Effect Spec（效果锁定表）

Effect Spec 是后续实现阶段 `Effect Reasoning` 的上游依据，必须回答“用户触发后实际看见什么”。不能只写“调用 action”或“打开弹窗”，必须把触发过程、动画/过渡、结束状态和目标 Section 出现时机写清楚。

每条效果必须记录：

| 字段 | 说明 |
|---|---|
| `id` | 稳定编号，如 E01 |
| `source` | 对应 Interaction Spec id 或业务状态 |
| `section` | 效果发生的 Section |
| `trigger` | click / swipe / timeout / dataChange 等 |
| `firstFrame` | 触发后第一帧用户看到什么 |
| `duringEffect` | 动画、过渡、禁用、加载或视觉反馈期间用户看到什么 |
| `endState` | 效果结束后用户看到什么 |
| `targetTiming` | 目标 Section / 弹窗 / 结果态何时变化：immediately / afterAnimation / afterDelay |
| `blockingOverlay` | 是否有弹窗、遮罩或跳转覆盖当前效果，及出现时机 |
| `mutex` | 效果期间禁用、互斥或节流规则 |
| `previewParity` | Runtime 与 `phone-preview` 是否必须一致 |

示例：

```md
| id | source | section | trigger | firstFrame | duringEffect | endState | targetTiming | blockingOverlay | mutex | previewParity |
|---|---|---|---|---|---|---|---|---|---|---|
| E01 | I07 | CritWheelSection | click crit | 中心按钮禁用，转盘开始旋转 | 盘面旋转 900ms，结果弹窗不出现 | 转盘停止，结果弹窗打开 | afterAnimation | CritResultModalSection 在动画完成后覆盖 | spinning/noChance 禁用重复点击 | runtime 与 phone-preview 都等待动画完成 |
```

示例：

```md
| id | triggerSection | element | userAction | actionHandler | targetSection | targetChange | closeOrReset | mutex |
|---|---|---|---|---|---|---|---|---|
| I01 | HeroSection | rule button | click | onOpenRule | RuleModalSection | isOpen=true, displayMode=overlay | onCloseRule | none |
| I02 | TaskSection | claim button | click | onClaimReward | RewardModalSection | isOpen=true, rewardId=current | onCloseReward | disabled when claimed |
| I03 | WheelSection | spin button | click | onSpin | ResultModalSection | after spinning, isOpen=true | onCloseResult | disabled when spinning/no chances |
```

### Uncertainty List（不确定项清单）

当以下信息无法从原型图稳定判断时，必须暂停确认，禁止自行脑补后进入实现：

- Section 边界不清楚。
- 关键元素归属不清楚。
- 关键元素相对顺序不清楚。
- 进度条、按钮、入口的父级不清楚。
- fixed / sticky / scroll / overlay 行为不清楚。
- 弹窗触发来源、关闭方式或目标状态不清楚。
- 多状态差异不清楚。
- 关键元素是否必须保留不清楚。

Uncertainty List 必须写入结构锁定表；所有关键布局和关键交互不确定项必须在第 3.5 步设计方案审批前解决或明确标记为设计师接受的实现假设。

## 使用要求

- 规划方案中必须明确区分哪些结论来自原型图，哪些结论来自视觉参考图或文字描述。
- 规划方案中必须输出「结构锁定表」，逐项说明原型图结构、参考图可借鉴内容和禁止改动项。
- 结构锁定表必须包含 Layout Spec、Interaction Spec、Effect Spec 和 Uncertainty List。
- 当存在图片类元素时，结构锁定表必须包含 Image Asset Inventory；当不存在时，必须明确写“无图片资产”。
- 动态业务图片必须规划为 `<img>`，并预留语义化 `Content` 字段；静态装饰图片可规划为 CSS `background-image` 或 `<img aria-hidden="true">`。
- 默认缺图使用目标 app 内 SVG 占位图，禁止在实现阶段用纯色 div、CSS 方块或 emoji 替代业务图片。
- 需要生成图片资源时，风格必须以视觉参考图和文字描述为依据；不得脱离参考图自行推断。
- 同一页面内生成图片的风格必须统一。
- 编写图片生成 prompt 时明确指定：风格、配色、构图要求、`not photorealistic`、`no text` 等约束。

### 图片生成工具

使用 `dreamina` CLI 生成图片资源：

- 命令：`dreamina text2image`，生成后统一下载到项目 `images/` 目录。
- 常见生成类型：顶部 Banner、页面背景、奖品/礼物卡片、抽奖主视觉、装饰边框等。
