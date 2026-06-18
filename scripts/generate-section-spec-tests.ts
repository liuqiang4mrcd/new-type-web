#!/usr/bin/env tsx
/**
 * Spec-first Section test generator.
 *
 * Source of truth: Component Card "Acceptance Tests" YAML block.
 * Output: apps/<campaign>/src/designer/sections/<SectionName>/__tests__/<SectionName>.spec.test.tsx
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import { buildSectionNaming } from "./section-validator/discovery";

type Scalar = string | number | boolean;
type ParsedObject = Record<string, Scalar | ParsedObject>;

interface CliOptions {
  campaign: string;
  sectionName?: string;
  all: boolean;
  rootDir: string;
}

interface AcceptanceTest {
  id: string;
  type?: string;
  level?: string;
  behavior?: string;
  description?: string;
  given?: Record<string, Scalar>;
  target?: Record<string, Scalar>;
  action?: Record<string, Scalar>;
  expect?: Record<string, Scalar>;
  followup?: {
    target?: Record<string, Scalar>;
    action?: Record<string, Scalar>;
    expect?: Record<string, Scalar>;
  };
}

const SUPPORTED_TEST_KEYS = new Set([
  "id",
  "type",
  "level",
  "behavior",
  "description",
  "given",
  "target",
  "action",
  "expect",
  "followup",
]);

const SUPPORTED_GROUP_KEYS = new Set([
  "given",
  "target",
  "action",
  "expect",
  "followup",
]);
const SUPPORTED_FOLLOWUP_KEYS = new Set(["target", "action", "expect"]);
const SUPPORTED_TARGET_KEYS = new Set([
  "role",
  "name",
  "label",
  "text",
  "testId",
]);
const SUPPORTED_ACTION_KEYS = new Set(["click", "typeText"]);
const SUPPORTED_EXPECT_KEYS = new Set([
  "visibleText",
  "hiddenText",
  "testIdVisible",
  "testIdHidden",
  "actionCalled",
  "times",
  "disabled",
  "enabled",
  "hasClass",
  "notHasClass",
]);

function parseArgs(argv: string[]): CliOptions {
  let campaign = "campaign-template";
  const remaining: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--campaign" && i + 1 < argv.length) {
      campaign = argv[i + 1];
      i++;
    } else {
      remaining.push(argv[i]);
    }
  }

  const rootDir = join(process.cwd(), "apps", campaign, "src");
  if (!existsSync(rootDir)) {
    fatal(`活动目录不存在: ${rootDir}`);
  }

  if (remaining[0] === "--all") {
    return { campaign, all: true, rootDir };
  }
  if (!remaining[0]) {
    fatal("请指定 Section 名称或使用 --all");
  }
  return { campaign, all: false, sectionName: remaining[0], rootDir };
}

function fatal(message: string): never {
  process.stderr.write(`ERROR: ${message}\n`);
  process.exit(2);
}

function findSectionCards(campaign: string, sectionName?: string): string[] {
  const candidates = [
    join(process.cwd(), ".feedback", "sections"),
    join(process.cwd(), "apps", campaign, ".feedback", "sections"),
  ];

  const cardPaths: string[] = [];
  for (const dir of candidates) {
    if (!existsSync(dir)) continue;
    if (sectionName) {
      const file = join(dir, `${sectionName}.md`);
      if (existsSync(file)) {
        return [file];
      }
    }
  }

  if (sectionName) {
    fatal(
      `未找到组件设计卡: .feedback/sections/${sectionName}.md 或 apps/${campaign}/.feedback/sections/${sectionName}.md`,
    );
  }

  for (const dir of candidates) {
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir)) {
      if (entry.endsWith(".md")) {
        cardPaths.push(join(dir, entry));
      }
    }
  }

  return cardPaths;
}

function sectionNameFromCardPath(cardPath: string): string {
  return cardPath.split("/").pop()!.replace(/\.md$/, "");
}

function extractAcceptanceYaml(markdown: string, cardPath: string): string {
  const headingIndex = markdown.search(/^##\s+Acceptance Tests\s*$/m);
  if (headingIndex < 0) {
    fatal(`组件设计卡缺少 "## Acceptance Tests": ${cardPath}`);
  }

  const afterHeading = markdown.slice(headingIndex);
  const fence = afterHeading.match(/```(?:yaml|yml)\s*\n([\s\S]*?)```/);
  if (!fence) {
    fatal(`Acceptance Tests 必须包含 yaml 代码块: ${cardPath}`);
  }

  return fence[1];
}

function parseScalar(raw: string): Scalar {
  const value = raw.trim();
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+$/.test(value)) return Number(value);
  return value.replace(/^["']|["']$/g, "");
}

function parseKeyValue(text: string): { key: string; value?: Scalar } {
  const index = text.indexOf(":");
  if (index < 0) {
    fatal(`YAML 行缺少冒号: ${text}`);
  }
  const key = text.slice(0, index).trim();
  const rawValue = text.slice(index + 1).trim();
  return rawValue ? { key, value: parseScalar(rawValue) } : { key };
}

function parseAcceptanceTests(
  yaml: string,
  cardPath: string,
): AcceptanceTest[] {
  const lines = yaml
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+#.*$/, ""))
    .filter((line) => line.trim().length > 0);

  if (!lines.some((line) => line.trim() === "tests:")) {
    fatal(`Acceptance Tests YAML 缺少 tests 根字段: ${cardPath}`);
  }

  const tests: ParsedObject[] = [];
  const stack: Array<{ indent: number; object: ParsedObject }> = [];

  for (const line of lines) {
    const indent = line.match(/^ */)![0].length;
    const trimmed = line.trim();

    if (trimmed === "tests:") continue;

    if (trimmed.startsWith("- ")) {
      if (indent !== 2) {
        fatal(`tests 列表项必须使用两个空格缩进: ${cardPath}`);
      }
      const test: ParsedObject = {};
      tests.push(test);
      stack.length = 0;
      stack.push({ indent, object: test });

      const rest = trimmed.slice(2).trim();
      if (rest) {
        const { key, value } = parseKeyValue(rest);
        if (value === undefined) {
          const child: ParsedObject = {};
          test[key] = child;
          stack.push({ indent: indent + 2, object: child });
        } else {
          test[key] = value;
        }
      }
      continue;
    }

    while (stack.length > 0 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1]?.object;
    if (!parent) {
      fatal(`无法解析 YAML 行: ${line}`);
    }

    const { key, value } = parseKeyValue(trimmed);
    if (value === undefined) {
      const child: ParsedObject = {};
      parent[key] = child;
      stack.push({ indent, object: child });
    } else {
      parent[key] = value;
    }
  }

  if (tests.length === 0) {
    fatal(`Acceptance Tests YAML 至少需要一条测试: ${cardPath}`);
  }

  return tests as AcceptanceTest[];
}

