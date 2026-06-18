# Section Implementation Gate

用于 H5 活动页第 4 步实现阶段，确保遵守“完成一个 Section，验证一个 Section”的过程门禁。

## 强制执行顺序

每个 Section 必须按以下顺序闭环：

1. 先写当前 Section 的「组件设计卡」，明确作用、展示方式、Layout Spec 引用、Interaction Spec 引用、数据、交互、状态和边界。
2. 完成状态适配判断，明确该 Section 是否真的需要 `loading / empty / error`。
3. 在组件设计卡中写入 `## Acceptance Tests` YAML，作为该 Section 的功能规格源。
4. 根据组件设计卡生成规格测试：

```bash
pnpm generate-spec-tests --campaign <campaign-name> <SectionName>
```

5. 实现 `designer/sections/<SectionName>/` 文件：`types.ts` / `content.ts` / `index.tsx` 必需；存在 required UI 状态时才创建 `states.tsx`。
6. 注册 `playground/section-registry.ts`，交互 Section 必须提供 `defaultActions`。
7. 接入 `integrations/store.ts` 的 `SectionState<<SectionName>Content>`。
8. 创建 `runtime/sections/<BaseName>Container.tsx`。
9. 在 `runtime/app.tsx` import 并渲染 Container。
10. 立即运行单组件验证：

```bash
pnpm --silent verify-section --campaign <campaign-name> <SectionName>
```

11. 单组件结构检查和规格测试全部通过后，更新 `.feedback/progress.md`。
12. 再开始下一个 Section。

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
- Acceptance tests:
  - Spec source: `.feedback/sections/<SectionName>.md`
  - Generated spec test: `apps/<campaign-name>/src/designer/sections/<SectionName>/__tests__/<SectionName>.spec.test.tsx`
  - Regression test: `apps/<campaign-name>/src/designer/sections/<SectionName>/__tests__/<SectionName>.regression.test.tsx`
- Validation command: `pnpm --silent verify-section --campaign <campaign-name> <SectionName>`
```

如果组件设计卡无法判断布局、关键元素归属、状态或交互，必须先补充分析，不能先写代码。

## Spec-First 组件测试

组件设计卡必须包含 `## Acceptance Tests`，并用 YAML 描述用户可见行为和稳定定位约定。该 YAML 是 `*.spec.test.tsx` 的唯一源头；实现阶段禁止直接修改生成的 spec 测试。如果验收项错误，必须先修改组件设计卡，再重新生成测试。

推荐结构：

````md
## Acceptance Tests

```yaml
tests:
  - id: claim-ready-click
    type: action
    level: vitest
    behavior: user taps the claim button in ready state
    given:
      contentState: ready
    target:
      role: button
      name: claim
      testId: claim-button
    action:
      click: true
    expect:
      actionCalled: onClaim
      times: 1

  - id: rule-modal-open-close
    type: modal
    level: vitest
    behavior: user opens and closes the rule modal
    target:
      role: button
      name: rule
      testId: rule-button
    action:
      click: true
    expect:
      visibleText: Rule
    followup:
      target:
        role: button
        name: close
        testId: rule-close-button
      action:
        click: true
      expect:
        hiddenText: Rule
```
````

第一版 Vitest schema 只支持活动页常见 DOM / action / state 断言：

| 字段     | 支持值                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `target` | `role` + `name`、`label`、`text`、`testId`                                                                                              |
| `action` | `click: true`、`typeText: string`                                                                                                       |
| `expect` | `visibleText`、`hiddenText`、`testIdVisible`、`testIdHidden`、`actionCalled`、`times`、`disabled`、`enabled`、`hasClass`、`notHasClass` |
| `level`  | `vitest`（默认）、`playwright`                                                                                                          |

选择器优先级为 `role + name` → `label` → `text` → `testId`。可点击控件必须优先提供可访问名称；复杂视觉热区才使用 `data-testid` 作为主定位。

`level: playwright` 的验收项不会生成 Vitest 用例，但必须保留在组件设计卡中，作为 Layer 2 视觉或集成验收事项。生成器遇到不支持字段时必须失败退出，禁止静默跳过。

生成文件规则：

| 文件                                | 维护方式           | 说明                                                   |
| ----------------------------------- | ------------------ | ------------------------------------------------------ |
| `<SectionName>.spec.test.tsx`       | 自动生成，可被覆盖 | 从 Component Card 的 `Acceptance Tests` 生成，禁止手改 |
| `<SectionName>.regression.test.tsx` | 人工维护           | 补充历史 bug、边界场景和非规格回归用例，生成器永不触碰 |

`pnpm --silent verify-section --campaign <campaign> <SectionName>` 每次都会重新生成 `*.spec.test.tsx`，然后运行当前 Section 的 spec 测试；如果 regression 测试文件存在，也会一并运行。

