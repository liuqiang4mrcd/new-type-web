# 反馈机制 Phase 1 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成反馈机制的核心链路（类型扩展 + 校验规则 + Playground 增强 + 存量组件重构 + 文档更新）

**Architecture:** 扩展 contracts/section.ts 的类型系统，新增 Layer 0 静态检查，Playground 支持 defaultActions 交互测试，WheelSection/CritSection 重构为 actions props 模式，RewardTierSection 补状态声明和动画

**Tech Stack:** TypeScript, React 18, AST-grep, Vitest

**设计文档:** `docs/superpowers/specs/2026-06-16-feedback-mechanism-design.md`

---

## 文件结构变更清单

### 修改的文件

| 文件 | 变更 |
|------|------|
| `apps/campaign-template/src/contracts/section.ts` | 扩展 StateType + 新增 StateTransition |
| `apps/money-rain/src/contracts/section.ts` | 同上 |
| `scripts/section-validator/types.ts` | 新增校验结果类型、StateTransition 解析类型 |
| `scripts/section-validator/parsers.ts` | 新增 parseStateTransitions、parseRuntimeApp |
| `scripts/section-validator/checks.ts` | 新增 #11-#15 检查 |
| `scripts/validate-section.ts` | 支持 `--campaign` 参数 |
| `apps/*/src/playground/types.ts` | 新增 defaultActions 字段 |
| `apps/*/src/playground/SectionPanel.tsx` | 传递 defaultActions 到组件 |
| `apps/money-rain/src/designer/sections/WheelSection/*` | 四文件重构 |
| `apps/money-rain/src/designer/sections/CritSection/*` | 去 useStore + actions props |
| `apps/money-rain/src/designer/sections/RewardTierSection/*` | 补 stateTransitions + 动画 |
| `apps/money-rain/src/runtime/sections/WheelContainer.tsx` | 传递 actions props |
| `apps/money-rain/src/runtime/sections/CritContainer.tsx` | 同上 |
| `apps/money-rain/src/runtime/sections/RewardTierContainer.tsx` | 传递 content currentIndex |
| `apps/money-rain/src/playground/section-registry.ts` | 增加 defaultActions |
| `agents/designer.md` | 更新工作流 |
| `agents/shared/DESIGN_OUTPUT.md` | 更新状态声明规范 |
| `docs/ai/development-rules.md` | 更新 AI 修改边界 |

---

### Task 1.1: 扩展 contracts/section.ts 类型系统

**上下文:** 当前 `StateType` 只有 `'ui' | 'business'`，缺少 `'interaction'` 类型。需要新增 `StateTransition` 接口使状态机可声明。

**Files:**
- Modify: `apps/campaign-template/src/contracts/section.ts`
- Modify: `apps/money-rain/src/contracts/section.ts`
  - (money-rain = `apps/campaign-2026-money-rain`)

- [ ] **Step 1.1.1: 修改 template 的 contracts/section.ts**

将 `apps/campaign-template/src/contracts/section.ts` 内容替换为：

```typescript
import type { ComponentType, ReactNode } from 'react';

/** 组件状态 */
export type SectionStatus = 'loading' | 'empty' | 'ready' | 'error' | 'disabled' | 'spinning';

/** 状态类型：ui=独立视觉组件（states.tsx），business=业务数据（stateData），interaction=交互状态机 */
export type StateType = 'ui' | 'business' | 'interaction';

/** 单个状态声明 */
export interface StateDeclaration {
  key: string;
  type: StateType;
  required: boolean;
}

/** 触发类型 */
export type TriggerType = 'click' | 'timeout' | 'animationend' | 'load' | 'swipe' | 'scroll';

/** 状态转换触发条件 */
export interface StateTrigger {
  type: TriggerType;
  /** click/swipe/scroll 类型必须：actions.xxx 方法名 */
  handler?: string;
  /** timeout 类型必须：持续时间(ms) */
  duration?: number;
}

/** 动效声明 */
export interface TransitionAnimation {
  type: 'spin' | 'slide' | 'fade' | 'scale' | 'none';
  /** 持续时间(ms) */
  duration: number;
  easing?: string;
}

/** 状态转换声明：状态机的一步转换 */
export interface StateTransition {
  from: string;
  to: string;
  trigger: StateTrigger;
  animation?: TransitionAnimation;
  description?: string;
}

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
export type StateViews = Partial<
  Record<SectionStatus, ComponentType<{ message?: string }>>
>;

/** Section 完整描述（用于 Playground 自动发现） */
export interface SectionDescriptor<TContent = unknown> {
  meta: SectionMeta;
  component: ComponentType<SectionProps<TContent>>;
  defaultContent: TContent;
  stateViews?: StateViews;
}
```

- [ ] **Step 1.1.2: 同步修改 money-rain 的 contracts/section.ts**

将 `apps/campaign-2026-money-rain/src/contracts/section.ts` 替换为与 Step 1.1.1 相同的内容。

（money-rain 版本已包含 `'disabled' | 'spinning'` 在 SectionStatus 中，保留这些。）

- [ ] **Step 1.1.3: 验证无编译错误**

```bash
cd /Users/q/work/ai/new-type-web
pnpm exec tsc --noEmit --pretty 2>&1 | head -30
```
Expected: 无类型错误（或仅与后续任务相关的预期错误）

---

### Task 1.2: 验证脚本 — 新检查项

**上下文:** 在现有 10 项检查基础上新增 #11-#15 五个检查项。同时添加 `--campaign` 参数支持指向任意 campaign。

**Files:**
- Modify: `scripts/section-validator/types.ts`
- Modify: `scripts/section-validator/parsers.ts`
- Modify: `scripts/section-validator/checks.ts`
- Modify: `scripts/validate-section.ts`

- [ ] **Step 1.2.1: 扩展 types.ts**

在 `scripts/section-validator/types.ts` 中新增类型：

```typescript
// 在现有类型后追加

/** 解析后的 StateTransition */
export interface ParsedTransition {
  from: string;
  to: string;
  trigger: {
    type: string;
    handler?: string;
    duration?: number;
  };
  animation?: {
    type: string;
    duration: number;
    easing?: string;
  };
}

/** 解析后的 Container 引用 */
export interface RuntimeAppInfo {
  /** app.tsx 中所有的 Container import */
  containerImports: string[];
  /** app.tsx 中所有的 Container JSX 标签 */
  containerTags: string[];
}

/** Cli 选项 */
export interface CliOptions {
  all: boolean;
  sectionName?: string;
  rootDir: string;
}
```

- [ ] **Step 1.2.2: 扩展 parsers.ts**

