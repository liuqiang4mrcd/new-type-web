#!/usr/bin/env tsx
import { join } from 'path';
import { existsSync } from 'fs';
import { readFileSafe, discoverSectionNames } from './section-validator/discovery';
import { validateSection } from './section-validator/checks';
import { buildReport, printReport } from './section-validator/report';
import type { CliOptions } from './section-validator/types';

function parseArgs(argv: string[]): CliOptions & { campaign?: string } {
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

  const CAMPAIGN_SRC = join(process.cwd(), 'apps', campaign, 'src');

  if (!existsSync(CAMPAIGN_SRC)) {
    process.stderr.write(`ERROR: 活动目录不存在: ${CAMPAIGN_SRC}\n`);
    process.exit(2);
  }

  if (remaining.length === 0) {
    return { all: false, rootDir: CAMPAIGN_SRC, campaign };
  }
  if (remaining[0] === '--all') {
    return { all: true, rootDir: CAMPAIGN_SRC, campaign };
  }
  return { all: false, sectionName: remaining[0], rootDir: CAMPAIGN_SRC, campaign };
}

function fatal(message: string): never {
  process.stderr.write(`ERROR: ${message}\n`);
  process.exit(2);
}

async function main(argv = process.argv.slice(2)): Promise<void> {
  const options = parseArgs(argv);

  let sectionNames: string[];
  if (options.all) {
    sectionNames = discoverSectionNames(options.rootDir);
    if (sectionNames.length === 0) {
      fatal('未找到任何 Section（designer/sections/ 目录为空或不存在）');
    }
  } else if (options.sectionName) {
    sectionNames = [options.sectionName];
  } else {
    fatal('请指定 Section 名称（如 HeroSection）或使用 --all 验证全部');
  }

  const registryPath = join(options.rootDir, 'playground', 'section-registry.ts');
  const storePath = join(options.rootDir, 'integrations', 'store.ts');
  const phonePreviewPath = join(options.rootDir, 'playground', 'phone-preview.tsx');

  const registryResult = readFileSafe(registryPath);
  if (!registryResult.ok) {
    fatal(registryResult.error);
  }
  const storeResult = readFileSafe(storePath);
  if (!storeResult.ok) {
    fatal(storeResult.error);
  }
  const phonePreviewResult = readFileSafe(phonePreviewPath);
  if (!phonePreviewResult.ok) {
    fatal(phonePreviewResult.error);
  }

  const registrySource = registryResult.ok ? registryResult.text : '';
  const storeSource = storeResult.ok ? storeResult.text : '';
  const phonePreviewSource = phonePreviewResult.ok ? phonePreviewResult.text : '';

  const results = sectionNames.map((name) =>
    validateSection(
      name,
      options.rootDir,
      registrySource,
      storeSource,
      phonePreviewSource,
    ),
  );

  const report = buildReport(
    options.all ? 'all' : options.sectionName!,
    results,
  );
  process.stdout.write(printReport(report) + '\n');

  if (report.summary.failedSections > 0 || report.summary.failedChecks > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  fatal(String(e));
});
