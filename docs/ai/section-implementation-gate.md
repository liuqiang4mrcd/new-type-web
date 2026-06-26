# Section Implementation Gate

用于 H5 活动页第 4 步实现阶段，确保遵守“完成一个 Section，验证一个 Section”的过程门禁。

## 强制执行顺序

每个 Section 必须按以下顺序闭环：

0. 当前 Section 未通过自己的 `pnpm --silent verify-section --campaign <campaign-name> <SectionName>` 前，禁止创建、修改或注册后续 Section 的业务文件。
   允许的例外仅限当前 Section 必需的共享基础设施，例如当前 Section 的 Store 字段、当前 Section 的 Runtime Container、当前 Section 的 Playground 注册，以及已经存在文件中为当前 Section 添加的最小 import/render 片段。禁止先批量创建多个 Section 目录、组件文件、设计卡或测试文件后再逐个验证。
1. 先写当前 Section 的「组件设计卡」，明确作用、展示方式、Layout Spec 引用、Interaction Spec 引用、Effect Spec 引用、Effect Reasoning、数据、交互、状态和边界。
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
   `integrations/`、`activity/`、`runtime/` 禁止 import `designer/sections/*/content.ts`；runtime 缺少真实 content 时返回 `loading / empty / error` 或 `null`，不得 fallback 到 `defaultContent`。
10. 立即运行单组件验证：

```bash
pnpm --silent verify-section --campaign <campaign-name> <SectionName>
```

11. 单组件结构检查和规格测试全部通过后，更新 `apps/<campaign-name>/.feedback/progress.md`。
12. 再开始下一个 Section。

## 组件设计卡

实际输出任何 Section 代码前，必须先完成组件设计卡。组件设计卡写入 `apps/<campaign-name>/.feedback/progress.md` 或 `apps/<campaign-name>/.feedback/sections/<SectionName>.md`。

组件设计卡必须继承第 2 步结构规划中的 Layout Spec、Interaction Spec、Effect Spec 和 Image Asset Inventory。若当前 Section 对应的几何约束、关键元素约束、交互链路、用户可见效果或图片资产语义缺失，必须先补齐结构规划或向设计师确认，禁止直接实现。

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
- Effect Spec refs:
  - Effect ids:
  - First frame:
  - During effect:
  - End state:
  - Target timing:
  - Blocking overlay:
  - Preview parity:
- Image Asset refs:
  - imageKeys:
  - content fields:
  - render methods:
  - import paths:
  - placeholders:
  - fallback behavior:
- Effect Reasoning:
  - Static view:
  - Trigger frame:
  - Animation/transition:
  - Completion:
  - Cross-section timing:
  - Disabled/mutex behavior:
  - Runtime vs phone-preview:
- Content fields:
- Static constants:
- Async data source: yes/no
- User interactions:
- Actions:
- UI states:
- Business states:
- Interaction states:
- State transitions:
- Animation binding:
  - Animated element:
  - DOM/CSS implementation:
  - Duration alignment:
  - Result/modal timing:
- Edge cases:
- Acceptance tests:
  - Spec source: `apps/<campaign-name>/.feedback/sections/<SectionName>.md`
  - Generated spec test: `apps/<campaign-name>/src/designer/sections/<SectionName>/__tests__/<SectionName>.spec.test.tsx`
  - Regression test: `apps/<campaign-name>/src/designer/sections/<SectionName>/__tests__/<SectionName>.regression.test.tsx`