在 `scripts/section-validator/parsers.ts` 中新增解析函数：

```typescript
// 追加到文件末尾

/** 从 content.ts 源码中解析 stateTransitions */
export function parseStateTransitions(source: string): ParsedTransition[] {
  // 使用正则匹配: export const stateTransitions: StateTransition[] = [...]
  // 提取数组内容
  const match = source.match(/export\s+const\s+stateTransitions\s*[:=][\s\S]*?\]\s*as\s+const\s*;|export\s+const\s+stateTransitions\s*[:=][\s\S]*?\];/);
  if (!match) return [];
  
  try {
    // 将 TS 字面量转为可 eval 的形式（处理 as const）
    let arrStr = match[0]
      .replace(/export\s+const\s+stateTransitions\s*:\s*StateTransition\[\]\s*=\s*/, '')
      .replace(/export\s+const\s+stateTransitions\s*=\s*/, '')
      .replace(/\s*as\s+const\s*;/, ';')
      .replace(/;\s*$/, '');
    
    // 安全解析：提取每个对象的字段
    const transitions: ParsedTransition[] = [];
    const objRegex = /\{\s*from:\s*'([^']+)'\s*,\s*to:\s*'([^']+)'\s*,\s*trigger:\s*\{([^}]+)\}\s*(?:,\s*animation:\s*\{([^}]+)\})?\s*\}/g;
    let objMatch;
    while ((objMatch = objRegex.exec(arrStr)) !== null) {
      const triggerStr = objMatch[3];
      const trigger: ParsedTransition['trigger'] = { type: 'click' };
      
      const typeMatch = triggerStr.match(/type:\s*'([^']+)'/);
      if (typeMatch) trigger.type = typeMatch[1];
      
      const handlerMatch = triggerStr.match(/handler:\s*'([^']+)'/);
      if (handlerMatch) trigger.handler = handlerMatch[1];
      
      const durationMatch = triggerStr.match(/duration:\s*(\d+)/);
      if (durationMatch) trigger.duration = parseInt(durationMatch[1], 10);
      
      const t: ParsedTransition = {
        from: objMatch[1],
        to: objMatch[2],
        trigger,
      };
      
      if (objMatch[4]) {
        const animStr = objMatch[4];
        t.animation = {
          type: (animStr.match(/type:\s*'([^']+)'/) || [])[1] || 'none',
          duration: parseInt((animStr.match(/duration:\s*(\d+)/) || [])[1] || '0', 10),
        };
      }
      
      transitions.push(t);
    }
    
    return transitions;
  } catch {
    return [];
  }
}

/** 从 runtime/app.tsx 解析 Container 引用 */
export function parseRuntimeApp(source: string): RuntimeAppInfo {
  const imports: string[] = [];
  const tags: string[] = [];
  
  // 提取 import { XxxContainer } from '...'
  const importRegex = /import\s+\{\s*(\w+Container)\s*\}\s+from\s+['"]\.\/sections\/\w+['"]/g;
  let impMatch;
  while ((impMatch = importRegex.exec(source)) !== null) {
    imports.push(impMatch[1]);
  }
  
  // 提取 <XxxContainer /> 或 <XxxContainer> 标签
  const tagRegex = /<(\w+Container)\s*\/?\s*>/g;
  let tagMatch;
  while ((tagMatch = tagRegex.exec(source)) !== null) {
    tags.push(tagMatch[1]);
  }
  
  return { containerImports: imports, containerTags: tags };
}

/** 检查 index.tsx 中是否有分层违规（直接 import store/api/tracking） */
export function checkLayerViolations(source: string): string[] {
  const violations: string[] = [];
  
  // 检查 import useStore
  if (/import\s+\{[^}]*useStore[^}]*\}\s+from/.test(source)) {
    violations.push('直接 import useStore（应从 Container 通过 actions props 传递）');
  }
  
  // 检查 import store 默认导出
  if (/import\s+useStore\s+from/.test(source)) {
    violations.push('直接 import useStore（应从 Container 通过 actions props 传递）');
  }
  
  // 检查 import createRequest
  if (/import\s+\{[^}]*createRequest[^}]*\}\s+from/.test(source)) {
    violations.push('直接 import createRequest');
  }
  
  // 检查 import track / tracking
  if (/import\s+\{[^}]*track[^}]*\}\s+from.*tracking/.test(source)) {
    violations.push('直接 import tracking 埋点函数');
  }
  
  return violations;
}

/** 从 index.tsx 提取所有事件的绑定情况（onClick/onChange/onSubmit 等） */
export function parseEventHandlers(source: string): Array<{ event: string; handler: string }> {
  const handlers: Array<{ event: string; handler: string }> = [];
  
  // 匹配 onClick={xxx} / onClick={() => xxx} 等
  const eventRegex = /\s(on[A-Z][a-zA-Z]*)\s*=\s*\{([^}]+)\}/g;
  let match;
  while ((match = eventRegex.exec(source)) !== null) {
    handlers.push({
      event: match[1],
      handler: match[2].trim(),
    });
  }
  
  return handlers;
}
```

- [ ] **Step 1.2.3: 扩展 checks.ts 新增 #11-#15 检查**

在 `checks.ts` 中新增：

