# Designer Playground & 协作架构设计

> 日期：2026-06-12
> 状态：Draft
> 基于新类型 web H5 活动框架改造

---

## 1. 背景与目标

### 1.1 问题

设计师用 Vite React 制作活动页 demo，AI 将其转换为框架结构，前端开发者再补充生产逻辑。当前流程的痛点：

- 设计师的 demo 与框架结构不兼容，AI 转换损耗大
- 设计师和开发者在同一文件上操作，容易冲突
- 设计师无法直观预览组件的多状态（loading/empty/error）
- 复杂交互流程（多步弹窗、状态流转）难以预览和沟通

### 1.2 目标

1. **同一仓库协作**：设计师、AI、开发者在同一个 monorepo 项目下工作，消除转换损耗
2. **视觉与逻辑分层**：设计师专注 `designer/` 目录，开发者专注 `integrations/` 和 `runtime/`，减少冲突
3. **Playground 预览系统**：设计师在浏览器中直接预览完整页面，支持组件状态切换和复杂交互流程模拟
4. **契约驱动**：Section 有明确的类型接口、内容模型、状态定义，AI 可预测性地转换

---

## 2. 目录结构改造

```
apps/campaign-template/src/
├── main.tsx                  ← 入口，根据模式渲染不同入口
├── app.tsx                   ← 线上正式入口（组合 runtime sections）
│
├── contracts/                ← [新] 类型契约
│   └── section.ts            ← SectionMeta, SectionProps, SectionState 等
│
├── designer/                 ← [新] 设计师视觉源码
│   └── sections/
│       └── HeroSection/
│           ├── types.ts      ← 数据接口定义
│           ├── content.ts    ← 默认展示数据
│           ├── index.tsx     ← 纯视觉组件
│           └── states.tsx    ← [可选] 各状态的视觉视图
│       ├── RuleSection/
│       ├── PrizeSection/
│       └── ...
│
├── runtime/                  ← [新] AI 转换后的生产版 section
│   ├── sections/
│   │   └── HeroSection/
│   │       └── container.tsx ← 状态路由 + 数据注入
│   └── app.tsx               ← 组合 runtime sections
│
├── integrations/             ← [新] 生产逻辑层（开发者专属）
│   ├── store.ts              ← Zustand stores
│   ├── api.ts                ← API 调用
│   ├── tracking.ts           ← 埋点
│   └── view-models/          ← 数据转换层
│
├── tokens/                   ← [新] AI 提取的设计 Token
│   ├── campaign.tokens.ts    ← 色值/字号/间距 Token
│   └── tailwind.preset.ts    ← 活动级 Tailwind 预设
│
├── playground/               ← [新] 设计师预览环境
│   ├── index.tsx             ← Playground 入口
│   ├── SectionPanel.tsx      ← 单组件预览面板（hover 状态切换）
│   ├── ScenarioRunner.tsx    ← 场景执行器（复杂交互流程）
│   ├── FlowInspector.tsx     ← 浮动流程调试面板
│   └── scenarios/            ← 交互场景定义
│       ├── lottery-win.ts
│       ├── lottery-lose.ts
│       └── default.ts
│
├── components/               ← 活动级组件（维持不变）
├── store/                    ← 旧配置，迁移至 integrations/
├── services/                 ← 旧配置，迁移至 integrations/
├── constants.ts              ← 活动常量
├── tracking.ts               ← 旧配置，迁移至 integrations/
└── index.css                 ← Tailwind 入口
```

---

## 3. 核心契约定义

### 3.1 Section 数据接口

```ts
// contracts/section.ts

/** 组件状态 */
export type SectionStatus = 'loading' | 'empty' | 'ready' | 'error';

/** 组件状态数据模型 */
export interface SectionState<TContent = unknown> {
  status: SectionStatus;
  content?: TContent;
  error?: string;
}

/** Section 元数据 */
export interface SectionMeta {
  id: string;
  name: string;
  description?: string;
}

/** Section Props 接口 */
export interface SectionProps<TContent, TActions = Record<string, unknown>> {
  content: TContent;
  actions?: TActions;
}

/** Section 注册描述 */
export interface SectionDescriptor<TContent = unknown, TActions = Record<string, unknown>> {
  meta: SectionMeta;
  component: React.ComponentType<SectionProps<TContent, TActions>>;
  defaultContent: TContent;
  states?: Partial<Record<SectionStatus, React.ComponentType<{ error?: string }>>>;
}
```

### 3.2 设计师 Section 约定

每个 section 遵循固定结构：

```ts
// designer/sections/HeroSection/types.ts
export interface HeroContent {
  title: string;
  subtitle: string;
  ctaText: string;
  backgroundImage?: string;
}

// designer/sections/HeroSection/content.ts
import type { HeroContent } from './types';
export const defaultContent: HeroContent = { ... };
```

