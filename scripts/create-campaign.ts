import { copy, readFileSync, writeFileSync } from 'fs-extra';
import { resolve } from 'path';
import prompts from 'prompts';

async function main() {
  const response = await prompts({
    type: 'text',
    name: 'name',
    message: '活动页名称（如 campaign-2026-new-year）',
    validate: (value: string) => (value ? true : '请输入活动名称'),
  });

  const campaignName = response.name;
  const templateDir = resolve(__dirname, '../apps/campaign-template');
  const targetDir = resolve(__dirname, `../apps/${campaignName}`);

  await copy(templateDir, targetDir);

  const pkgPath = `${targetDir}/package.json`;
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  pkg.name = `@new-type/${campaignName}`;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  console.log(`活动页 "${campaignName}" 已创建: ${targetDir}`);
  console.log('运行 "pnpm install" 安装依赖后即可开发');
}

main().catch(console.error);
