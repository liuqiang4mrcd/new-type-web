---
name: section-implementation
description: H5 活动页 Section 实施能力模块。用于 designer agent 在用户确认方案后逐个实现 Section、Playground、Runtime、Store、弹窗和流程预览联动。
---

# Section Implementation Skill

用于第 4 步代码实现。本模块只保留执行顺序和关键禁令；详细规则以引用文档为唯一真源。

## 必读引用

开始实现前必须读取：

- `agents/shared/DESIGN_OUTPUT.md`：操作范围、Section 输出格式、Layout/Interaction 保真、弹窗、流程预览、Runtime 联动。
- `docs/ai/section-implementation-gate.md`：组件设计卡、spec-first、逐 Section 门禁、实现阶段账本。
- `docs/ai/development-rules.md`：目录边界、三层架构、状态声明、流程预览规则。
- `docs/ai/framework-map.md`：共享包引用地图。
- `docs/campaign-template.md`：模板结构和 Playground/Runtime 注册方式。

## 进入条件

新项目模式必须满足：

- `.feedback/demand.md`、`.feedback/structure.md`、`.feedback/design.md` 已存盘。
- 第 3.5 步完整设计方案摘要已呈现。
- 用户已书面确认“可以开始实现”。
- 目标 app 是 `apps/<campaign-name>/`；不存在时优先运行 `pnpm create-campaign <campaign-name>` 创建。

修改模式必须满足：

- 目标 app、修改范围、预期效果已明确。
- 涉及结构或交互不确定项时已先确认。

## 执行顺序

1. 读取 `.feedback/progress.md`，确认 Current phase / Current gate。
2. 在既有 `.feedback/progress.md` 中追加 `docs/ai/section-implementation-gate.md` 的实现阶段模板。
3. 按结构锁定表顺序逐个 Section 实施。
4. 每个 Section 先写组件设计卡、`Effect Reasoning` 和 `## Acceptance Tests` YAML。
5. 运行 `pnpm generate-spec-tests --campaign <campaign-name> <SectionName>`。
6. 按 `DESIGN_OUTPUT.md` 实现 Section、Playground、Runtime、Store 和必要资源。
7. 若存在跨 Section 交互，确保 Playground `ACTION_WIRING` 与 Runtime Store action 都按 Interaction Spec 对齐。
8. 交给 `section-verification` 执行 `pnpm --silent verify-section --campaign <campaign-name> <SectionName>`。
9. 单 Section 验证通过并更新 `.feedback/progress.md` 后，才能进入下一个 Section。

## 输出语言

- 组件设计卡、`.feedback/progress.md` 实现阶段记录、验收记录和对用户的实现说明默认使用中文。
- 代码文件中的变量名、类型名、Section 名、action 名、状态 key、命令和文件路径保留英文。
- `content.ts` 中的用户可见默认文案，除非用户明确要求英文或多语言，否则默认使用中文。

## 硬禁令

- 禁止在用户确认“可以开始实现”前写新项目代码。
- 禁止直接修改 `apps/campaign-template/` 业务实现。
- 禁止越界修改其他 `apps/*`、`packages/*`、`scripts/*`。
- 禁止默认接入真实 API 或埋点；`integrations/api.ts` / `integrations/tracking.ts` 只有用户明确要求时才可改。
- 禁止组件设计卡缺少 Layout Spec 或 Interaction Spec 引用时直接实现。
- 禁止强交互 Section 缺少 Effect Spec 引用或 Effect Reasoning 时直接实现。
- 禁止批量实现多个 Section 后再统一验证。
- 禁止手改生成的 `*.spec.test.tsx`；规格变化必须先改组件设计卡再重新生成。
- 禁止 Runtime 跨 Section targetChange 使用 console.log-only；必须绑定 Store action。
- 禁止 Final Closeout 前遗留 `TODO` 占位。