---

## 4. Playground 系统

### 4.1 架构概览

```
playground/
├── index.tsx             ← 路由：/__playground
├── SectionPanel.tsx      ← 单组件预览面板
│   └── 功能：hover 浮层显示状态切换按钮
├── ScenarioRunner.tsx    ← 场景执行器
│   └── 功能：多步交互流程预览、步骤跳转
├── FlowInspector.tsx     ← 浮动流程面板
│   └── 功能：当前场景步骤导航
└── scenarios/            ← 场景定义
    └── ...
```

### 4.2 交互模式

**模式一：单组件状态切换（简单交互）**

鼠标悬停组件 → 右上角出现浮层按钮 → 点击切换 loading/empty/error/ready

```
┌───────────────────────┐
│  HeroSection    [⚡]  │ ← hover 显示
│                       │    ┌──────────────┐
│  视觉渲染区域          │    │ Ready        │
│                       │    │ Loading      │
│                       │    │ Empty        │
│                       │    │ Error        │
│                       │    └──────────────┘
└───────────────────────┘
```

**模式二：场景流程预览（复杂交互）**

设计师从场景列表选择一个场景 → 进入流程导航模式：

```
┌─────────────────────────────────────────────────────┐
│  场景: [抽奖→中奖→领取 ✓] [未中奖] [次数用完]        │
├─────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌─────────────────────┐  │
│  │                      │  │ 步骤导航              │  │
│  │  页面渲染区域          │  │                      │  │
│  │                      │  │ ● 抽奖前              │  │
│  │  (当前步骤的 UI 状态)  │  │ ○ 点击抽奖 - 加载中    │  │
│  │                      │  │ ○ 中奖结果弹窗 ← 当前  │  │
│  │                      │  │ ○ 点击领取 → 成功      │  │
│  │                      │  │                      │  │
│  │                      │  │ [单步切换] [自动播放]   │  │
│  └──────────────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────┤
│  [重置]  [全屏预览]                                  │
└─────────────────────────────────────────────────────┘
```

### 4.3 场景定义规范

```ts
// playground/scenarios/<name>.ts
export interface ScenarioStep {
  name: string;
  description?: string;
  store: Partial<StoreState>;     // 注入 store 状态
}

export interface Scenario {
  id: string;
  label: string;
  initialStore: Partial<StoreState>;
  steps: ScenarioStep[];
}
```

场景定义既是设计师的预览素材，也是开发者的需求文档。

---

## 5. 入口路由设计

```ts
// main.tsx
const mode = new URLSearchParams(window.location.search).get('mode');

if (mode === 'designer') {
  // 渲染 Playground
  import('./playground').then(({ Playground }) => {
    root.render(<Playground />);
  });
} else {
  // 渲染正式页面
  root.render(<App />);
}
```

---

## 6. 共享包 AI 可见性

新增 `docs/ai-framework-map.md`，列明：

| 场景                      | 应使用的包              |
| ------------------------- | ----------------------- |
| 网络请求                   | `@new-type/request`     |
| 轻提示/弹窗/图片懒加载     | `@new-type/ui`          |
| 倒计时/滚动方向/分享       | `@new-type/hooks`       |
| 日期格式化/防抖节流/本地存储 | `@new-type/utils`      |
| 埋点事件                   | `@new-type/analytics`   |
| 无样式 Tab                  | `@new-type/headless`     |

---

## 7. 实施范围（MVP）

**Phase 1 — 基础架构改造**（本次实施）
1. 创建 `contracts/` 目录和 `section.ts` 类型定义
2. 重构现有 sections 到 `designer/sections/` 格式
3. 创建 `playground/` 基础框架（SectionPanel + 状态切换）
4. 创建 `scenarios/` 系统及场景示例
5. 更新 `main.tsx` 支持模式路由
6. 创建 `docs/ai-framework-map.md`

**Phase 2 — 场景系统完善**（后续）
- ScenarioRunner 多步流程
- FlowInspector 浮动面板
- 自动播放功能

**Phase 3 — 生产层分离**（后续）
- runtime/ 和 integrations/ 目录填充
- store/api/tracking 迁移

---

## 8. 不做的范围

- ❌ 不上 JSON 渲染引擎/Schema 驱动
- ❌ 不上可视化拖拽搭建
- ❌ 不做视觉回归测试（Phase 2 再考虑）
- ❌ 不改动 packages/* 的实现逻辑，只补文档

## 9. 风险

| 风险                    | 缓解方案                                     |
| ----------------------- | -------------------------------------------- |
| 设计师不习惯新目录结构   | playground 的入口 URL 简单，无需理解完整架构 |
| AI 仍绕过共享包          | ai-framework-map.md + 模板代码引用示例        |
| 场景定义过于复杂         | 先从 1-2 个典型场景开始，逐步扩展             |
