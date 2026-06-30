import fsExtra from 'fs-extra';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import prompts from 'prompts';

const { copy, ensureDir, pathExists } = fsExtra;
const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const __dirname = dirname(fileURLToPath(import.meta.url));

function validateName(value: string): true | string {
  if (!value) return '请输入活动名称';
  if (!NAME_PATTERN.test(value)) {
    return '活动名称只能使用小写字母、数字和中划线，且不能以中划线开头或结尾';
  }
  if (value === 'campaign-template') {
    return 'campaign-template 是模板项目，不能作为新活动名称';
  }
  return true;
}

async function main() {
  const argName = process.argv[2]?.trim();
  const argValidation = argName ? validateName(argName) : true;
  if (argValidation !== true) {
    throw new Error(argValidation);
  }

  const response = argName
    ? { name: argName }
    : await prompts({
        type: 'text',
        name: 'name',
        message: '活动页名称（如 campaign-2026-new-year）',
        validate: validateName,
      });

  const campaignName = response.name;
  if (!campaignName) {
    throw new Error('已取消创建活动页');
  }

  const templateDir = resolve(__dirname, '../apps/campaign-template');
  const targetDir = resolve(__dirname, `../apps/${campaignName}`);

  if (await pathExists(targetDir)) {
    throw new Error(`目标项目已存在: ${targetDir}`);
  }

  await copy(templateDir, targetDir, {
    filter: (src) => {
      const rel = relative(templateDir, src);
      if (!rel) return true;
      const [topLevel] = rel.split(/[/\\]/);
      return !['dist', 'node_modules'].includes(topLevel);
    },
  });

  const pkgPath = `${targetDir}/package.json`;
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  pkg.name = `@new-type/${campaignName}`;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  const feedbackDir = `${targetDir}/.feedback`;
  await ensureDir(feedbackDir);
  const createdAt = new Date().toISOString();
  writeFileSync(
    `${feedbackDir}/meta.json`,
    JSON.stringify(
      {
        status: 'active',
        campaignName,
        targetApp: `apps/${campaignName}`,
        createdAt,
      },
      null,
      2,
    ) + '\n',
  );
  writeFileSync(
    `${feedbackDir}/status.json`,
    JSON.stringify(
      {
        campaignName,
        targetApp: `apps/${campaignName}`,
        mode: 'new-project',
        phase: 'created',
        gate: 'feedback-init',
        currentSection: null,
        confirmedForImplementation: false,
        sections: [],
        updatedAt: createdAt,
      },
      null,
      2,
    ) + '\n',
  );
  writeFileSync(
    `${feedbackDir}/progress.md`,
    [
      '# Designer 审计记录',
      '',
      '| 时间 | 阶段 | Section | 命令/动作 | 结果 |',
      '|---|---|---|---|---|',
      `| ${createdAt} | created | - | pnpm create-campaign ${campaignName} | 已初始化 feedback 工作区 |`,
      '',
    ].join('\n'),
  );

  console.log(`活动页 "${campaignName}" 已创建: ${targetDir}`);
  console.log(`Feedback 工作区已初始化: ${feedbackDir}`);
  console.log('运行 "pnpm install" 安装依赖后即可开发');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
