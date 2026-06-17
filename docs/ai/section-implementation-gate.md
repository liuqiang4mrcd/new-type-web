# Section Implementation Gate

用于 H5 活动页第 4 步实现阶段，确保遵守“完成一个 Section，验证一个 Section”的过程门禁。

## 强制执行顺序

每个 Section 必须按以下顺序闭环：

1. 先写当前 Section 的「组件设计卡」，明确作用、展示方式、Layout Spec 引用、Interaction Spec 引用、数据、交互、状态和边界。
2. 完成状态适配判断，明确该 Section 是否真的需要 `loading / empty / error`。
3. 实现 `designer/sections/<SectionName>/` 四文件。
4. 注册 `playground/section-registry.ts`，交互 Section 必须提供 `defaultActions`。
5. 接入 `integrations/store.ts` 的 `SectionState<<SectionName>Content>`。
6. 创建 `runtime/sections/<BaseName>Container.tsx`。
7. 在 `runtime/app.tsx` import 并渲染 Container。
8. 立即运行单组件验证：

```bash
pnpm validate-section --campaign <campaign-name> <SectionName>
```

9. 单组件检查全部通过后，更新 `.feedback/progress.md`。
10. 再开始下一个 Section。

## 组件设计卡

实际输出任何 Section 代码前，必须先完成组件设计卡。组件设计卡写入 `.feedback/progress.md` 或 `.feedback/sections/<SectionName>.md`。

组件设计卡必须继承第 2 步结构规划中的 Layout Spec 和 Interaction Spec。若当前 Section 对应的几何约束、关键元素约束或交互链路缺失，必须先补齐结构规划或向设计师确认，禁止直接实现。

```md
## <SectionName> Component Card

- Purpose:
- Display:
- Layout Spec refs:
  - Section constraints:
  - Key element constraints:
  - Preserved spacing/alignment/layer rules:
- Interaction Spec refs:
  - Interaction ids:
  - Action handlers:
  - Target changes:
  - Close/reset behavior:
  - Mutex rules:
- Content fields:
- Static constants:
- Async data source: yes/no
- User interactions:
- Actions:
- UI states:
- Business states:
- Interaction states:
- State transitions:
- Edge cases:
- Validation command: `pnpm validate-section --campaign <campaign-name> <SectionName>`
```

如果组件设计卡无法判断布局、关键元素归属、状态或交互，必须先补充分析，不能先写代码。

## 状态适配规则

禁止所有组件默认套用四状态。必须按组件职责声明真实状态：

| Section 类型 | UI 状态建议 | business 状态建议 | interaction 状态建议 |
|---|---|---|---|
| 静态展示 / 规则弹窗 | 通常无 `loading / empty / error` | 按活动阶段可选 | `open / closed` 等真实交互 |
| 数据列表 / 奖励列表 | 按数据源决定 `loading / empty / error` | `beforeStart / inProgress / ended` | 展开、筛选、翻页等 |
| 强交互组件 / 转盘 / 领取 | 按数据源决定 | 按活动阶段声明 | 必须声明并提供 `stateTransitions` |
| 纯视觉装饰 | 通常无 UI 状态 | 通常无 | 通常无 |

只有 `supportedStates` 中声明为 `type: 'ui'` 且 `required: true` 的状态，才需要：

- `states.tsx` 中导出对应状态组件。
- `playground/section-registry.ts` 的 `stateViews` 注册。
- Runtime Container 中对应 `case 'loading' / 'empty' / 'error'` 分支。

## 验证检查清单（Layer 0 — 16 项）

`pnpm validate-section --campaign <campaign> <SectionName>` 自动执行以下 16 项检查：

| # | 检查项 | 说明 |
|---|--------|------|
| 1 | 四文件完整性 | types/content/index/states 是否存在 |
| 2 | supportedStates 声明 | content.ts 中是否导出了 supportedStates |
| 3 | stateData 声明 | content.ts 中是否导出了 stateData |
| 4 | UI 状态组件覆盖 | states.tsx 是否导出了所有 required UI 组件 |
| 5 | 业务状态数据覆盖 | stateData 是否包含所有 required 业务状态 |
| 6 | 反向一致性 | stateData 的 key 都在 supportedStates 中声明 |
| 7 | Playground 注册 | section-registry.ts 中已注册 |
| 8 | stateViews 对齐 | 注册项的 stateViews 覆盖所有 UI 状态 |
| 9 | Runtime Container | runtime/sections/ 下有对应 Container |
| 10 | Container 路由完整性 | Container switch 覆盖 loading/empty/error/ready |
| 11 | Store 对齐 | store 中有 SectionState&lt;NameContent&gt; |
| 12 | Runtime 注册 | runtime/app.tsx 中已 import 并渲染 Container |
| 13 | stateTransitions 声明 | 交互 Section 已声明状态转换 |
| 14 | 声明完整性 | stateTransitions 的 from/to 均在 supportedStates 中 |
| 15 | 状态可达性 | 从初始状态出发，所有交互状态可达 |
| 16 | 分层边界检查 | index.tsx 未违规 import useStore/API/埋点 |

