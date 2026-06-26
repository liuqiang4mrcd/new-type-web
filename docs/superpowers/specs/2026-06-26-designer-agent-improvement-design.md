# Designer Agent 系统改进设计方案

> 基于 grill-me session 对 designer agent 全系统的审计，覆盖 6 个层面 25 项问题。
>
> 编写日期：2026-06-26
> 状态：待评审

---

## 问题域总览

| 层面 | 问题数 | 核心症结 |
|------|--------|---------|
| 架构与编排 | 3 | 编排者无牙齿、入口单一、双 Agent 边界生硬 |
| 文档与规则 | 4 | 规则碎片化、引用链过深、条件读取理想化、文档膨胀 |
| Skill 模块 | 4 | design-input 职责过载、verification 薄弱、visual-design 无反馈闭环、Skill 间无 Contract |
| 流程与工作流 | 5 | 八步流程僵化、确认节点粒度缺失、设计卡 overhead、YAML 表达力有限、逐 Section 串行阻塞 |
| 错误处理与韧性 | 3 | progress.md 单锚点、无外部变更处理、verify-section 单点故障 |
| 实际落地 | 6 | Playground 过度复杂、动效要求超出 LLM 能力、Image Asset 仪式感过重、强制 i18n boilerplate、行为意图推理不可靠、不确定项阈值模糊 |

---

## 改进方案

### P0 — 规则去重收敛（最高优先级）

**问题**：同一条"禁止用 div/CSS 方块/emoji 替代业务图片"在 5 个文件中重复出现。任何一处修改遗漏都会造成规则不一致，且维护成本随文档数量线性增长。

**方案**：收敛重复规则到唯一权威源，其他文件只引用不复制。

**映射表**（高频重复规则 → 唯一源）：

| 规则 | 当前出现位置 | 收敛到 |
|------|-------------|--------|
| 禁止 div/CSS/emoji 替代图片 | designer.md, design-input SKILL.md, section-implementation SKILL.md, section-implementation-gate.md, DESIGN_OUTPUT.md | `DESIGN_OUTPUT.md` 的 Image Asset Gate |
| 用户确认前禁止写代码 | designer.md, section-implementation SKILL.md, AGENTS.md | `designer.md` 的设计方案审批 |
| defaultContent 不得作为 runtime fallback | section-implementation SKILL.md, DESIGN_OUTPUT.md, section-implementation-gate.md | `DESIGN_OUTPUT.md` 的 Runtime 数据边界 |
| 逐 Section 验证不得批量 | section-implementation SKILL.md, section-implementation-gate.md | `section-implementation-gate.md` 的强制执行顺序 |
| 禁止相对路径 import 图片 | section-implementation SKILL.md, DESIGN_OUTPUT.md, section-implementation-gate.md | `DESIGN_OUTPUT.md` 的 ESM import 规则 |
| 动画落地要求（motion/react、duration 对齐） | section-implementation SKILL.md, DESIGN_OUTPUT.md, section-implementation-gate.md | `DESIGN_OUTPUT.md` 的动画落地要求 |
| 弹窗 inline/overlay 双模式 | DESIGN_OUTPUT.md, section-implementation-gate.md | `DESIGN_OUTPUT.md` 的弹窗交互输出 |
| 禁止批量创建多 Section 目录 | section-implementation SKILL.md, section-implementation-gate.md | `section-implementation-gate.md` 的执行粒度硬约束 |

**落地规则**：
- 非权威源中的规则文本替换为 `> 规则权威源见 <FILE> §<SECTION>`
- 权威源文档中的规则章节增加锚点标记（`## <a id="...">` 或使用稳定标题）
- 每个权威源章节末尾注明"本文是此规则的唯一维护点；修改时不需要同步其他文件"

---

### P1 — 阶段间 Contract 验证

**问题**：design-input → visual-design → section-implementation 三个阶段之间，上游产物是否完整只能靠 LLM 阅读判断。上游遗漏字段（如 Layout Spec 缺少某 Section 的 heightBehavior）要到实现阶段才发现。

**方案**：增加两个轻量自动检查命令，作为阶段门禁。

```
demand.md ──→ structure.md ──→ design.md ──→ 实现
              ↑ validate-       ↑ validate-
              structure         design
```

#### `validate-structure` 命令

```bash
pnpm validate-structure --feedback <path-to-feedback-workspace>
```

