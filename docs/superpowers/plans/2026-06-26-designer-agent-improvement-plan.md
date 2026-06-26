# Designer Agent 系统改进落地方案

> 基于 `2026-06-26-designer-agent-improvement-design.md`，按优先级分批落地。
>
> 编写日期：2026-06-26
> 来源：grill-me session

---

## 阶段总览

| 批次 | 优先级 | 改动项 | 预估工作量 | 依赖 |
|------|--------|--------|-----------|------|
| Phase 1 | P0-P2 | 规则去重 + 阶段门禁 + 修改模式 | 3-4h | 无 |
| Phase 2 | P3-P5 | 设计卡分级 + skill 拆分 + 并行脚手架 | 3-4h | Phase 1 |
| Phase 3 | P6-P8 | 快速通道 + 恢复增强 + 不确定项量化 | 3-4h | Phase 1 |
| Phase 4 | P9-P10 | Contract 自动化 + 动效验证 | 4-5h | Phase 2 |

---

## Phase 1 — 止血（P0 → P1 → P2）

### Step 1: 规则去重收敛（P0）

这是最高优先级——减少后续所有改动的维护成本。

#### 1a. `DESIGN_OUTPUT.md` 增加锚点标记

在以下章节标题增加 `id` 锚点：

```markdown
## <a id="image-asset-gate"></a>Image Asset Gate
## <a id="runtime-data-boundary"></a>Runtime 数据边界
## <a id="esm-import-rules"></a>ESM import 规则
## <a id="animation-landing"></a>动画落地要求
## <a id="modal-interaction-output"></a>弹窗交互输出
```

#### 1b. `section-implementation-gate.md` 增加锚点标记

```markdown
## <a id="mandatory-execution-order"></a>强制执行顺序
## <a id="execution-granularity"></a>执行粒度硬约束
```

#### 1c. `designer.md` 增加锚点标记

```markdown
## <a id="design-proposal-approval"></a>设计方案审批
```

#### 1d. 替换所有非权威源中的重复规则

按映射表逐一替换，规则文本变成：

```markdown
> 规则权威源见 `agents/shared/DESIGN_OUTPUT.md` §Image Asset Gate
```

**操作顺序**（按文件）：

1. `designer.md` → 搜索 `div.*emoji|CSS 方块`，删除并替换为引用
2. `agents/skills/design-input/SKILL.md` → 同上
3. `agents/skills/section-implementation/SKILL.md` → 搜索所有 9 条映射规则，逐条替换
4. `agents/skills/section-verification/SKILL.md` → 检查是否有重复规则
5. `docs/ai/section-implementation-gate.md` → 搜索 `defaultContent.*fallback|禁止.*div|禁止.*批量`，替换

**验收标准**：
- `grep -rn "禁止.*div\|禁止.*emoji\|禁止.*CSS 方块" agents/ docs/ai/` 只命中 `DESIGN_OUTPUT.md`
- `grep -rn "defaultContent.*fallback" agents/ docs/ai/` 只命中 `DESIGN_OUTPUT.md`
- `grep -rn "禁止.*批量" agents/ docs/ai/` 只命中 `section-implementation-gate.md`

---

### Step 2: 阶段间 Contract 验证（P1）

#### 2a. 创建 `scripts/validate-structure.ts`

参照现有 `scripts/` 目录的代码风格，实现 10 项检查的 CLI 脚本：

```bash
pnpm validate-structure --feedback apps/<campaign-name>/.feedback
```

输出格式：
```
✅ demand.md 存在
✅ structure.md 存在
✅ Section 拆分表存在 (3 sections)
✅ Layout Spec 关键元素完整
❌ Interaction Spec 不完整: PrizeSection 缺少 closeOrReset 字段
✅ Image Asset Inventory (2 items)
⚠️  Uncertainty List: 1 pending-confirmation
✅ 状态适配分析完整
✅ progress.md 阶段标记
✅ meta.json 一致

结果: 8/10 通过, 1 失败, 1 警告
```

#### 2b. 创建 `scripts/validate-design.ts`

实现 7 项检查的 CLI 脚本：

```bash
pnpm validate-design --feedback apps/<campaign-name>/.feedback
```

#### 2c. 在 designer.md 流程中集成门禁