function ensureRecord(
  value: unknown,
  field: string,
  test: AcceptanceTest,
  cardPath: string,
): Record<string, Scalar> {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fatal(`字段 ${field} 必须是对象: ${cardPath} / ${test.id}`);
  }
  return value as Record<string, Scalar>;
}

function assertAllowedKeys(
  object: Record<string, unknown>,
  allowed: Set<string>,
  scope: string,
  test: AcceptanceTest,
  cardPath: string,
): void {
  for (const key of Object.keys(object)) {
    if (!allowed.has(key)) {
      fatal(
        `unsupported acceptance test field: ${scope}.${key} (${cardPath} / ${test.id})`,
      );
    }
  }
}

function validateTest(test: AcceptanceTest, cardPath: string): boolean {
  if (!test.id || typeof test.id !== "string") {
    fatal(`每条 Acceptance Test 必须声明字符串 id: ${cardPath}`);
  }

  assertAllowedKeys(
    test as unknown as Record<string, unknown>,
    SUPPORTED_TEST_KEYS,
    "test",
    test,
    cardPath,
  );

  if (test.level === "playwright") {
    return false;
  }
  if (test.level && test.level !== "vitest") {
    fatal(`unsupported test level: ${test.level} (${cardPath} / ${test.id})`);
  }

  for (const group of ["given", "target", "action", "expect"] as const) {
    if (test[group]) {
      if (!SUPPORTED_GROUP_KEYS.has(group)) {
        fatal(`unsupported group: ${group} (${cardPath} / ${test.id})`);
      }
    }
  }

  assertAllowedKeys(
    ensureRecord(test.target, "target", test, cardPath),
    SUPPORTED_TARGET_KEYS,
    "target",
    test,
    cardPath,
  );
  assertAllowedKeys(
    ensureRecord(test.action, "action", test, cardPath),
    SUPPORTED_ACTION_KEYS,
    "action",
    test,
    cardPath,
  );
  assertAllowedKeys(
    ensureRecord(test.expect, "expect", test, cardPath),
    SUPPORTED_EXPECT_KEYS,
    "expect",
    test,
    cardPath,
  );

  if (test.followup) {
    assertAllowedKeys(
      test.followup,
      SUPPORTED_FOLLOWUP_KEYS,
      "followup",
      test,
      cardPath,
    );
    assertAllowedKeys(
      ensureRecord(test.followup.target, "followup.target", test, cardPath),
      SUPPORTED_TARGET_KEYS,
      "followup.target",
      test,
      cardPath,
    );
    assertAllowedKeys(
      ensureRecord(test.followup.action, "followup.action", test, cardPath),
      SUPPORTED_ACTION_KEYS,
      "followup.action",
      test,
      cardPath,
    );
    assertAllowedKeys(
      ensureRecord(test.followup.expect, "followup.expect", test, cardPath),
      SUPPORTED_EXPECT_KEYS,
      "followup.expect",
      test,
      cardPath,
    );
  }

  return true;
}

