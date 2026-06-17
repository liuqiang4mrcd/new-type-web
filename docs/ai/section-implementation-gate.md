# Section Implementation Gate

用于 H5 活动页第 4 步实现阶段，确保遵守“完成一个 Section，验证一个 Section”的过程门禁。

## 强制执行顺序

每个 Section 必须按以下顺序闭环：

1. 先写当前 Section 的「组件设计卡」，明确作用、展示方式、数据、交互、状态和边界。
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

```md
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
- Interaction states:
- State transitions:
- Edge cases:
- Validation command: `pnpm validate-section --campaign <campaign-name> <SectionName>`
```

如果组件设计卡无法判断状态或交互，必须先补充分析，不能先写代码。

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

## 禁止事项

- 禁止批量实现多个 Section 后只运行 `--all`。
- 禁止用最终 build 代替单组件验证。
- 禁止当前 Section 单独验证失败时继续实现下一个 Section。
- 禁止只在对话中口头说明进度而不更新 `.feedback/progress.md`。

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

所有 Section 均完成单独验证后，才能运行：

```bash
pnpm validate-section --campaign <campaign-name> --all
pnpm --filter @new-type/<campaign-name> build
```

最终回复必须说明：

- 每个 Section 的单独验证结果。
- `--all` 总验收结果。
- build 结果。
