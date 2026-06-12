# Designer Playground Phase 1 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构 campaign-template 架构，创建 designer/ + playground/ 系统，让设计师可预览组件状态

**Architecture:**
- 安装原有 src/ 目录改造为统一的合约驱动结构
- Section 组件标准化为 `types.ts + content.ts + index.tsx + states.tsx` 四文件模式
- Playground 通过 `?mode=designer` 路由激活，hover 显示状态切换面板
- 场景系统允许设计师预览复杂交互流程

**Tech Stack:** React 18 + TypeScript + TailwindCSS + Vite + Zustand

---

### Task 1: 创建核心类型契约 `contracts/section.ts`

**Files:**
- Create: `apps/campaign-template/src/contracts/section.ts`

- [ ] **Step 1: 创建 contracts 目录和 section.ts**

```ts
// apps/campaign-template/src/contracts/section.ts

import type { ComponentType, ReactNode } from 'react';

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
  children?: ReactNode;
}

/** Section 状态视图映射 */
export type StateViews = Partial<Record<SectionStatus, ComponentType<{ message?: string }>>>;

/** Section 完整描述（用于 Playground 自动发现） */
export interface SectionDescriptor<TContent = unknown> {
  meta: SectionMeta;
  component: ComponentType<SectionProps<TContent>>;
  defaultContent: TContent;
  stateViews?: StateViews;
}
```

---

### Task 2: 重构 HeroSection → designer 格式

**Files:**
- Create: `apps/campaign-template/src/designer/sections/HeroSection/types.ts`
- Create: `apps/campaign-template/src/designer/sections/HeroSection/content.ts`
- Create: `apps/campaign-template/src/designer/sections/HeroSection/index.tsx`
- Create: `apps/campaign-template/src/designer/sections/HeroSection/states.tsx`

- [ ] **Step 1: 创建 HeroSection types.ts**

```ts
// apps/campaign-template/src/designer/sections/HeroSection/types.ts
export interface HeroContent {
  title: string;
  subtitle: string;
  ctaText: string;
  endTime: number;
  backgroundImage?: string;
}
```

- [ ] **Step 2: 创建 HeroSection content.ts**

```ts
// apps/campaign-template/src/designer/sections/HeroSection/content.ts
import type { HeroContent } from './types';

export const defaultContent: HeroContent = {
  title: '夏日狂欢季',
  subtitle: '超多好礼等你来拿',
  ctaText: '立即参与',
  endTime: new Date('2026-06-30T23:59:59').getTime(),
};
```

- [ ] **Step 3: 创建 HeroSection index.tsx（从原有 HeroSection.tsx 改造）**

```tsx
// apps/campaign-template/src/designer/sections/HeroSection/index.tsx
import { useCountdown } from '@new-type/hooks';
import type { SectionProps } from '../../../contracts/section';
import type { HeroContent } from './types';

export function HeroSection({ content }: SectionProps<HeroContent>) {
  const { days, hours, minutes, seconds } = useCountdown(content.endTime);

  return (
    <section className="relative w-full min-h-[60vh] bg-gradient-to-b from-blue-500 to-purple-600 flex flex-col items-center justify-center text-white px-4">
      <h1 className="text-3xl font-bold mb-2">{content.title}</h1>
      <p className="text-lg mb-6 opacity-90">{content.subtitle}</p>

      <div className="flex items-center gap-2 text-lg mb-8">
        <span>距结束</span>
        <span className="bg-white/20 rounded px-2 py-1">{String(days).padStart(2, '0')}天</span>
        <span className="bg-white/20 rounded px-2 py-1">{String(hours).padStart(2, '0')}时</span>
        <span className="bg-white/20 rounded px-2 py-1">{String(minutes).padStart(2, '0')}分</span>
        <span className="bg-white/20 rounded px-2 py-1">{String(seconds).padStart(2, '0')}秒</span>
      </div>

      <button
        className="bg-white text-blue-600 font-bold px-8 py-3 rounded-full text-lg shadow-lg active:scale-95 transition-transform"
        onClick={content.ctaText ? undefined : undefined}
      >
        {content.ctaText}
      </button>
    </section>
  );
}
```

- [ ] **Step 4: 创建 HeroSection states.tsx**

