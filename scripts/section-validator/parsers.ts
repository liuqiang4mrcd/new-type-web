import type {
  SupportedStateDecl,
  ParsedContentModule,
  ParsedStatesModule,
  ParsedRegistryEntry,
  RuntimeStatus,
  ParsedContainerModule,
  ParsedStoreModule,
  ParsedTransition,
  RuntimeAppInfo,
} from './types';

export function parseSupportedStates(source: string): SupportedStateDecl[] | null {
  const re =
    /export\s+const\s+supportedStates[^=]*=\s*\[(?<body>[\s\S]*?)\]\s*as\s+const/;
  const match = source.match(re);
  if (!match || !match.groups?.body) {
    return null;
  }
  const body = match.groups.body;
  const itemRe =
    /\{\s*key:\s*['"]([^'"]+)['"]\s*,\s*type:\s*['"](ui|business|interaction)['"]\s*,\s*required:\s*(true|false)\s*\}/g;
  const results: SupportedStateDecl[] = [];
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(body)) !== null) {
    results.push({
      key: m[1],
      type: m[2] as 'ui' | 'business',
      required: m[3] === 'true',
    });
  }
  return results.length > 0 ? results : null;
}

export function parseStateDataKeys(source: string): string[] | null {
  // Find the start of stateData
  const startRe = /export\s+const\s+stateData[^=]*=\s*\{/;
  const startMatch = source.match(startRe);
  if (!startMatch) {
    return null;
  }

  const startIdx = startMatch.index! + startMatch[0].length;
  // Count braces from the opening { to find matching }
  let depth = 1;
  let endIdx = startIdx;
  for (let i = startIdx; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') depth--;
    if (depth === 0) {
      endIdx = i;
      break;
    }
  }
  if (depth !== 0) {
    return null; // unbalanced braces
  }

  const body = source.slice(startIdx, endIdx);
  const keyRe = /^\s{2}([A-Za-z_]\w*)\s*:/gm;
  const keys: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = keyRe.exec(body)) !== null) {
    keys.push(m[1]);
  }
  return keys.length > 0 ? keys : null;
}

export function parseContentModule(source: string): ParsedContentModule {
  const hasDefaultContent = /export\s+const\s+defaultContent\s*[:=]/.test(source);
  const supportedStates = parseSupportedStates(source);
  const stateDataKeys = parseStateDataKeys(source);
  return { hasDefaultContent, supportedStates, stateDataKeys };
}

export function parseStatesExports(source: string): ParsedStatesModule {
  // Match both export const Xxx and export function Xxx
  const re = /export\s+(?:const|function)\s+(\w+)\s*(?:[:=]|\()/g;
  const names: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    names.push(m[1]);
  }
  return { exportedNames: names };
}