```typescript
// === #11 Runtime 注册检查 ===
function checkRuntimeAppRegistration(
  rootDir: string,
  baseName: string,
): CheckResult {
  const appFile = join(rootDir, 'runtime', 'app.tsx');
  if (!existsSync(appFile)) {
    return check({
      name: 'Runtime 注册',
      passed: false,
      errors: ['runtime/app.tsx 不存在'],
    });
  }
  
  const result = readFileSafe(appFile);
  if (!result.ok || !result.text) {
    return check({
      name: 'Runtime 注册',
      passed: false,
      errors: ['无法读取 runtime/app.tsx'],
    });
  }
  
  const info = parseRuntimeApp(result.text);
  const expectedImport = `${baseName}Container`;
  const expectedTag = `${baseName}Container`;
  
  const errors: string[] = [];
  if (!info.containerImports.includes(expectedImport)) {
    errors.push(`runtime/app.tsx 缺少 import: ${expectedImport}`);
  }
  if (!info.containerTags.includes(expectedTag)) {
    errors.push(`runtime/app.tsx 的 JSX 中缺少 <${expectedTag} />`);
  }
  
  return check({
    name: 'Runtime 注册',
    passed: errors.length === 0,
    errors,
  });
}

// === #12 stateTransitions 声明 ===
function checkStateTransitionsDeclaration(source: string): CheckResult {
  const transitions = parseStateTransitions(source);
  if (transitions.length === 0) {
    return check({
      name: 'stateTransitions 声明',
      passed: false,
      errors: ['content.ts 中未找到 stateTransitions 导出（至少需要声明交互状态的转换）'],
    });
  }
  return check({
    name: 'stateTransitions 声明',
    passed: true,
    errors: [],
  });
}

// === #13 声明完整性 ===
function checkStateTransitionCoverage(
  states: SupportedStateDecl[],
  source: string,
): CheckResult {
  const transitions = parseStateTransitions(source);
  const transitionKeys = new Set<string>();
  for (const t of transitions) {
    transitionKeys.add(t.from);
    transitionKeys.add(t.to);
  }
  
  const interactionStates = states.filter((s) => s.type === 'interaction');
  const errors: string[] = [];
  
  for (const s of interactionStates) {
    if (!transitionKeys.has(s.key)) {
      errors.push(`交互状态 "${s.key}" 在 stateTransitions 中未出现（既不是 from 也不是 to）`);
    }
  }
  
  for (const t of transitions) {
    const allKeys = new Set(states.map((s) => s.key));
    if (!allKeys.has(t.from)) {
      errors.push(`stateTransitions 的 from "${t.from}" 未在 supportedStates 中声明`);
    }
    if (!allKeys.has(t.to)) {
      errors.push(`stateTransitions 的 to "${t.to}" 未在 supportedStates 中声明`);
    }
  }
  
  return check({
    name: '声明完整性（stateTransitions ↔ supportedStates）',
    passed: errors.length === 0,
    errors,
  });
}

// === #14 状态可达性 ===
function checkStateReachability(
  states: SupportedStateDecl[],
  source: string,
): CheckResult {
  const transitions = parseStateTransitions(source);
  if (transitions.length === 0) {
    return check({
      name: '状态可达性',
      skipped: true,
      passed: true,
      errors: [],
    });
  }
  
  const interactionStates = states.filter((s) => s.type === 'interaction');
  if (interactionStates.length === 0) {
    return check({
      name: '状态可达性',
      skipped: true,
      passed: true,
      errors: [],
    });
  }
  
  // 构建邻接表
  const graph = new Map<string, string[]>();
  for (const s of interactionStates) {
    graph.set(s.key, []);
  }
  for (const t of transitions) {
    if (!graph.has(t.from)) graph.set(t.from, []);
    graph.get(t.from)!.push(t.to);
  }
  
  // 找到初始状态：from 从未作为任何转换的 to 出现
  const allTo = new Set(transitions.map((t) => t.to));
  const initialCandidates = interactionStates
    .filter((s) => !allTo.has(s.key))
    .map((s) => s.key);
  
  if (initialCandidates.length === 0) {
    return check({
      name: '状态可达性',
      passed: false,
      errors: ['无法确定初始状态（所有交互状态都出现在 stateTransitions 的 to 中）'],
    });
  }
  
  const initialState = initialCandidates[0];
  
  // BFS
  const visited = new Set<string>();
  const queue = [initialState];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const neighbors = graph.get(current) || [];
    for (const next of neighbors) {
      if (!visited.has(next)) queue.push(next);
    }
  }
  
  const unreachable = interactionStates
    .map((s) => s.key)
    .filter((key) => !visited.has(key));
  
  if (unreachable.length > 0) {
    return check({
      name: '状态可达性',
      passed: false,
      errors: [
        `以下状态不可达（从初始状态 "${initialState}" 出发无法到达）: ${unreachable.join(', ')}`,
      ],
    });
  }
  
  return check({
    name: '状态可达性',
    passed: true,
    errors: [],
  });
}

// === #15 分层违规检查 ===
function checkLayerBoundaries(
  sectionName: string,
  baseName: string,
  rootDir: string,
): CheckResult {
  const naming = buildSectionNaming(sectionName);
  const paths = resolveSectionPaths(rootDir, naming);
  
  if (!existsSync(paths.indexFile)) {
    return check({
      name: '分层边界检查',
      skipped: true,
      passed: true,
      errors: [],
    });
  }
  
  const result = readFileSafe(paths.indexFile);
  if (!result.ok || !result.text) {
    return check({
      name: '分层边界检查',
      passed: false,
      errors: ['无法读取 index.tsx'],
    });
  }
  
  const violations = checkLayerViolations(result.text);
  
  return check({
    name: '分层边界检查',
    passed: violations.length === 0,
    errors: violations,
  });
}
```

- [ ] **Step 1.2.4: 在 validateSection 中集成新检查**

在 `checks.ts` 的 `validateSection` 函数末尾（return 之前）添加：

```typescript
  // 11. Runtime 注册
  allChecks.push(checkRuntimeAppRegistration(rootDir, naming.baseName));
  
  // 12. stateTransitions 声明（contentSource 存在时）
  if (contentSource) {
    allChecks.push(checkStateTransitionsDeclaration(contentSource));
  } else {
    allChecks.push(check({
      name: 'stateTransitions 声明',
      skipped: true,
      passed: true,
      errors: [],
    }));
  }
  
  // 13. 声明完整性
  if (supportedStates && contentSource) {
    allChecks.push(checkStateTransitionCoverage(supportedStates, contentSource));
  } else {
    allChecks.push(check({
      name: '声明完整性',
      skipped: true,
      passed: true,
      errors: [],
    }));
  }
  
  // 14. 状态可达性
  if (supportedStates && contentSource) {
    allChecks.push(checkStateReachability(supportedStates, contentSource));
  } else {
    allChecks.push(check({
      name: '状态可达性',
      skipped: true,
      passed: true,
      errors: [],
    }));
  }
  
  // 15. 分层边界检查
  allChecks.push(checkLayerBoundaries(sectionName, naming.baseName, rootDir));
```

- [ ] **Step 1.2.5: 更新 validate-section.ts 支持 --campaign 参数**

修改 `validate-section.ts`，使其不硬编码 `campaign-template`：