> 流程预览的场景分类、数据结构和数据流规则见 `docs/ai/development-rules.md` §流程预览规则。
> 弹窗 Section 实现要求、phone-preview.tsx ACTION_WIRING 联动见 `agents/designer.md` §4.4-4.5。

## 禁止事项

- 禁止批量实现多个 Section 后只运行 `--all`。
- 禁止用最终 build 代替单组件验证。
- 禁止当前 Section 单独验证失败时继续实现下一个 Section。
- 禁止只在对话中口头说明进度而不更新 `.feedback/progress.md`。
- 禁止在组件设计卡没有引用 Layout Spec 的情况下实现关键布局。
- 禁止在组件设计卡没有引用 Interaction Spec 的情况下实现交互 Section。

## `.feedback/progress.md` 模板

```md
# Section Implementation Progress

| Order | Section | Implemented | Single Validation | Command | Result |
|---:|---|---|---|---|---|
| 1 | HeroSection | [ ] | [ ] | `pnpm validate-section --campaign <campaign> HeroSection` | pending |
| 2 | UserBalanceSection | [ ] | [ ] | `pnpm validate-section --campaign <campaign> UserBalanceSection` | pending |
| 3 | PrizeSection | [ ] | [ ] | `pnpm validate-section --campaign <campaign> PrizeSection` | pending |

## Current Gate

- Current Section: `<SectionName>`
- Status: `planned | implementing | implemented | validating | validated`
- Last validation output: `pending`
```

## 最终验收

所有 Section 均完成单独验证后，必须进入最终收尾门禁。**单 Section 全部通过后不能直接宣布完成；`--all` 只是收尾门禁中的一项。**

先在 `.feedback/progress.md` 中追加并维护以下清单：

```md
## Final Closeout Gate

- [ ] Render order checked: `playground/section-registry.ts` and `runtime/app.tsx` match the locked structure order.
- [ ] Layout spec checked: implemented Section order, key element placement, spacing, alignment, and layer rules match Layout Spec.
- [ ] Action wiring checked: every Interaction Spec item is mapped to defaultActions / ACTION_WIRING / stateTransitions / Runtime actions and contains no TODO placeholders.
- [ ] All sections validation passed: `pnpm validate-section --campaign <campaign-name> --all`
- [ ] Build passed: `pnpm --filter @new-type/<campaign-name> build`
- [ ] Feedback archived: root `.feedback/` moved to `apps/<campaign-name>/.feedback/`
```

逐项执行：

1. 检查 `playground/section-registry.ts` 的注册顺序与结构锁定表一致。
2. 检查 `runtime/app.tsx` 的渲染顺序与结构锁定表一致。
3. 按 Layout Spec 检查关键元素位置、尺寸、间距、对齐、层级和响应规则是否被实现保留。
4. 按 Interaction Spec 逐条检查 `playground/section-registry.ts` 的 `defaultActions`、`playground/phone-preview.tsx` 的 `ACTION_WIRING`、各 Section `content.ts` 的 `stateTransitions` 和 Runtime actions 命名是否一致，且不存在 `TODO` 占位。
5. 运行总验收：

```bash
pnpm validate-section --campaign <campaign-name> --all
```

6. 运行 build：

```bash
pnpm --filter @new-type/<campaign-name> build
```

7. 将根目录 `.feedback/` 整体移动到 `apps/<campaign-name>/.feedback/`，并确认根目录不再残留该活动的反馈文件。

最终回复必须说明：

- 每个 Section 的单独验证结果。
- 渲染顺序校验结果。
- Layout Spec 保真校验结果。
- Interaction Spec / `ACTION_WIRING` 联动完整性校验结果。
- `--all` 总验收结果。
- build 结果。
- `.feedback` 归档结果。