在步骤 2 和步骤 3 结束后分别增加门禁调用：

**步骤 2 结束后**（结构规划完成）：
```markdown
6.5. 运行 `pnpm validate-structure --feedback <feedback-workspace>` 确认结构产物完整性。
      失败 → 根据输出补全缺失项，禁止进入步骤 3。
```

**步骤 3 结束后**（视觉设计完成）：
```markdown
7.5. 运行 `pnpm validate-design --feedback <feedback-workspace>` 确认视觉产物完整性。
      失败 → 根据输出补全缺失项，禁止进入步骤 3.5（设计方案审批）。
```

#### 2d. 更新 section-implementation SKILL.md 读取策略

在必读文档中增加对门禁输出的引用：
```markdown
- 开始实现前确认 `pnpm validate-structure` 和 `pnpm validate-design` 已通过；
  若未通过且用户强行要求进入实现，必须在 progress.md 中记录跳过的检查项和原因。
```

---

### Step 3: 修改模式完善（P2）

#### 3a. 重写 `designer.md` 的"修改模式"章节

将当前约 10 行的修改模式扩充为包含以下结构的完整章节：

```markdown
### 修改模式

#### 命中条件
（保留现有内容）

#### 修改类型分级

| 级别 | 触发场景 | 流程要求 | 验证要求 |
|------|---------|---------|---------|
| L0: 文案/数据 | ... | ... | ... |
| L1: 样式 | ... | ... | ... |
| L2: 布局 | ... | ... | ... |
| L3: 结构 | ... | ... | ... |
| L4: 交互 | ... | ... | ... |

#### 流程

1. 定位目标 app 和受影响 Section
2. 分级判断 → 向用户确认修改范围和级别
3. 读当前 feedback 工作区相关产物
4. 按级别要求执行变更
5. 更新 feedback 工作区
6. 按级别要求执行验证
7. 报告修改结果

#### 跨级组合
（说明取最高级别）

#### 修改模式 progress.md 追加模板

```markdown
## 修改记录

| 时间 | 级别 | 范围 | 受影响 Section | 验证结果 |
|------|------|------|---------------|---------|
| 2026-06-26 14:30 | L1 | 按钮配色调整 | HeroSection | ✅ verify-section 通过 |
```
```

#### 3b. 更新 `designer.md` 的 progress.md 模板

增加"修改记录"表格区域（仅修改模式时使用）。

---

## Phase 2 — 减负（P3 → P4 → P5）

### Step 4: 组件设计卡分级（P3）

#### 4a. 更新 `section-implementation-gate.md` 的组件设计卡模板

将当前单一块模板改为分层结构：

```markdown
## <SectionName> Component Card

### 核心字段（所有 Section 必填）

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

### 交互字段（存在用户交互时必填）

<!-- 仅当 User interactions 非空时填写以下区块 -->
- Interaction Spec refs:
  - ...
- Interaction states:

### 强交互字段（转盘/抽奖/翻牌/滑动切换时必填）

<!-- 仅当 Section 为强交互类型时填写 -->
- Effect Spec refs:
  - ...
- Effect Reasoning:
  - ...
- State transitions:
- Animation binding:
  - ...

### 图片字段（命中 Image Asset Inventory 时必填）

<!-- 仅当 structure.md 的 Image Asset Inventory 包含本 Section 的 imageKey 时填写 -->
- Image Asset refs:
  - ...

### Acceptance Tests

<!-- 按交互复杂度决定：静态展示无测试，简单交互 vitest，强交互必须含 playwright 项 -->
```

#### 4b. 更新 `section-implementation SKILL.md` 的硬禁令

将：
```markdown
- 禁止组件设计卡缺少 Layout Spec 或 Interaction Spec 引用时直接实现。
- 禁止组件设计卡缺少当前 Section 的 Image Asset refs 时实现任何图片类元素。
- 禁止强交互 Section 缺少 Effect Spec 引用或 Effect Reasoning 时直接实现。
```

改为：
```markdown
- 禁止组件设计卡缺少核心必填字段时直接实现。
- 禁止命中条件必填字段时跳过对应区块直接实现。
```

#### 4c. 更新 `section-implementation-gate.md` 禁止事项

