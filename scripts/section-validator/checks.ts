import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import type {
  SectionPaths,
  CheckResult,
  SectionValidationResult,
  SupportedStateDecl,
  SectionNaming,
} from './types';
import { readFileSafe, buildSectionNaming, resolveSectionPaths } from './discovery';
import {
  parseContentModule,
  parseStatesExports,
  parseRegistryEntries,
  parseContainerModule,
  parseStoreSectionStateTypes,
  parseStateTransitions,
  parseRuntimeApp,
  checkLayerViolations,
  parseActionWiring,
} from './parsers';

function check(partial: {
  name: string;
  passed: boolean;
  skipped?: boolean;
  errors?: string[];
}): CheckResult {
  return {
    name: partial.name,
    passed: partial.passed,
    skipped: partial.skipped ?? false,
    errors: partial.errors ?? [],
  };
}

function pascal(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function camel(key: string): string {
  return key.charAt(0).toLowerCase() + key.slice(1);
}

function collectSourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

function checkFilesExist(paths: SectionPaths): CheckResult {
  const errors: string[] = [];
  const files: [string, string][] = [
    ['types.ts', paths.typesFile],
    ['content.ts', paths.contentFile],
    ['index.tsx', paths.indexFile],
  ];
  for (const [label, fpath] of files) {
    if (!existsSync(fpath)) {
      errors.push(`Missing ${label}`);
    }
  }
  return check({
    name: 'Section 文件完整性',
    passed: errors.length === 0,
    errors,
  });
}

function checkSupportedStates(
  source: string,
): { result: CheckResult; states: SupportedStateDecl[] | null } {
  const content = parseContentModule(source);
  if (!content.supportedStates) {
    return {
      result: check({
        name: 'supportedStates 声明',
        passed: false,
        errors: ['content.ts 中未找到 supportedStates 导出'],
      }),
      states: null,
    };
  }
  if (!content.hasDefaultContent) {
    return {
      result: check({
        name: 'supportedStates 声明',
        passed: false,
        errors: ['content.ts 缺少 defaultContent 导出'],
      }),
      states: null,
    };
  }
  return {
    result: check({
      name: 'supportedStates 声明',
      passed: true,
      errors: [],
    }),
    states: content.supportedStates,
  };
}

function checkStateData(source: string): CheckResult {
  const content = parseContentModule(source);
  if (!content.stateDataKeys) {
    return check({
      name: 'stateData 声明',
      passed: false,
      errors: ['content.ts 中未找到 stateData 导出'],
    });
  }
  return check({
    name: 'stateData 声明',
    passed: true,
    errors: [],
  });
}

function checkUiStates(
  baseName: string,
  states: SupportedStateDecl[],
  statesSource: string | null,
): CheckResult {
  const uiStates = states.filter((s) => s.type === 'ui');
  if (uiStates.length === 0) {
    return check({ name: 'UI 状态组件覆盖', passed: true, errors: [] });
  }
  if (!statesSource) {
    return check({
      name: 'UI 状态组件覆盖',
      passed: false,
      errors: ['states.tsx 不存在，无法验证 UI 状态组件'],
    });
  }
  const parsed = parseStatesExports(statesSource);
  const errors: string[] = [];
  for (const s of uiStates) {
    const expectedName = `${baseName}${pascal(s.key)}`;
    const found = parsed.exportedNames.includes(expectedName);
    if (!found && s.required) {
      errors.push(`缺少必要 UI 状态组件: ${expectedName}（states.tsx 中未导出）`);
    } else if (!found) {
      // optional, just note
    }
  }
  return check({
    name: 'UI 状态组件覆盖',
    passed: errors.length === 0,
    errors,
  });
}

function checkBusinessStates(
  states: SupportedStateDecl[],
  stateDataKeys: string[] | null,
): CheckResult {
  const businessStates = states.filter((s) => s.type === 'business');
  if (businessStates.length === 0) {
    return check({ name: '业务状态数据覆盖', passed: true, errors: [] });
  }
  if (!stateDataKeys) {
    return check({
      name: '业务状态数据覆盖',
      passed: false,
      errors: ['stateData 未定义，无法验证业务状态'],
    });
  }
  const errors: string[] = [];
  for (const s of businessStates) {
    if (!stateDataKeys.includes(s.key) && s.required) {
      errors.push(`缺少必要业务状态: ${s.key}（stateData 中无对应数据）`);
    }
  }
  return check({
    name: '业务状态数据覆盖',
    passed: errors.length === 0,
    errors,
  });
}

function checkReverseConsistency(
  states: SupportedStateDecl[],
  stateDataKeys: string[] | null,
): CheckResult {
  if (!stateDataKeys) {
    return check({
      name: '反向一致性检查',
      passed: false,
      errors: ['stateData 未定义，无法检查反向一致性'],
    });
  }
  const declaredKeys = new Set(states.map((s) => s.key));
  const extraKeys = stateDataKeys.filter((k) => !declaredKeys.has(k));
  if (extraKeys.length > 0) {
    return check({
      name: '反向一致性检查',
      passed: false,
      errors: [
        `stateData 中的以下 key 未在 supportedStates 中声明: ${extraKeys.join(', ')}`,
      ],
    });
  }
  return check({
    name: '反向一致性检查',
    passed: true,
    errors: [],
  });
}

function checkPlaygroundRegistration(
  sectionName: string,
  baseName: string,
  registrySource: string,
): CheckResult {
  const entries = parseRegistryEntries(registrySource);
  const found = entries.find(
    (e) => e.name === sectionName || e.name === baseName,
  );
  if (!found) {
    return check({
      name: 'Playground 注册',
      passed: false,
      errors: [
        `section-registry.ts 中未找到 ${sectionName} 的注册项（需匹配 name: '${sectionName}' 或 '${baseName}'）`,
      ],
    });
  }
  return check({
    name: 'Playground 注册',
    passed: true,
    errors: [],
  });
}

function checkStateViewsAlignment(
  baseName: string,
  states: SupportedStateDecl[],
  registrySource: string,
): CheckResult {
  const entries = parseRegistryEntries(registrySource);
  const found = entries.find(
    (e) => e.name === `${baseName}Section` || e.name === baseName,
  );
  if (!found) {
    return check({
      name: 'stateViews 对齐',
      skipped: true,
      passed: true,
      errors: [],
    });
  }
  const declaredUiKeys = states
    .filter((s) => s.type === 'ui')
    .map((s) => s.key);
  if (declaredUiKeys.length === 0) {
    return check({ name: 'stateViews 对齐', passed: true, errors: [] });
  }
  const errors: string[] = [];
  for (const key of declaredUiKeys) {
    if (!found.stateViewKeys.includes(key)) {
      errors.push(
        `supportedStates 声明了 UI 状态 "${key}"，但注册项的 stateViews 中缺少该状态`,
      );
    }
  }
  return check({
    name: 'stateViews 对齐',
    passed: errors.length === 0,
    errors,
  });
}

function checkRuntimeContainer(
  rootDir: string,
  baseName: string,
): CheckResult {
  const containerFile = join(
    rootDir,
    'runtime',
    'sections',
    `${baseName}Container.tsx`,
  );
  if (!existsSync(containerFile)) {
    return check({
      name: 'Runtime Container',
      passed: false,
      errors: [`${baseName}Container.tsx 不存在（runtime/sections/ 下）`],
    });
  }
  const result = readFileSafe(containerFile);
  if (!result.ok) {
    return check({
      name: 'Runtime Container',
      passed: false,
      errors: [result.error],
    });
  }
  const container = parseContainerModule(result.ok ? result.text : null);
  if (container.exists && container.switchCases.length === 0) {
    return check({
      name: 'Runtime Container',
      passed: true,
      errors: [],
    });
  }
  return check({
    name: 'Runtime Container',
    passed: true,
    errors: [],
  });
}

function checkContainerRouting(
  rootDir: string,
  baseName: string,
  states: SupportedStateDecl[] | null,
): CheckResult {
  const containerFile = join(
    rootDir,
    'runtime',
    'sections',
    `${baseName}Container.tsx`,
  );
  if (!existsSync(containerFile)) {
    return check({
      name: 'Container 路由完整性',
      skipped: true,
      passed: true,
      errors: [],
    });
  }
  const result = readFileSafe(containerFile);
  if (!result.ok) {
    return check({
      name: 'Container 路由完整性',
      skipped: true,
      passed: true,
      errors: [],
    });
  }
  const container = parseContainerModule(result.ok ? result.text : null);
  const declaredUiStatuses = (states ?? [])
    .filter((s) => s.type === 'ui' && s.required)
    .map((s) => s.key)
    .filter((key) => ['loading', 'empty', 'error'].includes(key));
  const required: string[] = ['ready', ...declaredUiStatuses];
  const missing = required.filter((r) => !container.switchCases.includes(r as any));
  if (missing.length > 0) {
    return check({
      name: 'Container 路由完整性',
      passed: false,
      errors: [
        `Container switch 缺少以下状态的路由: ${missing.join(', ')}`,
      ],
    });
  }
  return check({
    name: 'Container 路由完整性',
    passed: true,
    errors: [],
  });
}

function checkStoreAlignment(
  baseName: string,
  storeSource: string,
  rootDir: string,
): CheckResult {
  const parsed = parseStoreSectionStateTypes(storeSource);
  const expectedType = `${baseName}Content`;
  if (parsed.stateContentTypes.includes(expectedType)) {
    return check({
      name: 'Store 对齐',
      passed: true,
      errors: [],
    });
  }

  const activityTypesFile = join(rootDir, 'activity', 'types.ts');
  const activityTypesResult = readFileSafe(activityTypesFile);
  const sectionKey = camel(baseName);
  const activityMapHasSectionState =
    activityTypesResult.ok &&
    new RegExp(`${sectionKey}\\s*:\\s*SectionState<${expectedType}>`).test(
      activityTypesResult.text,
    );

  if (activityMapHasSectionState) {
    return check({
      name: 'Store 对齐',
      passed: true,
      errors: [],
    });
  }

  return check({
    name: 'Store 对齐',
    passed: false,
    errors: [
      `未找到 SectionState<${expectedType}>：需在 Store 中声明，或在 activity/types.ts 的 SectionStateMap 中声明 ${sectionKey}: SectionState<${expectedType}>`,
    ],
  });
}

// === #11 Runtime 注册检查 ===
function checkRuntimeAppRegistration(
  rootDir: string,
  baseName: string,
): CheckResult {
  const appFile = join(rootDir, 'runtime', 'app.tsx');
  const result = readFileSafe(appFile);
  if (!result.ok || !result.text) {
    return check({
      name: 'Runtime 注册',
      passed: false,
      errors: ['runtime/app.tsx 不存在或无法读取'],
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
  const content = parseContentModule(source);
  const hasRequiredInteractionStates = (content.supportedStates ?? []).some(
    (state) => state.type === 'interaction' && state.required,
  );
  const transitions = parseStateTransitions(source);
  if (hasRequiredInteractionStates && transitions.length === 0) {
    return check({
      name: 'stateTransitions 声明',
      passed: false,
      errors: ['content.ts 中未找到 stateTransitions 导出'],
    });
  }
  if (!hasRequiredInteractionStates && transitions.length === 0) {
    return check({
      name: 'stateTransitions 声明',
      passed: true,
      skipped: true,
      errors: [],
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
  if (transitions.length === 0) {
    return check({
      name: '声明完整性',
      skipped: true,
      passed: true,
      errors: [],
    });
  }

  const transitionKeys = new Set<string>();
  for (const t of transitions) {
    transitionKeys.add(t.from);
    transitionKeys.add(t.to);
  }

  const interactionStates = states.filter((s) => s.type === 'interaction');
  const errors: string[] = [];

  for (const s of interactionStates) {
    if (!transitionKeys.has(s.key)) {
      errors.push(`交互状态 "${s.key}" 在 stateTransitions 中未出现`);
    }
  }

  const allKeys = new Set(states.map((s) => s.key));
  for (const t of transitions) {
    if (!allKeys.has(t.from)) {
      errors.push(`stateTransitions 的 from "${t.from}" 未在 supportedStates 中声明`);
    }
    if (!allKeys.has(t.to)) {
      errors.push(`stateTransitions 的 to "${t.to}" 未在 supportedStates 中声明`);
    }
  }

  return check({
    name: '声明完整性',
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

  // Build adjacency graph
  const graph = new Map<string, string[]>();
  for (const s of interactionStates) {
    graph.set(s.key, []);
  }
  for (const t of transitions) {
    if (!graph.has(t.from)) graph.set(t.from, []);
    graph.get(t.from)!.push(t.to);
  }

  // Find initial state:
  // 1. Try: states that appear in 'from' but never in any 'to' (acyclic root)
  const allTo = new Set(transitions.map((t) => t.to));
  const initialCandidates = interactionStates
    .filter((s) => !allTo.has(s.key))
    .map((s) => s.key);

  let initialState: string;
  if (initialCandidates.length > 0) {
    initialState = initialCandidates[0];
  } else if (interactionStates.length > 0) {
    // 2. Fallback: first interaction state in supportedStates order (cyclic graph)
    initialState = interactionStates[0].key;
  } else {
    return check({
      name: '状态可达性',
      passed: true,
      errors: [],
    });
  }

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

// === #15 分层边界检查 ===
function checkLayerBoundaries(
  rootDir: string,
  naming: SectionNaming,
): CheckResult {
  const paths = resolveSectionPaths(rootDir, naming);
  const result = readFileSafe(paths.indexFile);
  if (!result.ok || !result.text) {
    return check({
      name: '分层边界检查',
      skipped: true,
      passed: true,
      errors: [],
    });
  }

  const violations = checkLayerViolations(result.text);
  for (const filePath of collectSourceFiles(join(rootDir, 'playground'))) {
    const file = readFileSafe(filePath);
    if (!file.ok) continue;
    const relativePath = filePath.replace(rootDir + '/', '');
    const importsIntegration = /from\s+['"](?:\.\.\/)+integrations\//.test(file.text);
    const importsRuntimeApi =
      /from\s+['"](?:\.\.\/)+integrations\/(?:api|tracking|adapters|fixtures|mock-data)/.test(
        file.text,
      );
    const isFullPagePreviewBoundary =
      /playground\/(?:phone-preview|preview-state)\.tsx?$/.test(relativePath);

    if (importsRuntimeApi) {
      violations.push(
        `${relativePath} import integrations API/tracking/adapter/mock-data（Playground 禁止接入真实数据流）`,
      );
    } else if (importsIntegration && !isFullPagePreviewBoundary) {
      violations.push(
        `${relativePath} import integrations/*（仅 phone-preview/preview-state 可受控复用 runtime store）`,
      );
    }
  }

  for (const filePath of collectSourceFiles(join(rootDir, 'activity'))) {
    const file = readFileSafe(filePath);
    if (!file.ok) continue;
    const relativePath = filePath.replace(rootDir + '/', '');
    if (/from\s+['"]react['"]|from\s+['"]zustand['"]/.test(file.text)) {
      violations.push(`${relativePath} import React/Zustand（activity 必须保持纯 TS）`);
    }
    if (/from\s+['"].*integrations\/(api|store|tracking)/.test(file.text)) {
      violations.push(`${relativePath} import integrations runtime/API/tracking`);
    }
  }

  return check({
    name: '分层边界检查',
    passed: violations.length === 0,
    errors: violations,
  });
}

function findPropertyValue(source: string, propertyName: string): string | null {
  const propertyRe = new RegExp(`${propertyName}\\s*:`, 'g');
  const match = propertyRe.exec(source);
  if (!match) return null;

  let index = match.index + match[0].length;
  while (index < source.length && /\s/.test(source[index])) index++;

  const start = index;
  let depth = 0;
  let quote: string | null = null;
  for (; index < source.length; index++) {
    const char = source[index];
    const prev = source[index - 1];

    if (quote) {
      if (char === quote && prev !== '\\') quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '(' || char === '{' || char === '[') depth++;
    if (char === ')' || char === '}' || char === ']') {
      if (depth === 0) break;
      depth--;
    }
    if (depth === 0 && char === ',') break;
  }

  return source.slice(start, index).trim();
}

function checkRuntimeActionWiring(
  rootDir: string,
  sectionName: string,
  baseName: string,
  registrySource: string,
  phonePreviewSource: string,
): CheckResult {
  const entries = parseRegistryEntries(registrySource);
  const entry = entries.find(
    (e) => e.name === sectionName || e.name === baseName,
  );
  if (!entry?.id) {
    return check({
      name: 'Runtime 联动实现',
      skipped: true,
      passed: true,
      errors: [],
    });
  }

  const wiring = parseActionWiring(phonePreviewSource).find(
    (item) => item.sectionId === entry.id,
  );
  if (!wiring || wiring.actionNames.length === 0) {
    return check({
      name: 'Runtime 联动实现',
      skipped: true,
      passed: true,
      errors: [],
    });
  }

  const containerFile = join(
    rootDir,
    'runtime',
    'sections',
    `${baseName}Container.tsx`,
  );
  const result = readFileSafe(containerFile);
  if (!result.ok) {
    return check({
      name: 'Runtime 联动实现',
      passed: false,
      errors: [result.error],
    });
  }

  const errors: string[] = [];
  for (const actionName of wiring.actionNames) {
    const value = findPropertyValue(result.text, actionName);
    if (!value) {
      errors.push(
        `${baseName}Container.tsx 缺少跨 Section action 绑定: ${actionName}`,
      );
      continue;
    }
    if (/^\(?[^=)]*\)?\s*=>\s*console\.log\s*\(/.test(value)) {
      errors.push(
        `${baseName}Container.tsx 的 ${actionName} 是 console.log-only，必须绑定 Store action 更新目标 Section`,
      );
    }
  }

  return check({
    name: 'Runtime 联动实现',
    passed: errors.length === 0,
    errors,
  });
}

export function validateSection(
  sectionName: string,
  rootDir: string,
  registrySource: string,
  storeSource: string,
  phonePreviewSource = '',
): SectionValidationResult {
  const naming = buildSectionNaming(sectionName);
  const paths = resolveSectionPaths(rootDir, naming);

  const allChecks: CheckResult[] = [];

  // 1. Section 文件完整性
  const fileCheck = checkFilesExist(paths);
  allChecks.push(fileCheck);

  const contentResult = readFileSafe(paths.contentFile);
  const contentSource = contentResult.ok ? contentResult.text : null;

  const statesResult = readFileSafe(paths.statesFile);
  const statesSource = statesResult.ok ? statesResult.text : null;

  // 2. supportedStates 声明
  let supportedStates: SupportedStateDecl[] | null = null;
  if (!contentSource) {
    allChecks.push(
      check({
        name: 'supportedStates 声明',
        passed: false,
        skipped: true,
        errors: ['content.ts 不存在'],
      }),
    );
  } else {
    const ssResult = checkSupportedStates(contentSource);
    allChecks.push(ssResult.result);
    supportedStates = ssResult.states;
  }

  // 3. stateData 声明
  if (!contentSource) {
    allChecks.push(
      check({
        name: 'stateData 声明',
        passed: false,
        skipped: true,
        errors: ['content.ts 不存在'],
      }),
    );
  } else {
    allChecks.push(checkStateData(contentSource));
  }

  const stateDataKeys = contentSource
    ? parseContentModule(contentSource).stateDataKeys
    : null;

  // 4. UI 状态组件覆盖
  if (supportedStates) {
    allChecks.push(checkUiStates(naming.baseName, supportedStates, statesSource));
  } else {
    allChecks.push(
      check({
        name: 'UI 状态组件覆盖',
        passed: true,
        skipped: true,
        errors: [],
      }),
    );
  }

  // 5. 业务状态数据覆盖
  if (supportedStates) {
    allChecks.push(checkBusinessStates(supportedStates, stateDataKeys));
  } else {
    allChecks.push(
      check({
        name: '业务状态数据覆盖',
        passed: true,
        skipped: true,
        errors: [],
      }),
    );
  }

  // 6. 反向一致性检查
  if (supportedStates) {
    allChecks.push(checkReverseConsistency(supportedStates, stateDataKeys));
  } else {
    allChecks.push(
      check({
        name: '反向一致性检查',
        passed: true,
        skipped: true,
        errors: [],
      }),
    );
  }

  // 7. Playground 注册
  allChecks.push(
    checkPlaygroundRegistration(sectionName, naming.baseName, registrySource),
  );

  // 8. stateViews 对齐
  if (supportedStates) {
    allChecks.push(
      checkStateViewsAlignment(naming.baseName, supportedStates, registrySource),
    );
  } else {
    allChecks.push(
      check({
        name: 'stateViews 对齐',
        passed: true,
        skipped: true,
        errors: [],
      }),
    );
  }

  // 9. Runtime Container 存在性
  allChecks.push(checkRuntimeContainer(rootDir, naming.baseName));

  // 10. Container 路由完整性
  allChecks.push(checkContainerRouting(rootDir, naming.baseName, supportedStates));

  // 11. Store 对齐
  allChecks.push(checkStoreAlignment(naming.baseName, storeSource, rootDir));

  // 12. Runtime 注册
  allChecks.push(checkRuntimeAppRegistration(rootDir, naming.baseName));

  // 13. stateTransitions 声明
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

  // 14. 声明完整性
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

  // 15. 状态可达性
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

  // 16. 分层边界检查
  allChecks.push(checkLayerBoundaries(rootDir, naming));

  // 17. Runtime 联动实现
  allChecks.push(
    checkRuntimeActionWiring(
      rootDir,
      sectionName,
      naming.baseName,
      registrySource,
      phonePreviewSource,
    ),
  );

  const failedChecks = allChecks.filter((c) => !c.passed && !c.skipped);
  return {
    section: sectionName,
    passed: failedChecks.length === 0,
    checks: allChecks,
  };
}
