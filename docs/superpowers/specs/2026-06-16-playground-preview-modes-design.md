# Playground 预览模式改造设计

> 日期：2026-06-16
> 状态：设计稿（待用户审批）

## 目标

在 Playground 中新增三种预览模式，满足设计师在开发阶段对活动页效果的完整验证需求：

1. **完成页面预览** — 模拟最终用户在手机上看到的完整活动页，所有 Section 按顺序排列
2. **单组件预览** — 独立预览某个 Section，支持状态切换和 content 编辑
3. **流程预览** — 分步预览用户交互流程（复用现有 ScenarioRunner，改造为侧栏控制）

## 约束

- 不修改 `?mode=designer` 路由机制
- 保持 Playground 仅限 `import.meta.env.DEV` 加载
- 不引入新路由，所有模式由 Playground 顶层 **useState** 管理（后续可加 URL 同步）
- Header 中现有的模式切换按钮移除，统一移到右侧控制面板
- `playground/` 目录原标记为 AI ❌，但本项目属显式用户请求，跳过该约束
- 不依赖 `@new-type/*` 共享包以外的第三方依赖

## 一、整体布局

```
┌──────────────────────────────────────────────────────────────────────┐
│  Header (现有) — 项目名 + Campaign 标识，模式切换移至右侧控制面板     │
├────────────────────────────────┬─────────────────────────────────────┤
│  Main Content (flex: 1)        │  Control Panel (w-72, 280px)      │
│                                │                                     │
│  [完成页面] 手机壳模拟 390px    │  ═══ 预览模式 ═══                  │
│  内上下排列所有 Section        │  ◎ 完整页面                         │
│  可缩放至适配浏览器宽度         │  ○ 单组件                           │
│                                │  ○ 流程预览                         │
│  [单组件] Section 居中渲染      │                                     │
│  带状态切换 header             │  ─── 上下文列表 ───                 │
│                                │  (根据选中模式动态切换)              │
│  [流程] 分步渲染视图            │                                     │
│  场景数据通过控制面板传入       │  单组件模式: Section 列表           │
│                                │  ○ BannerSection                    │
│                                │  ○ WheelSection                     │
│                                │  ○ CritSection                      │
│                                │  ...                                │
│                                │                                     │
│                                │  流程模式: 场景列表                  │
│                                │  ◎ 抽奖→中奖→领取                   │
│                                │  ○ 抽奖→未中奖                      │
│                                │  ○ Hero 多态                        │
│                                │                                     │
│                                │  (流程模式) 步骤导航                 │
│                                │  ① ② ③ ④                           │
│                                │  [◀] [▶ 播放] [▲] [↺]              │
│                                │                                     │
│                                │  ▼ Store 数据 (可折叠)              │
│                                │  { "lottery": ... }                 │
│                                │                                     │
│                                │  (单组件模式) Content 编辑器        │
│                                │  (折叠面板，JSON 编辑 content props)│
│                                │                                     │
│                                │  (单组件模式) Actions 日志          │
│                                │  [15:30:01] onSpin 被调用           │
│                                │  [15:30:04] onSpinComplete 被调用   │
└────────────────────────────────┴─────────────────────────────────────┘
```

### 布局规则

| 区域           | 宽度                    | 说明                                              |
| -------------- | ----------------------- | ------------------------------------------------- |
| Main Content   | `flex: 1`，内容居中     | 手机壳模式下内容固定 390px 居中；其他模式自适应居中 |
| Control Panel  | `w-72` (288px)          | 右侧固定宽度，灰色背景分隔，内部可滚动              |
| Header         | 全宽，sticky top-0     | 保留现有样式，去除模式切换按钮（已移到控制面板）    |

## 二、模式切换与控制面板

### 控制面板组件树

```
ControlPanel
├── PreviewModeSelector  (radio: 完整页面 / 单组件 / 流程预览)
│
├── SectionList          (mode === 'single' 时显示)
│   └── 遍历 sections，radio 选择当前预览的 Section
│
├── ScenarioPanel        (mode === 'flow' 时显示)
│   ├── ScenarioList     (radio 选择场景)
│   ├── StepNavigator    (步骤点 + 播放控制按钮)
│   └── StoreViewer      (折叠面板，显示当前步骤的 store 数据)
│
├── ContentEditor        (mode === 'single' 时显示，折叠面板)
│   └── JSON textarea，编辑选中 Section 的 content props
│
└── ActionsLog           (mode === 'single' 时显示，折叠面板)
    └── 日志列表，记录 actions 调用时间/参数
```

### 状态管理

Playground 顶层 state：

```typescript
type PreviewMode = 'full' | 'single' | 'flow';

interface PlaygroundState {
  mode: PreviewMode;
  // 单组件模式
  selectedSectionId: string | null;
  customContent: Record<string, unknown> | null;
  actionsLog: Array<{ time: string; action: string; args: unknown[] }>;
  // 流程模式
  selectedScenario: Scenario;
  activeStepIndex: number;
  isPlaying: boolean;
}
```

控制面板与主渲染区通过 Playground 顶层 **useState** 共享状态，不引入 zustand（纯内部状态，Props 向下传递即可）。

## 三、完成页面渲染

### 手机壳组件

