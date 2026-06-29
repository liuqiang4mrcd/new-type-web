---
name: section-implementation
description: H5 活动页 Section 实施能力模块。用于 designer agent 在用户确认方案后逐个实现 Section、Playground、Runtime、Store、弹窗和流程预览联动。
---

# Section Implementation Skill

用于第 4 步代码实现。本模块只保留执行顺序和关键禁令；详细规则以引用文档为唯一真源。

## 读取策略

开始实现前必读：

- 本文件全文。
- 当前活动 feedback 工作区的 `progress.md`，以及 `demand.md`、`structure.md`、`design.md` 中与当前 Section / 当前门禁相关的内容；只有当前 Section 归属、交互、视觉约束不清楚时才全文复读这些产物。
- `agents/shared/DESIGN_OUTPUT.md` 的操作范围、Section 输出格式、Layout/Interaction/Effect 保真和当前 Section 命中的实现规则。
- `docs/ai/section-implementation-gate.md` 的组件设计卡、spec-first、逐 Section 门禁和当前 Section 验证规则。
- `docs/ai/development-rules.md` 的目录边界、三层架构和状态声明相关章节。

条件读取：

- 新建活动、修改 i18n 架构、涉及 URL 语言、RTL 或 runtime 静态文案时，读取 `docs/ai/i18n-rules.md`。新建活动默认视为 i18n-ready 项目，即使当前只有一个语言。
- 涉及共享包选择时，读取 `docs/ai/framework-map.md`。
- 涉及模板目录、Playground/Runtime 注册方式不确定时，读取 `docs/campaign-template.md` 的相关章节。
- 涉及弹窗、完整页预览、流程预览、跨 Section 联动、动态数据边界或强交互动效时，只读取 `agents/shared/DESIGN_OUTPUT.md` / `docs/ai/section-implementation-gate.md` 中对应章节，不为普通静态 Section 预读全部细则。

## 进入条件

新项目模式必须满足：

- `apps/<campaign-name>/.feedback/demand.md`、`structure.md`、`design.md` 已存盘。
- 第 3.5 步完整设计方案摘要已呈现。
- 用户已书面确认“可以开始实现”。
- 目标 app 是 `apps/<campaign-name>/`；不存在时优先运行 `pnpm create-campaign <campaign-name>` 创建。
- `apps/<campaign-name>/.feedback/` 已由已确认方案初始化；若本任务启用了 root draft，则 draft 已迁移到目标 app。实现阶段禁止继续读取 `.feedback/drafts/<task-id>/`。

修改模式必须满足：

- 目标 app、修改范围、预期效果已明确。
- 涉及结构或交互不确定项时已先确认。

## 执行顺序

1. 读取 `apps/<campaign-name>/.feedback/progress.md`，确认 Current phase / Current gate。
2. 在既有 `apps/<campaign-name>/.feedback/progress.md` 中追加实现阶段轻量账本；只记录当前 Section、状态、命令和 Final Closeout 勾选项，不复制大段规则说明。模板来源仍以 `docs/ai/section-implementation-gate.md` 为准。
3. 按结构锁定表顺序逐个 Section 实施。
4. 每个 Section 先写组件设计卡、`Effect Reasoning` 和 `## Acceptance Tests` YAML。
4a. 若当前 Section 命中 `Image Asset Inventory`，组件设计卡必须补充 `Image Asset refs`，列出 `imageKey`、`contentField`、`renderMethod`、`@/assets/...` import path、placeholder 和 fallback；缺失时先回到结构/视觉阶段补齐。
5. 运行 `pnpm generate-spec-tests --campaign <campaign-name> <SectionName>`。
6. 按 `DESIGN_OUTPUT.md` 实现 Section、Playground、Runtime、Store 和必要资源。
6a. 写完 `stateTransitions` 后立即实现对应的动画落地：
    - 强交互类型（spin / slide / scale）使用 `motion/react` 的 `motion.div` + `animate` prop，不得用纯 CSS transition
    - 弹窗 Section 使用 `<AnimatePresence>` + `motion.div` 实现入场/退场
    - `easing` 值从 `content.ts` 的对应 `animation.easing` 提取并应用到 `transition` 或 CSS 中
    - `duration` 与 `content.ts` 声明一致
    - 实现后对照 `stateTransitions` 逐条确认：每个声明的动画在 `index.tsx` 中有对应的 DOM 可见变化
7. 若存在跨 Section 交互，确保 `phone-preview` 复用 Runtime Store action；`playground/preview-state.ts` 只初始化预览数据，不维护 content patch 表。
8. 交给 `section-verification` 执行 `pnpm --silent verify-section --campaign <campaign-name> <SectionName>`。
9. 单 Section 验证通过并更新 `apps/<campaign-name>/.feedback/progress.md` 后，才能进入下一个 Section。