## 状态适配规则

禁止所有组件默认套用四状态。必须按组件职责声明真实状态：

| Section 类型             | UI 状态建议                            | business 状态建议                  | interaction 状态建议              |
| ------------------------ | -------------------------------------- | ---------------------------------- | --------------------------------- |
| 静态展示 / 规则弹窗      | 通常无 `loading / empty / error`       | 按活动阶段可选                     | `open / closed` 等真实交互        |
| 数据列表 / 奖励列表      | 按数据源决定 `loading / empty / error` | `beforeStart / inProgress / ended` | 展开、筛选、翻页等                |
| 强交互组件 / 转盘 / 领取 | 按数据源决定                           | 按活动阶段声明                     | 必须声明并提供 `stateTransitions` |
| 纯视觉装饰               | 通常无 UI 状态                         | 通常无                             | 通常无                            |

只有 `supportedStates` 中声明为 `type: 'ui'` 且 `required: true` 的状态，才需要：

- `states.tsx` 中导出对应状态组件。
- `playground/section-registry.ts` 的 `stateViews` 注册。
- Runtime Container 中对应 `case 'loading' / 'empty' / 'error'` 分支。

## 验证检查清单（Layer 0 — 17 项）

`pnpm validate-section --campaign <campaign> <SectionName>` 自动执行以下 17 项检查：

| #   | 检查项                | 说明                                                                             |
| --- | --------------------- | -------------------------------------------------------------------------------- |
| 1   | Section 文件完整性    | types/content/index 是否存在；states 由 UI 状态覆盖检查按需验证                  |
| 2   | supportedStates 声明  | content.ts 中是否导出了 supportedStates                                          |
| 3   | stateData 声明        | content.ts 中是否导出了 stateData                                                |
| 4   | UI 状态组件覆盖       | states.tsx 是否导出了所有 required UI 组件                                       |
| 5   | 业务状态数据覆盖      | stateData 是否包含所有 required 业务状态                                         |
| 6   | 反向一致性            | stateData 的 key 都在 supportedStates 中声明                                     |
| 7   | Playground 注册       | section-registry.ts 中已注册                                                     |
| 8   | stateViews 对齐       | 注册项的 stateViews 覆盖所有 UI 状态                                             |
| 9   | Runtime Container     | runtime/sections/ 下有对应 Container                                             |
| 10  | Container 路由完整性  | Container switch 覆盖 loading/empty/error/ready                                  |
| 11  | Store 对齐            | store 中有 SectionState&lt;NameContent&gt;                                       |
| 12  | Runtime 注册          | runtime/app.tsx 中已 import 并渲染 Container                                     |
| 13  | stateTransitions 声明 | 交互 Section 已声明状态转换                                                      |
| 14  | 声明完整性            | stateTransitions 的 from/to 均在 supportedStates 中                              |
| 15  | 状态可达性            | 从初始状态出发，所有交互状态可达                                                 |
| 16  | 分层边界检查          | index.tsx 未违规 import useStore/API/埋点                                        |
| 17  | Runtime 联动实现      | `ACTION_WIRING` 中跨 Section action 在 Runtime Container 中不是 console.log-only |

> 流程预览的场景分类、数据结构和数据流规则见 `docs/ai/development-rules.md` §流程预览规则。
> 弹窗 Section 实现要求、phone-preview.tsx ACTION_WIRING 联动见 `agents/skills/section-implementation/SKILL.md`。

## 禁止事项

- 禁止批量实现多个 Section 后只运行 `--all`。
- 禁止用最终 build 代替单组件验证。
- 禁止当前 Section 单独验证失败时继续实现下一个 Section。
- 禁止只在对话中口头说明进度而不更新 `.feedback/progress.md`。
- 禁止在组件设计卡没有引用 Layout Spec 的情况下实现关键布局。
- 禁止在组件设计卡没有引用 Interaction Spec 的情况下实现交互 Section。

## `.feedback/progress.md` 实现阶段模板

`.feedback/progress.md` 是 designer 任务的全局 process ledger。第 4 步进入实现阶段时，必须在既有 `.feedback/progress.md` 中追加以下实现阶段账本，并预置后续所有 Final Closeout Gate 任务。

当上下文被压缩、对话中断或 AI 不确定当前阶段时，必须先读取 `.feedback/progress.md`，按全局 `Current phase`、实现阶段 `Current Gate` 和下方 checklist 恢复，不得凭对话记忆继续执行。

