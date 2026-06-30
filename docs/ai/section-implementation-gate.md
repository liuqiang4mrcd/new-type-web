# Section Implementation Gate

用于 H5 活动页第 4 步实现阶段。本文只保留 agent 必读门禁；具体检查项以 `pnpm validate-section`、`pnpm verify-section`、`pnpm final-closeout-check` 的脚本输出为准。

## 强制执行顺序

每个 Section 必须按以下顺序闭环：

1. 确认 `status.json.currentSection` 指向当前 Section。
2. 写当前 Section 的 refs-first 组件设计卡：`apps/<campaign-name>/.feedback/sections/<SectionName>.md`。
3. 写 `## Acceptance Tests` YAML。
4. 运行 `pnpm generate-spec-tests --campaign <campaign-name> <SectionName>`。
5. 实现当前 Section 所需的最小代码：`designer/sections/`、Playground 注册、Store、Runtime Container、`runtime/app.tsx`。
6. 运行 `pnpm --silent verify-section --campaign <campaign-name> <SectionName>`。
7. 通过后更新 `status.json.sections[]` 和 `currentSection`，并向 `progress.md` 追加审计记录。
8. 再进入下一个 Section。

当前 Section 未通过自己的 `verify-section` 前，禁止实现或注册后续 Section。允许的共享改动仅限当前 Section 必需的 Store 字段、Runtime import/render 和 Playground 注册片段。

### 独立脚手架例外

满足以下全部条件时，可提前创建后续 Section 的空骨架和设计卡：

1. 两个 Section 在 Interaction Spec 中互不为 `targetSection`。
2. 不共享同一 Store action，open/close 类通用弹窗 action 除外。
3. 不在 `runtime/app.tsx` 的同一条件渲染分支内。

仍然禁止提前实现完整逻辑、注册 Playground / Runtime / Store，或提前运行后续 Section 的 `verify-section`。

## 组件设计卡

组件设计卡采用 refs-first 格式：只记录当前 Section 的实现事实和对结构/视觉产物的引用，不复制全局 Layout / Interaction / Effect / Image Asset 表。

````md
## <SectionName> Component Card

### Core

- Purpose:
- Content fields:
- Async data source: yes/no
- Actions:
- UI states:
- Business states:
- Edge cases:
- Refs:
  - layout:
  - interactions:
  - effects:
  - imageKeys:
  - visual:

### Interaction

<!-- 有交互时填写 -->
- Interaction states:
- Action wiring:
  - handler:
  - targetChange:
  - close/reset:
  - mutex:

### Effect

<!-- 强交互、动画或弹窗时填写 -->
- Effect Reasoning:
  - Static view:
  - Trigger frame:
  - Animation/transition:
  - Completion:
  - Cross-section timing:
  - Disabled/mutex behavior:
  - Runtime vs phone-preview:
- State transitions:
- Animation binding:
  - Animated element:
  - DOM/CSS implementation:
  - Duration alignment:
  - Result/modal timing:

### Image Assets

<!-- structure.md 的 Image Asset Inventory 命中当前 Section 时填写 -->
- Image Asset refs:
  - imageKeys:
  - overrides:

## Acceptance Tests

```yaml
tests:
  - id:
    type: dom | action | state | modal | animation
    level: vitest | playwright
    behavior:
    target:
      role:
      name:
      testId:
    action:
      click: true
    expect:
      visibleText:
```
````

要求：

- `Refs.layout`、`Refs.interactions`、`Refs.effects`、`Refs.imageKeys` 只写 id/key，不复制表格内容。
- `Image Asset refs.overrides` 只记录偏离 Image Asset Inventory 的实现选择；无偏离写 `none`。
- 强交互 Section 必须有 `Refs.effects` 和 `Effect Reasoning`。
- `level: playwright` 的测试不会生成 Vitest 用例，但必须保留为视觉/集成验收事项。
- 规格变化必须先改组件设计卡，再重新生成 `*.spec.test.tsx`；禁止手改生成的 spec。

## 自动门禁

单 Section 验证：

```bash
pnpm --silent verify-section --campaign <campaign-name> <SectionName>
```

`verify-section` 会依次执行：

1. `validate-section`
2. `generate-spec-tests`
3. 当前 Section 的 spec / regression Vitest

总体验收：

```bash
pnpm validate-section --campaign <campaign-name> --all
pnpm test:unit --reporter=minimal --silent=passed-only apps/<campaign-name>/src
pnpm --filter @new-type/<campaign-name> build
pnpm final-closeout-check --campaign <campaign-name>
```

脚本失败时，以脚本输出的检查名和错误详情为修复依据，不把检查清单复制回 agent 上下文。

## 脚本化覆盖

`validate-section` 负责 Section 文件、状态声明、Playground / Runtime / Store 注册、分层边界、跨 Section action、动画声明与落地、图片 refs、图片 import 和业务图片 `<img>` fallback。

`final-closeout-check` 负责 feedback 工作区、`status.json`、root draft、Section validated 状态和 Playground 注册一致性。

仍需人工确认：

- `?mode=designer` 单组件预览完整可见或可滚动。
- `?mode=phone-preview` 页面背景、间距和尾部无模板底色泄漏。
- Layout Spec 的视觉保真度。
- 强交互动效是否符合 Effect Spec 的用户感知节奏。

## 状态记录

`status.json` 是恢复真源，`progress.md` 是审计日志。

实现阶段最小 `status.json`：

```json
{
  "campaignName": "<campaign-name>",
  "targetApp": "apps/<campaign-name>",
  "mode": "new-project",
  "phase": "section-implementation",
  "gate": "verify-section",
  "currentSection": "HeroSection",
  "confirmedForImplementation": true,
  "sections": [
    { "name": "HeroSection", "status": "validated" },
    { "name": "PrizeSection", "status": "planned" }
  ],
  "updatedAt": "2026-06-30T00:00:00.000Z"
}
```

旧项目缺少 `status.json` 时运行：

```bash
pnpm audit-feedback --campaign <campaign-name> --write-status
```

## 最终回复

最终回复必须说明：

- 每个 Section 的单独验证结果。
- `validate-section --all` 结果。
- Vitest 结果。
- build 结果。
- `final-closeout-check` 结果。
- 未运行或失败的命令及原因。
