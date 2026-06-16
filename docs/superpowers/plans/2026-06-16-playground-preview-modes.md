# Playground 预览模式改造 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 改造 Playground 为左侧主区域 + 右侧控制面板布局，新增完整页面手机壳预览、单组件 content 编辑和 actions 日志、流程预览控制面板整合

**Architecture:** 在现有 Playground useState 顶层管理三种模式状态；新增 4 个组件（PhoneFrame/ControlPanel/ContentEditor/ActionsLog），修改 4 个现有文件（index/ScenarioRunner/FlowInspector/SectionPanel）；不引入新路由或新依赖

**Tech Stack:** React 18 + TypeScript + TailwindCSS

---

## 现有文件地图

### 不修改的文件
| 文件 | 原因 |
|------|------|
| `playground/types.ts` | ScenarioStep/Scenario 类型不变 |
| `playground/section-registry.ts` | 注册逻辑不变 |
| `playground/scenarios/lottery.ts` | 场景数据不变 |

### 修改的文件（4 个）
| 文件 | 改动内容 |
|------|----------|
| `playground/index.tsx` | — flex 布局重构（左侧主区域 + 右侧控制面板）<br/>— 移除 mode useState（原文已存在 mode，但改为三模式 + 控制面板）<br/>— 导入 ControlPanel/PhoneFrame<br/>— 管理所有顶层状态 |
| `playground/SectionPanel.tsx` | — 新增 `customContent?: Record<string, unknown>` prop<br/>— 如果 customContent 存在，覆盖 `section.defaultContent` 传入 `section.component` |
| `playground/ScenarioRunner.tsx` | — 移除场景列表 UI<br/>— 移除步骤项列表 UI<br/>— 移除播放控制按钮<br/>— 改为纯渲染组件，props: `scenario, stepIndex, sections`<br/>— 保留顶栏（步骤编号 + 名称）和内容渲染区 |
| `playground/FlowInspector.tsx` | — 新增 `collapsed: boolean` + `onToggleCollapse: () => void` props<br/>— 折叠时只显示标题栏 + 展开按钮<br/>— 展开时保留现有功能 |

### 新增的文件（4 个）
| 文件 | 职责 |
|------|------|
| `playground/PhoneFrame.tsx` | 完成页面预览 — 390px 手机壳容器，内按顺序渲染所有 Section |
| `playground/ControlPanel.tsx` | 右侧控制面板 — 模式选择 + 上下文列表 + 功能面板（编辑器/日志） |
| `playground/ContentEditor.tsx` | JSON textarea 编辑器，编辑选中 Section 的 content props |
| `playground/ActionsLog.tsx` | 显示 actions 调用时间戳和参数 |

---

## 顶层状态定义 (index.tsx)

```typescript
type PreviewMode = 'full' | 'single' | 'flow';

// 在 Playground 函数组件内部：
const [mode, setMode] = useState<PreviewMode>('full');
// 单组件模式
const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
const [customContent, setCustomContent] = useState<Record<string, unknown> | null>(null);
const [actionsLog, setActionsLog] = useState<Array<{ time: string; action: string; args: unknown[] }>>([]);
// 流程模式
const [selectedScenario, setSelectedScenario] = useState<Scenario>(scenarios[0]);
const [activeStepIndex, setActiveStepIndex] = useState(0);
const [isPlaying, setIsPlaying] = useState(false);
```

---

### Task 1: PhoneFrame 组件

**Files:** Create `apps/campaign-2026-money-rain/src/playground/PhoneFrame.tsx`

- [ ] **Step 1: 创建 PhoneFrame.tsx**

职责：固定 390px 宽度，黑框圆角手机壳，内部按顺序渲染所有 sections。

