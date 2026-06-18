#!/usr/bin/env tsx
import { existsSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

interface CliOptions {
  campaign: string;
  sectionName: string;
}

function fatal(message: string): never {
  process.stderr.write(`ERROR: ${message}\n`);
  process.exit(2);
}

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

  const sectionName = remaining[0];
  if (!sectionName || sectionName === "--all") {
    fatal("verify-section 只支持单个 Section，请指定 Section 名称");
  }

  const rootDir = join(process.cwd(), "apps", campaign, "src");
  if (!existsSync(rootDir)) {
    fatal(`活动目录不存在: ${rootDir}`);
  }

  return { campaign, sectionName };
}

function run(command: string, args: string[]): void {
  process.stdout.write(`\n$ ${command} ${args.join(" ")}\n`);
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  if (result.error) {
    fatal(String(result.error));
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main(argv = process.argv.slice(2)): void {
  const { campaign, sectionName } = parseArgs(argv);
  const sectionDir = join(
    process.cwd(),
    "apps",
    campaign,
    "src",
    "designer",
    "sections",
    sectionName,
  );
  const testsDir = join(sectionDir, "__tests__");
  const specTest = join(testsDir, `${sectionName}.spec.test.tsx`);
  const regressionTest = join(testsDir, `${sectionName}.regression.test.tsx`);

  run("pnpm", ["validate-section", "--campaign", campaign, sectionName]);
  run("pnpm", ["generate-spec-tests", "--campaign", campaign, sectionName]);

  const testTargets = [specTest];
  if (existsSync(regressionTest)) {
    testTargets.push(regressionTest);
  }

  run("pnpm", ["test:unit", "--", ...testTargets]);
}

main();
