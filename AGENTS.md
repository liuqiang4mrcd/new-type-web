# new-type-web — H5 活动页面开发平台

pnpm + Nx monorepo，提供 H5 活动页面的开发、设计和部署能力。

| 属性 | 说明 |
|---|---|
| 技术栈 | React 18 + TypeScript + TailwindCSS + Zustand + Vite |
| 构建 | Nx 编排，pnpm workspace |
| 设计规范 | 750px 设计稿，postcss-mobile-forever 自动 px→vw |

**目录结构：**

```
apps/
  campaign-template/     # 活动模板应用
packages/
  ui/                    # 通用 UI 组件
  hooks/                 # 通用 React Hooks
  request/               # 网络请求封装
  utils/                 # 工具函数
  analytics/             # 数据分析
  config/                # 统一配置
  headless/              # Headless 逻辑层
```

**关键文档：**

| 文件 | 用途 |
|---|---|
| `docs/ai/README.md` | AI 执行规范入口（读取顺序、权威边界、常用门禁） |
| `docs/campaign-template.md` | 活动页模板结构、Section 创建流程、Playground 注册方式 |
| `docs/ai/development-rules.md` | AI 开发约束（三层架构、目录边界、命名规范） |
| `docs/ai/framework-map.md` | 共享包引用地图（什么功能用哪个包） |
| `docs/ai/section-implementation-gate.md` | Section 实现阶段门禁：完成一个、验证一个 |
| `docs/ai/interface-integration-rules.md` | 接口接入规则 |

人类架构导览见 `docs/architecture.md`；历史设计说明不作为当前执行入口。

---

# 项目 Agent 调用规则

## 优先级规则

当多个 skill 或 agent 同时命中同一触发场景时，优先级从高到低为：

1. **本仓库声明的 agent 和 skill**（`agents/*.md`）— 最高优先级
2. 工作区配置（项目根目录 `.opencode/` 与用户 `~/.config/opencode/` 中的 skill）
3. 内置 / 插件提供的 skill 和 agent

> **覆盖规则**：对于 Designer agent（`agents/designer.md`），当用户需求明确定义了**设计方向（视觉风格、布局偏好、色彩方案）**时，以用户的显式输入为准，覆盖本仓库任何默认设定。非设计类 agent 依然遵循本优先级规则。

## 决策前置检查（强制）

在调用任何 skill 或 agent 之前，必须按顺序完成以下三项检查。这是优先级规则的具体执行保障，禁止跳过。

### 检查清单

| 步骤 | 问题 | 通过条件 |
|------|------|----------|
| Q1 | 项目 `agents/` 下是否有匹配当前场景的 agent？ | 有 → 直接使用项目 agent，不调用外部 skill |
| Q2 | AGENTS.md 的自动触发规则是否命中当前需求？ | 命中 → 按规则自动调用对应 agent |
| Q3 | 项目 agent 的工作流程是否已覆盖我想做的事？ | 已覆盖 → 使用项目 agent 的内置流程，不额外加载外部 skill |

### 核心原则

- **项目优先**：任何时候项目 `agents/*.md` 中的 agent 能覆盖当前需求，就不应加载外部 skill。
- **项目内 skill 例外**：`designer` agent 可按自身编排流程加载 `agents/skills/*/SKILL.md`，这些是项目 agent 的内部能力模块，不属于外部 skill。
- **不绕路**：项目 agent 的工作流程（如 designer 的第 1 步需求收集）已经内嵌了需求探索能力，不需要用 brainstorming / grill 等外部 skill 替代其职责。
- **自问自答**：在执行任何 skill 加载前，先过一遍 Q1→Q2→Q3，确认项目 agent 确实无法处理，再考虑外部 skill。

### 反例

```
❌ 用户说"参考图生成新活动"
   → Q1 未检查，直接加载 brainstorming skill
   → 绕过了 designer agent
   → 违反了优先级规则

✅ 用户说"参考图生成新活动"
   → Q1: agents/designer.md 匹配场景 ✅
   → Q2: 自动触发规则命中 ✅
   → Q3: designer 第 1 步需求收集已覆盖需求探索 ✅
   → 直接调用 designer agent，遵循其工作流程
```

## 项目 Agents 体系

```
agents/
├── designer.md          # AI 设计师助手 — H5 活动页流程编排者
├── integration.md       # API 数据集成助手 — 真实接口接入与联调
├── skills/              # designer 调用的项目内能力模块
│   ├── requirement-collection/SKILL.md  # 需求收集
│   ├── structure-planning/SKILL.md      # 结构规划
│   ├── visual-design/SKILL.md           # 视觉细化与视觉修改
│   ├── section-implementation/SKILL.md  # Section 实施、Playground/Runtime/Store 联动
│   └── section-verification/SKILL.md    # 单 Section 验证与最终收尾
└── shared/
    ├── DESIGN.md        # H5 活动页设计规范（画布、布局、色彩、字体、组件尺寸等）
    ├── DESIGN_INPUT.md  # 设计素材输入规则（原型图/视觉参考图职责边界）
    ├── DESIGN_OUTPUT.md # 端到端实施输出规则（操作范围、Section 格式、Playground/Runtime 注册）
    └── STRUCTURE_OUTPUT.md # Section 拆分决策树与结构输出模板
```