检查项：

| # | 检查项 | 说明 |
|---|--------|------|
| 1 | `demand.md` 存在 | 需求摘要已存盘 |
| 2 | `structure.md` 存在 | 结构规划已存盘 |
| 3 | Section 拆分表存在 | 包含顺序、名称、职责、数据来源、业务闭环、Tab归属、弹窗复杂度 |
| 4 | Layout Spec 关键元素完整 | 每个 Section 的关键元素（进度条、按钮、入口、列表等）有位置/尺寸/间距/对齐/层级字段 |
| 5 | Interaction Spec 完整 | 每条交互有 id / triggerSection / element / userAction / actionHandler / targetSection / targetChange / closeOrReset |
| 6 | Image Asset Inventory（条件） | 有图片类元素时必须输出完整清单，含 imageKey / Section / imageType / sourceType / dynamic / contentField / renderMethod / placeholder / fallback |
| 7 | Uncertainty List 状态 | 所有项标记为 resolved / accepted-assumption / pending-confirmation；pending 项不得进入下一阶段 |
| 8 | 状态适配分析完整 | 每个 Section 的 UI / business / interaction 状态已声明 |
| 9 | `progress.md` 阶段标记 | 当前阶段 = `structure`，第 2 步已勾选 |
| 10 | `meta.json` 一致 | campaignName / targetApp / status 字段完整 |

#### `validate-design` 命令

```bash
pnpm validate-design --feedback <path-to-feedback-workspace>
```

检查项：

| # | 检查项 | 说明 |
|---|--------|------|
| 1 | `design.md` 存在 | 视觉方案已存盘 |
| 2 | 配色声明完整 | 主色、辅助色、中性色、状态色、背景色 |
| 3 | 字体层级完整 | 字体族、字号层级、字重、行高 |
| 4 | 关键组件样式覆盖 | Header / 倒计时 / Tab / 用户信息 / 进度条 / 奖品卡 / CTA / 排行榜 / 弹窗 |
| 5 | Image Asset Inventory 占位对齐 | design.md 的占位策略与 structure.md 的 Image Asset Inventory 逐项对应 |
| 6 | 设计底线检查 | 首屏视觉焦点、核心标题/按钮可见、卡片/按钮/列表/弹窗风格统一 |
| 7 | `progress.md` 阶段标记 | 当前阶段 = `visual-design`，第 3 步已勾选 |

**失败行为**：
- 检查失败时输出具体缺失项和对应上游文档章节引用
- 禁止跳过门禁进入下一阶段
- 允许用户在确认风险后 `--skip <check-id>` 跳过非阻塞项

---

### P2 — 修改模式完善

**问题**：修改模式的流程描述不到 10 行，而新项目模式约 60 行。实际修改场景远比"改按钮颜色"复杂。

**方案**：扩充 `designer.md` 修改模式章节，按修改类型分级。

#### 修改类型分级

| 级别 | 触发场景 | 流程要求 | 验证要求 |
|------|---------|---------|---------|
| L0: 文案/数据 | 改按钮文案、调整 defaultContent、改静态常量的值 | 读 feedback 工作区 → 改 content.ts → 更新 progress.md | 可选：运行 `verify-section` |
| L1: 样式 | 改颜色、字体、间距、圆角、阴影等 CSS 级变更 | 读 `design.md` + 目标 Section 文件 → 改代码 → 更新 design.md（如涉及视觉方案变更） | 必须：运行受影响 Section 的 `verify-section` |
| L2: 布局 | 调整元素位置、尺寸、对齐、层级 | 读 `structure.md` 对应 Layout Spec + 目标 Section → 更新 Layout Spec → 改代码 | 必须：运行受影响 Section 的 `verify-section` + 单组件预览检查 |
| L3: 结构 | 增删 Section、调整 Section 职责边界、合并或拆分 | 读 `structure.md` 全文 → 更新 Section 拆分表 + Layout/Interaction/Effect Spec → 按新结构实现 → 更新 feedback | 必须：全量 `verify-section --all` + Final Closeout 子集 |
| L4: 交互 | 新增/修改按钮行为、弹窗联动、跨 Section 状态变更 | 读 `structure.md` Interaction Spec → 更新 Interaction/Effect Spec → 改代码 + Store + Container | 必须：全量 `verify-section --all` + 动画一致性人工确认 |