同步修改相应的禁止事项表述。

---

### Step 5: design-input 职责拆分（P4）

#### 5a. 创建 `agents/skills/requirement-collection/SKILL.md`

从 `design-input/SKILL.md` 抽取第 1 步内容，精简为独立文件：

```markdown
---
name: requirement-collection
description: H5 活动页需求收集能力模块。用于 designer agent 的第 1 步，产出 demand.md。
---

# Requirement Collection Skill

## 读取策略

必读：
- 本文件全文
- `agents/shared/DESIGN_INPUT.md` 中与素材输入、原型图/视觉参考图职责边界相关的章节

条件读取：
- 需要确认视觉底线时，读取 `agents/shared/DESIGN.md` 的相关章节

## 流程

[从 design-input 第 1 步迁移内容]

## 输出

- `demand.md` 存盘
- `progress.md` 更新

## 不输出

- Section 拆分
- Layout/Interaction/Effect Spec
- Image Asset Inventory
- 状态适配分析
```

#### 5b. 重命名 `design-input/SKILL.md` → `structure-planning/SKILL.md`

```bash
mv agents/skills/design-input agents/skills/requirement-collection
# 原 design-input 的第 2 步内容写入新的 structure-planning 目录
```

#### 5c. 创建 `agents/skills/structure-planning/SKILL.md`

从原 `design-input/SKILL.md` 抽取第 2 步内容，删除需求收集部分。

输入条件明确：
```markdown
## 进入条件

- `demand.md` 已存盘
- `validate-structure` 的前置检查通过（demand.md 存在）
```

#### 5d. 更新 `designer.md`

- 能力模块表增加一行（requirement-collection + structure-planning 替代 design-input）
- 新项目流程从 8 步变为 9 步
- 读取策略更新

#### 5e. 更新 `AGENTS.md`

项目 Agents 体系的 skills 列表更新：
```markdown
├── skills/
│   ├── requirement-collection/SKILL.md  # 需求收集
│   ├── structure-planning/SKILL.md      # 结构规划
│   ├── visual-design/SKILL.md           # 视觉细化
│   ├── section-implementation/SKILL.md  # Section 实施
│   └── section-verification/SKILL.md    # 验证与收尾
```

#### 5f. 删除旧目录

```bash
rm -rf agents/skills/design-input
```

确认 `grep -rn "design-input" agents/ docs/ai/ docs/superpowers/` 无残留引用（spec/plan 文档除外）。

---

### Step 6: 独立 Section 并行脚手架（P5）

#### 6a. 更新 `section-implementation-gate.md` 强制执行顺序

在步骤 0 末尾增加：

```markdown
#### 独立 Section 脚手架例外

满足以下全部条件时，允许在当前 Section 验证通过前创建后续 Section 的目录和文件骨架：
1. 两个 Section 在 Interaction Spec 中互不为 targetSection
2. 不共享同一 Store action（open/close 类通用弹窗 action 除外）
3. 不在 runtime/app.tsx 的同一条件渲染分支内

允许的操作：
- 创建 Section 目录和空骨架文件（types.ts / content.ts 骨架 / index.tsx 骨架）
- 写入组件设计卡

仍然禁止：
- 实现完整代码逻辑
- 注册 Playground / Runtime Container / Store
- 运行 verify-section

依赖判断由 designer agent 在结构规划阶段完成，写入 structure.md 的 Section 依赖矩阵。
```

#### 6b. 更新 `section-implementation SKILL.md` 执行粒度硬约束

将原约束替换为：
```markdown
- 当前 Section 未通过自己的 `verify-section` 前，禁止完整实现后续 Section 的业务逻辑；
  独立 Section 脚手架例外见 `docs/ai/section-implementation-gate.md` 的独立 Section 脚手架例外。
```

#### 6c. 在 `STRUCTURE_OUTPUT.md` 中增加 Section 依赖矩阵

```markdown
### Section 依赖矩阵

| Section A | Section B | 依赖关系 | 可并行脚手架 |
|-----------|-----------|---------|-------------|
| HeroSection | PrizeSection | 无（Hero 不触发 Prize 的目标变化） | ✅ |
| PrizeSection | RuleModal | PrizeSection 的 onRuleClick 打开 RuleModal | ❌ |
```