export function parseRegistryEntries(source: string): ParsedRegistryEntry[] {
  const entries: ParsedRegistryEntry[] = [];

  // Find each top-level object: { id: '...', ... }
  // Walk the source character-by-character counting brace depth
  const objStartRe = /\{\s*id\s*:\s*['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = objStartRe.exec(source)) !== null) {
    const startIdx = match.index;
    // Find the matching closing brace at depth 0
    let depth = 1;
    let endIdx = startIdx + match[0].length;
    for (let i = endIdx; i < source.length; i++) {
      if (source[i] === '{') depth++;
      if (source[i] === '}') depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
    if (depth !== 0) continue; // unbalanced, skip

    const block = source.slice(startIdx, endIdx);

    const idMatch = block.match(/id\s*:\s*['"]([^'"]+)['"]/);
    const nameMatch = block.match(/name\s*:\s*['"]([^'"]+)['"]/);

    // Extract stateViews keys by finding the stateViews block and its keys
    const svStartRe = /stateViews\s*:\s*\{/;
    const svStart = block.match(svStartRe);
    const stateViewKeys: string[] = [];
    if (svStart) {
      const svIdx = svStart.index! + svStart[0].length;
      let svDepth = 1;
      let svEnd = svIdx;
      for (let i = svIdx; i < block.length; i++) {
        if (block[i] === '{') svDepth++;
        if (block[i] === '}') svDepth--;
        if (svDepth === 0) { svEnd = i; break; }
      }
      const svBody = block.slice(svIdx, svEnd);
      const keyRe = /(\w+)\s*:/g;
      let km: RegExpExecArray | null;
      while ((km = keyRe.exec(svBody)) !== null) {
        stateViewKeys.push(km[1]);
      }
    }

    entries.push({
      name: nameMatch ? nameMatch[1] : (idMatch ? idMatch[1] : undefined),
      stateViewKeys,
    });
  }

  return entries;
}

export function parseContainerSwitchCases(source: string): RuntimeStatus[] {
  const re = /case\s+['"](loading|empty|ready|error)['"]\s*:/g;
  const statuses: RuntimeStatus[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    statuses.push(m[1] as RuntimeStatus);
  }
  return [...new Set(statuses)];
}

export function parseContainerModule(
  source: string | null,
): ParsedContainerModule {
  if (!source) {
    return { exists: false, switchCases: [] };
  }
  const switchCases = parseContainerSwitchCases(source);
  return { exists: true, switchCases };
}

export function parseStoreSectionStateTypes(
  source: string,
): ParsedStoreModule {
  const re = /SectionState<(\w+Content)>/g;
  const types: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    types.push(m[1]);
  }
  return { stateContentTypes: [...new Set(types)] };
}

/** 从 content.ts 源码中解析 stateTransitions */
export function parseStateTransitions(source: string): ParsedTransition[] {
  const transitions: ParsedTransition[] = [];

  // Match: export const stateTransitions: StateTransition[] = [...]
  // or: export const stateTransitions = [...]
  const arrRe = /export\s+const\s+stateTransitions[^=]*=\s*\[([\s\S]*?)\]\s*(?:as\s+const)?;?/;
  const arrMatch = source.match(arrRe);
  if (!arrMatch) return [];

  const body = arrMatch[1];
  // Match individual transition objects
  const objRe = /\{\s*from:\s*'([^']+)'\s*,\s*to:\s*'([^']+)'\s*,\s*trigger:\s*\{([^}]+)\}(?:[^}]*\})?/g;
  let m: RegExpExecArray | null;
  while ((m = objRe.exec(body)) !== null) {
    const triggerStr = m[3];
    const trigger: ParsedTransition['trigger'] = { type: 'click' };

    const typeMatch = triggerStr.match(/type:\s*'([^']+)'/);
    if (typeMatch) trigger.type = typeMatch[1];

    const handlerMatch = triggerStr.match(/handler:\s*'([^']+)'/);
    if (handlerMatch) trigger.handler = handlerMatch[1];

    const durationMatch = triggerStr.match(/duration:\s*(\d+)/);
    if (durationMatch) trigger.duration = parseInt(durationMatch[1], 10);

    const t: ParsedTransition = { from: m[1], to: m[2], trigger };
    transitions.push(t);
  }

  return transitions;
}

/** 从 runtime/app.tsx 解析 Container 引用 */
export function parseRuntimeApp(source: string): RuntimeAppInfo {
  const imports: string[] = [];
  const tags: string[] = [];

  // Match: import { XxxContainer } from '...sections/XxxContainer'
  const importRe = /import\s+\{\s*(\w+Container)\s*\}\s+from\s+['"][^'"]*\/sections\/\w+['"]/g;
  let impMatch: RegExpExecArray | null;
  while ((impMatch = importRe.exec(source)) !== null) {
    imports.push(impMatch[1]);
  }

  // Match: <XxxContainer /> or <XxxContainer>...</XxxContainer>
  const tagRe = /<(\w+Container)(?:\s[^>]*)?\/?\s*>/g;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = tagRe.exec(source)) !== null) {
    tags.push(tagMatch[1]);
  }

  return { containerImports: imports, containerTags: tags };
}

/** 检查 index.tsx 中是否有分层违规（直接 import store/api/tracking） */
export function checkLayerViolations(source: string): string[] {
  const violations: string[] = [];

  if (/import\s+\{[^}]*useStore[^}]*\}\s+from/.test(source)) {
    violations.push('直接 import useStore（应从 Container 通过 actions props 传递）');
  }
  if (/import\s+useStore\s+from/.test(source)) {
    violations.push('直接 import useStore（应从 Container 通过 actions props 传递）');
  }
  if (/import\s+\{[^}]*createRequest[^}]*\}\s+from/.test(source)) {
    violations.push('直接 import createRequest');
  }
  if (/import\s+\{[^}]*track[^}]*\}\s+from.*tracking/.test(source)) {
    violations.push('直接 import tracking 埋点函数');
  }

  return violations;
}

/** 从 index.tsx 提取所有事件的绑定情况 */
export function parseEventHandlers(source: string): Array<{ event: string; handler: string }> {
  const handlers: Array<{ event: string; handler: string }> = [];
  const eventRe = /\s(on[A-Z][a-zA-Z]*)\s*=\s*\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = eventRe.exec(source)) !== null) {
    handlers.push({ event: m[1], handler: m[2].trim() });
  }
  return handlers;
}