执行粒度硬约束：

> 规则权威源见 `docs/ai/section-implementation-gate.md` §Mandatory Execution Order。此处只保留与 skill 操作相关的要点。

- 当前 Section 未通过自己的 `verify-section` 前，禁止创建、修改或注册后续 Section 的业务文件；独立 Section 脚手架例外见 `docs/ai/section-implementation-gate.md` §Independent Section Scaffolding Exception。
- 允许在共享文件中为当前 Section 添加最小必要代码，例如 Store 字段、Runtime import/render、Playground 注册；不允许一次性批量创建多个 Section 目录、组件文件、设计卡或测试文件。
- 若发现后续 Section 文件已经提前创建，必须先停止继续扩散，并在账本中记录流程偏差；后续修正仍按受影响 Section 逐个验证。

## 输出语言

- 组件设计卡、`apps/<campaign-name>/.feedback/progress.md` 实现阶段记录、验收记录和对用户的实现说明默认使用中文。
- 代码文件中的变量名、类型名、Section 名、action 名、状态 key、命令和文件路径保留英文。
- `content.ts` 中的用户可见默认文案，除非用户明确要求中文、多语言或按素材原文还原，否则默认使用英文。
- 新建活动默认保留 app-local i18n 架构；单语言项目也必须通过默认语言资源和 `getI18nMessages` 管理 runtime 静态文案。

## 硬禁令

- 禁止在用户确认”可以开始实现”前写新项目代码；见权威源 `agents/designer.md` §Design Proposal Approval。
- 禁止直接修改 `apps/campaign-template/` 业务实现。
- 禁止越界修改其他 `apps/*`、`packages/*`、`scripts/*`。
- 禁止默认接入真实 API 或埋点；`integrations/api.ts` / `integrations/tracking.ts` 只有用户明确要求时才可改。
- 禁止在 `integrations/`、`activity/`、`runtime/` 中 import `designer/sections/*/content.ts` 或用 `defaultContent` 作为接口/mock/runtime fallback；见权威源 `agents/shared/DESIGN_OUTPUT.md` §Runtime Data Boundary。
- 禁止在 `integrations/store.ts` 中手写等价于设计态 `defaultContent` 的假数据来填充 `apps/<campaign-name>/.feedback/structure.md` 标记为 `数据来源 = 动态数据` 的 Section；见权威源 `agents/shared/DESIGN_OUTPUT.md` §Runtime Data Boundary。
- 禁止视觉组件直接读取 URL、store 或 i18n 当前语言；需要国际化时，由 runtime container / adapter 使用当前 `ui.lang` 生成最终字符串后通过 `content` 传入。
- 禁止因为当前只交付一个语言而删除 `src/i18n/`、移除 runtime `lang/dir`、跳过 URL locale 解析，或把 runtime 静态文案硬编码到 container/store/视觉组件。
- 禁止 Runtime 中使用 `useStore((s) => selectXxxSection(s.appState))`；Zustand selector 只能订阅原始字段或 primitive。派生 content 放在组件 render/useMemo 或拆分订阅。
- 禁止新增 `activity/selectors/*` 或 `phone-preview` 专用 `ACTION_WIRING`；完整页面预览必须通过 `preview-state` 初始化 `RuntimeViewState` 并复用 runtime container。
- 禁止组件设计卡缺少核心必填字段时直接实现。
- 禁止命中条件必填字段时跳过对应区块直接实现；条件必填详见 `docs/ai/section-implementation-gate.md` 组件设计卡模板。
- 禁止用 `div` / CSS 方块 / emoji 替代业务图片；见权威源 `agents/shared/DESIGN_OUTPUT.md` §Image Asset Gate。
- 禁止实现阶段临时发明图片字段名；图片字段必须来自 `Image Asset Inventory` 或组件设计卡。
- 禁止使用相对路径 import app-local 图片资源；见权威源 `agents/shared/DESIGN_OUTPUT.md` §ESM Import Rules。
- 禁止强交互 Section 缺少 Effect Spec 引用或 Effect Reasoning 时直接实现；见权威源 `agents/shared/DESIGN_OUTPUT.md` §Animation Landing。
- 禁止批量实现多个 Section 后再统一验证；见权威源 `docs/ai/section-implementation-gate.md` §Mandatory Execution Order。
- 禁止批量创建多个 Section 文件后再逐个验证；见权威源 `docs/ai/section-implementation-gate.md` §Mandatory Execution Order。
- 禁止手改生成的 `*.spec.test.tsx`；规格变化必须先改组件设计卡再重新生成。
- 禁止 Runtime 跨 Section targetChange 使用 console.log-only；必须绑定 Store action。
- 禁止 Final Closeout 前遗留 `TODO` 占位。
