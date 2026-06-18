#!/usr/bin/env tsx
import { existsSync } from "fs";
import { mkdirSync, writeFileSync } from "fs";
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

function logPath(campaign: string, sectionName: string): string {
  const logsDir = join(process.cwd(), ".feedback", "logs");
  mkdirSync(logsDir, { recursive: true });
  return join(logsDir, `verify-${campaign}-${sectionName}.log`);
}

function appendLog(path: string, content: string): void {
  writeFileSync(path, content, { flag: "a" });
}

function runStage(
  label: string,
  command: string,
  args: string[],
  logFile: string,
): void {
  process.stdout.write(`[${label}] ${command} ${args.join(" ")}\n`);
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  appendLog(
    logFile,
    [
      `\n$ ${command} ${args.join(" ")}\n`,
      stdout,
      stderr ? `\n[stderr]\n${stderr}` : "",
    ].join(""),
  );

  if (result.error) {
    fatal(String(result.error));
  }
  if (result.status !== 0) {
    if (stdout.trim()) {
      process.stdout.write(stdout.trimEnd() + "\n");
    }
    if (stderr.trim()) {
      process.stderr.write(stderr.trimEnd() + "\n");
    }
    process.stderr.write(`Full log: ${logFile}\n`);
    process.exit(result.status ?? 1);
  }

  process.stdout.write(`[${label}] passed\n`);
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
  const logFile = logPath(campaign, sectionName);

  writeFileSync(
    logFile,
    `verify-section ${campaign}/${sectionName} ${new Date().toISOString()}\n`,
  );

  runStage(
    "1/3 validate",
    "pnpm",
    ["--silent", "validate-section", "--campaign", campaign, sectionName],
    logFile,
  );
  runStage(
    "2/3 generate-spec-tests",
    "pnpm",
    ["--silent", "generate-spec-tests", "--campaign", campaign, sectionName],
    logFile,
  );

  const testTargets = [specTest];
  if (existsSync(regressionTest)) {
    testTargets.push(regressionTest);
  }

  runStage(
    "3/3 vitest",
    "pnpm",
    [
      "--silent",
      "test:unit",
      "--reporter=minimal",
      "--silent=passed-only",
      ...testTargets,
    ],
    logFile,
  );

  process.stdout.write(`verify-section passed. Full log: ${logFile}\n`);
}

main();