```tsx
// apps/campaign-template/src/designer/sections/HeroSection/states.tsx
import type { ComponentType } from 'react';

export const HeroLoading: ComponentType<{ message?: string }> = ({ message }) => (
  <section className="relative w-full min-h-[60vh] bg-gradient-to-b from-blue-500 to-purple-600 flex flex-col items-center justify-center px-4">
    <div className="w-48 h-8 bg-white/20 rounded animate-pulse mb-4" />
    <div className="w-64 h-5 bg-white/20 rounded animate-pulse mb-6" />
    <div className="w-24 h-10 bg-white/20 rounded-full animate-pulse" />
  </section>
);

export const HeroEmpty: ComponentType<{ message?: string }> = ({ message }) => (
  <section className="relative w-full min-h-[60vh] bg-gradient-to-b from-blue-500 to-purple-600 flex flex-col items-center justify-center text-white/70 px-4">
    <p className="text-lg">{message || '暂无活动内容'}</p>
  </section>
);

export const HeroError: ComponentType<{ message?: string }> = ({ message }) => (
  <section className="relative w-full min-h-[60vh] bg-gradient-to-b from-red-400 to-orange-500 flex flex-col items-center justify-center text-white px-4">
    <p className="text-lg font-bold mb-2">加载失败</p>
    <p className="text-sm opacity-80">{message || '请稍后重试'}</p>
  </section>
);
```

---

### Task 3: 重构 RuleSection → designer 格式

**Files:**
- Create: `apps/campaign-template/src/designer/sections/RuleSection/types.ts`
- Create: `apps/campaign-template/src/designer/sections/RuleSection/content.ts`
- Create: `apps/campaign-template/src/designer/sections/RuleSection/index.tsx`
- Create: `apps/campaign-template/src/designer/sections/RuleSection/states.tsx`

- [ ] **Step 1: 创建 types.ts**

```ts
// apps/campaign-template/src/designer/sections/RuleSection/types.ts
export interface RuleContent {
  title: string;
  rules: string[];
}
```

- [ ] **Step 2: 创建 content.ts**

```ts
// apps/campaign-template/src/designer/sections/RuleSection/content.ts
import type { RuleContent } from './types';

export const defaultContent: RuleContent = {
  title: '活动规则',
  rules: [
    '活动时间：2026年6月1日 - 2026年6月30日',
    '每位用户每天可参与3次',
    '中奖结果将在页面实时展示',
    '最终解释权归主办方所有',
  ],
};
```

- [ ] **Step 3: 创建 index.tsx**

```tsx
// apps/campaign-template/src/designer/sections/RuleSection/index.tsx
import type { SectionProps } from '../../../contracts/section';
import type { RuleContent } from './types';

export function RuleSection({ content }: SectionProps<RuleContent>) {
  return (
    <section className="px-6 py-10 bg-gray-50">
      <h2 className="text-xl font-bold text-center mb-6 text-gray-800">{content.title}</h2>
      <ul className="space-y-3">
        {content.rules.map((rule, index) => (
          <li key={index} className="flex items-start gap-3 text-gray-600 text-sm">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs shrink-0 mt-0.5">
              {index + 1}
            </span>
            {rule}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: 创建 states.tsx**

```tsx
// apps/campaign-template/src/designer/sections/RuleSection/states.tsx
import type { ComponentType } from 'react';

export const RuleLoading: ComponentType<{ message?: string }> = () => (
  <section className="px-6 py-10 bg-gray-50">
    <div className="w-24 h-6 bg-gray-200 rounded animate-pulse mx-auto mb-6" />
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse shrink-0 mt-0.5" />
          <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  </section>
);
```

---

### Task 4: 重构 PrizeSection → designer 格式

**Files:**
- Create: `apps/campaign-template/src/designer/sections/PrizeSection/types.ts`
- Create: `apps/campaign-template/src/designer/sections/PrizeSection/content.ts`
- Create: `apps/campaign-template/src/designer/sections/PrizeSection/index.tsx`
- Create: `apps/campaign-template/src/designer/sections/PrizeSection/states.tsx`

- [ ] **Step 1: 创建 types.ts**

```ts
// apps/campaign-template/src/designer/sections/PrizeSection/types.ts
export interface PrizeItem {
  name: string;
  image?: string;
}

export interface PrizeContent {
  title: string;
  prizes: PrizeItem[];
  drawButtonText: string;
  winRate: number;
}
```

- [ ] **Step 2: 创建 content.ts**

```ts
// apps/campaign-template/src/designer/sections/PrizeSection/content.ts
import type { PrizeContent } from './types';

