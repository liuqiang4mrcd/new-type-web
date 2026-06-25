# 数据集成入口（Integration Agent）设计方案

> 基于 eid-feast-rewards / eid-sacrifice 两个项目的对比分析，
> 发现 API 接入策略不一致且缺少独立的数据集成阶段。
>
> 状态：规划阶段（P2，待实施）
> 前置依赖：Designer Agent 流程完成 + Final Closeout 通过

---

## 问题

当前 Designer Agent 覆盖了从视觉到实现的全部流程，但 API 接入本质上是纯数据层的工程工作（contract.ts → adapter → fixture → store action），和视觉设计无关。两个项目展示了两种不同模式：

| 模式 | eid-feast-rewards | eid-sacrifice |
|------|-------------------|---------------|
| API 策略 | 先接真实 API → adapter → fixture | 全部 mock |
| store 初始 | createInitialAppState() 空态 → API 填充 | defaultContent 预填（违反规则） |
| 数据隔离 | 好，adapter 隔离层清晰 | 差，store 直接 import designer/ defaultContent |

需要引入一个独立的阶段和（可选）独立的 agent，在视觉定稿后统一处理数据集成。

---

## 方案

### 触发条件

所有 Section 视觉实现完成 + Final Closeout Gate 通过后，人工或自动触发。

```
Designer Agent 流程完成 (Final Closeout ✅)
                    ↓
          Integration 阶段入口
                    ↓
  对所有动态数据 Section 逐一/批量处理
```

### 处理范围

来自 `STRUCTURE_OUTPUT.md` 结构规划中 `数据来源 = 动态数据` 的所有 Section。

### 标准化步骤

每个动态数据 Section 按以下顺序完成：

1. **contract.ts** — 在该 Section 的 `designer/sections/<Name>/` 下创建 `contract.ts`，声明该 Section 需要的展示语义（非 DTO 字段，非 API 路径）
2. **adapter** — 在 `integrations/adapters/` 下创建 adapter，将 API DTO → DomainState / SectionState
3. **adapter test** — 为 adapter 编写单元测试，验证 DTO 到 SectionState 的映射正确
4. **fixture** — 在 `integrations/fixtures/` 下准备 mock JSON 数据，模拟真实 API 响应
5. **API 调用** — 在 `integrations/api.ts` 中添加或对齐真实 API 调用
6. **store action** — 在 `integrations/store.ts` 中添加 load/claim/refresh 等 action
7. **runtime联动** — 确认 runtime container 从 store 读取数据、适配 adapter、处理 loading/empty/error 状态

### 禁止操作

- 不得修改 `designer/` 下的视觉组件文件（types.ts / content.ts / index.tsx / states.tsx）
- 不得修改 `playground/` 下的预览文件
- 不得 import `designer/sections/*/content.ts` 到 `integrations/`、`activity/`、`runtime/`

### 门禁条件

Integration 阶段完成后必须通过：

- `pnpm build` 通过
- 所有 adapter test 通过
- `pnpm validate-section --all` 通过（验证 store 中 `defaultContent` 未被污染）

---

## 未来方向

### 独立 Agent 方案

如果需要，可创建 `agents/integration.md` 作为独立 agent，具有以下权限：

| 可操作 | 禁止操作 |
|--------|----------|
| `contracts/` | `designer/sections/*` 视觉文件 |
| `integrations/adapters/` | `playground/` |
| `integrations/fixtures/` | `runtime/` 的视觉部分 |
| `integrations/api.ts` | `apps/campaign-template/` |
| `integrations/store.ts`（仅数据层） | `packages/*` |
| `integrations/tracking.ts` | |

### 轻量方案

如果不需要独立 agent，可以在 `docs/ai/interface-integration-rules.md` 中增加流程文档，作为 Designer Agent 完成后的 check-list，由开发者手动执行。