- Validation command: `pnpm --silent verify-section --campaign <campaign-name> <SectionName>`
```

如果组件设计卡无法判断布局、关键元素归属、状态、交互或用户可见效果，必须先补充分析，不能先写代码。

如果当前 Section 含头像、礼物、奖品、道具、主视觉、背景图、装饰图或图标等图片类元素，组件设计卡必须填写 `Image Asset refs`。动态业务图片必须声明 `<img>` 渲染、语义化 `Content` 字段、本地 SVG placeholder 和加载失败 fallback；静态装饰图片必须声明 `css-background` 或 `<img aria-hidden="true">`。缺少这些信息时禁止实现。

强交互 Section 没有 `Effect Spec refs` 和 `Effect Reasoning` 时禁止实现。`Effect Reasoning` 必须说明代码如何保证效果真的发生，而不是复述 Interaction Spec。若推演发现 `apps/<campaign-name>/.feedback/structure.md` 的 Effect Spec 不完整，必须先回到结构规划补齐，再继续实现。

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

强交互组件如转盘、抽奖、翻牌、进度推进、滑动切换，必须在 `Acceptance Tests` 中补充至少一条 `level: playwright` 动画验收项，描述：

- 触发动作后哪个元素应进入动画态。
- 动画期间目标弹窗、遮罩或结果态是否应暂不出现。
- 动画结束后目标弹窗、遮罩或结果态何时出现。

示例：

```yaml
tests:
  - id: wheel-spins-before-result-modal
    type: animation
    level: playwright
    behavior: user taps crit and sees wheel spin before result modal
    target:
      role: button
      name: crit
      testId: crit-button
    action:
      click: true
    expect:
      testIdVisible: crit-wheel-disc
    description: click 后转盘盘面必须进入 spinning class，900ms 内结果弹窗不得遮住转盘，动画结束后再出现结果弹窗
```

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

## 验证检查清单（Layer 0 — 23 项）

`pnpm validate-section --campaign <campaign> <SectionName>` 自动执行以下 23 项检查：

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
| 17  | Runtime 联动实现      | 跨 Section action 在 Runtime Container 中不是 console.log-only                  |
| 18  | 动画 easing 对齐      | stateTransitions 中声明的 easing 在 index.tsx 中已使用                           |
| 19  | 动画 duration 对齐    | stateTransitions 中声明的 duration 与 index.tsx 一致                             |
| 20  | 强交互用 motion/react | spin/slide/scale 类型动画使用了 motion/react 而非纯 CSS transition              |
| 21  | Image Asset refs      | structure.md 命中 Image Asset Inventory 的 Section 必须在组件设计卡声明图片引用 |
| 22  | 图片引用路径          | app-local 图片资源必须用 `@/assets/...` ESM import，禁止相对路径和 Tailwind url |
| 23  | 业务图片 img 渲染     | 业务图片字段必须使用 `<img>` 渲染，并提供 `onError` fallback                    |

> 流程预览的场景分类、数据结构和数据流规则见 `docs/ai/development-rules.md` §流程预览规则。
> 弹窗 Section 实现要求、phone-preview 完整页预览联动见 `agents/skills/section-implementation/SKILL.md`。

## 禁止事项

- 禁止批量实现多个 Section 后只运行 `--all`。
- 禁止用最终 build 代替单组件验证。
- 禁止当前 Section 单独验证失败时继续实现下一个 Section。
- 禁止只在对话中口头说明进度而不更新 `apps/<campaign-name>/.feedback/progress.md`。
- 禁止在组件设计卡没有引用 Layout Spec 的情况下实现关键布局。
- 禁止在组件设计卡没有引用 Interaction Spec 的情况下实现交互 Section。
- 禁止在组件设计卡没有引用 Image Asset Inventory 的情况下实现图片类元素。
- 禁止在组件设计卡没有引用 Effect Spec、没有完成 Effect Reasoning 的情况下实现强交互 Section。
- 禁止用 div/CSS 方块/emoji 替代动态业务图片；头像、礼物、奖品、道具、房间头像、榜单头像等必须用 `<img>`，默认缺图使用目标 app 的 SVG 占位图。
- 禁止 `stateTransitions` 声明了 `animation` 但 `index.tsx` 没有对应的 DOM/CSS/motion 实现（包括 easing/duration 未对齐）。
- 禁止弹窗 Section 使用 `if (!content.isOpen) return null` 硬切；必须用 `<AnimatePresence>` + `motion.div` 实现入场/退场。

## `apps/<campaign-name>/.feedback/progress.md` 实现阶段轻量模板

`apps/<campaign-name>/.feedback/progress.md` 是 designer 任务的全局 process ledger。第 4 步进入实现阶段时，必须在既有 `apps/<campaign-name>/.feedback/progress.md` 中追加轻量实现阶段账本，并预置后续所有 Final Closeout Gate 任务。

当上下文被压缩、对话中断或 AI 不确定当前阶段时，必须先读取 `apps/<campaign-name>/.feedback/progress.md`，按全局“当前阶段”、实现阶段“当前门禁”和下方检查清单恢复，不得凭对话记忆继续执行。恢复时不需要全文读取本文件；只在当前门禁涉及组件设计卡、单 Section 验证或 Final Closeout 时读取对应章节。

模板写入要求：除命令、路径、Section 名、状态 key 和代码标识符外，`progress.md` 的标题、字段说明、状态说明和验收记录必须使用中文。账本只写状态和结果，不复制规则解释、示例代码或长段验收说明。

```md
# Designer 任务进度