export const defaultContent: PrizeContent = {
  title: '奖品展示',
  prizes: [
    { name: '一等奖：iPhone 16' },
    { name: '二等奖：AirPods' },
    { name: '三等奖：50元红包' },
    { name: '幸运奖：精美周边' },
  ],
  drawButtonText: '抽奖',
  winRate: 0.2,
};
```

- [ ] **Step 3: 创建 index.tsx（抽奖交互使用 mock）**

```tsx
// apps/campaign-template/src/designer/sections/PrizeSection/index.tsx
import { Modal } from '@new-type/ui';
import type { SectionProps } from '../../../contracts/section';
import type { PrizeContent, PrizeActions } from './types';

export function PrizeSection({ content, actions }: SectionProps<PrizeContent, PrizeActions>) {
    const res = drawLottery(
      content.prizes.map((p) => p.name),
      content.winRate,
    );
    setResult(res);
    setPrizeModalOpen(true);
  };

  return (
    <section className="px-6 py-10">
      <h2 className="text-xl font-bold text-center mb-6 text-gray-800">{content.title}</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {content.prizes.map((prize, index) => (
          <div key={index} className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-xl p-4 text-center shadow-sm">
            <p className="text-sm font-medium text-gray-700">{prize.name}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          className="bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold px-8 py-3 rounded-full text-lg shadow-lg active:scale-95 transition-transform"
          onClick={handleDraw}
        >
          {content.drawButtonText}
        </button>
      </div>

      <Modal open={prizeModalOpen} onClose={() => setPrizeModalOpen(false)}>
        <div className="text-center py-4">
          <p className="text-lg font-bold mb-2">
            {result?.isWin ? '恭喜中奖！' : '很遗憾'}
          </p>
          <p className="text-gray-600 mb-4">{result?.prize}</p>
          <button
            className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm"
            onClick={() => setPrizeModalOpen(false)}
          >
            知道了
          </button>
        </div>
      </Modal>
    </section>
  );
}
```

- [ ] **Step 4: 创建 states.tsx**

```tsx
// apps/campaign-template/src/designer/sections/PrizeSection/states.tsx
import type { ComponentType } from 'react';

export const PrizeLoading: ComponentType<{ message?: string }> = () => (
  <section className="px-6 py-10">
    <div className="w-24 h-6 bg-gray-200 rounded animate-pulse mx-auto mb-6" />
    <div className="grid grid-cols-2 gap-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl p-12 bg-gray-100 animate-pulse" />
      ))}
    </div>
    <div className="w-32 h-10 bg-gray-200 rounded-full animate-pulse mx-auto" />
  </section>
);

export const PrizeEmpty: ComponentType<{ message?: string }> = ({ message }) => (
  <section className="px-6 py-10 text-center text-gray-400">
    <p>{message || '暂无奖品信息'}</p>
  </section>
);

export const PrizeError: ComponentType<{ message?: string }> = ({ message }) => (
  <section className="px-6 py-10 text-center text-red-400">
    <p className="font-bold">奖品加载失败</p>
    <p className="text-sm mt-1">{message || '请稍后重试'}</p>
  </section>
);
```

---

### Task 5: 重构 CountdownTimer → designer 格式

**Files:**
- Create: `apps/campaign-template/src/designer/sections/CountdownTimer/types.ts`
- Create: `apps/campaign-template/src/designer/sections/CountdownTimer/content.ts`
- Create: `apps/campaign-template/src/designer/sections/CountdownTimer/index.tsx`

- [ ] **Step 1: 创建 types.ts**

```ts
// apps/campaign-template/src/designer/sections/CountdownTimer/types.ts
export interface CountdownTimerContent {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}
```

- [ ] **Step 2: 创建 content.ts**

```ts
// apps/campaign-template/src/designer/sections/CountdownTimer/content.ts
import type { CountdownTimerContent } from './types';

export const defaultContent: CountdownTimerContent = {
  days: 18,
  hours: 12,
  minutes: 30,
  seconds: 45,
};
```

- [ ] **Step 3: 创建 index.tsx**

```tsx
// apps/campaign-template/src/designer/sections/CountdownTimer/index.tsx
import type { SectionProps } from '../../../contracts/section';
import type { CountdownTimerContent } from './types';