#### 修改模式总流程

```
1. 定位目标 app 和受影响 Section
2. 分级判断（L0-L4），向用户确认修改范围和级别
3. 读当前 feedback 工作区相关产物
4. 按级别要求执行变更
5. 更新 feedback 工作区（demand.md / structure.md / design.md 中受影响的部分）
6. 按级别要求执行验证
7. 报告修改结果
```

#### 跨级组合

单次修改可能跨级（如"改按钮颜色 + 加一个弹窗"同时涉及 L1 + L4）。此时按最高级别执行流程和验证。

---

### P3 — 组件设计卡分级

**问题**：所有 Section 必须填写完整的 25+ 字段组件设计卡才允许写代码。对于静态展示 Section（如纯文本规则弹窗），设计卡 overhead 可能超过代码本身。

**方案**：将组件设计卡字段分为「核心必填」和「条件必填」两级。

#### 核心必填（所有 Section）

```markdown
## <SectionName> Component Card

- Purpose:
- Display:
- Content fields:
- Static constants:
- Async data source: yes/no
- User interactions:
- Actions:
- UI states:
- Business states:
- Edge cases:
```

#### 条件必填

| 条件 | 追加字段 |
|------|---------|
| `Async data source = yes` | supportedStates 的 type:'ui' 声明、stateData、stateViews |
| 存在用户交互 | Interaction Spec refs、Interaction states |
| 强交互（抽奖/转盘/翻牌/滑动切换） | Effect Spec refs、Effect Reasoning、State transitions、Animation binding |
| 命中 Image Asset Inventory | Image Asset refs（imageKeys / content fields / render methods / import paths / placeholders / fallback） |

#### 规则变更点

- `section-implementation SKILL.md` 的"执行顺序 4"和"硬禁令"中，将"禁止组件设计卡缺少 Layout Spec 或 Interaction Spec 引用"改为"核心必填字段不可缺失；条件必填字段在条件未命中时不要求"
- `section-implementation-gate.md` 的"组件设计卡"模板改为分层展示，核心区 + 条件区用视觉分隔

---

### P4 — design-input 职责拆分

**问题**：一个 skill 同时承担需求收集（理解用户意图、归纳摘要）和结构规划（几何分析、Spec 编写），认知负荷过大。

**方案**：拆分为两个独立 skill，各自有明确的输入/输出 Contract。

```
agents/skills/
├── requirement-collection/
│   └── SKILL.md        # 原 design-input 第 1 步
└── structure-planning/
    └── SKILL.md        # 原 design-input 第 2 步
```

#### requirement-collection SKILL.md

| 维度 | 内容 |
|------|------|
| **触发时机** | designer step 1（新项目）/ 修改模式需求不明确时 |
| **输入** | 用户原始需求（文字/图片/参考图） |
| **输出** | `demand.md`（活动类型、素材清单、视觉约束、目标受众、目标 app） |
| **必读** | 本文件全文、`DESIGN_INPUT.md` 素材职责边界章节 |
| **条件读** | 需要判断视觉底线时读 `DESIGN.md` 相关章节 |
| **不输出** | Section 拆分、Layout/Interaction/Effect Spec、Image Asset Inventory |

#### structure-planning SKILL.md

| 维度 | 内容 |
|------|------|
| **触发时机** | demand.md 确认后 |
| **输入** | `demand.md` + 原型图/参考图 |
| **输出** | `structure.md`（Section 拆分、Layout/Interaction/Effect Spec、Image Asset Inventory、Uncertainty List、状态适配分析） |
| **必读** | 本文件全文、`STRUCTURE_OUTPUT.md`、`DESIGN_INPUT.md` 冲突处理章节、`DESIGN_OUTPUT.md` Image Asset Inventory Schema |
| **条件读** | 模板/Playground 不确定时读 `campaign-template.md` |

#### designer.md 变更

- 新项目流程步骤从 8 步变为 9 步（步骤 1 → requirement-collection，步骤 2 → structure-planning）
- Skill 表增加一行
- 读取策略中，需求收集阶段只加载 requirement-collection，禁止预读 structure-planning 的文档

---

### P5 — 允许独立 Section 并行脚手架

**问题**："当前 Section 未通过 verify-section 前，禁止创建后续 Section 的业务文件"保证了质量，但对 5-6 个相互独立 Section 的活动引入了不必要的串行阻塞。

