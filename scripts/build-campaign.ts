import { execSync } from 'child_process';

function main() {
  const args = process.argv.slice(2);
  const campaignName = args[0];

  if (!campaignName) {
    console.error('用法: tsx scripts/build-campaign.ts <campaign-name>');
    console.error('示例: tsx scripts/build-campaign.ts campaign-2026-new-year');
    process.exit(1);
  }

  const fullName = campaignName.startsWith('@new-type/')
    ? campaignName
    : `@new-type/${campaignName}`;

  console.log(`构建: ${fullName}`);
  execSync(`npx nx build ${fullName}`, { stdio: 'inherit' });
}

main();