---

## Phase 3 — 提速（P6 → P7 → P8）

### Step 7: 快速通道（P6）

#### 7a. 更新 `designer.md` 的模式判断

在"新项目模式"和"修改模式"之前插入"快速通道模式"判断：

```markdown
### 快速通道模式

在判断新项目/修改模式之前，先检查是否同时满足以下全部条件：

1. 预期 Section ≤ 2
2. 无强交互 Section（无抽奖、转盘、翻牌、进度推进、滑动切换）
3. 无动态数据 Section（全部为静态展示，数据来源 = 静态展示）
4. 用户提供的参考图/原型图 ≤ 1 张

命中 → 走快速通道流程。
不命中 → 继续判断新项目/修改模式。

快速通道流程：

1. 加载 `requirement-collection`，完成需求收集并写入 `demand.md`。
2. 加载 `structure-planning`（精简模式：只输出 Section 列表 + 简化 Layout Spec + Image Asset Inventory（有图片时））。
   跳过：完整 Interaction Spec、Effect Spec、Uncertainty List（简单结构判断）、状态适配分析。
3. 加载 `visual-design`（精简模式：在结构方案中附带视觉方向即可，不需要独立 design.md）。
4. 输出简化实现方案，等待用户确认。
5. 用户确认后，创建 app 并迁移 draft。
6. 加载 `section-implementation`，所有 Section 并行实现。
7. 加载 `section-verification`，一次性运行 `verify-section --all` + Final Closeout。
```

#### 7b. 快速通道的组件设计卡

快速通道不要求逐 Section 组件设计卡，而是合并为一份"简化实现方案"：

```markdown
## 简化实现方案

- Section 列表及职责
- 每个 Section 的 Content 字段
- 图片资产（如有）及占位策略
- 视觉方向（配色、字体）
```

---

### Step 8: progress.md 恢复能力增强（P7）

#### 8a. 创建 `scripts/audit-feedback.ts`

```bash
pnpm audit-feedback --campaign <campaign-name>
```

JSON 输出格式见设计方案 P7。

实现要点：
- 读 `apps/<campaign-name>/.feedback/` 目录结构
- 读 `apps/<campaign-name>/src/designer/sections/` 目录，列出已创建的 Section
- 读 `playground/section-registry.ts`，解析已注册的 Section ID
- 读 `runtime/app.tsx`，解析已渲染的 Container
- 读 `apps/<campaign-name>/src/integrations/store.ts`，解析已声明的 SectionState
- 读 `progress.md` 解析当前阶段和 Section 状态
- 交叉对比，输出 diff

#### 8b. 更新 `designer.md` 的恢复规则

```markdown
- 恢复规则：
  1. 先读取当前 feedback 工作区的 `progress.md`。
  2. 运行 `pnpm audit-feedback --campaign <campaign-name>` 获取文件系统实际状态。
  3. 对比账本 vs 实际，处理差异（降级/追加/标记/询问）。
  4. 更新 `progress.md` 的"当前阶段"和"当前门禁"。
  5. 从校正后的阶段继续执行。
```

#### 8c. 更新 `designer.md` 的 progress.md 模板

增加"账本审计记录"字段：

```markdown
- 最近审计时间：`<timestamp>`
- 账本与文件系统一致：`yes | no (差异: <summary>)`
```

---

### Step 9: 不确定项阈值量化（P8）

#### 9a. 更新 `structure-planning SKILL.md`（原 design-input 第 2 步）

将 Uncertainty List 从自由文本改为三级分类表格：

```markdown
### Uncertainty List

不确定项分为三级：

| 级别 | 定义 | 处理方式 |
|------|------|---------|
| `blocking` | 影响 Section 边界、核心交互链路、数据字段语义 | 必须向用户确认 |
| `assumption` | 影响具体数值但不影响结构/交互链路 | 记录假设值，用户可在审批时修正 |
| `no-impact` | 纯装饰微调 | 不进入 Uncertainty List |

输出格式：

| 级别 | 描述 | 相关 Section/元素 | 假设值（assumption 级必填） | 状态 |
|------|------|-------------------|---------------------------|------|
| blocking | Tab 切换是否影响下方排行榜 | HeroSection | — | pending-confirmation |
| assumption | 奖品卡间距 | PrizeSection | 24px（参考移动端卡片列表惯例） | accepted |
```