- `agents/*.md` — 可调用的 agent 定义
- `agents/skills/*/SKILL.md` — 项目内能力模块，由 `designer` agent 按阶段加载，不直接替代项目 agent
- `agents/shared/*.md` — 被 agent 或 skill 引用的共享规则文档，不可直接调用

## 自动触发规则

以下场景必须自动调用对应的 agent，无需用户手动 @指定：

### designer — H5 活动页设计与修改

当用户需求涉及 H5 活动页的**创建、修改或视觉调整**时，自动调用 `designer` agent：

| 触发场景 | 示例 |
|---|---|
| 创建新活动页面 | "设计一个抽奖活动页面"、"创建签到活动" |
| 修改活动样式 | "改一下这个活动的配色"、"按钮样式调一下" |
| 调整布局/结构 | "把排行榜移到下面"、"增加一个奖品区" |
| 视觉细节调整 | "标题字体再大一点"、"背景换成金色" |
| 活动模板相关 | "创建新的活动模板"、"基于这个模板改" |

> **新项目创建门禁**：当触发场景为**"创建新活动页面"**（含基于图片/原型图创建）时，`designer` agent 必须先输出完整的设计方案提案（包含项目目录、Section 拆分方案、结构锁定表、视觉方向），**等待用户书面确认后**，才能进入代码实现阶段。禁止跳过方案确认直接写代码。

设计依据：
- `agents/designer.md` — designer agent 定义
- `agents/skills/requirement-collection/SKILL.md` — 需求收集
- `agents/skills/structure-planning/SKILL.md` — 结构规划
- `agents/skills/visual-design/SKILL.md` — 视觉细化
- `agents/skills/section-implementation/SKILL.md` — Section 实施与联动
- `agents/skills/section-verification/SKILL.md` — 验证与最终收尾
- `agents/shared/DESIGN.md` — 设计规范底线
- `agents/shared/DESIGN_INPUT.md` — 素材输入与冲突处理规则
- `agents/shared/DESIGN_OUTPUT.md` — 端到端实施范围与格式规范

### integration — API 数据集成与接口联调

当用户需求明确涉及 H5 活动页的**接口接入、后端联调或数据集成**时，自动调用 `integration` agent：

| 触发场景 | 示例 |
|---|---|
| 接口接入 / API 接入 | "接一下活动首页接口"、"把这个页面对接后端 API" |
| 接口联调 / 后端对接 | "联调领奖接口"、"根据接口文档接真实数据" |
| DTO 映射 / adapter | "写 activityHome adapter"、"把后端 DTO 映射到 SectionState" |
| fixture / adapter test | "补接口 fixture"、"给 adapter 加 contract test" |
| store 真实数据 action | "把 integrations/store.ts 改成真实 load/refresh/claim" |
| 动态 Section contract 校验 | "检查动态 Section 的 contract" |
| defaultContent 泄漏检查 | "检查 runtime 有没有用 defaultContent fallback" |
| integration 验证 | "跑 validate-integration"、"验证接口接入完成度" |

`integration` 不覆盖以下场景：创建活动页、视觉修改、布局/样式调整、Playground 视觉预览、Section 视觉组件实现。这些仍归 `designer` agent。

> **人工阶段边界**：Designer Final Closeout 后不会自动进入 Integration。只有当用户另起请求或明确提出接口接入类任务时，才触发 `integration` agent。

Integration 依据：
- `agents/integration.md` — integration agent 定义
- `docs/ai/interface-integration-rules.md` — 接口接入规则
- `docs/ai/development-rules.md` — 三层架构和数据边界
- `agents/shared/STRUCTURE_OUTPUT.md` — 动态 Section 与跨 Section Tab 结构来源

---

## 新建活动项目强约束

当用户需求包含"新建项目 / 新活动 / 创建活动 / 生成新项目"时：

- 必须在 `apps/<campaign-name>/` 下创建独立项目。
- `apps/campaign-template/` 只能作为复制源，禁止作为业务实现目录。
- 写代码前必须先确认目标 app 目录；如果目标 app 不存在，必须优先使用 `pnpm create-campaign <campaign-name>` 创建项目。
- 只有当 `pnpm create-campaign` 不可用或明确失败且原因已记录时，才允许手动复制 `apps/campaign-template` 到 `apps/<campaign-name>`。
- Feedback 工作区、审批前不落盘、可选 root draft 和确认后落盘规则以 `docs/ai/README.md` §Feedback 工作区为唯一权威源。
- 实现阶段、Final Closeout 和 Integration 阶段禁止继续读取 root draft，只能使用 `apps/<campaign-name>/.feedback/`。
- 业务 Section、runtime、store、playground 注册都只能写入目标 app。
- 完成前必须检查 `apps/campaign-template` 无非预期 diff。
- 实现阶段必须遵守 `docs/ai/section-implementation-gate.md`：完成一个 Section 后立即单独执行 `pnpm --silent verify-section --campaign <campaign-name> <SectionName>`，通过后才允许进入下一个 Section；最终 `validate-section --all` 只能作为总验收的一项。
- Section 状态适配、流程预览、弹窗交互等实施细节见 `agents/skills/section-implementation/SKILL.md`。
