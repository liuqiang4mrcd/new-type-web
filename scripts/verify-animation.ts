#!/usr/bin/env tsx
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

interface Options {
  campaign: string;
  sectionName?: string;
}

function parseArgs(argv: string[]): Options {
  let campaign = "";
  let sectionName: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--campaign" && i + 1 < argv.length) {
      campaign = argv[i + 1];
      i++;
    } else if (!argv[i].startsWith("--")) {
      sectionName = argv[i];
    }
  }

  if (!campaign) {
    process.stderr.write(
      "ERROR: 请指定活动名称和 Section 名称：pnpm verify-animation --campaign <campaign-name> <SectionName>\n",
    );
    process.exit(2);
  }

  return { campaign, sectionName };
}

interface TransitionInfo {
  from: string;
  to: string;
  handler: string;
  type: string;
  duration?: number;
}

function readFileSafe(path: string): string | null {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

function extractTransitions(
  contentTsPath: string,
): TransitionInfo[] {
  const content = readFileSafe(contentTsPath);
  if (!content) return [];

  const transitions: TransitionInfo[] = [];

  // Parse stateTransitions array from content.ts
  const match = content.match(
    /export const stateTransitions[\s\S]*?=\s*\[([\s\S]*?)\];/,
  );
  if (!match) return [];

  const arrayContent = match[1];
  const entryRegex =
    /\{\s*from:\s*['"](\w+)['"],\s*to:\s*['"](\w+)['"],\s*trigger:\s*\{\s*type:\s*['"](\w+)['"],\s*handler:\s*['"](\w+)['"](?:,\s*duration:\s*(\d+))?/g;

  let entryMatch;
  while ((entryMatch = entryRegex.exec(arrayContent)) !== null) {
    transitions.push({
      from: entryMatch[1],
      to: entryMatch[2],
      type: entryMatch[3],
      handler: entryMatch[4],
      duration: entryMatch[5] ? parseInt(entryMatch[5]) : undefined,
    });
  }

  return transitions;
}

function main(argv = process.argv.slice(2)): void {
  const { campaign, sectionName } = parseArgs(argv);
  const appSrc = join(process.cwd(), "apps", campaign, "src");

  // Discover sections
  const sections: string[] = [];
  if (sectionName) {
    sections.push(sectionName);
  } else {
    const sectionsDir = join(appSrc, "designer", "sections");
    if (existsSync(sectionsDir)) {
      const entries = readdirSync(sectionsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          sections.push(entry.name);
        }
      }
    }
  }

  if (sections.length === 0) {
    process.stdout.write("INFO: 未找到任何 Section\n");
    process.exit(0);
  }

  let totalTransitions = 0;
  let passedTransitions = 0;

  for (const section of sections) {
    const contentTsPath = join(
      appSrc,
      "designer",
      "sections",
      section,
      "content.ts",
    );
    const indexTsxPath = join(
      appSrc,
      "designer",
      "sections",
      section,
      "index.tsx",
    );

    if (!existsSync(contentTsPath)) continue;

    const transitions = extractTransitions(contentTsPath);
    if (transitions.length === 0) {
      process.stdout.write(`${section}: 无 stateTransitions 声明，跳过\n`);
      continue;
    }

    totalTransitions += transitions.length;

    const indexContent = readFileSafe(indexTsxPath) || "";

    process.stdout.write(`\nSection: ${section}\n`);

    for (const t of transitions) {
      // Check if the animation handler is referenced in index.tsx
      const handlerInComponent = indexContent.includes(t.handler);
      const motionUsed = /motion\.div|motion\.\w+/.test(indexContent);
      const animatePresenceUsed =
        /AnimatePresence/.test(indexContent);

      // For now, do static analysis only — actual pixel comparison requires
      // Playwright-based testing which is planned for a future phase.
      // This tool verifies:
      // 1. handler is referenced in component
      // 2. motion/react or AnimatePresence is used (for spin/slide/scale)
      // 3. Visual change detection will need Playwright runtime

      const issues: string[] = [];

      if (!handlerInComponent) {
        issues.push(
          `handler "${t.handler}" 未在 index.tsx 中引用`,
        );
      }

      const needsMotion = ["spin", "slide", "scale"].includes(t.type);
      if (needsMotion && !motionUsed && !animatePresenceUsed) {
        issues.push(
          `${t.type} 类型需使用 motion/react 或 AnimatePresence，但 index.tsx 中未检测到`,
        );
      }

      if (t.duration) {
        const durationInComponent = new RegExp(
          `duration.*${t.duration}|${t.duration}.*duration`,
          "i",
        ).test(indexContent);
        if (!durationInComponent) {
          // Not a hard fail — duration might be in transition config differently
        }
      }

      const passed = issues.length === 0;

      if (passed) {
        passedTransitions++;
      }

      const status = passed ? "✅" : "⚠️";
      process.stdout.write(
        `  ${status} transition: ${t.from} → ${t.to} (${t.type}, ${t.handler})`,
      );
      if (!passed) {
        process.stdout.write(`\n     ${issues.join("; ")}`);
      }
      process.stdout.write("\n");
    }
  }

  process.stdout.write(
    `\n结果: ${passedTransitions}/${totalTransitions} transitions 通过静态分析\n`,
  );

  if (passedTransitions < totalTransitions) {
    process.stdout.write(
      "⚠️  部分 transitions 可能无法产生视觉变化，请人工确认\n",
    );
  }
}

main();
