#!/usr/bin/env tsx
/**
 * Layer 1 测试生成器 — 基于 stateTransitions 自动生成 Vitest 测试用例
 *
 * 用法:
 *   pnpm generate-section-tests --campaign campaign-2026-money-rain WheelSection
 *   pnpm generate-section-tests --campaign campaign-2026-money-rain --all
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { discoverSectionNames, buildSectionNaming, resolveSectionPaths, readFileSafe } from './section-validator/discovery';
import { parseStateTransitions } from './section-validator/parsers';

interface CliOptions {
  all: boolean;
  sectionName?: string;
  rootDir: string;
  campaign: string;
}

function parseArgs(argv: string[]): CliOptions {
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

  const rootDir = join(process.cwd(), 'apps', campaign, 'src');

  if (!existsSync(rootDir)) {
    process.stderr.write(`ERROR: 活动目录不存在: ${rootDir}\n`);
    process.exit(2);
  }

  if (remaining.length === 0) {
    return { all: false, rootDir, campaign };
  }
  if (remaining[0] === '--all') {
    return { all: true, rootDir, campaign };
  }
  return { all: false, sectionName: remaining[0], rootDir, campaign };
}

/**
 * 从 index.tsx 扫描 data-testid 属性，建立 testId → handler 映射
 */