```typescript
#!/usr/bin/env tsx
import { join } from 'path';
import { existsSync } from 'fs';
import { readFileSafe, discoverSectionNames } from './section-validator/discovery';
import { validateSection } from './section-validator/checks';
import { buildReport, printReport } from './section-validator/report';
import type { CliOptions } from './section-validator/types';

function parseArgs(argv: string[]): CliOptions & { campaign?: string } {
  let campaign = 'campaign-template';
  const remaining: string[] = [];
  
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--campaign' && i + 1 < argv.length) {
      campaign = argv[i + 1];
      i++;
    } else {
      remaining.push(argv[i]);
    }
  }
  
  const CAMPAIGN_SRC = join(process.cwd(), 'apps', campaign, 'src');
  
  if (!existsSync(CAMPAIGN_SRC)) {
    process.stderr.write(`ERROR: 活动目录不存在: ${CAMPAIGN_SRC}\n`);
    process.exit(2);
  }
  
  if (remaining.length === 0) {
    return { all: false, rootDir: CAMPAIGN_SRC, campaign };
  }
  if (remaining[0] === '--all') {
    return { all: true, rootDir: CAMPAIGN_SRC, campaign };
  }
  return { all: false, sectionName: remaining[0], rootDir: CAMPAIGN_SRC, campaign };
}

function fatal(message: string): never {
  process.stderr.write(`ERROR: ${message}\n`);
  process.exit(2);
}

async function main(argv = process.argv.slice(2)): Promise<void> {
  const options = parseArgs(argv);

  let sectionNames: string[];
  if (options.all) {
    sectionNames = discoverSectionNames(options.rootDir);
    if (sectionNames.length === 0) {
      fatal('未找到任何 Section（designer/sections/ 目录为空或不存在）');
    }
  } else if (options.sectionName) {
    sectionNames = [options.sectionName];
  } else {
    fatal('请指定 Section 名称（如 HeroSection）或使用 --all 验证全部');
  }

  const registryPath = join(options.rootDir, 'playground', 'section-registry.ts');
  const storePath = join(options.rootDir, 'integrations', 'store.ts');

  const registryResult = readFileSafe(registryPath);
  if (!registryResult.ok) {
    fatal(registryResult.error);
  }
  const storeResult = readFileSafe(storePath);
  if (!storeResult.ok) {
    fatal(storeResult.error);
  }

  const registrySource = registryResult.ok ? registryResult.text : '';
  const storeSource = storeResult.ok ? storeResult.text : '';

  const results = sectionNames.map((name) =>
    validateSection(name, options.rootDir, registrySource, storeSource),
  );

  const report = buildReport(
    options.all ? 'all' : options.sectionName!,
    results,
  );
  process.stdout.write(printReport(report) + '\n');

  if (report.summary.failedSections > 0 || report.summary.failedChecks > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  fatal(String(e));
});
```

- [ ] **Step 1.2.6: 验证脚本能运行**

```bash
cd /Users/q/work/ai/new-type-web
pnpm validate-section --campaign campaign-template --all
```
Expected: 运行成功，显示报告（可能有预期内的检查失败）

---

### Task 1.3: Playground 增强 — defaultActions + 交互状态切换

**上下文:** 当前 Playground 不传递 actions props，组件交互在预览中不可用。需要支持 defaultActions 注册和传递。

**Files:**
- Modify: `apps/campaign-template/src/playground/types.ts`
- Modify: `apps/campaign-2026-money-rain/src/playground/types.ts`
- Modify: `apps/campaign-template/src/playground/SectionPanel.tsx`
- Modify: `apps/campaign-2026-money-rain/src/playground/SectionPanel.tsx`

- [ ] **Step 1.3.1: 扩展 PlaygroundSection 类型**

在两个 `types.ts` 中（template 和 money-rain），新增 `defaultActions` 字段：

```typescript
export interface PlaygroundSection {
  id: string;
  name: string;
  component: ComponentType<any>;
  defaultContent: Record<string, unknown>;
  /** 新增：Playground 中使用的 mock actions */
  defaultActions?: Record<string, unknown>;
  stateViews: Partial<
    Record<SectionStatus, ComponentType<{ message?: string }>>
  >;
}
```

- [ ] **Step 1.3.2: 更新 SectionPanel 传递 actions**

在两个 `SectionPanel.tsx` 中，修改渲染逻辑：

```typescript
// 第 25 行附近，修改 renderContent
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
  // 传递 defaultActions 到组件
  return (
    <section.component
      content={section.defaultContent}
      actions={section.defaultActions}
    />
  );
};
```

---

### Task 1.4: WheelSection 重构

**上下文:** WheelSection 当前 `index.tsx` 直接 `import { useStore }`，违规且无法在 Playground 中工作。重构为 actions props 模式：spinning 状态由本地 useState 管理，点击通过 actions.onSpin 通知。

**Files:**
- Modify: `apps/campaign-2026-money-rain/src/designer/sections/WheelSection/types.ts`
- Modify: `apps/campaign-2026-money-rain/src/designer/sections/WheelSection/content.ts`
- Modify: `apps/campaign-2026-money-rain/src/designer/sections/WheelSection/index.tsx`
- Keep: `apps/campaign-2026-money-rain/src/designer/sections/WheelSection/states.tsx`（无需改动）
- Modify: `apps/campaign-2026-money-rain/src/runtime/sections/WheelContainer.tsx`
- Modify: `apps/campaign-2026-money-rain/src/playground/section-registry.ts`

- [ ] **Step 1.4.1: 更新 types.ts**

```typescript
export interface WheelPrize {
  label: string;
  color: string;
}

export interface WheelContent {
  prizes: WheelPrize[];
  baseAmount: number;
}

/** WheelSection 的 actions */
export interface WheelActions {
  /** 点击 GO 按钮触发抽奖 */
  onSpin: () => void;
  /** 动画结束，展示结果 */
  onSpinComplete: () => void;
  /** 重置/关闭结果 */
  onReset: () => void;
}
```

- [ ] **Step 1.4.2: 重写 content.ts**

