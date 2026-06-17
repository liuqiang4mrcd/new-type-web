# 活动页模板说明

> 最后更新：2026-06-17（中性 Scaffold 模板 + Playground 3 模式预览）

`apps/campaign-template` 是新活动的最小可运行脚手架，不承载具体业务示例。它只保留中性的 `ScaffoldSection`，用于确认工程链路、Playground 和 runtime 能正常工作。

创建新活动后，必须根据已确认的设计方案和组件设计卡逐个创建真实 Section。禁止把模板中的 scaffold 内容、状态或文案当成业务组件基底。

## 目录结构

```
apps/campaign-template/
├── src/
│   ├── main.tsx                     # 入口，?mode=designer → Playground
│   ├── app.tsx                      # 重导出 runtime/app
│   ├── contracts/
│   │   └── section.ts               # 类型契约
│   │
│   ├── designer/sections/           # 🎨 设计师视觉层
│   │   └── ScaffoldSection/         # 中性占位 Section，创建新活动后替换
│   │
│   ├── runtime/                     # 🤖 AI 粘合层
│   │   ├── app.tsx
│   │   └── sections/
│   │       └── ScaffoldContainer.tsx
│   │
│   ├── integrations/                # 👨‍💻 生产逻辑层
│   │   ├── store.ts
│   │   ├── api.ts
│   │   ├── tracking.ts
│   │   └── constants.ts
│   │
│   └── playground/                  # 🔍 设计师预览
│       ├── index.tsx                # 左主区域 + 右控制面板 flex 布局
│       ├── ControlPanel.tsx         # 右侧控制面板（模式选择/编辑/日志）
│       ├── PhoneFrame.tsx           # 手机壳模拟（iframe 内渲染，vw 正确）
│       ├── SectionPanel.tsx         # 单组件预览（状态切换）
│       ├── ScenarioRunner.tsx       # 流程预览渲染器（props 驱动）
│       ├── FlowInspector.tsx        # 浮动流程面板（可折叠）
│       ├── ContentEditor.tsx        # JSON content 编辑器
│       ├── ActionsLog.tsx           # actions 调用日志
│       ├── phone-preview.tsx        # iframe 独立 entry（?mode=phone-preview）
│       ├── types.ts                 # PlaygroundSection / Scenario / PreviewMode
│       ├── section-registry.ts      # 组件注册
│       └── scenarios/               # 中性预设场景数据
```

## Scaffold 约束

- `ScaffoldSection` 只用于验证模板可运行，不代表任何活动类型。
- 复制模板创建新活动后，应先根据设计方案决定真实 Section 拆分。
- 输出真实 Section 前必须先写组件设计卡，明确作用、展示方式、数据、交互、状态和边界。
- 不要从 scaffold 默认状态推导业务状态；每个 Section 必须独立做状态适配。
- 如果需要业务示例，应放在 `docs/` 或独立示例目录，不应放入 `apps/campaign-template` 复制源。

## 创建新 Section

### 1. 视觉组件（designer/）

```
designer/sections/<Name>/
├── types.ts          # 定义 <Name>Content 接口
├── content.ts        # export const defaultContent: <Name>Content
├── index.tsx         # 纯视觉组件，Props: SectionProps<<Name>Content>
└── states.tsx        # [可选] export <Name>Loading / <Name>Empty / <Name>Error
```

```ts
// 约束：index.tsx 不能引用 store/api/tracking
// 所有数据通过 content props 传入
```

### 2. 注册到 Playground（playground/）

```
// playground/section-registry.ts 中添加
{
  id: '<name>',
  name: '<Name>Section',
  component: <Name>Section,
  defaultContent,
  stateViews: { /* 只注册 supportedStates 中真实存在的 UI 状态 */ },
}
```

### 3. 添加 store 状态（integrations/）

```
// integrations/store.ts 中添加 section state
interface AppStore {
  <name>: SectionState<<Name>Content>;
  // ...
}
```

### 4. 创建 runtime 容器（runtime/）

```
// runtime/sections/<Name>Container.tsx
// 从 store 读取状态 → 按 status 渲染对应视图
```

## 引入共享包

```ts
import { useCountdown } from '@new-type/hooks';
import { createRequest } from '@new-type/request';
import { toast } from '@new-type/ui';
import { Tab } from '@new-type/headless';
```

详见 `docs/ai/framework-map.md`。

## 运行方式

```bash
# 线上页面
pnpm dev

# 设计师 Playground（三种预览模式 + 控制面板）
pnpm dev  →  http://localhost:5173/?mode=designer
# 完整页面手机壳独立入口（iframe 用，无需手动访问）
pnpm dev  →  http://localhost:5173/?mode=phone-preview
```
