# 设计输出规则

> 设计师的操作范围和输出规范

## 操作范围

设计师的操作范围限定在活动应用 `apps/<campaign>/src/` 下的特定目录，不得越界修改其他层级的代码。

| 目录 | 职责 | 可操作 |
|------|------|--------|
| `designer/sections/` | 视觉 Section 四文件 | ✅ 创建/修改 |
| `playground/` | 预览环境注册 | ✅ 注册新 Section |
| `assets/` | 图片/资源文件 | ✅ 添加 |

## 禁止操作

- ❌ `integrations/` — 生产逻辑层（Store/API/埋点），归开发者
- ❌ `runtime/` — AI 粘合层容器
- ❌ `contracts/` — 类型契约（只读，不可修改）
- ❌ `packages/*` — 共享包
- ❌ `scripts/` — 工程化脚本

## Section 输出格式

每个视觉 section 严格按四文件模式输出：

```
designer/sections/<Name>/
├── types.ts          # <Name>Content 接口定义
├── content.ts        # export const defaultContent: <Name>Content
├── index.tsx         # 纯视觉组件，通过 SectionProps<Content> 接收数据
└── states.tsx        # [可选] <Name>Loading / <Name>Empty / <Name>Error
```

约束：
- `index.tsx` 不能 import store、API、埋点，所有数据通过 `content` props 传入
- `types.ts` 中接口名以 `Content` 结尾
- `content.ts` 导出名为 `defaultContent`

### 状态声明要求

每个 Section 的 `content.ts` 必须通过 `supportedStates` 声明所有状态：

```typescript
export const supportedStates: StateDeclaration[] = [
  // UI 状态（对应 states.tsx 中独立组件）
  { key: 'loading', type: 'ui', required: true },
  { key: 'empty',   type: 'ui', required: true },
  { key: 'error',   type: 'ui', required: true },
  // 业务状态（复用主组件，仅换数据）
  { key: 'beforeStart', type: 'business', required: true },
  { key: 'inProgress',  type: 'business', required: true },
  { key: 'ended',       type: 'business', required: true },
  // 交互状态（组件内部 useState 管理的 UI 状态机）
  { key: 'idle',     type: 'ui', required: true },
  { key: 'spinning', type: 'ui', required: true },
  { key: 'result',   type: 'ui', required: true },
] as const;
```

- **UI 状态**：对应 `states.tsx` 中导出的独立组件（loading/empty/error）
- **业务状态**：输入数据不同但复用主组件（beforeStart/inProgress/ended）
- **交互状态**：组件内部 `useState` 管理的动态 UI 阶段（idle/spinning/result 等），必须声明到 `supportedStates` 中以供验证和 Playground 识别

## Playground 注册

创建 section 后，必须在 `playground/section-registry.ts` 中注册：

```ts
{
  id: '<name>',
  name: '<Name>Section',
  component: <Name>Section,
  defaultContent,
  stateViews: { loading: <Name>Loading, empty: <Name>Empty, error: <Name>Error },
}
```