```typescript
import type { WheelContent } from './types';
import type { StateDeclaration, StateTransition } from '../../../contracts/section';

export const supportedStates: StateDeclaration[] = [
  { key: 'loading',    type: 'ui',          required: true },
  { key: 'empty',      type: 'ui',          required: true },
  { key: 'error',      type: 'ui',          required: true },
  { key: 'idle',       type: 'interaction', required: true },
  { key: 'spinning',   type: 'interaction', required: true },
  { key: 'result',     type: 'interaction', required: true },
] as const;

export const stateTransitions: StateTransition[] = [
  {
    from: 'idle',
    to: 'spinning',
    trigger: { type: 'click', handler: 'onSpin' },
    animation: { type: 'spin', duration: 3000, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
    description: '点击 GO 按钮，转盘旋转 3 秒',
  },
  {
    from: 'spinning',
    to: 'result',
    trigger: { type: 'timeout', duration: 3000 },
    description: '旋转动画结束后展示结果',
  },
  {
    from: 'result',
    to: 'idle',
    trigger: { type: 'click', handler: 'onReset' },
    description: '点击关闭/重置按钮回到初始状态',
  },
];

export const stateData: Record<string, Partial<WheelContent>> = {
  loading: {},
  empty: { prizes: [], baseAmount: 0 },
  error: { prizes: [], baseAmount: 0 },
  idle: {
    prizes: [
      { label: 'x100', color: '#FFD700' },
      { label: 'x300', color: '#1a3a1a' },
      { label: 'x500', color: '#FFD700' },
      { label: '20%', color: '#1a3a1a' },
      { label: '10%', color: '#FFD700' },
      { label: '30%', color: '#1a3a1a' },
      { label: '?', color: '#FFD700' },
      { label: '道具', color: '#1a3a1a' },
    ],
    baseAmount: 15000,
  },
  spinning: {
    prizes: [
      { label: 'x100', color: '#FFD700' },
      { label: 'x300', color: '#1a3a1a' },
      { label: 'x500', color: '#FFD700' },
      { label: '20%', color: '#1a3a1a' },
      { label: '10%', color: '#FFD700' },
      { label: '30%', color: '#1a3a1a' },
      { label: '?', color: '#FFD700' },
      { label: '道具', color: '#1a3a1a' },
    ],
    baseAmount: 15000,
  },
  result: {
    prizes: [
      { label: 'x100', color: '#FFD700' },
      { label: 'x300', color: '#1a3a1a' },
      { label: 'x500', color: '#FFD700' },
      { label: '20%', color: '#1a3a1a' },
      { label: '10%', color: '#FFD700' },
      { label: '30%', color: '#1a3a1a' },
      { label: '?', color: '#FFD700' },
      { label: '道具', color: '#1a3a1a' },
    ],
    baseAmount: 15000,
  },
};

export const defaultContent: WheelContent = {
  prizes: [
    { label: 'x100', color: '#FFD700' },
    { label: 'x300', color: '#1a3a1a' },
    { label: 'x500', color: '#FFD700' },
    { label: '20%', color: '#1a3a1a' },
    { label: '10%', color: '#FFD700' },
    { label: '30%', color: '#1a3a1a' },
    { label: '?', color: '#FFD700' },
    { label: '道具', color: '#1a3a1a' },
  ],
  baseAmount: 15000,
};
```

- [ ] **Step 1.4.3: 重写 index.tsx**

