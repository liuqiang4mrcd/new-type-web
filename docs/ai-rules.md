# AI 开发规则

> 最后更新：2026-06-12（适配三层协作架构）

## 目录边界

- `apps/*` — 活动页应用，每个独立部署，不互相引用
- `packages/*` — 共享包，业务逻辑放在这里，按职责拆分
- `scripts/` — 工程化脚本，不包含业务逻辑

## 活动页内部三层架构

每个活动页 `apps/<campaign>/src/` 内按角色分为三层：

| 目录             | 负责人   | 职责                     | AI 能否修改 |
| ---------------- | -------- | ------------------------ | ----------- |
| `designer/`      | 设计师   | 纯视觉组件、展示数据     | 仅 content  |
| `runtime/`       | AI       | 连接 store 和视觉组件    | ✅ 主力     |
| `integrations/`  | 开发者   | Store / API / 埋点 / 配置 | 按需        |
| `playground/`    | 设计师   | 预览环境                 | ❌          |
| `contracts/`     | 所有角色 | 类型定义                 | ✅          |

### AI 修改边界

| 场景                           | 改什么文件                                      | 禁止做的事               |
| ------------------------------ | ----------------------------------------------- | ------------------------ |
| 新 section 视觉 + 数据          | `designer/sections/<Name>/{types,content,index,states}.tsx` | 不要调用 store 或 API    |
| 新 section 连接数据             | `runtime/sections/<Name>Container.tsx`          | 不要改 visual 组件       |
| 数据接口变更                   | `types.ts`（改接口）+ `runtime/`（改容器）         | 不要直接改 index.tsx     |
| 新增 API / Store / 埋点         | `integrations/{store,api,tracking}.ts`           | 不要绕开 integrations    |
| 设计师调整视觉                  | 不动，由设计师手动改                             | AI 绝不自动改 designer 代码 |

## 引用规则

- 所有共享包通过 `@new-type/*` 引用
- 使用 workspace 协议：`"@new-type/utils": "workspace:*"`
- 禁止跨 apps 引用
- packages 之间只向下依赖（utils → request → hooks → headless → ui）

## 文件命名

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 设计师 Section（四文件） | `designer/sections/<Name>/{types,content,index,states}.tsx` | `HeroSection/` |
| Section 类型接口 | `types.ts` 中 `<Name>Content` | `HeroContent` |
| Section 默认数据 | `content.ts` 中 `defaultContent` | |
| Section 状态视图 | `states.tsx` 中直接 export | `HeroLoading`, `HeroError` |
| Runtime 容器 | `<Name>Container.tsx` | `HeroContainer.tsx` |
| Playground 场景 | `playground/scenarios/<name>.ts` | `lottery.ts` |
| Store | `integrations/store.ts` | |
| Hook | `use<Name>.ts` | `useCountdown.ts` |
| 工具函数 | 功能名 | `formatDate.ts` |

## Section 四文件约定

每个视觉 section 必须包含四个文件：

```txt
designer/sections/HeroSection/
├── types.ts          # 数据接口定义（HeroContent）
├── content.ts        # 默认展示数据（defaultContent）
├── index.tsx         # 纯视觉组件（通过 content props 接收数据）
└── states.tsx        # [可选] loading/empty/error 状态视图
```

**重要约束**：
- `index.tsx` 不能直接 import store、API、埋点
- 所有外部数据通过 `SectionProps<T>` 的 `content` 和 `actions` 传入
- `states.tsx` 中的状态视图只接收 `{ message?: string }` 作为 props

## Runtime Container 模式

每个 visual section 必须有一个对应的 runtime container：

```ts
// runtime/sections/HeroContainer.tsx
// 职责：从 store 读取状态 → 按 status 渲染不同视图
function HeroContainer() {
  const hero = useStore(s => s.hero);
  switch (hero.status) {
    case 'loading': return <HeroLoading />;
    case 'error':   return <HeroError message={hero.error} />;
    case 'empty':   return <HeroEmpty />;
    case 'ready':   return <HeroSection content={hero.content!} />;
  }
}
```

## Playground 访问

设计师预览环境通过 URL 参数激活：

```
http://localhost:5173/?mode=designer
```

此模式下渲染 `playground/index.tsx`，提供：
- `SectionPanel` — 单组件 hover 状态切换
- `ScenarioRunner` — 场景流程预览（实况渲染 + 自动播放）

## 活动页创建流程

1. 运行 `pnpm create-campaign` 交互式创建
2. 在 `designer/sections/` 下创建 Section 四文件
3. 在 `integrations/store.ts` 中添加对应的 store state
4. 在 `runtime/sections/` 下创建 Container
5. 在 `playground/section-registry.ts` 注册新 section
6. 可选：在 `playground/scenarios/` 中添加预览场景