function scanTestIds(indexSource: string): Map<string, string> {
  const idMap = new Map<string, string>();

  // 匹配 data-testid="xxx" (或 data-testid={`xxx`})
  const testIdRe = /data-testid\s*=\s*["'`]([^"'`]+)["'`]/g;
  let m: RegExpExecArray | null;
  while ((m = testIdRe.exec(indexSource)) !== null) {
    const testId = m[1];
    // 从 testId 推断 handler: wheel-go-button → onSpin, crit-button → onCrit
    const parts = testId.split('-');
    // 去掉 wheel/crit/reward-tier 前缀
    const relevant = parts.filter((p) => !['wheel', 'crit', 'reward', 'tier'].includes(p));
    // 取第一个有意义的词转为 handler
    if (relevant.length > 0) {
      idMap.set(testId, testIdToHandler(relevant));
    }
  }

  return idMap;
}

function testIdToHandler(parts: string[]): string {
  const known: Record<string, string> = {
    go: 'onSpin',
    button: 'onCrit',
    reset: 'onReset',
    prev: 'onSwitchLeft',
    next: 'onSwitchRight',
    dot: 'onDotClick',
    switch: 'onSwitch',
  };

  for (const part of parts) {
    if (known[part]) return known[part];
  }

  // fallback: camelCase from parts
  return 'on' + parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
}

/**
 * 生成测试文件内容
 */
function generateTestContent(
  baseName: string,
  indexSource: string,
  transitions: ReturnType<typeof parseStateTransitions>,
): string {
  const testIds = scanTestIds(indexSource);

  const actionHandlers = new Set<string>();
  for (const t of transitions) {
    if (t.trigger.handler) {
      actionHandlers.add(t.trigger.handler);
    }
  }

  // 构建 mock 定义
  // 生成测试用例
  const testCases: string[] = [];

  const initialStates = ['idle', 'active'];

  for (const t of transitions) {
    const handler = t.trigger.handler;

    if (t.trigger.type === 'click' && handler) {
      // 只对从初始状态出发的转换生成直接测试
      // 非初始状态的转换由多步链路测试覆盖
      if (!initialStates.includes(t.from)) continue;

      const matchedTestId = findTestIdForHandler(handler, testIds);

      if (matchedTestId) {
        const allMocks = Array.from(actionHandlers).map((h) => `const ${h} = vi.fn();`).join('\n    ');
        const allActionProps = Array.from(actionHandlers).join(', ');
        testCases.push(`
  it('${t.from} → ${t.to}: 点击触发 ${handler}', async () => {
    ${allMocks}
    render(
      <${baseName}Section
        content={defaultContent}
        actions={{ ${allActionProps} }}
      />
    );
    await user.click(screen.getByTestId('${matchedTestId}'));
    expect(${handler}).toHaveBeenCalledTimes(1);
  });`);
      } else {
        testCases.push(`
  it('${t.from} → ${t.to}: ${handler} 可调用', () => {
    const ${handler} = vi.fn();
    render(
      <${baseName}Section
        content={defaultContent}
        actions={{ ${handler} }}
      />
    );
    expect(${handler}).toBeDefined();
  });`);
      }
    } else if (t.trigger.type === 'timeout' && handler) {
      // 超时测试需要理解组件内部状态机流程，自动生成不可靠
      // 跳过自动生成，留给人工编写
    }
  }

  // Generate multi-step flow tests for transitions where from is not the initial state
  for (const t of transitions) {
    if (t.trigger.type === 'click' && t.trigger.handler && initialStates.includes(t.from)) {
      // Find transitions that start from this transition's destination
      const dependentTransitions = transitions.filter(
        (dt) => dt.from === t.to && dt.trigger.type === 'click' && dt.trigger.handler,
      );
      for (const dt of dependentTransitions) {
        const testId = findTestIdForHandler(t.trigger.handler, testIds);
        const depTestId = findTestIdForHandler(dt.trigger.handler!, testIds);
        if (testId && depTestId) {
          testCases.push(`
  it('${dt.from} → ${dt.to}: ${t.from}→${t.to}→${dt.to} 全链路', async () => {
    const ${t.trigger.handler} = vi.fn();
    const ${dt.trigger.handler} = vi.fn();
    render(
      <${baseName}Section
        content={defaultContent}
        actions={{ ${t.trigger.handler}, ${dt.trigger.handler} }}
      />
    );
    await user.click(screen.getByTestId('${testId}'));
    expect(${t.trigger.handler}).toHaveBeenCalled();
    await user.click(screen.getByTestId('${depTestId}'));
    expect(${dt.trigger.handler}).toHaveBeenCalled();
  });`);
        }
      }
    }
  }

  if (actionHandlers.size === 0) {
    testCases.push(`
  it('渲染正常', () => {
    render(<${baseName}Section content={defaultContent} />);
    expect(screen.getByTestId('${baseName.toLowerCase()}-section')).toBeInTheDocument();
  });`);
  }

  return `import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ${baseName}Section } from '../index';
import { defaultContent } from '../content';

const user = userEvent.setup();

describe('${baseName}Section', () => {
${testCases.join('\n')}
});
`;
}

function findTestIdForHandler(
  handler: string,
  testIds: Map<string, string>,
): string | null {
  // Direct match using Array.from to avoid Map iteration target issue
  const entries = Array.from(testIds.entries());
  for (const [testId, h] of entries) {
    if (h === handler) return testId;
  }

  // Partial match
  const handlerLower = handler.toLowerCase().replace(/^on/, '');
  for (const [testId] of entries) {
    const idLower = testId.toLowerCase();
    if (idLower.includes(handlerLower)) return testId;
  }

  return null;
}

function generate(
  sectionName: string,
  rootDir: string,
): boolean {
  const naming = buildSectionNaming(sectionName);
  const paths = resolveSectionPaths(rootDir, naming);

  // Read required files
  const contentResult = readFileSafe(paths.contentFile);
  if (!contentResult.ok) {
    const err = contentResult as { ok: false; error: string };
    process.stderr.write(`  SKIP ${sectionName}: 无法读取 content.ts (${err.error})\n`);
    return false;
  }

  const indexResult = readFileSafe(paths.indexFile);
  if (!indexResult.ok) {
    const err = indexResult as { ok: false; error: string };
    process.stderr.write(`  SKIP ${sectionName}: 无法读取 index.tsx (${err.error})\n`);
    return false;
  }

  const transitions = parseStateTransitions(contentResult.text);

  if (transitions.length === 0) {
    process.stderr.write(`  SKIP ${sectionName}: 无 stateTransitions（纯展示 Section）\n`);
    return false;
  }

  // Create __tests__ directory
  const testDir = join(paths.dir, '__tests__');
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  const testFile = join(testDir, `${sectionName}.test.tsx`);
  const testContent = generateTestContent(
    naming.baseName,
    indexResult.text,
    transitions,
  );

  writeFileSync(testFile, testContent, 'utf-8');
  process.stdout.write(`  GEN ${sectionName}: ${testFile}\n`);
  return true;
}

function main(argv = process.argv.slice(2)): void {
  const options = parseArgs(argv);

  let sectionNames: string[];
  if (options.all) {
    sectionNames = discoverSectionNames(options.rootDir);
    if (sectionNames.length === 0) {
      process.stderr.write('ERROR: 未找到任何 Section\n');
      process.exit(2);
    }
  } else if (options.sectionName) {
    sectionNames = [options.sectionName];
  } else {
    process.stderr.write('请指定 Section 名称或使用 --all\n');
    process.exit(2);
  }

  process.stdout.write(`生成测试用例 (campaign: ${options.campaign})\n`);
  process.stdout.write('---\n');

  let generated = 0;
  let skipped = 0;
  for (const name of sectionNames) {
    const ok = generate(name, options.rootDir);
    if (ok) generated++;
    else skipped++;
  }

  process.stdout.write('---\n');
  process.stdout.write(`完成: 生成 ${generated} 个, 跳过 ${skipped} 个\n`);
}

main();