function quote(value: Scalar | undefined): string {
  return JSON.stringify(String(value ?? ""));
}

function buildContentExpression(test: AcceptanceTest): string {
  const given = ensureRecord(test.given, "given", test, "generated");
  const contentState = given.contentState;
  if (contentState) {
    return `{ ...defaultContent, ...(stateData.${contentState} ?? {}) }`;
  }
  return "defaultContent";
}

function collectActionNames(tests: AcceptanceTest[]): string[] {
  const names = new Set<string>();
  for (const test of tests) {
    const expected = ensureRecord(
      test.expect,
      "expect",
      test,
      "generated",
    ).actionCalled;
    if (expected) names.add(String(expected));
    const followupExpected = test.followup
      ? ensureRecord(test.followup.expect, "followup.expect", test, "generated")
          .actionCalled
      : undefined;
    if (followupExpected) names.add(String(followupExpected));
  }
  return Array.from(names).sort();
}

function selectorExpression(target: Record<string, Scalar>): string {
  if (target.role && target.name) {
    return `screen.getByRole(${quote(target.role)}, { name: ${quote(target.name)} })`;
  }
  if (target.label) {
    return `screen.getByLabelText(${quote(target.label)})`;
  }
  if (target.text) {
    return `screen.getByText(${quote(target.text)})`;
  }
  if (target.testId) {
    return `screen.getByTestId(${quote(target.testId)})`;
  }
  fatal("target 必须包含 role+name、label、text 或 testId");
}

function queryExpressionByText(text: Scalar): string {
  return `screen.queryByText(${quote(text)})`;
}

function renderLines(
  baseName: string,
  test: AcceptanceTest,
  actionNames: string[],
): string[] {
  const actionsProp =
    actionNames.length > 0
      ? ` actions={{ ${actionNames.map((name) => `${name}: ${name}Mock`).join(", ")} }}`
      : "";
  return [
    `    render(<${baseName}Section content={${buildContentExpression(test)}}${actionsProp} />);`,
  ];
}

function actionLines(
  target: Record<string, Scalar>,
  action: Record<string, Scalar>,
): string[] {
  const lines: string[] = [];
  if (action.click === true) {
    lines.push(`    await user.click(${selectorExpression(target)});`);
  }
  if (typeof action.typeText === "string") {
    lines.push(
      `    await user.type(${selectorExpression(target)}, ${quote(action.typeText)});`,
    );
  }
  return lines;
}

function expectationLines(
  target: Record<string, Scalar>,
  expected: Record<string, Scalar>,
): string[] {
  const lines: string[] = [];

  if (expected.visibleText) {
    lines.push(
      `    expect(screen.getByText(${quote(expected.visibleText)})).toBeInTheDocument();`,
    );
  }
  if (expected.hiddenText) {
    lines.push(
      `    expect(${queryExpressionByText(expected.hiddenText)}).not.toBeInTheDocument();`,
    );
  }
  if (expected.testIdVisible) {
    lines.push(
      `    expect(screen.getByTestId(${quote(expected.testIdVisible)})).toBeInTheDocument();`,
    );
  }
  if (expected.testIdHidden) {
    lines.push(
      `    expect(screen.queryByTestId(${quote(expected.testIdHidden)})).not.toBeInTheDocument();`,
    );
  }
  if (expected.actionCalled) {
    const times = expected.times ?? 1;
    lines.push(
      `    expect(${String(expected.actionCalled)}Mock).toHaveBeenCalledTimes(${times});`,
    );
  }
  if (expected.disabled === true) {
    lines.push(`    expect(${selectorExpression(target)}).toBeDisabled();`);
  }
  if (expected.enabled === true) {
    lines.push(`    expect(${selectorExpression(target)}).toBeEnabled();`);
  }
  if (expected.hasClass) {
    lines.push(
      `    expect(${selectorExpression(target)}).toHaveClass(${quote(expected.hasClass)});`,
    );
  }
  if (expected.notHasClass) {
    lines.push(
      `    expect(${selectorExpression(target)}).not.toHaveClass(${quote(expected.notHasClass)});`,
    );
  }

  if (lines.length === 0) {
    fatal("expect 至少需要一个支持的断言字段");
  }
  return lines;
}