```tsx
import type { PlaygroundSection } from './types';

interface PhoneFrameProps {
  sections: PlaygroundSection[];
}

export function PhoneFrame({ sections }: PhoneFrameProps) {
  return (
    <div className="flex justify-center items-start min-h-screen py-8">
      <div className="relative w-[390px] min-h-[844px] bg-[#0a1a0a] rounded-[40px] border-[3px] border-gray-700 overflow-hidden shadow-2xl">
        {/* 刘海 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-[30px] bg-gray-700 rounded-b-xl z-10" />
        {/* Section 列表 */}
        <div className="pt-[40px]">
          {sections.map((section) => (
            <section.component
              key={section.id}
              content={section.defaultContent}
              actions={section.defaultActions}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

自动缩放：父容器宽度不足时通过 CSS `transform: scale()` 缩放，但该逻辑由 index.tsx 的容器控制，PhoneFrame 自身不关心。

- [ ] **Step 2: 验证** — `lsp_diagnostics` 无报错

---

### Task 2: ActionsLog 组件

**Files:** Create `apps/campaign-2026-money-rain/src/playground/ActionsLog.tsx`

- [ ] **Step 1: 创建 ActionsLog.tsx**

```tsx
interface ActionsLogProps {
  logs: Array<{ time: string; action: string; args: unknown[] }>;
}

