# AI 文档入口

本目录只放 AI 执行规范、门禁和引用地图。面向人类阅读的架构背景见 `docs/architecture.md`，模板导览见 `docs/campaign-template.md`。

## 读取顺序

AI 执行任务时按以下顺序读取规则：

1. `AGENTS.md`：项目 agent 调度、自动触发、优先级和新建活动硬约束。
2. `agents/designer.md`：H5 活动页创建、修改、视觉调整和 Section 实施流程入口。
3. `agents/integration.md`：真实接口接入、adapter、fixture、联调和 integration 验证入口。
4. `docs/ai/development-rules.md`：目录边界、数据流、Playground、Runtime 和 activity 规则。
5. `docs/ai/framework-map.md`：共享包引用地图。
6. `docs/ai/section-implementation-gate.md`：Section 实现阶段门禁、20 项 Layer 0 检查、Final Closeout Gate。
7. `docs/ai/interface-integration-rules.md`：接口接入边界、`defaultContent` 边界、`validate-integration` 规则。
8. `docs/ai/i18n-rules.md`：多语言、RTL 和文案资源规则。

## 权威边界

- 活动页设计、创建、修改：以 `AGENTS.md` 和 `agents/designer.md` 为最高入口。
- 接口接入、DTO 映射、adapter、fixture、真实数据 store action：以 `agents/integration.md` 为最高入口。
- Section 逐个实现和验证：以 `docs/ai/section-implementation-gate.md` 为门禁真源。
- 接口集成验证：以 `docs/ai/interface-integration-rules.md` 和 `scripts/validate-integration.ts` 为真源。
- 架构背景和人类说明：只读 `docs/architecture.md`，不得把它覆盖为执行规范。

## Feedback 工作区

新建活动在活动名和 app 目录确认前，使用 root draft 工作区：

```txt
.feedback/drafts/<task-id>/
├── meta.json
├── progress.md
├── demand.md
├── structure.md
├── design.md
└── sections/
```

`meta.json` 至少记录：

```json
{
  "status": "draft",
  "campaignName": null,
  "targetApp": null,
  "createdAt": "2026-06-25T00:00:00.000Z"
}
```

规则：

- app 创建前：只能写 `.feedback/drafts/<task-id>/`，禁止写根目录裸 `.feedback/progress.md`。
- 活动名确认后：更新 `meta.json` 的 `campaignName` 和 `targetApp`。
- `apps/<campaign-name>/` 创建成功后：立即迁移 draft 到 `apps/<campaign-name>/.feedback/`，并把 `meta.json.status` 改为 `active`。
- 第 4 步实现、Final Closeout 和 Integration 阶段：只读写 `apps/<campaign-name>/.feedback/`。
- 修改既有活动：直接使用 `apps/<campaign-name>/.feedback/`，不创建 root draft。

## 常用门禁

```bash
pnpm create-campaign <campaign-name>
pnpm --silent verify-section --campaign <campaign-name> <SectionName>
pnpm validate-section --campaign <campaign-name> --all
pnpm validate-integration --campaign <campaign-name>
pnpm validate-integration --campaign <campaign-name> --section <SectionName>
pnpm final-closeout-check --campaign <campaign-name>
```

`validate-section` 当前执行 20 项 Layer 0 检查。`verify-section` 是单 Section 闭环，不能用最终 `--all` 替代。