function generateTestContent(
  sectionName: string,
  tests: AcceptanceTest[],
): string {
  const naming = buildSectionNaming(sectionName);
  const actionNames = collectActionNames(tests);
  const usesStateData = tests.some(
    (test) => ensureRecord(test.given, "given", test, "generated").contentState,
  );
  const usesUserEvent = tests.some((test) => {
    const action = ensureRecord(test.action, "action", test, "generated");
    const followupAction = test.followup
      ? ensureRecord(test.followup.action, "followup.action", test, "generated")
      : {};
    return (
      action.click === true ||
      typeof action.typeText === "string" ||
      followupAction.click === true ||
      typeof followupAction.typeText === "string"
    );
  });
  const imports = usesStateData
    ? `import { defaultContent, stateData } from '../content';`
    : `import { defaultContent } from '../content';`;
  const vitestImports =
    actionNames.length > 0
      ? "import { describe, expect, it, vi } from 'vitest';"
      : "import { describe, expect, it } from 'vitest';";
  const userEventImport = usesUserEvent
    ? "import userEvent from '@testing-library/user-event';\n"
    : "";
  const userSetup = usesUserEvent
    ? "\nconst user = userEvent.setup();\n"
    : "\n";

  const cases = tests.map((test) => {
    const target = ensureRecord(test.target, "target", test, "generated");
    const action = ensureRecord(test.action, "action", test, "generated");
    const expected = ensureRecord(test.expect, "expect", test, "generated");
    const description = test.behavior || test.description || test.id;
    const lines: string[] = [];

    for (const actionName of actionNames) {
      lines.push(`    const ${actionName}Mock = vi.fn();`);
    }
    lines.push(...renderLines(naming.baseName, test, actionNames));
    lines.push(...actionLines(target, action));
    lines.push(...expectationLines(target, expected));

    if (test.followup) {
      const followupTarget = ensureRecord(
        test.followup.target,
        "followup.target",
        test,
        "generated",
      );
      const followupAction = ensureRecord(
        test.followup.action,
        "followup.action",
        test,
        "generated",
      );
      const followupExpect = ensureRecord(
        test.followup.expect,
        "followup.expect",
        test,
        "generated",
      );
      lines.push(...actionLines(followupTarget, followupAction));
      lines.push(...expectationLines(followupTarget, followupExpect));
    }

    return `  it(${quote(description)}, async () => {
${lines.join("\n")}
  });`;
  });

  return `// @generated from Component Card Acceptance Tests. Do not edit directly.
import { render, screen } from '@testing-library/react';
${userEventImport}${vitestImports}
import { ${naming.baseName}Section } from '../index';
${imports}
${userSetup}

describe('${naming.baseName}Section spec acceptance', () => {
${cases.join("\n\n")}
});
`;
}

function generateForCard(campaign: string, cardPath: string): boolean {
  const sectionName = sectionNameFromCardPath(cardPath);
  const markdown = readFileSync(cardPath, "utf-8");
  const yaml = extractAcceptanceYaml(markdown, cardPath);
  const parsed = parseAcceptanceTests(yaml, cardPath);
  const vitestTests = parsed.filter((test) => validateTest(test, cardPath));

  if (vitestTests.length === 0) {
    process.stdout.write(`  SKIP ${sectionName}: 仅包含非 Vitest 验收项\n`);
    return false;
  }

  const testDir = join(
    process.cwd(),
    "apps",
    campaign,
    "src",
    "designer",
    "sections",
    sectionName,
    "__tests__",
  );
  mkdirSync(testDir, { recursive: true });

  const testPath = join(testDir, `${sectionName}.spec.test.tsx`);
  writeFileSync(
    testPath,
    generateTestContent(sectionName, vitestTests),
    "utf-8",
  );
  process.stdout.write(`  GEN ${sectionName}: ${testPath}\n`);
  return true;
}

function main(argv = process.argv.slice(2)): void {
  const options = parseArgs(argv);
  const cards = findSectionCards(options.campaign, options.sectionName);
  if (cards.length === 0) {
    fatal("未找到任何组件设计卡");
  }

  process.stdout.write(`生成规格测试 (campaign: ${options.campaign})\n`);
  process.stdout.write("---\n");

  let generated = 0;
  let skipped = 0;
  for (const card of cards) {
    if (generateForCard(options.campaign, card)) generated++;
    else skipped++;
  }

  process.stdout.write("---\n");
  process.stdout.write(`完成: 生成 ${generated} 个, 跳过 ${skipped} 个\n`);
}

main();
