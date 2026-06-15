#!/usr/bin/env tsx
import { join } from 'path';
import { readFileSafe } from './section-validator/discovery';
import { discoverSectionNames } from './section-validator/discovery';
import { validateSection } from './section-validator/checks';
import { buildReport, printReport } from './section-validator/report';
import type { CliOptions } from './section-validator/types';

const CAMPAIGN_SRC = join(process.cwd(), 'apps', 'campaign-template', 'src');

function parseArgs(argv: string[]): CliOptions {
  if (argv.length === 0) {
    return { all: false, rootDir: CAMPAIGN_SRC };
  }
  if (argv[0] === '--all') {
    return { all: true, rootDir: CAMPAIGN_SRC };
  }
  return { all: false, sectionName: argv[0], rootDir: CAMPAIGN_SRC };
}

function fatal(message: string): never {
  process.stderr.write(`ERROR: ${message}\n`);
  process.exit(2);
}

async function main(argv = process.argv.slice(2)): Promise<void> {
  const options = parseArgs(argv);

  // Determine section names to validate
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

  // Read global files once
  const registryPath = join(options.rootDir, 'playground', 'section-registry.ts');
  const storePath = join(options.rootDir, 'integrations', 'store.ts');

  const registryResult = readFileSafe(registryPath);
  if (!registryResult.ok) {
    fatal(registryResult.error);
  }
  const storeResult = readFileSafe(storePath);
  if (!storeResult.ok) {
    fatal(storeResult.error);
  }

  const registrySource = registryResult.ok ? registryResult.text : '';
  const storeSource = storeResult.ok ? storeResult.text : '';

  // Validate each section
  const results = sectionNames.map((name) =>
    validateSection(name, options.rootDir, registrySource, storeSource),
  );

  // Build and print report
  const report = buildReport(
    options.all ? 'all' : options.sectionName!,
    results,
  );
  process.stdout.write(printReport(report) + '\n');

  // Exit code
  if (report.summary.failedSections > 0 || report.summary.failedChecks > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  fatal(String(e));
});
