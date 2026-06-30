#!/usr/bin/env tsx
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";

interface Options {
  campaign: string;
  writeStatus: boolean;
}

function parseArgs(argv: string[]): Options {
  let campaign = "";
  let writeStatus = false;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--campaign" && i + 1 < argv.length) {
      campaign = argv[i + 1];
      i++;
    } else if (argv[i] === "--write-status") {
      writeStatus = true;
    }
  }

  if (!campaign) {
    process.stderr.write(
      "ERROR: 请指定活动名称：pnpm audit-feedback --campaign <campaign-name>\n",
    );
    process.exit(2);
  }

  return { campaign, writeStatus };
}

interface AuditResult {
  feedbackWorkspace: string;
  files: Record<string, { exists: boolean; size?: number }>;
  status: {
    exists: boolean;
    phase?: string;
    gate?: string;
    currentSection?: string;
    sectionStatuses: Record<string, string>;
  };
  sections: {
    created: string[];
    registered: string[];
    verified: string[];
  };
  playground: {
    registeredSections: string[];
    scenarios: string[];
  };
  runtime: {
    containers: string[];
    appRenders: string[];
  };
  diffs: {
    sectionsCreatedButNotRegistered: string[];
    sectionsRegisteredButNotVerified: string[];
    feedbackMissingSectionCards: string[];
  };
  wroteStatus: boolean;
}

