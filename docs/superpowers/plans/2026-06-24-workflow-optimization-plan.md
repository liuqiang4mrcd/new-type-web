# 活动页工作流优化方案

> 基于 eid-feast-rewards / eid-sacrifice 两个同源项目（同一套参考图 Prototype.png + reference.jpg、相同后端接口规范、不同模型产出）的对比分析，提取工作流改进点。
>
> 编写日期：2026-06-24
> 来源：grill-me session

---

## 背景

两个项目使用了相同的输入素材：
- 原型图：`参考图2/Prototype.png`（页面结构、模块顺序、弹窗关系、交互入口）
- 视觉参考图：`参考图2/reference.jpg`（配色、质感、字体气质、装饰语言）
- 后端接口规范相同

但由两个不同模型分别实现，在以下方面出现了显著差异。

---

## 核心差异清单

### 1. Section 拆分粒度不一致（P0）

| 维度 | eid-feast-rewards | eid-sacrifice |
|------|-------------------|---------------|
| Section 总数 | 10 | 12 |
| 礼物+玩法+Tab | 合并为 GiftActivitySection | 拆为 GiftSection + ActionSection |
| 弹窗 | Rule / RewardSelect / RewardRecord / Toast | 多出 CreateRoom / RankingRule / RewardPreview / RoomHelp |
| Tab 归属 | GiftActivitySection 内部管理 | 独立 ActionSection |

**根因**：没有统一的 Section 拆分决策标准，不同模型对同一原型图推断出不同的 Section 边界。

### 2. Tab 切换影响范围不同（P1）

- **eid-feast-rewards**：GiftActivitySection 内部 tab 切换，控制整个页面下半部分的条件渲染（feast tab 显示完整下半部分，leaderboard tab 隐藏下半部分并仅显示 LeaderboardSection）
- **eid-sacrifice**：ActionSection 独立，tab 切换仅影响自身容器内部内容

**影响**：Tab 是否跨 Section 控制直接影响 runtime/app.tsx 的架构设计（条件渲染 vs 内部切换）。

### 3. API 接入策略不同（P2）

- **eid-feast-rewards**：先接真实 API → adapter → fixture → store action → 再补 mock
- **eid-sacrifice**：全部使用 mock，store 直接 import designer/ 层的 defaultContent

**影响**：store 初始化策略不同（空态填充 vs 预填充），且 eid-sacrifice 违反了 "Runtime 禁止 import designer/defaultContent" 的规则。

### 4. Store 初始化差异

- **eid-feast-rewards**：`createInitialAppState()` 空态启动，API 返回后通过 adapter 填充
- **eid-sacrifice**：`defaultContent` 预填充所有 Section，API 只覆盖部分

---

## 优化方案

### P0 — 结构规划模板化（最高优先级）

在 `agents/shared/STRUCTURE_OUTPUT.md` 中定义带决策树枚举字段的 Section 表格模板。

**决策树分叉：**
```
是否动态数据？
  ├── 静态展示 → 无需 contract.ts + adapter
  └── 动态数据 → 必须 contract.ts + adapter + fixture

业务闭环完整性？
  ├── 独立业务闭环 + 独立状态 → 独立 Section
  └── 附属模块，无独立状态 → 合并入宿主 Section

Tab 切换影响范围？
  ├── 跨 Section 控制 → Tab 归属标记为"跨Section控制"，runtime 需条件渲染
  ├── 自身控制 → Tab 作为 Section 内部组件
  └── 无 Tab → 不涉及

弹窗复杂度？
  ├── 有交互逻辑（选择/确认/列表/表单）→ 独立 Section
  └── 纯信息展示 → 轻量 Section 或共享 UI 组件
```

**Section 列表表格格式（每个 Section 一行）：**

```markdown
| 顺序 | Section | 职责 | 数据来源 | 业务闭环 | Tab归属 | 弹窗复杂度 | 关键数据字段 |
```

### P1 — Tab 跨 Section 控制

当 `Tab归属 = 跨Section控制` 时，structure.md 必须额外标注 `[AFFECTED_SECTIONS]` 列表，明确哪些 Section 受该 Tab 显隐控制。

此规则嵌入到 `agents/shared/STRUCTURE_OUTPUT.md` 中。

### P2 — 独立的数据集成入口

在设计师流程（Designer Agent）全部完成后，新增独立的 Integration 阶段：

```
Designer Agent 流程完成 (Final Closeout ✅)
                    ↓
        Integration 阶段入口（人工或 agent 触发）
                    ↓
  对所有动态数据 Section 统一处理：
    contract.ts → adapter + adapter test → fixture → store action → runtime联调
```

**触发条件**：Final Closeout 通过后
**处理范围**：所有 `数据来源 = 动态数据` 的 Section
**禁止操作**：不得修改 `designer/` 下的视觉组件文件

---

## 落地顺序

1. **P0** — 创建 `agents/shared/STRUCTURE_OUTPUT.md`，designer agent 在结构规划阶段引用
2. **P1** — 在 STRUCTURE_OUTPUT.md 中嵌入 Tab 跨 Section 控制规则
3. **P2** — 新增 `agents/integration.md` 或扩充 `docs/ai/interface-integration-rules.md`

---

## 后续注意事项

- STRUCTURE_OUTPUT.md 需要和 DESIGN_OUTPUT.md 保持一致（Section 边界规则已在 DESIGN_OUTPUT.md 第 56 行有声明，要避免冲突）
- P2 Integration Agent 的定义需要明确其工具权限（允许操作：contracts/、integrations/adapters/、integrations/fixtures/、integrations/api.ts、integrations/store.ts；禁止操作：designer/、playground/、runtime/ 的视觉部分）
- 如果未来引入更多活动类型，决策树的节点可能需要扩展（如：是否需要外部分享、是否需要支付等）