export function CountdownTimer({ content }: SectionProps<CountdownTimerContent>) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="bg-gray-800 text-white rounded px-1.5 py-0.5 min-w-[24px] text-center">
        {String(content.days).padStart(2, '0')}
      </span>
      <span className="text-gray-500">:</span>
      <span className="bg-gray-800 text-white rounded px-1.5 py-0.5 min-w-[24px] text-center">
        {String(content.hours).padStart(2, '0')}
      </span>
      <span className="text-gray-500">:</span>
      <span className="bg-gray-800 text-white rounded px-1.5 py-0.5 min-w-[24px] text-center">
        {String(content.minutes).padStart(2, '0')}
      </span>
      <span className="text-gray-500">:</span>
      <span className="bg-gray-800 text-white rounded px-1.5 py-0.5 min-w-[24px] text-center">
        {String(content.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
```

---

### Task 6: 创建 Playground 系统入口

**Files:**
- Create: `apps/campaign-template/src/playground/index.tsx`
- Create: `apps/campaign-template/src/playground/types.ts`

- [ ] **Step 1: 创建 playground/types.ts**

```ts
// apps/campaign-template/src/playground/types.ts
import type { ComponentType } from 'react';
import type { SectionStatus } from '../contracts/section';

export interface PlaygroundSection {
  id: string;
  name: string;
  component: ComponentType<any>;
  defaultContent: Record<string, unknown>;
  stateViews: Partial<Record<SectionStatus, ComponentType<{ message?: string }>>>;
}

export interface ScenarioStep {
  id: string;
  name: string;
  description?: string;
  store: Record<string, unknown>;
}

export interface Scenario {
  id: string;
  label: string;
  description?: string;
  initialStore: Record<string, unknown>;
  steps: ScenarioStep[];
}
```

- [ ] **Step 2: 创建 playground/index.tsx**

```tsx
// apps/campaign-template/src/playground/index.tsx
import { useState } from 'react';
import { SectionPanel } from './SectionPanel';
import { ScenarioRunner } from './ScenarioRunner';
import { registerSections } from './section-registry';
import type { PlaygroundSection } from './types';

const sections = registerSections();

export function Playground() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [mode, setMode] = useState<'single' | 'scenario'>('single');

  return (
    <div className="min-h-screen bg-white">
      {/* 顶栏 */}
      <header className="sticky top-0 z-50 bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold">[@new-type] Designer Playground</h1>
          <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">campaign-template</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            className={`px-3 py-1 rounded text-sm ${mode === 'single' ? 'bg-blue-500' : 'bg-gray-700'}`}
            onClick={() => setMode('single')}
          >
            单组件预览
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${mode === 'scenario' ? 'bg-blue-500' : 'bg-gray-700'}`}
            onClick={() => setMode('scenario')}
          >
            场景流程
          </button>
        </div>
      </header>

      {/* 内容区 */}
      <main className="max-w-3xl mx-auto py-8 px-4">
        {mode === 'single' && (
          <div className="space-y-12">
            {sections.map((section) => (
              <SectionPanel key={section.id} section={section} />
            ))}
          </div>
        )}
        {mode === 'scenario' && <ScenarioRunner />}
      </main>
    </div>
  );
}
```

---

### Task 7: 创建 SectionPanel（hover 状态切换）

**Files:**
- Create: `apps/campaign-template/src/playground/SectionPanel.tsx`

- [ ] **Step 1: 创建 SectionPanel.tsx**

```tsx
// apps/campaign-template/src/playground/SectionPanel.tsx
import { useState } from 'react';
import type { SectionStatus } from '../contracts/section';
import type { PlaygroundSection } from './types';

interface SectionPanelProps {
  section: PlaygroundSection;
}

export function SectionPanel({ section }: SectionPanelProps) {
  const [status, setStatus] = useState<SectionStatus>('ready');
  const [showMenu, setShowMenu] = useState(false);

  const statuses: SectionStatus[] = ['ready', 'loading', 'empty', 'error'];

  const renderContent = () => {
    if (status !== 'ready' && section.stateViews[status]) {
      const StateComponent = section.stateViews[status]!;
      const messages: Record<string, string> = {
        loading: '加载中...',
        empty: '暂无内容',
        error: '加载失败，请稍后重试',
      };
      return <StateComponent message={messages[status]} />;
    }
    return <section.component content={section.defaultContent} />;
  };

  return (
    <div
      className="relative border border-gray-200 rounded-xl overflow-hidden"
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Section 名称 */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{section.name}</span>
        {showMenu && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 mr-1">状态:</span>
            {statuses.map((s) => (
              <button
                key={s}
                className={`px-2 py-0.5 text-xs rounded ${
                  status === s
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                onClick={() => setStatus(s)}
              >
                {s === 'ready' ? '正常' : s === 'loading' ? '加载' : s === 'empty' ? '空态' : '错误'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 渲染区 */}
      <div className="relative">
        {renderContent()}
        {/* 半透明遮罩提示 hover */}
        {!showMenu && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-gray-400 bg-white/80 px-2 py-1 rounded shadow">
              悬停切换状态
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Task 8: 创建 Section Registry 和 Scenario 系统

**Files:**
- Create: `apps/campaign-template/src/playground/section-registry.ts`
- Create: `apps/campaign-template/src/playground/ScenarioRunner.tsx`
- Create: `apps/campaign-template/src/playground/scenarios/lottery.ts`

- [ ] **Step 1: 创建 section-registry.ts**

```ts
// apps/campaign-template/src/playground/section-registry.ts
import type { PlaygroundSection } from './types';

import { HeroSection } from '../designer/sections/HeroSection';
import { defaultContent as heroContent } from '../designer/sections/HeroSection/content';
import { HeroLoading, HeroEmpty, HeroError } from '../designer/sections/HeroSection/states';

import { RuleSection } from '../designer/sections/RuleSection';
import { defaultContent as ruleContent } from '../designer/sections/RuleSection/content';
import { RuleLoading } from '../designer/sections/RuleSection/states';

import { PrizeSection } from '../designer/sections/PrizeSection';
import { defaultContent as prizeContent } from '../designer/sections/PrizeSection/content';
import { PrizeLoading, PrizeEmpty, PrizeError } from '../designer/sections/PrizeSection/states';

export function registerSections(): PlaygroundSection[] {
  return [
    {
      id: 'hero',
      name: 'HeroSection',
      component: HeroSection,
      defaultContent: heroContent,
      stateViews: { loading: HeroLoading, empty: HeroEmpty, error: HeroError },
    },
    {
      id: 'rules',
      name: 'RuleSection',
      component: RuleSection,
      defaultContent: ruleContent,
      stateViews: { loading: RuleLoading },
    },
    {
      id: 'prize',
      name: 'PrizeSection',
      component: PrizeSection,
      defaultContent: prizeContent,
      stateViews: { loading: PrizeLoading, empty: PrizeEmpty, error: PrizeError },
    },
  ];
}
```

- [ ] **Step 2: 创建 scenarios/lottery.ts**

```ts
// apps/campaign-template/src/playground/scenarios/lottery.ts
import type { Scenario } from '../types';

export const lotteryWinScenario: Scenario = {
  id: 'lottery-win',
  label: '抽奖 → 中奖 → 领取成功',
  description: '用户参与抽奖并中奖的完整交互流程',
  initialStore: {
    user: { id: 'test_001', name: '测试用户' },
    lottery: { dailyQuota: 3, usedCount: 0, lastResult: null, showResultModal: false },
  },
  steps: [
    {
      id: 'before-draw',
      name: '抽奖前',
      description: '用户进入活动页，看到抽奖按钮',
      store: { lottery: { dailyQuota: 3, usedCount: 0, lastResult: null, showResultModal: false } },
    },
    {
      id: 'drawing',
      name: '点击抽奖 - 加载中',
      description: '用户点击抽奖按钮，等待结果',
      store: { lottery: { dailyQuota: 3, usedCount: 0, drawing: true, showResultModal: false } },
    },
    {
      id: 'win-result',
      name: '中奖结果弹窗',
      description: '中奖弹窗展示奖品信息',
      store: {
        lottery: {
          dailyQuota: 3,
          usedCount: 1,
          lastResult: { isWin: true, prize: '一等奖：iPhone 16' },
          showResultModal: true,
        },
      },
    },
    {
      id: 'claimed',
      name: '领取成功',
      description: '用户领取奖品成功',
      store: {
        lottery: {
          dailyQuota: 3,
          usedCount: 1,
          lastResult: { isWin: true, prize: '一等奖：iPhone 16', claimed: true },
          showResultModal: false,
        },
      },
    },
  ],
};

export const lotteryLoseScenario: Scenario = {
  id: 'lottery-lose',
  label: '抽奖 → 未中奖',
  description: '用户参与抽奖但未中奖',
  initialStore: {
    user: { id: 'test_001', name: '测试用户' },
    lottery: { dailyQuota: 3, usedCount: 0, lastResult: null, showResultModal: false },
  },
  steps: [
    {
      id: 'before-draw',
      name: '抽奖前',
      store: { lottery: { dailyQuota: 3, usedCount: 0 } },
    },
    {
      id: 'lose-result',
      name: '未中奖弹窗',
      store: {
        lottery: {
          dailyQuota: 3,
          usedCount: 1,
          lastResult: { isWin: false, prize: '未中奖' },
          showResultModal: true,
        },
      },
    },
  ],
};

export const scenarios = [lotteryWinScenario, lotteryLoseScenario];
```

- [ ] **Step 3: 创建 ScenarioRunner.tsx**

```tsx
// apps/campaign-template/src/playground/ScenarioRunner.tsx
import { useState } from 'react';
import { scenarios } from './scenarios/lottery';
import type { Scenario } from './types';

export function ScenarioRunner() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(scenarios[0]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const currentStep = selectedScenario.steps[activeStepIndex];

  return (
    <div className="flex gap-6">
      {/* 场景列表 */}
      <div className="w-48 shrink-0 space-y-2">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">场景</h3>
        {scenarios.map((s) => (
          <button
            key={s.id}
            className={`w-full text-left px-3 py-2 rounded text-sm ${
              selectedScenario.id === s.id
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => { setSelectedScenario(s); setActiveStepIndex(0); }}
          >
            <div className="font-medium">{s.label}</div>
            {s.description && <div className="text-xs text-gray-400 mt-0.5">{s.description}</div>}
          </button>
        ))}
      </div>

      {/* 渲染区 */}
      <div className="flex-1">
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              步骤 {activeStepIndex + 1} / {selectedScenario.steps.length}: {currentStep.name}
            </span>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 text-xs bg-gray-200 rounded disabled:opacity-30"
                disabled={activeStepIndex === 0}
                onClick={() => setActiveStepIndex((i) => Math.max(0, i - 1))}
              >
                上一步
              </button>
              <button
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded disabled:opacity-30"
                disabled={activeStepIndex >= selectedScenario.steps.length - 1}
                onClick={() => setActiveStepIndex((i) => Math.min(selectedScenario.steps.length - 1, i + 1))}
              >
                下一步
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-4">{currentStep.description}</p>

          {/* 步骤导航点 */}
          <div className="flex items-center gap-2 mb-4">
            {selectedScenario.steps.map((step, idx) => (
              <button
                key={step.id}
                className={`w-8 h-8 rounded-full text-xs font-medium ${
                  idx === activeStepIndex
                    ? 'bg-blue-500 text-white'
                    : idx < activeStepIndex
                      ? 'bg-green-400 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
                onClick={() => setActiveStepIndex(idx)}
                title={step.name}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* 渲染区域 — 显示当前 step 的 store 状态 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 min-h-[200px]">
            <pre className="text-xs text-gray-600 overflow-auto">
              {JSON.stringify(currentStep.store, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### Task 9: 更新 main.tsx 支持模式路由

**Files:**
- Modify: `apps/campaign-template/src/main.tsx`

- [ ] **Step 1: 修改 main.tsx**

```tsx
// apps/campaign-template/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);

// Designer Playground 模式：?mode=designer
const searchParams = new URLSearchParams(window.location.search);
if (searchParams.get('mode') === 'designer') {
  import('./playground').then(({ Playground }) => {
    root.render(
      <React.StrictMode>
        <Playground />
      </React.StrictMode>,
    );
  });
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
```

---

### Task 10: 更新 app.tsx 指向新路径

**Files:**
- Modify: `apps/campaign-template/src/app.tsx`

- [ ] **Step 1: 修改 app.tsx**

```tsx
// apps/campaign-template/src/app.tsx
import { ToastContainer } from '@new-type/ui';
import { HeroSection } from './designer/sections/HeroSection';
import { defaultContent as heroContent } from './designer/sections/HeroSection/content';
import { RuleSection } from './designer/sections/RuleSection';
import { defaultContent as ruleContent } from './designer/sections/RuleSection/content';
import { PrizeSection } from './designer/sections/PrizeSection';
import { defaultContent as prizeContent } from './designer/sections/PrizeSection/content';

export function App() {
  return (
    <main className="min-h-screen bg-white">
      <HeroSection content={heroContent} />
      <RuleSection content={ruleContent} />
      <PrizeSection content={prizeContent} />
      <ToastContainer />
    </main>
  );
}
```

---

### Task 11: 创建 docs/ai-framework-map.md

**Files:**
- Create: `docs/ai-framework-map.md`

- [ ] **Step 1: 创建 ai-framework-map.md**

```md
# AI Framework Map

> AI 辅助开发时的共享包引用指南

## 包引用速查

| 场景 | 应使用的包 | 示例 |
|------|-----------|------|
| 网络请求 | `@new-type/request` | `import { createRequest } from '@new-type/request'` |
| 轻提示 | `@new-type/ui` | `import { toast, ToastContainer } from '@new-type/ui'` |
| 弹窗 | `@new-type/ui` | `import { Modal } from '@new-type/ui'` |
| 图片懒加载 | `@new-type/ui` | `import { LazyImage } from '@new-type/ui'` |
| 加载指示器 | `@new-type/ui` | `import { Loading } from '@new-type/ui'` |
| 骨架屏 | `@new-type/ui` | `import { Skeleton } from '@new-type/ui'` |
| 倒计时 | `@new-type/hooks` | `import { useCountdown } from '@new-type/hooks'` |
| 滚动方向 | `@new-type/hooks` | `import { useScrollDirection } from '@new-type/hooks'` |
| Web Share | `@new-type/hooks` | `import { useShare } from '@new-type/hooks'` |
| 微信分享 | `@new-type/hooks` | `import { useWechatShare } from '@new-type/hooks'` |
| 日期格式化 | `@new-type/utils` | `import { formatDate } from '@new-type/utils'` |
| URL 参数解析 | `@new-type/utils` | `import { parseUrlParams } from '@new-type/utils'` |
| 防抖/节流 | `@new-type/utils` | `import { debounce, throttle } from '@new-type/utils'` |
| 本地存储 | `@new-type/utils` | `import { storage } from '@new-type/utils'` |
| 埋点 | `@new-type/analytics` | `import { pageView, click, track } from '@new-type/analytics'` |
| 无样式 Tab | `@new-type/headless` | `import { Tab } from '@new-type/headless'` |

## 通用规则

1. **不要自己实现**：任何上述功能都优先使用 `@new-type/*` 包
2. **不要修改共享包**：如果你缺少某个功能，在 `packages/*` 中添加而不是修改现有导出
3. **react-router-dom 直接使用**：路由库直接依赖，不封装
4. **zustand 直接使用**：状态管理库直接使用
```

---

### Task 12: 清理旧文件

**Files:**
- Delete: Old files that have been migrated

- [ ] **Step 1: 删除已迁移的旧文件**

```bash
# 删除旧的 section 文件（已迁移到 designer/sections/）
rm apps/campaign-template/src/sections/HeroSection.tsx
rm apps/campaign-template/src/sections/RuleSection.tsx
rm apps/campaign-template/src/sections/PrizeSection.tsx
rm apps/campaign-template/src/sections
rm apps/campaign-template/src/components/CountdownTimer.tsx

# 保留 store/, services/, tracking.ts 作为向后兼容（后续 Phase 3 再迁移）
# 但确保它们不被 app.tsx 直接引用（目前 app.tsx 确实没有引用它们）
```

---

## 执行顺序

1. Task 1: 创建 contracts/section.ts（基础类型，无依赖）
2. Task 2-5: 重构 4 个组件到 designer 格式（并行的子任务）
3. Task 6: 创建 Playground 入口（依赖 Task 1）
4. Task 7: 创建 SectionPanel（依赖 Task 1, 6）
5. Task 8: 创建 Registry + Scenario（依赖 Task 1, 2-5）
6. Task 9: 更新 main.tsx（依赖 Task 6）
7. Task 10: 更新 app.tsx（依赖 Task 2-5）
8. Task 11: 创建 ai-framework-map.md（无依赖）
9. Task 12: 清理旧文件（依赖 Task 2-5, 10）
