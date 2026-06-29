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
      "ERROR: 请指定 feedback 工作区路径：pnpm validate-structure --feedback <path>\n",
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

  // Resolve relative to cwd if needed
  const resolvedPath = feedbackPath.startsWith("/")
    ? feedbackPath
    : join(process.cwd(), feedbackPath);

  const demandPath = join(resolvedPath, "demand.md");
  const structurePath = join(resolvedPath, "structure.md");
  const progressPath = join(resolvedPath, "progress.md");
  const metaPath = join(resolvedPath, "meta.json");

  const results: CheckResult[] = [];

  // 1. demand.md exists
  const demandExists = existsSync(demandPath);
  results.push({
    id: "1",
    label: "demand.md 存在",
    pass: demandExists,
    detail: demandExists ? undefined : `缺失: ${demandPath}`,
  });

  // 2. structure.md exists
  const structureExists = existsSync(structurePath);
  results.push({
    id: "2",
    label: "structure.md 存在",
    pass: structureExists,
    detail: structureExists ? undefined : `缺失: ${structurePath}`,
  });

  const structureContent = readFileSafe(structurePath);

  // 3. Section 拆分表 exists (checks for table with required columns)
  const hasSectionTable =
    structureContent !== null &&
    /\|.*顺序.*\|.*Section.*\|.*职责.*\|/i.test(structureContent);
  results.push({
    id: "3",
    label: "Section 拆分表存在",
    pass: hasSectionTable,
    detail: hasSectionTable
      ? undefined
      : "structure.md 中未找到 Section 拆分表（含「顺序 | Section | 职责」等列）",
  });

  // 4. Layout Spec 关键元素完整 — check for key element table patterns
  const hasLayoutSpec =
    structureContent !== null &&
    (/\|.*element.*parentSection.*position/i.test(structureContent) ||
      /\|.*section.*role.*container/i.test(structureContent));
  results.push({
    id: "4",
    label: "Layout Spec 关键元素完整",
    pass: hasLayoutSpec,
    detail: hasLayoutSpec
      ? undefined
      : "structure.md 中未找到 Layout Spec 表格（Section 级或关键元素级）",
  });

  // 5. Interaction Spec 完整
  const hasInteractionSpec =
    structureContent !== null &&
    /\|.*id.*\|.*triggerSection.*\|.*element.*\|.*userAction/i.test(
      structureContent,
    );
  results.push({
    id: "5",
    label: "Interaction Spec 完整",
    pass: hasInteractionSpec,
    detail: hasInteractionSpec
      ? undefined
      : "structure.md 中未找到 Interaction Spec 表格",
  });

  // 6. Image Asset Inventory — conditional: exists if image elements found
  const hasImageMention =
    structureContent !== null &&
    /图片|image|asset|头像|礼物|奖品|道具|主视觉/i.test(structureContent);
  const hasImageInventory =
    structureContent !== null &&
    /\|.*imageKey.*\|.*Section.*\|.*imageType/i.test(structureContent);
  const noImageExplicit =
    structureContent !== null && /无图片资产/.test(structureContent);
  const imageCheckPass = !hasImageMention || hasImageInventory || noImageExplicit;
  results.push({
    id: "6",
    label: "Image Asset Inventory（条件）",
    pass: imageCheckPass,
    detail: imageCheckPass
      ? hasImageMention && hasImageInventory
        ? "已输出完整图片资产清单"
        : hasImageMention && noImageExplicit
          ? "已明确声明「无图片资产」"
          : "无图片类元素，不要求清单"
      : "检测到图片类元素但未输出 Image Asset Inventory",
  });

  // 7. Uncertainty List status
  const hasUncertaintyList =
    structureContent !== null &&
    /不确定项|uncertainty/i.test(structureContent);
  const hasPendingItems =
    structureContent !== null &&
    /pending-confirmation|待确认/i.test(structureContent);
  const uncertaintyPass = hasUncertaintyList && !hasPendingItems;
  results.push({
    id: "7",
    label: "Uncertainty List 状态",
    pass: hasUncertaintyList ? !hasPendingItems : true,
    detail: hasUncertaintyList
      ? hasPendingItems
        ? "存在 pending-confirmation 项，禁止进入下一阶段"
        : "所有项已 resolved 或 accepted-assumption"
      : "无不确定项列表（可能不需要）",
  });

  // 8. 状态适配分析完整
  const hasStatusAnalysis =
    structureContent !== null &&
    /UI.*状态.*business.*状态.*interaction.*状态|状态适配分析/i.test(
      structureContent,
    );
  results.push({
    id: "8",
    label: "状态适配分析完整",
    pass: hasStatusAnalysis || false,
    detail: hasStatusAnalysis
      ? undefined
      : "structure.md 中未找到状态适配分析（Section 类型 + UI/business/interaction 状态声明）",
  });

  // 9. progress.md phase marker
  const progressContent = readFileSafe(progressPath);
  const hasPhaseMarker =
    progressContent !== null &&
    (/当前阶段.*structure/i.test(progressContent) ||
      /第 2 步.*已.*勾选|\[x\].*第 2 步/i.test(progressContent));
  results.push({
    id: "9",
    label: "progress.md 阶段标记",
    pass: hasPhaseMarker || false,
    detail: hasPhaseMarker
      ? undefined
      : "progress.md 中当前阶段未标记为 structure，或第 2 步未勾选",
  });

  // 10. meta.json consistency
  const metaContent = readFileSafe(metaPath);
  let metaPass = false;
  let metaDetail = "meta.json 不存在或不可读";
  if (metaContent) {
    try {
      const meta = JSON.parse(metaContent);
      const hasStatus = typeof meta.status === "string";
      const hasCampaign = "campaignName" in meta;
      const hasTarget = "targetApp" in meta;
      const hasCreated = "createdAt" in meta;
      const missing: string[] = [];
      if (!hasStatus) missing.push("status");
      if (!hasCampaign) missing.push("campaignName");
      if (!hasTarget) missing.push("targetApp");
      if (!hasCreated) missing.push("createdAt");
      metaPass = missing.length === 0;
      metaDetail = metaPass
        ? `status=${meta.status}, campaignName=${meta.campaignName}`
        : `缺少字段: ${missing.join(", ")}`;
    } catch {
      metaDetail = "meta.json 格式错误，无法解析";
    }
  }
  results.push({
    id: "10",
    label: "meta.json 一致",
    pass: metaPass,
    detail: metaDetail,
  });

  printResults(results, verbose);

  if (results.some((r) => !r.pass)) {
    process.exit(1);
  }
}

main();
