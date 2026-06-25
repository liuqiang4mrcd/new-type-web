#!/usr/bin/env tsx
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { spawnSync } from "child_process";
import { basename, join, relative } from "path";

type Check = {
  name: string;
  passed: boolean;
  skipped?: boolean;
  errors: string[];
};

type StructureRow = {
  order: string;
  section: string;
  role: string;
  dataSource: string;
  businessLoop: string;
  tabOwnership: string;
  modalComplexity: string;
  keyFields: string;
};

type Options = {
  campaign: string;
  section?: string;
  adapter?: string;
  verbose: boolean;
  rootDir: string;
  appDir: string;
};

const DATA_SOURCE_VALUES = new Set(["静态展示", "动态数据"]);
const BUSINESS_LOOP_VALUES = new Set(["独立", "附属"]);
const TAB_OWNERSHIP_VALUES = new Set(["无", "自身控制", "跨Section控制"]);
const MODAL_COMPLEXITY_VALUES = new Set(["非弹窗", "纯展示", "有交互"]);

function parseArgs(argv: string[]): Options {
  let campaign = "campaign-template";
  let section: string | undefined;
  let adapter: string | undefined;
  let verbose = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--campaign" && argv[i + 1]) {
      campaign = argv[++i];
    } else if (arg === "--section" && argv[i + 1]) {
      section = argv[++i];
    } else if (arg === "--adapter" && argv[i + 1]) {
      adapter = argv[++i];
    } else if (arg === "--verbose") {
      verbose = true;
    } else if (!arg.startsWith("--") && !section) {
      section = arg;
    } else {
      fatal(`未知参数: ${arg}`);
    }
  }

  const appDir = join(process.cwd(), "apps", campaign);
  const rootDir = join(appDir, "src");
  if (!existsSync(rootDir)) {
    fatal(`活动目录不存在: ${rootDir}`);
  }

  return { campaign, section, adapter, verbose, rootDir, appDir };
}

function fatal(message: string): never {
  process.stderr.write(`ERROR: ${message}\n`);
  process.exit(2);
}

function check(name: string, passed: boolean, errors: string[] = []): Check {
  return { name, passed, skipped: false, errors };
}

function skipped(name: string, reason: string): Check {
  return { name, passed: true, skipped: true, errors: [reason] };
}

function readText(filePath: string): string | null {
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, "utf-8");
}

function collectFiles(
  dir: string,
  predicate: (filePath: string) => boolean,
): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...collectFiles(fullPath, predicate));
    } else if (predicate(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

function normalizeName(value: string): string {
  return value
    .replace(/\.(test|spec)\.[^.]+$/, "")
    .replace(/\.[^.]+$/, "")
    .replace(/Section$/, "")
    .replace(/adapter$/i, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

function camelSectionKey(sectionName: string): string {
  const baseName = sectionName.endsWith("Section")
    ? sectionName.slice(0, -7)
    : sectionName;
  return baseName.charAt(0).toLowerCase() + baseName.slice(1);
}

function splitMarkdownRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((part) => part.trim().replace(/^`|`$/g, ""));
}

function parseStructure(text: string): {
  rows: StructureRow[];
  errors: string[];
} {
  const lines = text.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) =>
    /\|\s*顺序\s*\|\s*Section\s*\|\s*职责\s*\|\s*数据来源\s*\|\s*业务闭环\s*\|\s*Tab归属\s*\|\s*弹窗复杂度\s*\|\s*关键数据字段\s*\|/.test(
      line,
    ),
  );

  if (headerIndex < 0) {
    return {
      rows: [],
      errors: [
        "缺少 STRUCTURE_OUTPUT.md 要求的 Section 表格表头：顺序 / Section / 职责 / 数据来源 / 业务闭环 / Tab归属 / 弹窗复杂度 / 关键数据字段",
      ],
    };
  }

  const rows: StructureRow[] = [];
  const errors: string[] = [];
  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith("|")) break;
    const cells = splitMarkdownRow(line);
    if (cells.length < 8) {
      errors.push(`结构表第 ${i + 1} 行列数不足：${line.trim()}`);
      continue;
    }
    if (/^-+$/.test(cells[0])) continue;
    rows.push({
      order: cells[0],
      section: cells[1],
      role: cells[2],
      dataSource: cells[3],
      businessLoop: cells[4],
      tabOwnership: cells[5],
      modalComplexity: cells[6],
      keyFields: cells.slice(7).join(" | "),
    });
  }

  if (rows.length === 0) {
    errors.push("Section 结构表没有数据行");
  }

  for (const row of rows) {
    if (!row.section.endsWith("Section")) {
      errors.push(`Section 名称应以 Section 结尾: ${row.section}`);
    }
    if (!DATA_SOURCE_VALUES.has(row.dataSource)) {
      errors.push(`Section ${row.section} 的 数据来源 非法: ${row.dataSource}`);
    }
    if (!BUSINESS_LOOP_VALUES.has(row.businessLoop)) {
      errors.push(
        `Section ${row.section} 的 业务闭环 非法: ${row.businessLoop}`,
      );
    }
    if (!TAB_OWNERSHIP_VALUES.has(row.tabOwnership)) {
      errors.push(
        `Section ${row.section} 的 Tab归属 非法: ${row.tabOwnership}`,
      );
    }
    if (!MODAL_COMPLEXITY_VALUES.has(row.modalComplexity)) {
      errors.push(
        `Section ${row.section} 的 弹窗复杂度 非法: ${row.modalComplexity}`,
      );
    }
  }

  return { rows, errors };
}