```tsx
// 纯展示组件，接收已注册的 sections 数组
function PhoneFrame({ sections }: { sections: PlaygroundSection[] }) {
  // 固定 390px 宽度，自动缩放适配父容器
  // 圆角 + 黑边 + 顶部刘海槽
  // 内部按顺序渲染所有 sections，使用 defaultContent + defaultActions
}
```

- 固定宽度 390px（iPhone 14 Pro 逻辑像素）
- 内部最小高度 844px，超长可滚动
- 背景保持 runtime 一致（`#0a1a0a`）
- 自动缩放：父容器宽度不足时 CSS `transform: scale()` 缩放适配，确保不出现横向滚动
- 所有 Section 用 `section.component` 渲染，传 `defaultContent` 和 `defaultActions`
- Section 之间保留 margin（参照 runtime `app.tsx` 的排列方式）
- 不加任何状态切换 UI，最终页面不应有调试工具痕迹

### 新窗口打开

手机壳右上角"新窗口打开"按钮，调用 `window.open()` 在 ?mode=designer 且无控制面板的条件下渲染手机壳。

## 四、单组件渲染

### 复用现有 SectionPanel

- 主区域直接渲染 `<SectionPanel section={selectedSection} />`
- Section 通过控制面板的 `SectionList` 选择
- SectionPanel 自带 header（名称 + 状态切换按钮），保留现有状态控制功能

### Content 编辑器

控制面板中折叠面板：

```tsx
function ContentEditor({
  sectionId,
  content,
  onChange,
}: {
  sectionId: string;
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}) {
  // 提供 JSON textarea，非受控编辑
  // 点击"应用"按钮更新传递给 SectionPanel 的 content
}
```

- 默认使用 `defaultContent`
- 编辑后点击"应用"触发重新渲染
- 提供"重置为默认"按钮

### Actions 日志

通过包装 defaultActions 实现：

```tsx
const wrappedActions = Object.fromEntries(
  Object.entries(section.defaultActions || {}).map(([key, fn]) => [
    key,
    (...args: unknown[]) => {
      addLog(key, args);
      fn(...args);
    },
  ]),
);
```

日志列表显示在控制面板底部，按时间倒序排列，最多保留 50 条。

## 五、流程渲染

### ScenarioRunner 改造

现有 `ScenarioRunner` 改为纯渲染组件，不再包含选择 UI：

```tsx
// 新的 props 驱动
interface ScenarioRunnerProps {
  scenario: Scenario;
  stepIndex: number;
}
```

- 移除左侧场景列表
- 移除播放控制（由控制面板控制）
- 只负责根据传入的 scenario + stepIndex 渲染当前步骤内容
- 保留渲染框的 border/header（步骤编号 + 名称）

### FlowInspector 保留

- FlowInspector 浮窗继续存在（右下角），作为设计师查看流程的浮动面板
- 可折叠（新增折叠按钮）
- 步骤导航点和进度条保留
- 播放控制按钮移到控制面板为主，FlowInspector 保留为辅助

### 控制面板流程控制

- 场景选择：radio list
- 步骤导航：步骤点（圆形编号，完成/当前/未到三种状态着色）
- 播放控制：上一步 / 播放暂停 / 下一步 / 重置
- Store 数据：折叠面板，显示当前步骤的 store 字段
- 步骤描述：选中步骤的名称 + description

## 六、文件变更清单

| 文件                                                | 操作     | 说明                                              |
| --------------------------------------------------- | -------- | ------------------------------------------------- |
| `src/playground/index.tsx`                          | 重写     | 改为 flex 布局 + ControlPanel，去除模式切换 state |
| `src/playground/ControlPanel.tsx`                   | **新增** | 右侧控制面板（模式选择 + 上下文列表 + 编辑器）    |
| `src/playground/PhoneFrame.tsx`                     | **新增** | 手机壳模拟组件，完成页面模式使用                   |
| `src/playground/ContentEditor.tsx`                  | **新增** | JSON content 编辑器（单组件模式）                  |
| `src/playground/ActionsLog.tsx`                     | **新增** | actions 调用日志（单组件模式）                     |
| `src/playground/ScenarioRunner.tsx`                 | 修改     | 移除场景/步骤选择 UI，改为 props 驱动              |
| `src/playground/FlowInspector.tsx`                  | 修改     | 增加折叠按钮，播放控制按钮降级为辅助              |
| `src/playground/SectionPanel.tsx`                   | 修改     | 可选：接受 `customContent` prop 覆盖 defaultContent |

无新增包依赖。

## 七、测试策略

| 类型      | 覆盖点                                               |
| --------- | ---------------------------------------------------- |
| Vitest    | ControlPanel 模式切换逻辑；ContentEditor JSON 解析；ActionsLog 追加行为 |
| E2E       | 三种模式切换渲染；手机壳缩放；新窗口打开；流程播放控制 |

## 八、未纳入范围

- stateTransitions 自动生成场景步骤（留作 Phase 4）
- 手机壳主题色/型号选择（只做 390px 固定版）
- Section 拖拽排序（非必需）
- 与 runtime 真实的 store 联动（纯设计预览，defaultContent 即可）
- URL 同步模式状态（后续可以加，现在内部 state 足够）
