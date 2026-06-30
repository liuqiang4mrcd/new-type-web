#!/usr/bin/env tsx
import { existsSync, readdirSync, readFileSync } from 'fs';
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

function rootDraftsForCampaign(rootFeedbackDir: string, campaign: string): string[] {
  const draftsDir = join(rootFeedbackDir, 'drafts');
  if (!existsSync(draftsDir)) return [];

  const matches: string[] = [];
  for (const entry of readdirSync(draftsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const metaPath = join(draftsDir, entry.name, 'meta.json');
    if (!existsSync(metaPath)) continue;

    try {
      const meta = JSON.parse(readFileSync(metaPath, 'utf-8')) as {
        campaignName?: unknown;
        targetApp?: unknown;
      };
      if (
        meta.campaignName === campaign ||
        meta.targetApp === `apps/${campaign}`
      ) {
        matches.push(`.feedback/drafts/${entry.name}`);
      }
    } catch {
      // Ignore malformed unrelated drafts; integration/implementation gates validate target app feedback.
    }
  }

  return matches;
}

function main(argv = process.argv.slice(2)): void {
  const { campaign } = parseArgs(argv);
  const rootDir = process.cwd();
  const appDir = join(rootDir, 'apps', campaign);
  const rootFeedbackDir = join(rootDir, '.feedback');
  const appFeedbackDir = join(appDir, '.feedback');
  const statusFile = join(appFeedbackDir, 'status.json');
  const progressFile = join(appFeedbackDir, 'progress.md');

  const errors: string[] = [];

  if (!existsSync(appDir)) {
    errors.push(`活动目录不存在：apps/${campaign}`);
  }

  const legacyRootProgress = join(rootFeedbackDir, 'progress.md');
  if (existsSync(legacyRootProgress)) {
    errors.push('根目录存在旧式 .feedback/progress.md，请迁移到目标活动目录或 drafts 工作区');
  }

  const rootDraftMatches = rootDraftsForCampaign(rootFeedbackDir, campaign);
  if (rootDraftMatches.length > 0) {
    errors.push(
      `目标活动仍存在 root draft：${rootDraftMatches.join(', ')}，请迁移到 apps/${campaign}/.feedback/`,
    );
  }

  if (!existsSync(appFeedbackDir)) {
    errors.push(`缺少反馈账本目录：apps/${campaign}/.feedback/`);
  }

  if (!existsSync(progressFile)) {
    errors.push(`缺少审计日志：apps/${campaign}/.feedback/progress.md`);
  }

  if (!existsSync(statusFile)) {
    errors.push(`缺少状态真源：apps/${campaign}/.feedback/status.json`);
  } else {
    try {
      const status = JSON.parse(readFileSync(statusFile, 'utf-8')) as {
        campaignName?: unknown;
        targetApp?: unknown;
        phase?: unknown;
        sections?: unknown;
      };
      if (status.campaignName !== campaign) {
        errors.push(`status.json campaignName 不匹配：期望 ${campaign}`);
      }
      if (status.targetApp !== `apps/${campaign}`) {
        errors.push(`status.json targetApp 不匹配：期望 apps/${campaign}`);
      }
      if (typeof status.phase !== 'string') {
        errors.push('status.json 缺少 phase');
      }
      if (!Array.isArray(status.sections)) {
        errors.push('status.json 缺少 sections[]');
      }
    } catch {
      errors.push('status.json 格式错误，无法解析');
    }
  }

  if (errors.length > 0) {
    fail(errors);
  }

  process.stdout.write(
    `OK final-closeout-check ${campaign}\n反馈账本：apps/${campaign}/.feedback/，目标活动无 root draft\n`,
  );
}

main();
