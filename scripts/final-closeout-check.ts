#!/usr/bin/env tsx
import { existsSync } from 'fs';
import { join } from 'path';

interface Options {
  campaign: string;
}

function parseArgs(argv: string[]): Options {
  let campaign = '';

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--campaign' && i + 1 < argv.length) {
      campaign = argv[i + 1];
      i++;
    }
  }

  if (!campaign) {
    process.stderr.write(
      'ERROR: 请指定活动名称：pnpm final-closeout-check --campaign <campaign-name>\n',
    );
    process.exit(2);
  }

  return { campaign };
}

function fail(errors: string[]): never {
  process.stderr.write('FAIL final-closeout-check\n');
  for (const error of errors) {
    process.stderr.write(`- ${error}\n`);
  }
  process.exit(1);
}

function main(argv = process.argv.slice(2)): void {
  const { campaign } = parseArgs(argv);
  const rootDir = process.cwd();
  const appDir = join(rootDir, 'apps', campaign);
  const rootFeedbackDir = join(rootDir, '.feedback');
  const appFeedbackDir = join(appDir, '.feedback');
  const progressFile = join(appFeedbackDir, 'progress.md');

  const errors: string[] = [];

  if (!existsSync(appDir)) {
    errors.push(`活动目录不存在：apps/${campaign}`);
  }

  if (existsSync(rootFeedbackDir)) {
    errors.push('根目录仍存在 .feedback/，请先移动到目标活动目录');
  }

  if (!existsSync(appFeedbackDir)) {
    errors.push(`缺少归档目录：apps/${campaign}/.feedback/`);
  }

  if (!existsSync(progressFile)) {
    errors.push(`缺少进度账本：apps/${campaign}/.feedback/progress.md`);
  }

  if (errors.length > 0) {
    fail(errors);
  }

  process.stdout.write(
    `OK final-closeout-check ${campaign}\n反馈归档：apps/${campaign}/.feedback/，根目录无 .feedback/\n`,
  );
}

main();