#### 9b. 更新行为意图推理表

增加 `uncertaintyLevel` 字段：

```markdown
| uncertaintyLevel | blocking / assumption / no-impact |
```

---

## Phase 4 — 自动化（P9 → P10）

### Step 10: Designer ↔ Integration Contract 自动化（P9）

#### 10a. 创建 `scripts/gen-integration-skel.ts`

```bash
pnpm gen-integration-skel --campaign <campaign-name>
```

实现逻辑：
1. 读取 `apps/<campaign-name>/.feedback/structure.md`，解析所有 `数据来源 = 动态数据` 的 Section
2. 对每个动态 Section：
   a. 读取 `designer/sections/<Name>/types.ts`，提取 `Content` 接口
   b. 读取 `content.ts`，提取 `supportedStates`
   c. 从 structure.md 的 Image Asset Inventory 提取需要映射的图片字段
3. 生成骨架文件：

```
integrations/
├── adapters/
│   ├── <Name>Adapter.ts       # 含 @generated 标记 + 骨架代码
│   └── __tests__/
│       └── <Name>Adapter.test.ts
├── fixtures/
│   └── <Name>.fixture.json
└── contracts/
    └── <Name>.contract.ts
```

骨架代码示例（adapter）：
```typescript
// @generated by gen-integration-skel — 2026-06-26T14:30:00Z
// 来源: apps/<campaign-name>/.feedback/structure.md
// Section: PrizeSection, 数据来源: 动态数据
// TODO: 补充 DTO → SectionState 映射逻辑

import type { SectionState } from '../../store';
import type { PrizeSectionContent } from '../../designer/sections/PrizeSection/types';

export function adaptPrizeSection(dto: unknown): SectionState<PrizeSectionContent> {
  // TODO: 映射 DTO 字段到 PrizeSectionContent
  throw new Error('Adapter not implemented');
}
```

#### 10b. 更新 `integration.md`

增加骨架检查步骤（作为 integration agent 的第 0 步）：

```markdown
## 第 0 步：骨架检查

触发后先运行：

```bash
pnpm gen-integration-skel --campaign <campaign-name> --check
```

- 已有骨架 → 基于骨架补充 adapter 逻辑、fixture 数据和 contract 验证
- 无骨架 → 运行 `pnpm gen-integration-skel --campaign <campaign-name>` 生成后，再基于骨架补充
```

---

### Step 11: 动效验证辅助工具（P10）

#### 11a. 创建 `scripts/verify-animation.ts`

使用 Playwright 启动 headless 浏览器：

```bash
pnpm verify-animation --campaign <campaign-name> <SectionName>
```

实现要点：
1. 启动 Vite dev server（或复用已有）
2. 打开 `?mode=designer&section=<SectionName>` 的 single 预览
3. 对每个 `stateTransitions` 条目：
   a. 截取触发前帧
   b. 模拟触发（click 等）
   c. 等待 animation.duration + 100ms buffer
   d. 截取动画后帧
   e. pixelmatch 比较两帧
4. 输出结果

#### 11b. 在 `section-verification SKILL.md` 中引用

在"单 Section 验证"的人工确认步骤后增加可选的自动检查：

```markdown
- [ ] （可选但推荐）运行 `pnpm verify-animation --campaign <campaign-name> <SectionName>` 检查动画是否产生 DOM 可见变化
```

在 Final Closeout 检查清单中增加：

```markdown
- [ ] 所有声明了 `stateTransitions.animation` 的 Section 已通过 `verify-animation`，无 `no visual change detected` 警告
```

---

## 文件变更清单

### 新增文件

| 路径 | 用途 | Phase |
|------|------|-------|
| `scripts/validate-structure.ts` | 结构产物完整性检查 | 1 |
| `scripts/validate-design.ts` | 视觉产物完整性检查 | 1 |
| `agents/skills/requirement-collection/SKILL.md` | 需求收集模块 | 2 |
| `agents/skills/structure-planning/SKILL.md` | 结构规划模块 | 2 |
| `scripts/audit-feedback.ts` | feedback 工作区文件系统审计 | 3 |
| `scripts/gen-integration-skel.ts` | integration 骨架生成 | 4 |
| `scripts/verify-animation.ts` | 动效运行时验证 | 4 |