**方案**：区分"脚手架"和"实现+验证"。允许对无相互依赖的 Section 并行创建脚手架，但实现和验证仍逐个进行。

#### 依赖判断规则

两个 Section 相互独立的条件：
- Interaction Spec 中互不为 targetSection
- 不共享同一 Store action（除了 open/close 类通用弹窗 action）
- 不共享同一 Runtime Container 条件渲染分支

#### 并行脚手架许可

满足独立条件时，允许：
- 并行创建多个 Section 目录和占位文件（types.ts / content.ts 骨架 / index.tsx 骨架）
- 并行写入多个组件设计卡

仍然禁止：
- 并行实现完整代码（必须逐个完成）
- 并行注册 Playground / Runtime Container / Store（必须逐个注册并验证）
- 跳过单 Section 验证

#### 规则变更点

- `section-implementation SKILL.md` 执行粒度硬约束：将"禁止创建后续 Section 业务文件"改为"禁止在上一 Section 通过验证前完整实现后续 Section；允许对已验证为相互独立的 Section 并行创建脚手架"
- `section-implementation-gate.md` 强制执行顺序 0：增加"独立 Section 脚手架例外"段落

---

### P6 — 快速通道

**问题**：八步流程对所有项目一视同仁。"纯展示单页"和"多 Section 强交互活动"承受同样的流程 overhead。

**方案**：在 `designer.md` 的模式判断中增加"快速通道"判断。

#### 快速通道触发条件（同时满足）

1. Section 数量 ≤ 2
2. 无强交互 Section（无抽奖、转盘、翻牌、滑动切换）
3. 无动态数据 Section（全部为静态展示，数据来源 = 静态展示）
4. 用户提供的参考图/原型图 ≤ 1 张（结构简单可判断）

#### 快速通道流程

```
需求收集 → 简化结构方案（Section 列表 + 简化 Layout Spec） → 用户确认 → 并行实现 → 总体验证
```

跳过的步骤：
- 完整 Interaction Spec（无交互时不输出）
- Effect Spec（无动效时不输出）
- Image Asset Inventory（无图片时不输出；有图片时保留）
- 逐 Section 组件设计卡 → 合并为"简化实现方案"（一个文件覆盖所有 Section）
- 逐 Section verify-section → 改为一次性 `verify-section --all`
- visual-design 独立阶段 → 在简化结构方案中附带视觉方向即可

#### 快速通道入口

`designer.md` 模式判断增加一节：

```markdown
### 快速通道模式

在"新项目模式"和"修改模式"判断之前，先判断是否同时满足：
1. 预期 Section ≤ 2
2. 无强交互
3. 无动态数据
4. 素材简单可判断

命中 → 走快速通道流程。
不命中 → 继续判断新项目/修改模式。
```

---

### P7 — progress.md 恢复能力增强

**问题**：上下文丢失后，恢复完全依赖 `progress.md`。如果账本与实际文件系统不一致（LLM 忘记更新账本是高频事件），没有自动审计机制。

**方案**：在 recovery 流程中增加文件系统状态扫描作为交叉验证。

#### 恢复协议

```
上下文丢失 / 阶段不确定
  ↓
1. 读取 progress.md
  ↓
2. 文件系统审计（扫描实际状态）
  ↓
3. 交叉验证（账本 vs 实际）
  ↓
4. 差异处理 → 更新账本 → 继续
```

#### 文件系统审计脚本

```bash
pnpm audit-feedback --campaign <campaign-name>
```

输出：

```json
{
  "feedbackWorkspace": "apps/<name>/.feedback/",
  "files": {
    "demand.md": { "exists": true, "size": 1234 },
    "structure.md": { "exists": true, "size": 5678 },
    "design.md": { "exists": true, "size": 3456 },
    "progress.md": { "exists": true, "size": 2100 },
    "sections/": ["HeroSection.md", "PrizeSection.md"]
  },
  "sections": {
    "created": ["HeroSection", "PrizeSection", "RuleModal"],
    "registered": ["HeroSection"],
    "verified": []
  },
  "playground": {
    "registeredSections": ["HeroSection"],
    "scenarios": []
  },
  "runtime": {
    "containers": ["HeroContainer.tsx"],
    "appRenders": ["HeroContainer"]
  },
  "diffs": {
    "sectionsCreatedButNotRegistered": ["PrizeSection", "RuleModal"],
    "sectionsRegisteredButNotVerified": ["HeroSection"],
    "feedbackMissingSectionCards": ["PrizeSection", "RuleModal"]
  }
}
```

