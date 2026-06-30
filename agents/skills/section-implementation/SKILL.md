---
name: section-implementation
description: H5 活动页 Section 实施能力模块。用于 designer agent 在用户确认方案后逐个实现 Section、Playground、Runtime、Store、弹窗和流程预览联动。
---

# Section Implementation Skill

用于第 4 步代码实现。本模块只保留执行顺序和关键禁令；详细规则以引用文档为唯一真源。

## 读取策略

开始实现前必读：

- 本文件全文。
- 当前活动 `apps/<campaign-name>/.feedback/status.json`。旧项目缺失时，读取 `progress.md` 并先迁移或校正当前状态。
- 当前 Section 卡 `apps/<campaign-name>/.feedback/sections/<SectionName>.md`。
- `demand.md`、`structure.md`、`design.md` 中与当前 Section refs 直接相关的片段；只有 Section 归属、交互、视觉约束不清楚时才全文复读这些产物。
- `docs/ai/section-implementation-gate.md` 的逐 Section 门禁、refs-first 组件卡和 spec-first 规则。

条件读取：

- 涉及目录边界、三层架构或状态声明不确定时，读取 `docs/ai/development-rules.md` 的相关章节。
- 涉及操作范围、Runtime Data Boundary、图片资产、动画落地或弹窗实现时，读取 `agents/shared/DESIGN_OUTPUT.md` 的对应章节。
- 新建活动、修改 i18n 架构、涉及 URL 语言、RTL 或 runtime 静态文案时，读取 `docs/ai/i18n-rules.md`。新建活动默认视为 i18n-ready 项目，即使当前只有一个语言。
- 涉及共享包选择时，读取 `docs/ai/framework-map.md`。
- 涉及模板目录、Playground/Runtime 注册方式不确定时，读取 `docs/campaign-template.md` 的相关章节。

## 进入条件

新项目模式必须满足：

- `apps/<campaign-name>/.feedback/demand.md`、`structure.md`、`design.md` 已存盘。
- `apps/<campaign-name>/.feedback/status.json` 已初始化，且 `confirmedForImplementation` 为 `true`。
- 第 3.5 步完整设计方案摘要已呈现。
- 用户已书面确认“可以开始实现”。
- 目标 app 是 `apps/<campaign-name>/`；不存在时优先运行 `pnpm create-campaign <campaign-name>` 创建。
- `apps/<campaign-name>/.feedback/` 已由已确认方案初始化；若本任务启用了 root draft，则 draft 已迁移到目标 app。实现阶段禁止继续读取 `.feedback/drafts/<task-id>/`。

修改模式必须满足：

- 目标 app、修改范围、预期效果已明确。
- 涉及结构或交互不确定项时已先确认。

## 执行顺序

1. 读取 `apps/<campaign-name>/.feedback/status.json`，确认 `phase`、`gate`、`currentSection` 和 Section 状态。
2. 在 `status.json` 中维护唯一当前状态；`progress.md` 只追加历史审计记录，不再作为恢复真源，不复制大段规则说明。
3. 按结构锁定表顺序逐个 Section 实施。
4. 每个 Section 先写 refs-first 组件设计卡和 `## Acceptance Tests` YAML；卡片只记录当前 Section 的必要字段与 refs，不复制全局结构表。
4a. 若当前 Section 命中 `Image Asset Inventory`，组件设计卡只列 `imageKeys` 和必要覆盖项；字段、占位、fallback 默认从 `structure.md` 的资产清单追溯。
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
9. 单 Section 验证通过并更新 `status.json` 后，才能进入下一个 Section；同时向 `progress.md` 追加一条审计记录。

执行粒度硬约束：

> 规则权威源见 `docs/ai/section-implementation-gate.md` §Mandatory Execution Order。此处只保留与 skill 操作相关的要点。

- 当前 Section 未通过自己的 `verify-section` 前，禁止创建、修改或注册后续 Section 的业务文件；独立 Section 脚手架例外见 `docs/ai/section-implementation-gate.md` §Independent Section Scaffolding Exception。
- 允许在共享文件中为当前 Section 添加最小必要代码，例如 Store 字段、Runtime import/render、Playground 注册；不允许一次性批量创建多个 Section 目录、组件文件、设计卡或测试文件。
- 若发现后续 Section 文件已经提前创建，必须先停止继续扩散，并在账本中记录流程偏差；后续修正仍按受影响 Section 逐个验证。

## 输出语言

- 组件设计卡、`apps/<campaign-name>/.feedback/progress.md` 审计记录、验收记录和对用户的实现说明默认使用中文。
- 代码文件中的变量名、类型名、Section 名、action 名、状态 key、命令和文件路径保留英文。
- `content.ts` 中的用户可见默认文案，除非用户明确要求中文、多语言或按素材原文还原，否则默认使用英文。
- 新建活动默认保留 app-local i18n 架构；单语言项目也必须通过默认语言资源和 `getI18nMessages` 管理 runtime 静态文案。

## 实现边界

以下边界由 `verify-section`、`validate-section --all`、`final-closeout-check` 和对应权威文档共同维护；本 skill 只保留执行提醒，不复制完整检查清单：

- 未确认实现前不写新项目代码，不修改 `apps/campaign-template/` 业务实现，不越界修改其他 app 或共享包。
- 不默认接入真实 API 或埋点；接口接入属于 `integration`。
- Runtime / integration / activity 不得依赖设计态 `defaultContent` fallback。
- 当前 Section 未验证通过前，不批量实现或注册后续 Section。
- 规格变化先改组件设计卡并重新生成 spec，禁止手改生成的 `*.spec.test.tsx`。
- 图片、动画、弹窗、i18n 和跨 Section 联动按当前 Section refs 追溯到权威规则；缺失 refs 时先补结构/视觉产物。