<!-- 第 1-3.5 步的全局流程由 agents/designer.md 维护；以下内容为第 4 步轻量追加区块。规则细则以 docs/ai/section-implementation-gate.md 为准。 -->

## Section 实现进度

## 执行上下文

- 活动名称：`<campaign-name>`
- 目标应用：`apps/<campaign-name>`
- 复制源模板：`apps/campaign-template`
- 模式：`new-project`
- 设计方案已确认：yes
- 当前阶段：`section-implementation | final-closeout | completed`
- 恢复规则：从全局当前阶段和实现阶段当前门禁继续；如果代码和本文件冲突，先审计并更新本文件，再继续实现。

| 顺序 | Section            | 已实现 | 单 Section 验证 | 命令                                                                    | 结果 |
| ---: | ------------------ | ------ | --------------- | ----------------------------------------------------------------------- | ---- |
|    1 | HeroSection        | [ ]    | [ ]             | `pnpm --silent verify-section --campaign <campaign> HeroSection`        | 待执行 |
|    2 | UserBalanceSection | [ ]    | [ ]             | `pnpm --silent verify-section --campaign <campaign> UserBalanceSection` | 待执行 |
|    3 | PrizeSection       | [ ]    | [ ]             | `pnpm --silent verify-section --campaign <campaign> PrizeSection`       | 待执行 |

## 当前门禁

- 当前 Section：`<SectionName>`
- 状态：`planned | implementing | implemented | validating | validated`
- 最近验证输出：`待执行`

## Section 循环检查清单

- [ ] 所有组件设计卡已写入 `apps/<campaign-name>/.feedback/sections/` 或本文件。
- [ ] 所有规格测试已从组件设计卡生成。
- [ ] 所有 Section 已实现。
- [ ] 所有 Section 已按结构锁定顺序注册到 Playground。
- [ ] 所有 Runtime Container 已创建，并按结构锁定顺序渲染。
- [ ] 所有必需 Store actions 已实现。
- [ ] `phone-preview` 已通过 `preview-state` 初始化 `RuntimeViewState` 并复用 Runtime Container。
- [ ] 每个 Section 均已通过自己的 `pnpm --silent verify-section --campaign <campaign-name> <SectionName>`。

## Final Closeout Gate