```typescript
import { useState, useRef, useCallback } from 'react';
import type { SectionProps } from '../../../contracts/section';
import type { WheelContent, WheelActions } from './types';

type WheelPhase = 'idle' | 'spinning' | 'result';

export function WheelSection({ content, actions }: SectionProps<WheelContent, WheelActions>) {
  const { prizes, baseAmount } = content;
  const [phase, setPhase] = useState<WheelPhase>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const segmentAngle = 360 / prizes.length;

  const gradientStops = prizes.map((prize, i) => {
    const startDeg = i * segmentAngle;
    const endDeg = (i + 1) * segmentAngle;
    return `${prize.color} ${startDeg}deg ${endDeg}deg`;
  });
  const conicGradient = `conic-gradient(${gradientStops.join(', ')})`;

  const handleGo = useCallback(() => {
    if (phase !== 'idle') return;
    setPhase('spinning');
    actions?.onSpin();

    timerRef.current = setTimeout(() => {
      setPhase('result');
      actions?.onSpinComplete();
    }, 3000);
  }, [phase, actions]);

  const handleReset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPhase('idle');
    actions?.onReset();
  }, [actions]);

  // spinning 和 result 状态下禁用点击
  const isInteractive = phase === 'idle';

  return (
    <div className="w-full flex flex-col items-center" data-testid="wheel-section">
      <h2 className="text-[28px] font-black mb-[24px]"
        style={{ color: '#FFD700' }}
      >
        暴击转盘
      </h2>

      <div className="relative w-[340px] h-[340px] mx-auto" data-testid="wheel">
        {/* 指针 */}
        <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 z-10"
          style={{
            width: '0',
            height: '0',
            borderLeft: '15px solid transparent',
            borderRight: '15px solid transparent',
            borderTop: '20px solid #FFD700',
          }}
        />

        {/* 转盘 */}
        <div
          data-testid="wheel-disk"
          className={`w-[340px] h-[340px] rounded-full overflow-hidden relative ${phase === 'spinning' ? 'animate-spin-wheel' : ''}`}
          style={{
            background: conicGradient,
            transition: phase === 'result' ? 'transform 0.3s ease-out' : 'none',
          }}
        >
          {prizes.map((prize, i) => {
            const angle = i * segmentAngle + segmentAngle / 2;
            const rad = (angle * Math.PI) / 180;
            const radius = 120;
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;

            return (
              <div
                key={i}
                className="absolute text-white font-bold text-sm whitespace-nowrap"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${angle}deg)`,
                }}
              >
                {prize.label}
              </div>
            );
          })}

          {/* GO 按钮 — 仅在 idle 时可点击 */}
          <div
            data-testid="wheel-go-button"
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60px] h-[60px] rounded-full flex items-center justify-center text-black font-black text-xs
              ${isInteractive ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
            style={{ background: '#FFD700' }}
            onClick={handleGo}
          >
            {phase === 'spinning' ? '...' : phase === 'result' ? '✓' : 'GO'}
          </div>
        </div>
      </div>

      {/* 结果展示 */}
      {phase === 'result' && (
        <div className="mt-[20px] flex flex-col items-center gap-[12px]">
          <p className="text-white text-base">恭喜获得奖励!</p>
          <button
            data-testid="wheel-reset-button"
            className="px-[30px] py-[8px] rounded-full text-sm font-bold"
            style={{ background: '#FFD700', color: '#3c0500' }}
            onClick={handleReset}
          >
            再来一次
          </button>
        </div>
      )}

      {/* 信息提示 */}
      {phase === 'idle' && (
        <>
          <p className="text-white/70 text-sm mt-[20px] text-center">
            本次暴击的返币倍数的基数为 {baseAmount}
          </p>
          <p className="text-xs mt-[8px] text-center" style={{ color: '#FFD700' }}>
            点击暴击按钮旋转转盘
          </p>
        </>
      )}

      <style>{`
        @keyframes spinWheel {
          from { transform: rotate(0deg); }
          to { transform: rotate(1080deg); }
        }
        .animate-spin-wheel {
          animation: spinWheel 3s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 1.4.4: 更新 WheelContainer.tsx**

```typescript
import { useCallback } from 'react';
import { useStore } from '../../integrations/store';
import { WheelSection } from '../../designer/sections/WheelSection';
import { WheelLoading, WheelEmpty, WheelError } from '../../designer/sections/WheelSection/states';
import type { WheelActions } from '../../designer/sections/WheelSection/types';

export function WheelContainer() {
  const data = useStore((s) => s.wheel);
  const drawCrit = useStore((s) => s.drawCrit);
  const resetCrit = useStore((s) => s.resetCrit);

  const actions: WheelActions = {
    onSpin: useCallback(() => drawCrit(), [drawCrit]),
    onSpinComplete: useCallback(() => {
      // store 中的 drawCrit 已经在 3s 后自动更新结果
      // 此处可触发弹窗等副作用
    }, []),
    onReset: useCallback(() => resetCrit(), [resetCrit]),
  };

  switch (data.status) {
    case 'loading': return <WheelLoading />;
    case 'error': return <WheelError />;
    case 'empty': return <WheelEmpty />;
    case 'ready': return <WheelSection content={data.content!} actions={actions} />;
  }
}
```

- [ ] **Step 1.4.5: 更新 store.ts 的 drawCrit**

当前 `store.ts` 中的 `drawCrit` 直接操作 `wheel.content.spinning`。重构后 spinning 由组件本地管理，store 只需负责数据和次数扣减：

```typescript
// 在 store.ts 的 drawCrit 方法中，移除 spinning 的直接操作：
drawCrit: async () => {
  const { lottery, drawing } = get();
  if (drawing) return;
  if (lottery.usedCount >= lottery.dailyQuota) return;

  set({ drawing: true });

  await new Promise((r) => setTimeout(r, 3000));

  const multipliers = ['x100', 'x300', 'x500'];
  const percents = ['10%', '20%', '30%'];
  const items = ['金砖×30天', '钻石×7天'];
  const all = [...multipliers, ...percents, ...items, '?'];
  const prize = all[Math.floor(Math.random() * all.length)];
  const isWin = prize !== '?';

  const newUsed = lottery.usedCount + 1;
  const remaining = Math.max(0, lottery.dailyQuota - newUsed);

  set({
    drawing: false,
    showPrizeModal: true,
    crit: {
      status: 'ready',
      content: { remainingHits: remaining, maxHits: lottery.dailyQuota, disabled: remaining <= 0 },
    },
    lottery: { ...lottery, usedCount: newUsed, lastResult: { prize, isWin } },
    broadcast: {
      status: 'ready',
      content: {
        messages: [{ user: '我', content: `获得了${prize}` }, ...get().broadcast.content!.messages],
      },
    },
  });
},
```

- [ ] **Step 1.4.6: 更新 section-registry.ts**

在 money-rain 的 `section-registry.ts` 中，为 WheelSection 添加 `defaultActions`：

```typescript
{
  id: 'wheel',
  name: 'WheelSection',
  component: WheelSection,
  defaultContent: wheelContent as unknown as Record<string, unknown>,
  defaultActions: {
    onSpin: () => console.log('[Playground] 点击抽奖'),
    onSpinComplete: () => console.log('[Playground] 动画结束'),
    onReset: () => console.log('[Playground] 重置'),
  },
  stateViews: {
    loading: WheelLoading,
    empty: WheelEmpty,
    error: WheelError,
    spinning: WheelSpinning,
  },
},
```

---

### Task 1.5: CritSection 重构

**上下文:** CritSection 同样直接使用 `useStore`。需要改为 actions props 模式。

**Files:**
- Modify: `apps/campaign-2026-money-rain/src/designer/sections/CritSection/types.ts`
- Modify: `apps/campaign-2026-money-rain/src/designer/sections/CritSection/content.ts`
- Modify: `apps/campaign-2026-money-rain/src/designer/sections/CritSection/index.tsx`
- Modify: `apps/campaign-2026-money-rain/src/runtime/sections/CritContainer.tsx`
- Modify: `apps/campaign-2026-money-rain/src/playground/section-registry.ts`

- [ ] **Step 1.5.1: 更新 types.ts**

```typescript
export interface CritContent {
  remainingHits: number;
  maxHits: number;
  disabled: boolean;
}

export interface CritActions {
  onCrit: () => void;
}
```

- [ ] **Step 1.5.2: 更新 content.ts**

```typescript
import type { CritContent } from './types';
import type { StateDeclaration, StateTransition } from '../../../contracts/section';

export const supportedStates: StateDeclaration[] = [
  { key: 'loading',    type: 'ui',          required: true },
  { key: 'empty',      type: 'ui',          required: true },
  { key: 'error',      type: 'ui',          required: true },
  { key: 'active',     type: 'interaction', required: true },
  { key: 'disabled',   type: 'interaction', required: true },
] as const;

export const stateTransitions: StateTransition[] = [
  {
    from: 'active',
    to: 'disabled',
    trigger: { type: 'click', handler: 'onCrit' },
    description: '点击暴击按钮消耗次数，次数归零后变为 disabled',
  },
];

export const stateData: Record<string, Partial<CritContent>> = {
  loading: {},
  empty: {},
  error: {},
  active: { remainingHits: 5, maxHits: 5, disabled: false },
  disabled: { remainingHits: 0, maxHits: 5, disabled: true },
};

export const defaultContent: CritContent = {
  remainingHits: 5,
  maxHits: 5,
  disabled: false,
};
```

- [ ] **Step 1.5.3: 重写 index.tsx**

```typescript
import type { SectionProps } from '../../../contracts/section';
import type { CritContent, CritActions } from './types';

export function CritSection({ content, actions }: SectionProps<CritContent, CritActions>) {
  const isDisabled = content.disabled || content.remainingHits <= 0;

  return (
    <div className="relative flex flex-col items-center mb-[30px] py-8">
      <div className="absolute top-0 left-[50px] w-8 h-8 border-t-2 border-l-2 border-yellow-500/40 rounded-tl-lg" />
      <div className="absolute top-0 right-[50px] w-8 h-8 border-t-2 border-r-2 border-yellow-500/40 rounded-tr-lg" />
      <div className="absolute bottom-0 left-[50px] w-8 h-8 border-b-2 border-l-2 border-yellow-500/40 rounded-bl-lg" />
      <div className="absolute bottom-0 right-[50px] w-8 h-8 border-b-2 border-r-2 border-yellow-500/40 rounded-br-lg" />

      <button
        data-testid="crit-button"
        className={`w-[180px] h-[180px] rounded-full flex items-center justify-center mx-auto transition-transform active:scale-95 ${
          isDisabled
            ? 'bg-gray-600 border-4 border-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 border-4 border-yellow-300 animate-pulse'
        }`}
        style={!isDisabled ? {
          boxShadow: '0 0 30px rgba(255,215,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
        } : undefined}
        disabled={isDisabled}
        onClick={() => !isDisabled && actions?.onCrit()}
      >
        <span
          className={`font-black text-[42px] ${
            isDisabled ? 'text-gray-400' : 'text-[#3c0500]'
          }`}
        >
          暴击
        </span>
      </button>

      <div className="text-[24px] text-white mt-4 text-center">
        剩余{' '}
        <span className="text-[#ffe45a] font-bold text-[28px]">
          {isDisabled ? 0 : content.remainingHits}
        </span>{' '}
        次
      </div>

      {isDisabled && (
        <div className="text-[20px] text-gray-400 mt-1">已用完</div>
      )}
    </div>
  );
}
```

- [ ] **Step 1.5.4: 更新 CritContainer.tsx**

```typescript
import { useStore } from '../../integrations/store';
import { CritSection } from '../../designer/sections/CritSection';
import { CritLoading, CritEmpty, CritError, CritDisabled } from '../../designer/sections/CritSection/states';
import type { CritActions } from '../../designer/sections/CritSection/types';

export function CritContainer() {
  const data = useStore((s) => s.crit);
  const drawCrit = useStore((s) => s.drawCrit);

  const actions: CritActions = {
    onCrit: () => drawCrit(),
  };

  switch (data.status) {
    case 'loading': return <CritLoading />;
    case 'error': return <CritError />;
    case 'empty': return <CritEmpty />;
    case 'ready': return <CritSection content={data.content!} actions={actions} />;
  }
}
```

- [ ] **Step 1.5.5: 更新 section-registry.ts**

```typescript
{
  id: 'crit',
  name: 'CritSection',
  component: CritSection,
  defaultContent: critContent as unknown as Record<string, unknown>,
  defaultActions: {
    onCrit: () => alert('[Playground] 暴击!'),
  },
  stateViews: {
    loading: CritLoading,
    empty: CritEmpty,
    error: CritError,
    disabled: CritDisabled,
  },
},
```

---

### Task 1.6: RewardTierSection 增强

**上下文:** RewardTierSection 已经是纯组件（无 store 依赖），但缺少 stateTransitions 声明、缺少切换动画。

**Files:**
- Modify: `apps/campaign-2026-money-rain/src/designer/sections/RewardTierSection/types.ts`
- Modify: `apps/campaign-2026-money-rain/src/designer/sections/RewardTierSection/content.ts`
- Modify: `apps/campaign-2026-money-rain/src/designer/sections/RewardTierSection/index.tsx`

- [ ] **Step 1.6.1: 更新 content.ts — 补 stateTransitions**

```typescript
import type { RewardTierContent } from './types';
import type { StateDeclaration, StateTransition } from '../../../contracts/section';

export const supportedStates: StateDeclaration[] = [
  { key: 'loading',    type: 'ui',          required: true },
  { key: 'empty',      type: 'ui',          required: true },
  { key: 'error',      type: 'ui',          required: true },
  { key: 'idle',       type: 'interaction', required: true },
  { key: 'switching',  type: 'interaction', required: true },
] as const;

export const stateTransitions: StateTransition[] = [
  {
    from: 'idle',
    to: 'switching',
    trigger: { type: 'click', handler: 'onSwitchLeft/onSwitchRight/onDotClick' },
    animation: { type: 'slide', duration: 300 },
    description: '点击左右箭头或指示点切换档位',
  },
  {
    from: 'switching',
    to: 'idle',
    trigger: { type: 'animationend' },
    animation: { type: 'slide', duration: 300 },
    description: '切换动画完成后回到 idle',
  },
];

export const stateData: Record<string, Partial<RewardTierContent>> = {
  loading: { tiers: [], currentIndex: 0 },
  empty: { tiers: [], currentIndex: 0 },
  error: { tiers: [], currentIndex: 0 },
  idle: {
    tiers: [
      { tier: '50K', coinAmount: 5000, items: [{ name: '豪华跑车', days: 7 }], claimed: false },
      { tier: '80K', coinAmount: 8000, items: [{ name: '皇家座驾', days: 10 }], claimed: false },
      { tier: '500K', coinAmount: 50000, items: [{ name: '黄金翅膀', days: 15 }], claimed: false },
    ],
    currentIndex: 0,
  },
  switching: {
    tiers: [
      { tier: '50K', coinAmount: 5000, items: [{ name: '豪华跑车', days: 7 }], claimed: false },
      { tier: '80K', coinAmount: 8000, items: [{ name: '皇家座驾', days: 10 }], claimed: false },
      { tier: '500K', coinAmount: 50000, items: [{ name: '黄金翅膀', days: 15 }], claimed: false },
    ],
    currentIndex: 0,
  },
};

// ... rest stays same
```

- [ ] **Step 1.6.2: 重写 index.tsx — 添加切换动画**

```typescript
import { useState, useCallback } from 'react';
import type { SectionProps } from '../../../contracts/section';
import type { RewardTierContent } from './types';

export function RewardTierSection({ content }: SectionProps<RewardTierContent>) {
  const { tiers } = content;
  const [currentIndex, setCurrentIndex] = useState(content.currentIndex ?? 0);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right');
  const [isAnimating, setIsAnimating] = useState(false);

  const currentTier = tiers[currentIndex] ?? tiers[0];

  if (!currentTier) return null;

  const switchTo = useCallback((idx: number, dir: 'left' | 'right') => {
    if (isAnimating) return;
    if (idx < 0 || idx >= tiers.length) return;
    if (idx === currentIndex) return;

    setSlideDir(dir);
    setIsAnimating(true);
    setCurrentIndex(idx);

    // 动画结束后重置
    setTimeout(() => setIsAnimating(false), 300);
  }, [currentIndex, tiers.length, isAnimating]);

  const handlePrev = useCallback(() => {
    switchTo(currentIndex - 1, 'left');
  }, [currentIndex, switchTo]);

  const handleNext = useCallback(() => {
    switchTo(currentIndex + 1, 'right');
  }, [currentIndex, switchTo]);

  return (
    <section className="relative flex flex-col items-center py-[30px]">
      {/* 标题 */}
      <div className="w-[630px] flex items-center justify-center mb-[20px]">
        <h2 className="text-[32px] font-black text-center" style={{ color: '#ffe45a' }}>
          奖励档位
        </h2>
      </div>

      {/* 卡片主体 */}
      <div className="relative w-[630px] rounded-2xl p-[30px] overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #ffd736' }}
      >
        {/* 左箭头 */}
        <div
          data-testid="reward-tier-prev"
          className={`absolute top-1/2 -translate-y-1/2 left-[30px] w-[64px] h-[64px] flex items-center justify-center cursor-pointer z-10 transition-opacity duration-200
            ${currentIndex <= 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:scale-110'}`}
          onClick={handlePrev}
        >
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" fill="rgba(0,0,0,0.5)" stroke="#ffd736" strokeWidth="1" />
            <path d="M38 20L26 32L38 44" stroke="#ffd736" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* 右箭头 */}
        <div
          data-testid="reward-tier-next"
          className={`absolute top-1/2 -translate-y-1/2 right-[30px] w-[64px] h-[64px] flex items-center justify-center cursor-pointer z-10 transition-opacity duration-200
            ${currentIndex >= tiers.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:scale-110'}`}
          onClick={handleNext}
        >
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ transform: 'scaleX(-1)' }}>
            <circle cx="32" cy="32" r="30" fill="rgba(0,0,0,0.5)" stroke="#ffd736" strokeWidth="1" />
            <path d="M38 20L26 32L38 44" stroke="#ffd736" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* 卡片内容 — 带滑动动画 */}
        <div
          key={currentIndex}
          className="transition-all duration-300 ease-in-out"
          style={{
            transform: isAnimating
              ? `translateX(${slideDir === 'right' ? '20px' : '-20px'})`
              : 'translateX(0)',
            opacity: isAnimating ? 0.5 : 1,
          }}
        >
          {/* 档位头部 */}
          <div className="flex items-center justify-center gap-[10px] mb-[20px]">
            <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ffe45a, #ffd736)' }}
            >
              <span className="text-[24px] font-black" style={{ color: '#3c0500' }}>¥</span>
            </div>
            <span className="text-[42px] font-black" style={{ color: '#ffe45a' }}>
              {currentTier.tier}
            </span>
          </div>

          {/* 金币数量 */}
          <div className="text-center mb-[24px]">
            <span className="text-[36px] font-black" style={{ color: '#ffdc5c' }}>
              {currentTier.coinAmount.toLocaleString()}
            </span>
            <span className="text-[20px] font-medium ml-[6px]" style={{ color: '#ffd736' }}>
              金币
            </span>
          </div>

          {/* 奖品网格 */}
          <div className="grid grid-cols-3 gap-[30px] mb-[30px]">
            {currentTier.items.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="w-[160px] h-[160px] flex items-center justify-center rounded-lg mb-[8px]"
                  style={{ background: 'rgba(255, 215, 54, 0.1)' }}
                >
                  <span className="text-[40px]" style={{ color: '#ffd736' }}>🎁</span>
                </div>
                <p className="w-[160px] text-center text-[16px] leading-[20px]"
                  style={{ color: 'rgba(255,255,255,0.8)' }}
                >
                  {item.name}
                </p>
                {item.days && (
                  <div className="w-[64px] h-[32px] rounded-[20px] flex items-center justify-center mt-[6px]"
                    style={{
                      border: '1px solid #ffd736',
                      background: 'linear-gradient(135deg, rgba(255,228,90,0.2), rgba(255,215,54,0.1))',
                      boxShadow: 'inset 0 0 6px 2px rgba(255,255,255,0.5)',
                    }}
                  >
                    <span className="text-[16px] font-black" style={{ color: '#ffe45a' }}>
                      {item.days}D
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 充值按钮 */}
          <div className="flex justify-center">
            {currentTier.claimed ? (
              <div className="w-[460px] h-[100px] rounded-[60px] flex items-center justify-center"
                style={{ background: 'rgba(128,128,128,0.3)', border: '1px solid rgba(128,128,128,0.5)' }}
              >
                <span className="text-[32px] font-black" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  已领取
                </span>
              </div>
            ) : (
              <div className="w-[460px] h-[100px] rounded-[60px] flex items-center justify-center cursor-pointer"
                style={{
                  background: 'linear-gradient(180deg, #f9ffb8 0%, #fbff65 45%, #ffaf15 100%)',
                  border: '3px solid transparent',
                  borderImage: 'linear-gradient(180deg, #ffffff 0%, #ffa116 48%, #c86000 100%) 1',
                  boxShadow: '0 4px 0 #cb6e00, inset 0 4px 4px rgba(255,255,255,0.6)',
                }}
              >
                <span className="text-[32px] font-black" style={{ color: '#3c0500' }}>
                  充值
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 指示点 */}
      <div className="flex items-center justify-center gap-[10px] mt-[20px]">
        {tiers.map((_, idx) => (
          <div
            key={idx}
            data-testid={`reward-tier-dot-${idx}`}
            className="w-[12px] h-[12px] rounded-full transition-all duration-200 cursor-pointer"
            style={{
              background: idx === currentIndex ? '#ffe45a' : 'rgba(255,255,255,0.3)',
              transform: idx === currentIndex ? 'scale(1.3)' : 'scale(1)',
            }}
            onClick={() => {
              const dir = idx > currentIndex ? 'right' : 'left';
              switchTo(idx, dir);
            }}
          />
        ))}
      </div>
    </section>
  );
}
```

---

### Task 1.7: 更新文档

**Files:**
- Modify: `agents/designer.md`
- Modify: `agents/shared/DESIGN_OUTPUT.md`
- Modify: `docs/ai/development-rules.md`

- [ ] **Step 1.7.1: 更新 designer.md**

在 `designer.md` 中更新 Step 4 的工作流：

1. Step 4 改为**垂直切片循环**模式，说明每个 Section 生成后自动运行 validate 检查
2. 更新**反馈系统核心约定**章节，加入 stateTransitions 声明要求
3. 更新验证命令为 `pnpm validate-section --campaign <name> <SectionName>`

- [ ] **Step 1.7.2: 更新 DESIGN_OUTPUT.md**

1. 在「状态声明要求」章节加入 `stateTransitions` 声明规范
2. 加入交互状态（interaction）的声明示例
3. 更新四文件约束说明

- [ ] **Step 1.7.3: 更新 development-rules.md**

在「Section 四文件约定」和「验证」章节补充新检查项说明。

---

## 验收标准

Phase 1 完成后：

1. ✅ `pnpm validate-section --campaign campaign-2026-money-rain WheelSection` 通过全部 15 项检查
2. ✅ `pnpm validate-section --campaign campaign-2026-money-rain CritSection` 通过全部检查
3. ✅ `pnpm validate-section --campaign campaign-2026-money-rain RewardTierSection` 通过全部检查
4. ✅ Playground 中 WheelSection 点击 GO 可看到旋转动画，3s 后显示"再来一次"按钮
5. ✅ Playground 中 CritSection 点击"暴击"按钮触发 alert
6. ✅ Playground 中 RewardTierSection 切换档位有滑动动画
7. ✅ WheelSection index.tsx 无 `useStore` import
8. ✅ CritSection index.tsx 无 `useStore` import
9. ✅ `pnpm exec tsc --noEmit --pretty` 无类型错误