export function ActionsLog({ logs }: ActionsLogProps) {
  if (logs.length === 0) {
    return (
      <div className="text-xs text-gray-400 text-center py-4">
        暂无 actions 调用记录
      </div>
    );
  }
  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {[...logs].reverse().map((log, idx) => (
        <div key={idx} className="text-xs font-mono text-gray-300 bg-gray-800 rounded px-2 py-1">
          <span className="text-gray-500">[{log.time}]</span>{' '}
          <span className="text-blue-400">{log.action}</span>
          {log.args.length > 0 && (
            <span className="text-gray-400">
              ({log.args.map((a) => JSON.stringify(a)).join(', ')})
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 验证** — `lsp_diagnostics` 无报错

---

### Task 3: ContentEditor 组件

**Files:** Create `apps/campaign-2026-money-rain/src/playground/ContentEditor.tsx`

- [ ] **Step 1: 创建 ContentEditor.tsx**

```tsx
import { useState, useEffect } from 'react';

interface ContentEditorProps {
  defaultContent: Record<string, unknown>;
  customContent: Record<string, unknown> | null;
  onChange: (content: Record<string, unknown>) => void;
}

export function ContentEditor({ defaultContent, customContent, onChange }: ContentEditorProps) {
  const [text, setText] = useState(
    () => JSON.stringify(customContent ?? defaultContent, null, 2)
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(customContent ?? defaultContent, null, 2));
    setError(null);
  }, [defaultContent, customContent]);

  const handleApply = () => {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed !== 'object' || parsed === null) {
        setError('内容必须是 JSON 对象');
        return;
      }
      onChange(parsed);
      setError(null);
    } catch {
      setError('JSON 格式错误，无法解析');
    }
  };

  const handleReset = () => {
    setText(JSON.stringify(defaultContent, null, 2));
    onChange(defaultContent);
    setError(null);
  };

  return (
    <div className="space-y-2">
      <textarea
        className="w-full h-32 text-xs font-mono bg-gray-800 text-gray-200 border border-gray-700 rounded p-2 resize-y"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
      />
      {error && <div className="text-xs text-red-400">{error}</div>}
      <div className="flex gap-2">
        <button
          className="px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white"
          onClick={handleApply}
        >
          应用
        </button>
        <button
          className="px-3 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300"
          onClick={handleReset}
        >
          重置为默认
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证** — `lsp_diagnostics` 无报错

---

### Task 4: SectionPanel 支持 customContent + 外部 actions

**Files:** Modify `apps/campaign-2026-money-rain/src/playground/SectionPanel.tsx`

- [ ] **Step 1: 修改接口**

```typescript
interface SectionPanelProps {
  section: PlaygroundSection;
  customContent?: Record<string, unknown> | null;
  actions?: Record<string, unknown>;
}
```

在 `renderContent()` 中：将 `section.defaultContent` 替换为 `customContent ?? section.defaultContent`，将 `section.defaultActions` 替换为 `actions ?? section.defaultActions`

```typescript
const content = customContent ?? section.defaultContent;
const actionProps = actions ?? section.defaultActions;
// 在 renderContent 的 ready 分支中：
<section.component content={content} actions={actionProps} />
```

- [ ] **Step 2: 验证** — `lsp_diagnostics` 无报错

---

### Task 5: FlowInspector 可折叠

**Files:** Modify `apps/campaign-2026-money-rain/src/playground/FlowInspector.tsx`

- [ ] **Step 1: 修改接口**

在 `FlowInspectorProps` 中补充：
```typescript
  collapsed: boolean;
  onToggleCollapse: () => void;
```

如果 `collapsed` 为 true，只渲染一个精简版条（标题 + 展开按钮 + 当前进度），不展示步骤导航、控制按钮：

```typescript
if (collapsed) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-72 bg-gray-900 text-white rounded-xl shadow-2xl border border-gray-700 overflow-hidden cursor-pointer" onClick={onToggleCollapse}>
      <div className="px-4 py-2.5 bg-gray-800 flex items-center justify-between">
        <span className="text-sm font-medium">{scenario.label}</span>
        <span className="text-xs text-gray-400">
          {currentIndex + 1}/{totalSteps}
        </span>
      </div>
    </div>
  );
}
```

展开状态下，在标题栏右侧加一个折叠按钮（`_` 字符）：

```tsx
<button onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }} className="text-gray-400 hover:text-white text-xs px-1">_</button>
```

- [ ] **Step 2: 验证** — `lsp_diagnostics` 无报错

---

### Task 6: ScenarioRunner 纯渲染化

**Files:** Modify `apps/campaign-2026-money-rain/src/playground/ScenarioRunner.tsx`

- [ ] **Step 1: 精简组件**

移除：
- `useState` 中的 `selectedScenario` / `activeStepIndex` / `isPlaying`
- `timerRef`
- `useEffect` 自动播放逻辑
- 左侧场景列表 UI（`.w-48.shrink-0`）
- 播放控制按钮（FlowInspector 中保留）
- 场景切换、步进、播放/暂停、重置等所有回调函数

新的 props 接口：
```typescript
interface ScenarioRunnerProps {
  scenario: Scenario;
  stepIndex: number;
}
```

内部保留 `useStepRenderer` 和 `const sections = registerSections()`，保持原样（不接收外部 sections prop）。

渲染内容简化为：
```tsx
<div className="flex-1">
  <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
    <div className="px-4 py-2 bg-white border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">
          步骤 {stepIndex + 1} / {scenario.steps.length}
        </span>
        <span className="text-sm font-medium text-gray-700">
          {currentStep.name}
        </span>
      </div>
      {currentStep.sectionId && (
        <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
          {currentStep.sectionId}
        </span>
      )}
    </div>
    <div className="relative">
      {stepRenderer || (
        <div className="flex items-center justify-center min-h-[400px] text-gray-400 text-sm">
          此步骤未指定要渲染的 section
        </div>
      )}
    </div>
  </div>
</div>
```

移除的导入：`useState`, `useRef`, `useEffect`, `useCallback`, `FlowInspector`

保留的导入：只保留 `useStepRenderer` 和 `registerSections`

⚠️ 注意：`useStepRenderer` 函数中原来引用 `step.status` 和 `section.stateViews`，应保持原样。

- [ ] **Step 2: 验证** — `lsp_diagnostics` 无报错

---

### Task 7: ControlPanel 组件

**Files:** Create `apps/campaign-2026-money-rain/src/playground/ControlPanel.tsx`

- [ ] **Step 1: 创建 ControlPanel.tsx**

该组件是右侧控制面板的容器，根据 mode 渲染不同内容。

Props 接口：
```typescript
import type { PreviewMode, PlaygroundSection, Scenario, ScenarioStep } from './types';
import { ContentEditor } from './ContentEditor';
import { ActionsLog } from './ActionsLog';

interface ControlPanelProps {
  mode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
  // 单组件模式
  sections: PlaygroundSection[];
  selectedSectionId: string | null;
  onSectionSelect: (id: string) => void;
  customContent: Record<string, unknown> | null;
  onContentChange: (content: Record<string, unknown>) => void;
  actionsLog: Array<{ time: string; action: string; args: unknown[] }>;
  // 流程模式
  scenarios: Scenario[];
  selectedScenario: Scenario;
  onScenarioSelect: (scenario: Scenario) => void;
  activeStepIndex: number;
  onStepChange: (index: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onReset: () => void;
  // 折叠状态
  flowInspectorCollapsed: boolean;
  onToggleFlowInspectorCollapse: () => void;
}
```

渲染结构：
```tsx
<aside className="w-72 shrink-0 bg-gray-900 text-white h-[calc(100vh-56px)] overflow-y-auto border-l border-gray-700">
  {/* === 预览模式 === */}
  <div className="p-4 border-b border-gray-700">
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">预览模式</h3>
    <div className="space-y-1">
      {(['full', 'single', 'flow'] as const).map((m) => (
        <button key={m} className={`w-full text-left px-3 py-2 rounded text-sm ${...}`} onClick={() => onModeChange(m)}>
          {m === 'full' ? '📱 完整页面' : m === 'single' ? '🔍 单组件' : '📋 流程预览'}
        </button>
      ))}
    </div>
  </div>

  {/* === Section 列表 — 仅单组件模式 === */}
  {mode === 'single' && (
    <div className="p-4 border-b border-gray-700">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Section</h3>
      <div className="space-y-0.5">
        {sections.map((s) => (
          <button key={s.id} className={`w-full text-left px-3 py-1.5 rounded text-sm ${selectedSectionId === s.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`} onClick={() => onSectionSelect(s.id)}>
            {s.name}
          </button>
        ))}
      </div>
    </div>
  )}

  {/* === 场景列表 — 仅流程模式 === */}
  {mode === 'flow' && (
    <div className="p-4 border-b border-gray-700">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">场景</h3>
      {/* 场景 radio list */}
      {/* 步骤导航 */}
      {/* 播放控制按钮 */}
      {/* Store 数据折叠面板 */}
    </div>
  )}

  {/* === Content 编辑器 — 仅单组件模式 === */}
  {mode === 'single' && selectedSectionId && (
    <details className="p-4 border-b border-gray-700" open>
      <summary className="text-xs font-bold text-gray-400 uppercase tracking-wide cursor-pointer">Content 编辑</summary>
      <div className="mt-3">
        <ContentEditor ... />
      </div>
    </details>
  )}

  {/* === Actions 日志 — 仅单组件模式 === */}
  {mode === 'single' && (
    <details className="p-4 border-b border-gray-700" open>
      <summary className="text-xs font-bold text-gray-400 uppercase tracking-wide cursor-pointer">Actions 日志</summary>
      <div className="mt-3">
        <ActionsLog logs={actionsLog} />
      </div>
    </details>
  )}
</aside>
```

**场景列表 UI（流程模式）：**
```tsx
<div className="space-y-1">
  {scenarios.map((s) => (
    <button
      key={s.id}
      className={`w-full text-left px-3 py-2 rounded text-sm ${
        selectedScenario.id === s.id
          ? 'bg-blue-600 text-white'
          : 'text-gray-300 hover:bg-gray-800'
      }`}
      onClick={() => onScenarioSelect(s)}
    >
      <div className="font-medium">{s.label}</div>
      {s.description && <div className="text-xs text-gray-500 mt-0.5">{s.description}</div>}
    </button>
  ))}
</div>
```

**步骤导航（流程模式）：**
```tsx
<div className="mt-4">
  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">步骤</h4>
  <div className="flex items-center gap-1.5 flex-wrap mb-3">
    {selectedScenario.steps.map((step, idx) => {
      const isActive = idx === activeStepIndex;
      const isPast = idx < activeStepIndex;
      return (
        <button
          key={step.id}
          className={`w-7 h-7 rounded-full text-xs font-medium ${
            isActive ? 'bg-blue-500 text-white ring-2 ring-blue-400' :
            isPast ? 'bg-green-600 text-white' :
            'bg-gray-700 text-gray-400'
          }`}
          onClick={() => onStepChange(idx)}
          title={step.name}
        >
          {idx + 1}
        </button>
      );
    })}
  </div>
  {/* 当前步骤描述 */}
  <div className="text-xs text-gray-400 mb-3">
    {selectedScenario.steps[activeStepIndex]?.name}
    {selectedScenario.steps[activeStepIndex]?.description && (
      <span className="block text-gray-500 mt-0.5">
        {selectedScenario.steps[activeStepIndex].description}
      </span>
    )}
  </div>
  {/* 控制按钮 */}
  <div className="flex items-center gap-2">
    <button className="flex-1 px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-30" disabled={activeStepIndex === 0} onClick={() => onStepChange(activeStepIndex - 1)}>◀ 上一步</button>
    <button className="px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500" onClick={onPlayToggle}>{isPlaying ? '⏸ 暂停' : '▶ 播放'}</button>
    <button className="flex-1 px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-30" disabled={activeStepIndex >= selectedScenario.steps.length - 1} onClick={() => onStepChange(activeStepIndex + 1)}>下一步 ▶</button>
    <button className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-red-800" onClick={onReset} title="重置">↺</button>
  </div>
  {/* Store 数据折叠面板 */}
  {selectedScenario.steps[activeStepIndex]?.store && (
    <details className="mt-3">
      <summary className="text-xs font-bold text-gray-400 uppercase tracking-wide cursor-pointer">Store 数据</summary>
      <pre className="mt-2 text-xs font-mono bg-gray-800 text-gray-300 rounded p-2 max-h-32 overflow-auto">
        {JSON.stringify(selectedScenario.steps[activeStepIndex].store, null, 2)}
      </pre>
    </details>
  )}
</div>
```

- [ ] **Step 2: 验证** — `lsp_diagnostics` 无报错

---

### Task 8: index.tsx 集成

**Files:** Rewrite `apps/campaign-2026-money-rain/src/playground/index.tsx`

- [ ] **Step 1: 重写 index.tsx**

新结构：

```tsx
import { useState, useCallback } from 'react';
import { SectionPanel } from './SectionPanel';
import { PhoneFrame } from './PhoneFrame';
import { ScenarioRunner } from './ScenarioRunner';
import { ControlPanel } from './ControlPanel';
import { FlowInspector } from './FlowInspector';
import { registerSections } from './section-registry';
import { scenarios } from './scenarios/lottery';
import type { Scenario } from './types';

type PreviewMode = 'full' | 'single' | 'flow';

const sections = registerSections();

export function Playground() {
  const [mode, setMode] = useState<PreviewMode>('full');
  // 单组件模式
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    sections[0]?.id ?? null
  );
  const [customContent, setCustomContent] = useState<Record<string, unknown> | null>(null);
  const [actionsLog, setActionsLog] = useState<Array<{ time: string; action: string; args: unknown[] }>>([]);
  // 流程模式
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(scenarios[0]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [flowCollapsed, setFlowCollapsed] = useState(false);

  const selectedSection = sections.find((s) => s.id === selectedSectionId) ?? null;

  // 为 selectedSection 包装带日志的 actions
  const loggedActions = selectedSection?.defaultActions
    ? Object.fromEntries(
        Object.entries(selectedSection.defaultActions).map(([key, fn]) => [
          key,
          (...args: unknown[]) => {
            setActionsLog((prev) => [
              ...prev,
              { time: new Date().toLocaleTimeString(), action: key, args },
            ]);
            (fn as (...args: unknown[]) => void)(...args);
          },
        ])
      )
    : undefined;

  // 流程控制
  const handleScenarioSelect = useCallback((s: Scenario) => {
    setSelectedScenario(s);
    setActiveStepIndex(0);
    setIsPlaying(false);
  }, []);

  const handleStepChange = useCallback((idx: number) => {
    if (isPlaying) setIsPlaying(false);
    setActiveStepIndex(idx);
  }, [isPlaying]);

  const handlePlayToggle = useCallback(() => {
    if (activeStepIndex >= selectedScenario.steps.length - 1) {
      setActiveStepIndex(0);
    }
    setIsPlaying((p) => !p);
  }, [activeStepIndex, selectedScenario.steps.length]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setActiveStepIndex(0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* 顶栏 — 不再包含模式切换按钮 */}
      <header className="sticky top-0 z-50 bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold">[@new-type] Designer Playground</h1>
          <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">money-rain</span>
        </div>
      </header>

      {/* 主区域：flex 布局 */}
      <div className="flex">
        {/* 左侧主内容 */}
        <main className="flex-1 min-h-[calc(100vh-56px)] overflow-auto">
          {mode === 'full' && <PhoneFrame sections={sections} />}
          {mode === 'single' && selectedSection && (
            <div className="max-w-lg mx-auto py-8 px-4">
              <SectionPanel
                section={selectedSection}
                customContent={customContent}
                actions={loggedActions}
              />
            </div>
          )}
          {mode === 'flow' && (
            <div className="py-8 px-4">
              <ScenarioRunner
                scenario={selectedScenario}
                stepIndex={activeStepIndex}
              />
            </div>
          )}
        </main>

        {/* 右侧控制面板 */}
        <ControlPanel
          mode={mode}
          onModeChange={setMode}
          sections={sections}
          selectedSectionId={selectedSectionId}
          onSectionSelect={setSelectedSectionId}
          customContent={customContent}
          onContentChange={setCustomContent}
          actionsLog={actionsLog}
          scenarios={scenarios}
          selectedScenario={selectedScenario}
          onScenarioSelect={handleScenarioSelect}
          activeStepIndex={activeStepIndex}
          onStepChange={handleStepChange}
          isPlaying={isPlaying}
          onPlayToggle={handlePlayToggle}
          onReset={handleReset}
          flowInspectorCollapsed={flowCollapsed}
          onToggleFlowInspectorCollapse={() => setFlowCollapsed((p) => !p)}
        />
      </div>

      {/* 浮动流程面板 — 仅流程模式 */}
      {mode === 'flow' && !flowCollapsed && (
        <FlowInspector
          scenario={selectedScenario}
          currentStep={selectedScenario.steps[activeStepIndex]}
          currentIndex={activeStepIndex}
          totalSteps={selectedScenario.steps.length}
          isPlaying={isPlaying}
          onStepChange={handleStepChange}
          onPlayToggle={handlePlayToggle}
          onReset={handleReset}
          collapsed={flowCollapsed}
          onToggleCollapse={() => setFlowCollapsed((p) => !p)}
        />
      )}
    </div>
  );
}
```

（Task 4 已处理 SectionPanel 接口变更，此处无需重复声明）

- [ ] **Step 2: 验证** — `lsp_diagnostics` 无报错

---

### Task 9: 验证与修正

- [ ] **Step 1: 运行 tsc 检查**
  ```bash
  pnpm exec tsc --noEmit --pretty
  ```
  期望：只有 3 个 pre-existing 错误（tailwind config 类型声明 + headless 未使用变量）

- [ ] **Step 2: 检查 Vitest 是否受影响**
  ```bash
  pnpm test:unit
  ```
  期望：2 个测试仍通过（WheelSection + CritSection）

- [ ] **Step 3: 手动验证 Playground**
  ```bash
  pnpm exec nx dev campaign-2026-money-rain --port 5175
  ```
  访问 `http://localhost:5175/?mode=designer`，检查：
  - [ ] Header 无模式切换按钮
  - [ ] 默认进入"完整页面"模式，显示手机壳
  - [ ] 手机壳渲染所有 9 个 Section
  - [ ] 切换"单组件"模式，控制面板显示 Section 列表
  - [ ] 选择不同 Section，主区域切换渲染
  - [ ] Content 编辑器中修改 JSON 并应用，Section 内容更新
  - [ ] 点击 WheelSection GO 按钮，Actions 日志出现调用记录
  - [ ] 切换"流程预览"模式，控制面板显示场景列表
  - [ ] 选择不同场景，主区域渲染对应步骤
  - [ ] 播放/暂停/上一步/下一步正常工作
  - [ ] FlowInspector 浮窗可折叠/展开