- [ ] 渲染顺序已检查：`playground/section-registry.ts` 与 `runtime/app.tsx` 符合结构锁定顺序。
- [ ] Layout Spec 已检查：已实现的 Section 顺序、关键元素位置、间距、对齐和层级规则符合 Layout Spec。
- [ ] 单组件预览已检查：`?mode=designer` 的 single 模式下，每个 Section 在预览面板内完整可见或可滚动，不被 Playground 容器、`max-width`、`overflow-hidden`、fixed 定位或弹窗遮罩错误裁切。
- [ ] 移动端完整页预览背景已检查：`runtime/app.tsx` 与 `playground/phone-preview.tsx` 的页面根背景一致，`?mode=phone-preview` 不露出模板默认底色。
- [ ] Playground 联动已检查：每条 Interaction Spec 都映射到 defaultActions / preview-state / stateTransitions / Runtime actions，且无 TODO 占位。
- [ ] 交互动效已检查：所有 `stateTransitions.animation` 均有 DOM/CSS 落地；抽奖/转盘类动画不会被结果弹窗首帧遮挡。
- [ ] Runtime 联动已检查：每个跨 Section targetChange 都有 Store action，且每个 Runtime Container 已绑定该 action；console.log-only 只允许用于外部或无目标交互。
- [ ] 全部 Section 验证通过：`pnpm validate-section --campaign <campaign-name> --all`
- [ ] 单元规格测试通过：`pnpm test:unit --reporter=minimal --silent=passed-only apps/<campaign-name>/src`
- [ ] 构建通过：`pnpm --filter @new-type/<campaign-name> build`
- [ ] Feedback 工作区检查完成：目标活动账本位于 `apps/<campaign-name>/.feedback/`，且目标活动无 root draft。
- [ ] Feedback 工作区机器检查通过：`pnpm final-closeout-check --campaign <campaign-name>`
```

## 最终验收

所有 Section 均完成单独验证后，必须进入最终收尾门禁。**单 Section 全部通过后不能直接宣布完成；`--all` 只是收尾门禁中的一项。**

Final Closeout Gate 必须已在进入第 4 步时预置到 `apps/<campaign-name>/.feedback/progress.md`。执行最终验收时逐项勾选并记录结果，禁止等到最后才追加 checklist。

逐项执行：

1. 检查 `playground/section-registry.ts` 的注册顺序与结构锁定表一致。
2. 检查 `runtime/app.tsx` 的渲染顺序与结构锁定表一致。
3. 按 Layout Spec 检查关键元素位置、尺寸、间距、对齐、层级和响应规则是否被实现保留。
4. 直接访问 `?mode=designer`，逐个切换 single 模式 Section，确认组件完整可见；高组件必须可滚动，宽组件必须适配预览宽度，弹窗必须限制在单组件预览框内。
5. 检查 `runtime/app.tsx` 与 `playground/phone-preview.tsx` 的页面根背景是否一致；直接访问 `?mode=phone-preview`，确认 Section 间距、页面尾部和内容不足一屏时不会露出模板默认底色。
6. 按 Interaction Spec 逐条检查 `playground/section-registry.ts` 的 `defaultActions`、`playground/preview-state.ts`、各 Section `content.ts` 的 `stateTransitions` 和 Runtime actions 命名是否一致，且不存在 `TODO` 占位。
7. 对所有声明了 `stateTransitions.animation` 的 Section 执行动画落地检查：确认触发后实际 DOM/class/style 变化存在；若动画后会打开弹窗或遮罩，必须确认动画期间未被遮挡，动画结束后再显示结果。
8. 按 Interaction Spec 逐条检查 Runtime 联动：凡 `targetSection` 不是 `self` 或 `targetChange` 会改变其他 Section 的交互，`integrations/store.ts` 必须存在对应 action，Runtime Container 必须绑定该 action，禁止 console.log-only。
9. 运行总验收：

```bash
pnpm validate-section --campaign <campaign-name> --all
```

10. 运行全量单元测试：

```bash
pnpm test:unit --reporter=minimal --silent=passed-only apps/<campaign-name>/src
```

11. 运行 build：

```bash
pnpm --filter @new-type/<campaign-name> build
```

12. 确认反馈账本位于 `apps/<campaign-name>/.feedback/`，且 `.feedback/drafts/` 下没有 `meta.json.campaignName = <campaign-name>` 或 `targetApp = apps/<campaign-name>` 的 root draft。

13. 运行 Feedback 工作区机器检查；该命令必须通过后才能最终回复：

```bash
pnpm final-closeout-check --campaign <campaign-name>
```

该命令至少检查：

- `apps/<campaign-name>/.feedback/` 已存在。
- `apps/<campaign-name>/.feedback/progress.md` 已存在。
- 目标活动不存在 root draft；允许 `.feedback/drafts/` 下保留其他未创建 app 的任务草稿。

最终回复必须说明：

- 每个 Section 的单独验证结果。
- 渲染顺序校验结果。
- Layout Spec 保真校验结果。
- 单组件预览完整性校验结果。
- Interaction Spec / `preview-state` / Runtime actions 联动完整性校验结果。
- Runtime Store action / Container action 联动完整性校验结果。
- `--all` 总验收结果。
- 全量 Vitest 结果。
- build 结果。
- Feedback 工作区检查结果。
- `pnpm final-closeout-check --campaign <campaign-name>` 结果。