function readFileSafe(path: string): string | null {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

function readStatus(feedbackDir: string): AuditResult["status"] {
  const statusPath = join(feedbackDir, "status.json");
  const content = readFileSafe(statusPath);
  const status: AuditResult["status"] = {
    exists: content !== null,
    sectionStatuses: {},
  };

  if (!content) return status;

  try {
    const parsed = JSON.parse(content) as {
      phase?: unknown;
      gate?: unknown;
      currentSection?: unknown;
      sections?: Array<{ name?: unknown; status?: unknown }>;
    };
    if (typeof parsed.phase === "string") status.phase = parsed.phase;
    if (typeof parsed.gate === "string") status.gate = parsed.gate;
    if (typeof parsed.currentSection === "string") {
      status.currentSection = parsed.currentSection;
    }
    if (Array.isArray(parsed.sections)) {
      for (const section of parsed.sections) {
        if (
          typeof section.name === "string" &&
          typeof section.status === "string"
        ) {
          status.sectionStatuses[section.name] = section.status;
        }
      }
    }
  } catch {
    // Keep exists=true; malformed status will be visible to the caller via empty fields.
  }

  return status;
}

function fileInfo(path: string): { exists: boolean; size?: number } {
  const exists = existsSync(path);
  return {
    exists,
    ...(exists ? { size: statSync(path).size } : {}),
  };
}

function inferPhase(progressContent: string | null, allVerified: boolean): string {
  if (progressContent && /Final Closeout Gate[\s\S]*\[[xX]\]/.test(progressContent)) {
    return allVerified ? "completed" : "final-closeout";
  }
  return allVerified ? "final-closeout" : "section-implementation";
}

function writeStatusFile(
  feedbackDir: string,
  campaign: string,
  sectionNames: string[],
  verified: string[],
  progressContent: string | null,
): void {
  const allVerified =
    sectionNames.length > 0 && sectionNames.every((name) => verified.includes(name));
  const firstPending = sectionNames.find((name) => !verified.includes(name)) ?? null;
  const phase = inferPhase(progressContent, allVerified);
  const status = {
    campaignName: campaign,
    targetApp: `apps/${campaign}`,
    mode: "new-project",
    phase,
    gate: allVerified ? "final-closeout" : "verify-section",
    currentSection: firstPending,
    confirmedForImplementation: true,
    sections: sectionNames.map((name) => ({
      name,
      status: verified.includes(name) ? "validated" : "planned",
    })),
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(join(feedbackDir, "status.json"), JSON.stringify(status, null, 2) + "\n");
}

function main(argv = process.argv.slice(2)): void {
  const { campaign, writeStatus } = parseArgs(argv);
  const rootDir = process.cwd();
  const appDir = join(rootDir, "apps", campaign);
  const appSrc = join(appDir, "src");
  const feedbackDir = join(appDir, ".feedback");
  const sectionsDir = join(appSrc, "designer", "sections");
  const sectionsFeedbackDir = join(feedbackDir, "sections");

  const result: AuditResult = {
    feedbackWorkspace: feedbackDir,
    files: {},
    status: readStatus(feedbackDir),
    sections: { created: [], registered: [], verified: [] },
    playground: { registeredSections: [], scenarios: [] },
    runtime: { containers: [], appRenders: [] },
    diffs: {
      sectionsCreatedButNotRegistered: [],
      sectionsRegisteredButNotVerified: [],
      feedbackMissingSectionCards: [],
    },
    wroteStatus: false,
  };

  // 1. Scan feedback workspace files
  for (const f of [
    "demand.md",
    "structure.md",
    "design.md",
    "status.json",
    "progress.md",
  ]) {
    const path = join(feedbackDir, f);
    result.files[f] = fileInfo(path);
  }

  // 2. Scan sections feedback cards
  if (existsSync(sectionsFeedbackDir)) {
    const files = readdirSync(sectionsFeedbackDir, { withFileTypes: true });
    for (const entry of files) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        const name = entry.name.replace(".md", "");
        if (!result.sections.verified.includes(name)) {
          // Will be checked against progress.md below
        }
      }
    }
  }

  // 3. Scan created sections (file system)
  if (existsSync(sectionsDir)) {
    const entries = readdirSync(sectionsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        result.sections.created.push(entry.name);
      }
    }
  }

  // 4. Scan playground/section-registry.ts for registered sections
  const registryPath = join(appSrc, "playground", "section-registry.ts");
  const registrySrc = readFileSafe(registryPath);
  if (registrySrc) {
    const nameMatches = registrySrc.matchAll(/name:\s*['"]([^'"]+)['"]/g);
    for (const m of nameMatches) {
      result.playground.registeredSections.push(m[1]);
      result.sections.registered.push(m[1]);
    }
  }

  // 5. Scan runtime/app.tsx for rendered containers
  const runtimeAppPath = join(appSrc, "runtime", "app.tsx");
  const runtimeAppSrc = readFileSafe(runtimeAppPath);
  if (runtimeAppSrc) {
    const containerMatches = runtimeAppSrc.matchAll(
      /<(\w+Container)\s*\/?>/g,
    );
    for (const m of containerMatches) {
      result.runtime.appRenders.push(m[1]);
    }
  }

  // 6. Scan runtime/sections/ for Container files
  const runtimeSectionsDir = join(appSrc, "runtime", "sections");
  if (existsSync(runtimeSectionsDir)) {
    const entries = readdirSync(runtimeSectionsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith("Container.tsx")) {
        result.runtime.containers.push(
          entry.name.replace("Container.tsx", "Container"),
        );
      }
    }
  }

  // 7. Prefer status.json for verification status; fall back to legacy progress.md
  for (const [section, status] of Object.entries(result.status.sectionStatuses)) {
    if (status === "validated" && !result.sections.verified.includes(section)) {
      result.sections.verified.push(section);
    }
  }

  const progressContent = readFileSafe(join(feedbackDir, "progress.md"));
  if (progressContent) {
    for (const section of result.sections.created) {
      if (result.sections.verified.includes(section)) continue;
      const validatedPattern = new RegExp(
        `${section}.*\\[x\\].*\\[x\\]|${section}.*\\[x\\].*验证|${section}.*✅|${section}.*validated|${section}.*通过`,
        "i",
      );
      if (validatedPattern.test(progressContent)) {
        result.sections.verified.push(section);
      }
    }
  }

  // 8. Compute diffs
  for (const s of result.sections.created) {
    if (!result.playground.registeredSections.includes(s)) {
      result.diffs.sectionsCreatedButNotRegistered.push(s);
    }
  }

  for (const s of result.playground.registeredSections) {
    if (!result.sections.verified.includes(s)) {
      result.diffs.sectionsRegisteredButNotVerified.push(s);
    }
  }

  if (existsSync(sectionsFeedbackDir)) {
    const cardFiles = readdirSync(sectionsFeedbackDir, {
      withFileTypes: true,
    })
      .filter((e) => e.isFile() && e.name.endsWith(".md"))
      .map((e) => e.name.replace(".md", ""));
    for (const s of result.sections.created) {
      if (!cardFiles.includes(s)) {
        result.diffs.feedbackMissingSectionCards.push(s);
      }
    }
  }

  if (writeStatus) {
    writeStatusFile(
      feedbackDir,
      campaign,
      result.sections.created,
      result.sections.verified,
      progressContent,
    );
    result.wroteStatus = true;
    result.status = readStatus(feedbackDir);
    result.files["status.json"] = fileInfo(join(feedbackDir, "status.json"));
  }

  // Output as JSON
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

main();
