#!/usr/bin/env tsx
import { existsSync, readFileSync } from "fs";
import { join } from "path";

interface Options {
  feedbackPath: string;
  verbose: boolean;
}

function parseArgs(argv: string[]): Options {
  let feedbackPath = "";
  let verbose = false;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--feedback" && i + 1 < argv.length) {
      feedbackPath = argv[i + 1];
      i++;
    } else if (argv[i] === "--verbose") {
      verbose = true;
    }
  }

  if (!feedbackPath) {
    process.stderr.write(
      "ERROR: 请指定 feedback 工作区路径：pnpm validate-design --feedback <path>\n",
    );
    process.exit(2);
  }

  return { feedbackPath, verbose };
}

interface CheckResult {
  id: string;
  label: string;
  pass: boolean;
  detail?: string;
}

function readFileSafe(path: string): string | null {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

function printResults(results: CheckResult[], verbose: boolean): void {
  const outputResults = verbose ? results : results.filter((r) => !r.pass);

  for (const r of outputResults) {
    const icon = r.pass ? "✅" : "❌";
    const detail = r.detail ? ` — ${r.detail}` : "";
    process.stdout.write(`${icon} ${r.label}${detail}\n`);
  }

  const passCount = results.filter((r) => r.pass).length;
  const failCount = results.length - passCount;
  const prefix = outputResults.length > 0 ? "\n" : "";

  process.stdout.write(`${prefix}结果: ${passCount}/${results.length} 通过`);
  if (failCount > 0) {
    process.stdout.write(`, ${failCount} 失败`);
  }
  process.stdout.write("\n");
}

function main(argv = process.argv.slice(2)): void {
  const { feedbackPath, verbose } = parseArgs(argv);

  const resolvedPath = feedbackPath.startsWith("/")
    ? feedbackPath
    : join(process.cwd(), feedbackPath);

  const designPath = join(resolvedPath, "design.md");
  const structurePath = join(resolvedPath, "structure.md");
  const progressPath = join(resolvedPath, "progress.md");

  const results: CheckResult[] = [];

  // 1. design.md exists
  const designExists = existsSync(designPath);
  results.push({
    id: "1",
    label: "design.md 存在",
    pass: designExists,
    detail: designExists ? undefined : `缺失: ${designPath}`,
  });

  const designContent = readFileSafe(designPath);
  const structureContent = readFileSafe(structurePath);

  // 2. Color scheme declared
  const hasColorScheme =
    designContent !== null &&
    (/主色|主色调|primary|配色|color.*scheme/i.test(designContent) ||
      /#[0-9a-fA-F]{3,8}.+#[0-9a-fA-F]{3,8}/.test(designContent));
  results.push({
    id: "2",
    label: "配色声明完整",
    pass: hasColorScheme,
    detail: hasColorScheme
      ? undefined
      : "design.md 中未找到配色声明（主色、辅助色、中性色、状态色、背景色）",
  });

  // 3. Typography scale declared
  const hasTypography =
    designContent !== null &&
    /字体|font|字号|字重|font-size|font-weight/i.test(designContent);
  results.push({
    id: "3",
    label: "字体层级完整",
    pass: hasTypography,
    detail: hasTypography
      ? undefined
      : "design.md 中未找到字体层级声明（字体族、字号层级、字重、行高）",
  });

  // 4. Key component styles covered
  const keyComponents = [
    "Header", "倒计时", "countdown",
    "Tab", "用户信息", "user-info",
    "进度条", "progress",
    "奖品卡", "prize-card", "reward",
    "CTA", "按钮", "button",
    "弹窗", "modal",
  ];
  const componentsFound = keyComponents.filter(
    (c) => designContent !== null && designContent.toLowerCase().includes(c.toLowerCase()),
  );
  const hasComponentStyles = componentsFound.length >= 3;
  results.push({
    id: "4",
    label: "关键组件样式覆盖",
    pass: hasComponentStyles,
    detail: hasComponentStyles
      ? `已覆盖: ${componentsFound.join(", ")}`
      : `design.md 中关键组件样式覆盖不足（命中 ${componentsFound.length}/9 类）`,
  });

  // 5. Image Asset Inventory placeholder alignment
  const structureHasImages =
    structureContent !== null &&
    /\|.*imageKey.*\|.*Section.*\|.*imageType/i.test(structureContent);
  let placeholderAligned = true;
  let placeholderDetail = "structure.md 无 Image Asset Inventory，不要求占位对齐";
  if (structureHasImages && designContent !== null) {
    // Simple check: design.md mentions placeholder strategy
    const hasPlaceholderStrategy =
      /占位|placeholder|SVG.*占位/i.test(designContent);
    placeholderAligned = hasPlaceholderStrategy;
    placeholderDetail = hasPlaceholderStrategy
      ? "design.md 包含图片占位策略"
      : "design.md 缺少图片占位策略（structure.md 有 Image Asset Inventory）";
  }
  results.push({
    id: "5",
    label: "Image Asset Inventory 占位对齐",
    pass: placeholderAligned,
    detail: placeholderDetail,
  });

  // 6. Design baseline checks
  const baselineChecks: string[] = [];
  if (designContent !== null) {
    if (/首屏|first.screen|视觉焦点|main.*visual/i.test(designContent))
      baselineChecks.push("首屏视觉焦点");
    if (/可读|readability|对比度|contrast/i.test(designContent))
      baselineChecks.push("可读性");
    if (/可点击|clickable|触控.*热区|touch.*target/i.test(designContent))
      baselineChecks.push("可点击性");
    if (/统一|consistent|一致/i.test(designContent))
      baselineChecks.push("风格统一");
  }
  const baselinePass = baselineChecks.length >= 2;
  results.push({
    id: "6",
    label: "设计底线检查",
    pass: baselinePass,
    detail: baselinePass
      ? `已覆盖: ${baselineChecks.join(", ")}`
      : "design.md 中设计底线覆盖不足（需包含首屏焦点、可读性、可点击性、风格统一中的至少 2 项）",
  });

  // 7. progress.md phase marker
  const progressContent = readFileSafe(progressPath);
  const hasPhaseMarker =
    progressContent !== null &&
    (/当前阶段.*visual-design/i.test(progressContent) ||
      /当前阶段.*design/i.test(progressContent) ||
      /第 3 步.*已.*勾选|\[x\].*第 3 步/i.test(progressContent));
  results.push({
    id: "7",
    label: "progress.md 阶段标记",
    pass: hasPhaseMarker || false,
    detail: hasPhaseMarker
      ? undefined
      : "progress.md 中当前阶段未标记为 visual-design，或第 3 步未勾选",
  });

  printResults(results, verbose);

  if (results.some((r) => !r.pass)) {
    process.exit(1);
  }
}

main();
