#!/usr/bin/env tsx
import { spawnSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

interface Options {
  campaign: string;
}

interface Stage {
  label: string;
  command: string;
  args: string[];
}

function fatal(message: string): never {
  process.stderr.write(`ERROR: ${message}\n`);
  process.exit(2);
}

function parseArgs(argv: string[]): Options {
  let campaign = "";

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--campaign" && i + 1 < argv.length) {
      campaign = argv[i + 1];
      i++;
    }
  }

  if (!campaign) {
    fatal("请指定活动名称：pnpm final-closeout --campaign <campaign-name>");
  }

  const appDir = join(process.cwd(), "apps", campaign);
  if (!existsSync(appDir)) {
    fatal(`活动目录不存在: apps/${campaign}`);
  }

  return { campaign };
}

function safeTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function logPath(campaign: string): string {
  const logsDir = join(process.cwd(), "apps", campaign, ".feedback", "logs");
  mkdirSync(logsDir, { recursive: true });
  return join(logsDir, `final-closeout-${safeTimestamp()}.log`);
}

function appendLog(path: string, content: string): void {
  writeFileSync(path, content, { flag: "a" });
}

function stripAnsi(value: string): string {
  return value.replace(/\u001b\[[0-9;]*m/g, "");
}

function summarizeFailureOutput(stdout: string, stderr: string): string {
  const output = stripAnsi([stdout, stderr].filter(Boolean).join("\n"));
  const lines = output.split(/\r?\n/);
  const summary: string[] = [];
  const seen = new Set<string>();
  const important =
    /(FAIL|Error:|error during build|TestingLibraryElementError|AssertionError|TypeError|ReferenceError|SyntaxError|TS\d+|Rollup failed|Unable to find|Failed Tests|Test Files|Tests\s+\d|sections:|checks:|^\s*[×✕]\s|ERR_PNPM|ELIFECYCLE|src\/|apps\/.*:\d+:\d+)/;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!important.test(line)) continue;

    const normalized = line.trim();
    if (!normalized || seen.has(normalized)) continue;

    seen.add(normalized);
    summary.push(line);
    if (summary.length >= 40) break;
  }

  if (summary.length === 0) {
    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (!line.trim()) continue;
      summary.push(line);
      if (summary.length >= 12) break;
    }
  }

  const text = summary.join("\n");
  return text.length > 5000 ? `${text.slice(0, 5000)}\n...` : text;
}

function runStage(stage: Stage, logFile: string): void {
  const commandLine = `${stage.command} ${stage.args.join(" ")}`;
  process.stdout.write(`[${stage.label}] ${commandLine}\n`);

  const result = spawnSync(stage.command, stage.args, {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";

  appendLog(
    logFile,
    [
      `\n## ${stage.label}\n`,
      `$ ${commandLine}\n`,
      stdout,
      stderr ? `\n[stderr]\n${stderr}` : "",
      `\n[exit] ${result.status ?? 1}\n`,
    ].join(""),
  );

  if (result.error) {
    process.stderr.write(`[${stage.label}] failed to start\n`);
    process.stderr.write(`${String(result.error)}\n`);
    process.stderr.write(`Full log: ${logFile}\n`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.stderr.write(`[${stage.label}] failed with exit code ${result.status ?? 1}\n`);
    const summary = summarizeFailureOutput(stdout, stderr);
    if (summary.trim()) {
      process.stderr.write(`${summary.trimEnd()}\n`);
    }
    process.stderr.write(`Full log: ${logFile}\n`);
    process.exit(result.status ?? 1);
  }

  process.stdout.write(`[${stage.label}] passed\n`);
}

function main(argv = process.argv.slice(2)): void {
  const { campaign } = parseArgs(argv);
  const logFile = logPath(campaign);
  const packageName = `@new-type/${campaign}`;

  writeFileSync(
    logFile,
    `final-closeout ${campaign} ${new Date().toISOString()}\n`,
  );

  const stages: Stage[] = [
    {
      label: "1/4 validate-section-all",
      command: "pnpm",
      args: ["validate-section", "--campaign", campaign, "--all"],
    },
    {
      label: "2/4 vitest",
      command: "pnpm",
      args: [
        "test:unit",
        "--reporter=minimal",
        "--silent=passed-only",
        `apps/${campaign}/src`,
      ],
    },
    {
      label: "3/4 build",
      command: "pnpm",
      args: ["--filter", packageName, "build"],
    },
    {
      label: "4/4 final-closeout-check",
      command: "pnpm",
      args: ["final-closeout-check", "--campaign", campaign],
    },
  ];

  for (const stage of stages) {
    runStage(stage, logFile);
  }

  process.stdout.write(`final-closeout passed. Full log: ${logFile}\n`);
}

main();