function parseAffectedSectionSources(text: string): Set<string> {
  const sources = new Set<string>();
  const headingIndex = text.search(/^##\s+Tab 跨 Section 控制\s*$/m);
  if (headingIndex < 0) return sources;

  const afterHeading = text.slice(headingIndex).split(/\r?\n/);
  const headerIndex = afterHeading.findIndex((line) =>
    /\|\s*源 Section\s*\|\s*Tab 名\s*\|\s*AFFECTED_SECTIONS\s*\|\s*显隐规则\s*\|/.test(
      line,
    ),
  );
  if (headerIndex < 0) return sources;

  for (let i = headerIndex + 2; i < afterHeading.length; i++) {
    const line = afterHeading[i];
    if (!line.trim().startsWith("|")) break;
    const cells = splitMarkdownRow(line);
    if (cells.length < 4 || /^-+$/.test(cells[0])) continue;
    if (cells[2]) sources.add(cells[0]);
  }

  return sources;
}

function findAdapterFiles(rootDir: string): {
  adapters: string[];
  tests: string[];
} {
  const adaptersDir = join(rootDir, "integrations", "adapters");
  const sourceFiles = collectFiles(adaptersDir, (filePath) =>
    /\.(ts|tsx)$/.test(filePath),
  );
  return {
    adapters: sourceFiles.filter(
      (filePath) => !/\.test\.(ts|tsx)$/.test(filePath),
    ),
    tests: sourceFiles.filter((filePath) => /\.test\.(ts|tsx)$/.test(filePath)),
  };
}

function fileMentionsSection(filePath: string, sectionName: string): boolean {
  const source = readText(filePath) ?? "";
  const baseName = sectionName.endsWith("Section")
    ? sectionName.slice(0, -7)
    : sectionName;
  const contentType = `${baseName}Content`;
  const sectionKey = camelSectionKey(sectionName);
  const normalizedFile = normalizeName(basename(filePath));
  const normalizedSection = normalizeName(sectionName);
  const normalizedBase = normalizeName(baseName);

  return (
    normalizedFile.includes(normalizedSection) ||
    normalizedFile.includes(normalizedBase) ||
    source.includes(sectionName) ||
    source.includes(contentType) ||
    new RegExp(`\\b${sectionKey}\\b`).test(source)
  );
}

function matchingAdapterFiles(files: string[], sectionName: string): string[] {
  return files.filter((filePath) => fileMentionsSection(filePath, sectionName));
}

function matchingAdapterByName(files: string[], adapterName: string): string[] {
  const target = normalizeName(adapterName);
  return files.filter((filePath) =>
    normalizeName(basename(filePath)).includes(target),
  );
}

function checkStructureFile(options: Options): {
  checks: Check[];
  rows: StructureRow[];
  dynamicRows: StructureRow[];
  structureText: string | null;
} {
  const structurePath = join(options.appDir, ".feedback", "structure.md");
  const structureText = readText(structurePath);
  if (!structureText) {
    return {
      checks: [
        check("结构规划文件", false, [
          `缺少结构规划文件: ${relative(process.cwd(), structurePath)}`,
        ]),
      ],
      rows: [],
      dynamicRows: [],
      structureText: null,
    };
  }

  const parsed = parseStructure(structureText);
  let rows = parsed.rows;
  if (options.section) {
    rows = rows.filter((row) => row.section === options.section);
    if (rows.length === 0) {
      parsed.errors.push(
        `.feedback/structure.md 中未找到指定 Section: ${options.section}`,
      );
    }
  }

  const dynamicRows = rows.filter((row) => row.dataSource === "动态数据");
  const checks = [
    check("结构规划文件", true),
    check("结构表格式", parsed.errors.length === 0, parsed.errors),
  ];

  const affectedSources = parseAffectedSectionSources(structureText);
  const crossTabErrors = rows
    .filter((row) => row.tabOwnership === "跨Section控制")
    .filter((row) => !affectedSources.has(row.section))
    .map(
      (row) =>
        `${row.section} 标记为 跨Section控制，但 ## Tab 跨 Section 控制 中缺少对应 AFFECTED_SECTIONS 行`,
    );
  checks.push(
    check("Tab 跨 Section 控制", crossTabErrors.length === 0, crossTabErrors),
  );

  return { checks, rows, dynamicRows, structureText };
}

function checkContracts(rootDir: string, dynamicRows: StructureRow[]): Check {
  if (dynamicRows.length === 0) {
    return skipped(
      "动态 Section contract",
      "没有 数据来源 = 动态数据 的 Section",
    );
  }
  const errors = dynamicRows
    .map((row) =>
      join(rootDir, "designer", "sections", row.section, "contract.ts"),
    )
    .filter((contractPath) => !existsSync(contractPath))
    .map(
      (contractPath) =>
        `缺少 contract.ts: ${relative(process.cwd(), contractPath)}`,
    );
  return check("动态 Section contract", errors.length === 0, errors);
}

function checkAdapters(
  rootDir: string,
  dynamicRows: StructureRow[],
  adapterName?: string,
): { checks: Check[]; testFiles: string[] } {
  const { adapters, tests } = findAdapterFiles(rootDir);
  const fixturesDir = join(rootDir, "integrations", "fixtures");
  const fixtures = collectFiles(
    fixturesDir,
    (filePath) =>
      /\.(json|ts|md)$/.test(filePath) && !basename(filePath).startsWith("."),
  );
  const dataFixtures = fixtures.filter((filePath) =>
    /\.(json|ts)$/.test(filePath),
  );
  const sourceDocs = fixtures.filter((filePath) => /\.md$/.test(filePath));

  if (adapterName) {
    const matchedAdapters = matchingAdapterByName(adapters, adapterName);
    const matchedTests = matchingAdapterByName(tests, adapterName);
    const matchedFixtures = fixtures.filter((filePath) =>
      normalizeName(basename(filePath)).includes(normalizeName(adapterName)),
    );
    return {
      checks: [
        check(
          "adapter 文件",
          matchedAdapters.length > 0,
          [`未找到匹配 --adapter ${adapterName} 的 adapter 文件`].filter(
            () => matchedAdapters.length === 0,
          ),
        ),
        check(
          "adapter test",
          matchedTests.length > 0,
          [
            `未找到匹配 --adapter ${adapterName} 的 *.test.ts adapter contract test`,
          ].filter(() => matchedTests.length === 0),
        ),
        check(
          "fixture 文件",
          matchedFixtures.length > 0 || dataFixtures.length > 0,
          [
            `未找到匹配 --adapter ${adapterName} 的 fixture 文件，且 integrations/fixtures 下没有可用数据 fixture`,
          ].filter(
            () => matchedFixtures.length === 0 && dataFixtures.length === 0,
          ),
        ),
        check(
          "fixture 来源记录",
          sourceDocs.length > 0,
          ["integrations/fixtures 下缺少 fixture source markdown 记录"].filter(
            () => sourceDocs.length === 0,
          ),
        ),
      ],
      testFiles: matchedTests,
    };
  }

  if (dynamicRows.length === 0) {
    return {
      checks: [
        skipped("adapter 文件", "没有 数据来源 = 动态数据 的 Section"),
        skipped("adapter test", "没有 数据来源 = 动态数据 的 Section"),
        skipped("fixture 文件", "没有 数据来源 = 动态数据 的 Section"),
      ],
      testFiles: [],
    };
  }

  const adapterErrors: string[] = [];
  const testErrors: string[] = [];
  const matchedTestFiles = new Set<string>();
  for (const row of dynamicRows) {
    if (matchingAdapterFiles(adapters, row.section).length === 0) {
      adapterErrors.push(
        `${row.section} 未找到关联 adapter（文件名或源码需包含 Section 名、Content 类型或 section key）`,
      );
    }
    const sectionTests = matchingAdapterFiles(tests, row.section);
    if (sectionTests.length === 0) {
      testErrors.push(`${row.section} 未找到关联 adapter contract test`);
    } else {
      for (const testFile of sectionTests) matchedTestFiles.add(testFile);
    }
  }

  const fixtureErrors: string[] = [];
  if (dataFixtures.length === 0) {
    fixtureErrors.push(
      "integrations/fixtures 下缺少 .json 或 .ts 数据 fixture",
    );
  }

  const fixtureSourceErrors: string[] = [];
  if (sourceDocs.length === 0) {
    fixtureSourceErrors.push(
      "integrations/fixtures 下缺少 fixture source markdown 记录",
    );
  }

  return {
    checks: [
      check("adapter 文件", adapterErrors.length === 0, adapterErrors),
      check("adapter test", testErrors.length === 0, testErrors),
      check("fixture 文件", fixtureErrors.length === 0, fixtureErrors),
      check(
        "fixture 来源记录",
        fixtureSourceErrors.length === 0,
        fixtureSourceErrors,
      ),
    ],
    testFiles: Array.from(matchedTestFiles),
  };
}

function truncateOutput(text: string): string {
  const max = 4000;
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n... output truncated ...`;
}

function checkAdapterTestsRun(testFiles: string[]): Check {
  if (testFiles.length === 0) {
    return skipped("adapter test 运行", "没有可运行的关联 adapter test");
  }

  const args = [
    "exec",
    "vitest",
    "run",
    ...testFiles.map((filePath) => relative(process.cwd(), filePath)),
  ];
  const result = spawnSync("pnpm", args, {
    cwd: process.cwd(),
    encoding: "utf-8",
  });

  const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
  if (result.status === 0) {
    return check("adapter test 运行", true);
  }

  return check("adapter test 运行", false, [
    `命令失败: pnpm ${args.join(" ")}`,
    truncateOutput(output || String(result.error ?? "unknown error")),
  ]);
}

function checkDefaultContentLeak(rootDir: string): Check {
  const scanDirs = ["integrations", "activity", "runtime"].map((dir) =>
    join(rootDir, dir),
  );
  const files = scanDirs.flatMap((dir) =>
    collectFiles(dir, (filePath) => /\.(ts|tsx)$/.test(filePath)),
  );
  const errors: string[] = [];
  for (const filePath of files) {
    const source = readText(filePath) ?? "";
    const relativePath = relative(process.cwd(), filePath);
    const importsDesignerContent =
      /from\s+['"][^'"]*designer\/sections\/[^'"]*\/content['"]/.test(source);
    const importsDefaultContent =
      /import\s+\{[^}]*defaultContent[^}]*\}\s+from\s+['"][^'"]+['"]/.test(
        source,
      );
    if (importsDesignerContent || importsDefaultContent) {
      errors.push(`${relativePath} import designer content/defaultContent`);
    }
  }
  return check("defaultContent 泄漏", errors.length === 0, errors);
}

function checkRuntimeDtoLeak(rootDir: string): Check {
  const scanDirs = ["activity", "runtime"].map((dir) => join(rootDir, dir));
  const files = scanDirs.flatMap((dir) =>
    collectFiles(dir, (filePath) => /\.(ts|tsx)$/.test(filePath)),
  );
  const errors: string[] = [];
  for (const filePath of files) {
    const source = readText(filePath) ?? "";
    const relativePath = relative(process.cwd(), filePath);
    if (
      /from\s+['"][^'"]*integrations\/(api|adapters|fixtures|mock|mock-data)[^'"]*['"]/.test(
        source,
      )
    ) {
      errors.push(
        `${relativePath} import integrations API/adapter/fixture/mock/mock-data`,
      );
    }
    if (/\b[A-Za-z0-9_]*DTO\b|\b[A-Za-z0-9_]*Dto\b|\bdto\./.test(source)) {
      errors.push(`${relativePath} 出现 DTO/dto render-path 痕迹`);
    }
  }
  return check("runtime raw DTO 边界", errors.length === 0, errors);
}

function checkPlaygroundBoundary(rootDir: string): Check {
  const playgroundDir = join(rootDir, "playground");
  const files = collectFiles(playgroundDir, (filePath) =>
    /\.(ts|tsx)$/.test(filePath),
  );
  const errors: string[] = [];
  for (const filePath of files) {
    const source = readText(filePath) ?? "";
    if (
      /from\s+['"][^'"]*integrations\/(api|adapters|fixtures|tracking|mock|mock-data)[^'"]*['"]/.test(
        source,
      )
    ) {
      errors.push(
        `${relative(process.cwd(), filePath)} import integrations API/adapter/fixture/tracking/mock/mock-data`,
      );
    }
  }
  return check("Playground 数据边界", errors.length === 0, errors);
}

function checkMockTreeShakingBoundary(rootDir: string): Check {
  const apiPath = join(rootDir, "integrations", "api.ts");
  const source = readText(apiPath);
  if (!source) {
    return skipped("mock tree-shaking 边界", "缺少 integrations/api.ts");
  }

  const errors: string[] = [];
  const staticMockImport =
    /^\s*import\s+(?:[^'"]+\s+from\s+)?['"][^'"]*\.\/mock(?:\/[^'"]*)?['"];?/m.test(
      source,
    );
  const staticFixtureImport =
    /^\s*import\s+(?:[^'"]+\s+from\s+)?['"][^'"]*\.\/fixtures(?:\/[^'"]*)?['"];?/m.test(
      source,
    );

  if (staticMockImport) {
    errors.push(
      "integrations/api.ts 顶层静态 import mock；应使用 import('./mock')",
    );
  }
  if (staticFixtureImport) {
    errors.push(
      "integrations/api.ts 顶层静态 import fixtures；fixture 只能经 mock/adapter test 使用",
    );
  }
  if (
    source.includes("VITE_USE_MOCK") &&
    !/import\(\s*['"]\.\/mock['"]\s*\)/.test(source)
  ) {
    errors.push(
      "integrations/api.ts 使用 VITE_USE_MOCK 但没有动态 import('./mock')",
    );
  }

  return check("mock tree-shaking 边界", errors.length === 0, errors);
}

function printCompact(options: Options, checks: Check[]): string {
  const failed = checks.filter((item) => !item.passed && !item.skipped);
  const skippedCount = checks.filter((item) => item.skipped).length;
  const passedCount = checks.length - failed.length - skippedCount;
  const target = options.adapter
    ? `adapter ${options.adapter}`
    : options.section
      ? options.section
      : "campaign";
  const lines = [
    `${failed.length > 0 ? "FAIL" : "OK"} validate-integration ${options.campaign} ${target}`,
    `checks: ${passedCount}/${checks.length} passed, skipped: ${skippedCount}`,
  ];

  for (const item of failed) {
    lines.push("", `- ${item.name}`);
    for (const error of item.errors) {
      lines.push(`  ${error}`);
    }
  }

  return lines.join("\n");
}

function printVerbose(options: Options, checks: Check[]): string {
  return JSON.stringify(
    {
      campaign: options.campaign,
      section: options.section ?? null,
      adapter: options.adapter ?? null,
      checks,
      summary: {
        total: checks.length,
        passed: checks.filter((item) => item.passed && !item.skipped).length,
        failed: checks.filter((item) => !item.passed && !item.skipped).length,
        skipped: checks.filter((item) => item.skipped).length,
      },
    },
    null,
    2,
  );
}

function main(argv = process.argv.slice(2)): void {
  const options = parseArgs(argv);
  const structure = checkStructureFile(options);
  const checks: Check[] = [...structure.checks];

  const dynamicRows = structure.dynamicRows;
  checks.push(checkContracts(options.rootDir, dynamicRows));
  const adapterResult = checkAdapters(
    options.rootDir,
    dynamicRows,
    options.adapter,
  );
  checks.push(...adapterResult.checks);
  checks.push(checkAdapterTestsRun(adapterResult.testFiles));
  checks.push(checkDefaultContentLeak(options.rootDir));
  checks.push(checkRuntimeDtoLeak(options.rootDir));
  checks.push(checkPlaygroundBoundary(options.rootDir));
  checks.push(checkMockTreeShakingBoundary(options.rootDir));

  process.stdout.write(
    (options.verbose
      ? printVerbose(options, checks)
      : printCompact(options, checks)) + "\n",
  );

  if (checks.some((item) => !item.passed && !item.skipped)) {
    process.exit(1);
  }
}

main();