### 修改文件

| 路径 | 变更内容 | Phase |
|------|---------|-------|
| `agents/designer.md` | 规则去重替换；增加修改模式分级；增加快速通道；增加恢复协议；增加门禁调用；技能表更新；progress.md 模板更新 | 1+2+3 |
| `agents/skills/section-implementation/SKILL.md` | 规则去重替换；设计卡分级约束；并行脚手架例外；读取策略更新 | 1+2 |
| `agents/skills/section-verification/SKILL.md` | 规则去重替换；增加 verify-animation 引用 | 1+4 |
| `agents/shared/DESIGN_OUTPUT.md` | 增加锚点标记；标注规则权威源 | 1 |
| `docs/ai/section-implementation-gate.md` | 增加锚点标记；设计卡分层模板；并行脚手架例外；禁止事项更新 | 1+2 |
| `agents/shared/STRUCTURE_OUTPUT.md` | 增加 Section 依赖矩阵 | 2 |
| `AGENTS.md` | skills 列表更新 | 2 |
| `agents/integration.md` | 增加骨架检查步骤 | 4 |

### 废弃/删除文件

| 路径 | 原因 | Phase |
|------|------|-------|
| `agents/skills/design-input/SKILL.md` | 拆分为 requirement-collection + structure-planning | 2 |
| `agents/skills/design-input/` 目录 | 同上 | 2 |

### 不修改的文件

- `agents/shared/DESIGN.md` — 设计规范底线，无重复规则，不涉及本次改动
- `agents/shared/DESIGN_INPUT.md` — 素材职责边界规则，自身是权威源，不被去重
- `docs/ai/development-rules.md` — 三层架构规则，自身是权威源
- `docs/ai/framework-map.md` — 共享包引用地图，不涉及本次改动
- `docs/ai/i18n-rules.md` — i18n 规则，不涉及本次改动
- `docs/campaign-template.md` — 模板结构参考，不涉及本次改动

---

## 验收标准

### Phase 1 验收

- [ ] `grep -rn "禁止.*div\|禁止.*emoji\|禁止.*CSS 方块" agents/ docs/ai/` 只命中 `DESIGN_OUTPUT.md`
- [ ] `grep -rn "defaultContent.*fallback\|禁止.*批量" agents/ docs/ai/` 只命中各自权威源
- [ ] `pnpm validate-structure --feedback <test-workspace>` 可执行，输出 10 项检查结果
- [ ] `pnpm validate-design --feedback <test-workspace>` 可执行，输出 7 项检查结果
- [ ] designer.md 修改模式章节包含 L0-L4 分级表
- [ ] 所有非权威源的重复规则已替换为引用格式

### Phase 2 验收

- [ ] `agents/skills/requirement-collection/SKILL.md` 可独立加载
- [ ] `agents/skills/structure-planning/SKILL.md` 可独立加载
- [ ] `agents/skills/design-input/` 目录已删除
- [ ] `grep -rn "design-input" agents/ AGENTS.md` 无有效引用（仅 spec/plan 文档可保留历史引用）
- [ ] 组件设计卡模板区分核心必填和条件必填
- [ ] Section 依赖矩阵格式已写入 STRUCTURE_OUTPUT.md

### Phase 3 验收

- [ ] designer.md 包含快速通道模式判断（在修改模式之前）
- [ ] `pnpm audit-feedback --campaign <test-campaign>` 可执行，输出 JSON
- [ ] designer.md 恢复规则引用 audit-feedback
- [ ] Uncertainty List 使用三级分类格式
- [ ] 行为意图推理表含 uncertaintyLevel 字段

### Phase 4 验收

- [ ] `pnpm gen-integration-skel --campaign <test-campaign>` 可执行，生成骨架文件
- [ ] 生成文件顶部包含 `@generated` 标记
- [ ] integration.md 包含骨架检查步骤
- [ ] `pnpm verify-animation --campaign <test-campaign> <SectionName>` 可执行
- [ ] verify-animation 输出包含像素差异统计