#### 差异处理规则

| 差异类型 | 自动操作 |
|---------|---------|
| 账本标记 `validated` 但实际未注册/未验证 | 降级为 `implemented`，重新验证 |
| 实际 Section 目录存在但账本无记录 | 追加记录，标记为 `unknown-status` |
| 账本记录 Section 但目录不存在 | 标记为 `orphaned-record`，询问用户 |
| feedback 工作区文件与账本阶段不一致 | 以文件系统为准，更新账本阶段 |

#### 规则变更点

- `designer.md` 的恢复规则：从"先读 progress.md"改为"先读 progress.md → 再运行 audit-feedback → 差异处理 → 继续"
- `designer.md` 的 progress.md 模板：增加"账本审计记录"字段

---

### P8 — 不确定项阈值量化

**问题**：什么算"关键不确定"完全依赖 LLM 主观判断。按钮颜色不确定 → 视觉阶段决定。Section 边界不确定 → 必须确认。间距不确定 → 模糊地带。

**方案**：将不确定项从二元（关键/非关键）改为三级分类。

#### 三级分类

| 级别 | 定义 | 处理方式 | 示例 |
|------|------|---------|------|
| **阻塞级** | 影响 Section 边界、核心交互链路、数据字段语义 | 必须向用户确认，不得作为假设 | Section 归属不清、弹窗触发逻辑不明、关键业务字段含义不明 |
| **假设级** | 影响具体数值但不影响结构/交互链路 | 记录为"实现假设"，在 design.md 或实现阶段按行业惯例取默认值；允许用户在审批时修正 | 具体间距值、动画 duration、按钮颜色 |
| **无影响级** | 纯装饰微调 | 不进入 Uncertainty List，在实现阶段按视觉方案自由发挥 | 装饰光效位置微调、背景纹理角度 |

#### Uncertainty List 格式变更

当前格式：
```
- 关键不确定项：xxx
```

变更后：
```markdown
| 级别 | 描述 | 相关 Section/元素 | 假设值（假设级） | 状态 |
|------|------|-------------------|-----------------|------|
| blocking | Tab 切换是否影响下方排行榜 | HeroSection | — | pending-confirmation |
| assumption | 奖品卡间距 | PrizeSection | 24px（参考移动端卡片列表惯例） | accepted |
| assumption | 弹窗圆角 | RuleModal | 16px（继承 design.md 弹窗统一圆角） | accepted |
```

#### 规则变更点

- `design-input SKILL.md` 的 Uncertainty List：将"关键不确定"改为三级分类格式
- `design-input SKILL.md` 的行为意图推理表：增加 `uncertaintyLevel` 字段
- 第 3.5 步审批：阻塞级必须全部 resolved；假设级默认 accepted，用户可修正

---

### P9 — Designer ↔ Integration Contract 自动化

**问题**：Designer Final Closeout 后进入 Integration，但两个 agent 之间没有任何编译期保证——designer 预留的图片字段、Section 状态，integration 能否正确对接全靠人工。

**方案**：从 structure.md 产物自动生成 integration 骨架，减少手工对接成本。

#### 自动生成内容

执行 `pnpm gen-integration-skel --campaign <campaign-name>` 后自动生成：

```
integrations/
├── adapters/
│   ├── <SectionName>Adapter.ts     # 从 Image Asset Inventory 的 contentField + dynamic 判断
│   └── __tests__/
│       └── <SectionName>Adapter.test.ts
├── fixtures/
│   └── <SectionName>.fixture.json  # 从 types.ts 的 Content 接口生成 fixture 骨架
└── contracts/
    └── <SectionName>.contract.ts   # 从 supportedStates + supportedStates 生成 contract
```

生成逻辑：

- 遍历 `structure.md` 中所有 `数据来源 = 动态数据` 的 Section
- 从对应 `designer/sections/<Name>/types.ts` 提取 Content 接口
- 从 `content.ts` 提取 supportedStates
- 从 Image Asset Inventory 提取需要 adapter 映射的图片字段

#### 生成文件的标记

