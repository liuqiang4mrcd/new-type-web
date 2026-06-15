import type {
  SupportedStateDecl,
  ParsedContentModule,
  ParsedStatesModule,
  ParsedRegistryEntry,
  RuntimeStatus,
  ParsedContainerModule,
  ParsedStoreModule,
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
    /\{\s*key:\s*['"]([^'"]+)['"]\s*,\s*type:\s*['"](ui|business)['"]\s*,\s*required:\s*(true|false)\s*\}/g;
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
  const re = /export\s+const\s+(\w+)\s*[:=]/g;
  const names: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    names.push(m[1]);
  }
  return { exportedNames: names };
}

export function parseRegistryEntries(source: string): ParsedRegistryEntry[] {
  const entries: ParsedRegistryEntry[] = [];

  const simpleBlockRe = /\{\s*id\s*:\s*['"]([^'"]+)['"][\s\S]*?\}(?=\s*,)/g;

  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = simpleBlockRe.exec(source)) !== null) {
    const block = blockMatch[0];
    const idMatch = block.match(/id\s*:\s*['"]([^'"]+)['"]/);
    const nameMatch = block.match(/name\s*:\s*['"]([^'"]+)['"]/);

    const svMatch = block.match(/stateViews\s*:\s*\{(?<svBody>[\s\S]*?)\}/);
    const stateViewKeys: string[] = [];
    if (svMatch?.groups?.svBody) {
      const keyRe = /(\w+)\s*:/g;
      let km: RegExpExecArray | null;
      while ((km = keyRe.exec(svMatch.groups.svBody)) !== null) {
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