```md
# Designer Task Progress

<!-- 第 1-3.5 步的 Global Flow 由 agents/designer.md 维护；以下内容为第 4 步追加区块。 -->

## Section Implementation Progress

## Execution Context

- Campaign: `<campaign-name>`
- Target app: `apps/<campaign-name>`
- Source template: `apps/campaign-template`
- Mode: `new-project`
- Design package confirmed: yes
- Current phase: `section-implementation | final-closeout | completed`
- Resume rule: continue from global Current phase and implementation Current Gate; if code and this file conflict, audit and update this file before implementing.

| Order | Section            | Implemented | Single Validation | Command                                                                 | Result  |
| ----: | ------------------ | ----------- | ----------------- | ----------------------------------------------------------------------- | ------- |
|     1 | HeroSection        | [ ]         | [ ]               | `pnpm --silent verify-section --campaign <campaign> HeroSection`        | pending |
|     2 | UserBalanceSection | [ ]         | [ ]               | `pnpm --silent verify-section --campaign <campaign> UserBalanceSection` | pending |
|     3 | PrizeSection       | [ ]         | [ ]               | `pnpm --silent verify-section --campaign <campaign> PrizeSection`       | pending |

## Current Gate

- Current Section: `<SectionName>`
- Status: `planned | implementing | implemented | validating | validated`
- Last validation output: `pending`

## Section Loop Checklist

- [ ] All component cards written under `.feedback/sections/` or this file.
- [ ] All spec tests generated from component cards.
- [ ] All Sections implemented.
- [ ] All Sections registered in Playground in locked structure order.
- [ ] All Runtime Containers created and rendered in locked structure order.
- [ ] All required Store actions implemented.
- [ ] All phone-preview `ACTION_WIRING` entries completed.
- [ ] Every Section has passed its own `pnpm --silent verify-section --campaign <campaign-name> <SectionName>`.

## Final Closeout Gate

- [ ] Render order checked: `playground/section-registry.ts` and `runtime/app.tsx` match the locked structure order.
- [ ] Layout spec checked: implemented Section order, key element placement, spacing, alignment, and layer rules match Layout Spec.
- [ ] Playground wiring checked: every Interaction Spec item is mapped to defaultActions / ACTION_WIRING / stateTransitions and contains no TODO placeholders.
- [ ] Runtime wiring checked: every cross-Section targetChange has a Store action and every Runtime Container binds that action; console.log-only handlers are allowed only for external/no-target interactions.
- [ ] All sections validation passed: `pnpm validate-section --campaign <campaign-name> --all`
- [ ] Unit spec tests passed: `pnpm test:unit --reporter=minimal --silent=passed-only apps/<campaign-name>/src`
- [ ] Build passed: `pnpm --filter @new-type/<campaign-name> build`
- [ ] Feedback archived: root `.feedback/` moved to `apps/<campaign-name>/.feedback/`
```

## 最终验收

所有 Section 均完成单独验证后，必须进入最终收尾门禁。**单 Section 全部通过后不能直接宣布完成；`--all` 只是收尾门禁中的一项。**

Final Closeout Gate 必须已在进入第 4 步时预置到 `.feedback/progress.md`。执行最终验收时逐项勾选并记录结果，禁止等到最后才追加 checklist。

逐项执行：

1. 检查 `playground/section-registry.ts` 的注册顺序与结构锁定表一致。
2. 检查 `runtime/app.tsx` 的渲染顺序与结构锁定表一致。
3. 按 Layout Spec 检查关键元素位置、尺寸、间距、对齐、层级和响应规则是否被实现保留。
4. 按 Interaction Spec 逐条检查 `playground/section-registry.ts` 的 `defaultActions`、`playground/phone-preview.tsx` 的 `ACTION_WIRING`、各 Section `content.ts` 的 `stateTransitions` 命名是否一致，且不存在 `TODO` 占位。
5. 按 Interaction Spec 逐条检查 Runtime 联动：凡 `targetSection` 不是 `self` 或 `targetChange` 会改变其他 Section 的交互，`integrations/store.ts` 必须存在对应 action，Runtime Container 必须绑定该 action，禁止 console.log-only。
6. 运行总验收：

```bash
pnpm validate-section --campaign <campaign-name> --all
```

7. 运行全量单元测试：

```bash
pnpm test:unit --reporter=minimal --silent=passed-only apps/<campaign-name>/src
```

8. 运行 build：

```bash
pnpm --filter @new-type/<campaign-name> build
```

9. 将根目录 `.feedback/` 整体移动到 `apps/<campaign-name>/.feedback/`，并确认根目录不再残留该活动的反馈文件。

最终回复必须说明：

- 每个 Section 的单独验证结果。
- 渲染顺序校验结果。
- Layout Spec 保真校验结果。
- Interaction Spec / `ACTION_WIRING` Playground 联动完整性校验结果。
- Runtime Store action / Container action 联动完整性校验结果。
- `--all` 总验收结果。
- 全量 Vitest 结果。
- build 结果。
- `.feedback` 归档结果。