生成文件顶部注入：
```ts
// @generated by gen-integration-skel — 骨架由 structure.md 产物自动生成
// 人工补充 adapter 逻辑、fixture 数据和 contract 验证
```

integration agent 触发时优先检查是否存在生成骨架，存在则基于骨架补充，不存在则从零创建。

#### 规则变更点

- `integration.md` 增加"骨架检查"步骤：触发后先运行 `gen-integration-skel --check` 确认骨架覆盖
- `AGENTS.md` 的自动触发规则中补充：integration agent 触发后优先检查骨架

---

### P10 — 动效验证辅助工具

**问题**：LLM 自己确认自己写的动画代码能否在浏览器中正确运行——存在循环确认问题。

**方案**：增加 `verify-animation` 命令，对声明了 `stateTransitions.animation` 的 Section 做运行时截屏对比。

#### 命令

```bash
pnpm verify-animation --campaign <campaign-name> <SectionName>
```

#### 检查逻辑

1. 启动 headless 浏览器，渲染目标 Section 的 single 预览
2. 触发每个 interaction state transition
3. 在动画前后各截一帧
4. 比较两帧的像素差异：差异像素数 < 阈值 → 动画未生效（警告）；差异像素数 > 阈值 → 动画可能已生效（通过）

**这不是完美方案，但比 LLM 自我确认更可靠。** 即使只检测"是否有视觉变化"这一维度，也能排除"声明了动画但完全没落地"的失效模式。

#### 输出

```
Section: WheelSection
  transition: idle → spinning
    frame diff: 3847 pixels changed (4.2% of viewport) ✅ animation detected
  transition: spinning → result
    frame diff: 12 pixels changed (0.01%) ⚠️ animation may not be visible
```

#### 限制

- 不验证 easing 曲线是否正确
- 不验证 duration 是否对齐
- 不验证 AnimatePresence 入场/退场
- 这些维度仍需人工确认，但至少机器能告诉你"动画是否真的引起了视觉变化"

---

## 影响范围汇总

| 优先级 | 改动项 | 涉及文件 |
|--------|--------|---------|
| P0 | 规则去重收敛 | `designer.md`, `design-input SKILL.md`, `section-implementation SKILL.md`, `section-verification SKILL.md`, `section-implementation-gate.md`, `DESIGN_OUTPUT.md` |
| P1 | 阶段间 Contract 验证 | 新增 `scripts/validate-structure.ts`, `scripts/validate-design.ts`；`designer.md` + skill 文件引用 |
| P2 | 修改模式完善 | `designer.md` 修改模式章节 |
| P3 | 组件设计卡分级 | `section-implementation SKILL.md`, `section-implementation-gate.md` |
| P4 | design-input 拆分 | `design-input/` → `requirement-collection/` + `structure-planning/`；`designer.md` 技能表和流程 |
| P5 | 独立 Section 并行 | `section-implementation SKILL.md`, `section-implementation-gate.md` |
| P6 | 快速通道 | `designer.md` 模式判断章节 |
| P7 | progress.md 恢复增强 | 新增 `scripts/audit-feedback.ts`；`designer.md` 恢复规则 |
| P8 | 不确定项阈值量化 | `design-input SKILL.md`（或拆分后的 `structure-planning SKILL.md`） |
| P9 | Contract 自动化 | 新增 `scripts/gen-integration-skel.ts`；`integration.md` |
| P10 | 动效验证 | 新增 `scripts/verify-animation.ts`；`section-verification SKILL.md` |

---

## 不做的改进

以下改进方向经评估后明确推迟或不做：

| 项目 | 原因 |
|------|------|
| Playground 体系简化 | 当前复杂度服务于多种预览需求，硬简化会损失功能；等待实际痛点积累后再动 |
| 强制 i18n boilerplate 放宽 | 已有明确的工程规范要求；且去掉后集成成本更高 |
| LLM 行为意图推理替代 | 没有比 LLM 更好的替代方案；用 P8 的 Uncertainty List 三级分流缓解 |
| 外部变更检测 | 当前单人使用场景不需要；等到多人协作需求明确再做 |
| Skill Contract schema 化 | 成本过高（需要定义完整的 structure.md / design.md JSON schema），ROI 不够 |
| 文档引用扁平化 | 需要引入新的中间层（如 manifest），当前引用深度 → 用 P0 规则去重 + P1 门禁控制 |
