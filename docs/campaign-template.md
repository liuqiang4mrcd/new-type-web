# 活动页模板说明

> 最后更新：2026-06-12（适配三层协作架构，campaign-core → headless）

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
│   │   ├── HeroSection/            # types/content/index/states
│   │   ├── RuleSection/
│   │   ├── PrizeSection/
│   │   └── CountdownTimer/
│   │
│   ├── runtime/                     # 🤖 AI 粘合层
│   │   ├── app.tsx
│   │   └── sections/
│   │       ├── HeroContainer.tsx
│   │       ├── RuleContainer.tsx
│   │       └── PrizeContainer.tsx
│   │
│   ├── integrations/                # 👨‍💻 生产逻辑层
│   │   ├── store.ts
│   │   ├── api.ts
│   │   ├── tracking.ts
│   │   └── constants.ts
│   │
│   └── playground/                  # 🔍 设计师预览
│       ├── index.tsx
│       ├── SectionPanel.tsx
│       ├── ScenarioRunner.tsx
│       ├── FlowInspector.tsx
│       ├── section-registry.ts
│       └── scenarios/
```

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
  stateViews: { loading: <Name>Loading, empty: <Name>Empty, error: <Name>Error },
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

详见 `docs/ai-framework-map.md`。

## 运行方式

```bash
# 线上页面
pnpm dev

# 设计师 Playground（状态切换 + 场景流程 + 自动播放）
pnpm dev  →  http://localhost:5173/?mode=designer
```
