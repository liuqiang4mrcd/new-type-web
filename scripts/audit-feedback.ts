#!/usr/bin/env tsx
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

interface Options {
  campaign: string;
}

function parseArgs(argv: string[]): Options {
  let campaign = "";

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--campaign" && i + 1 < argv.length) {
      campaign = argv[i + 1];
      i++;
    }
  }

  if (!campaign) {
    process.stderr.write(
      "ERROR: 请指定活动名称：pnpm audit-feedback --campaign <campaign-name>\n",
    );
    process.exit(2);
  }

  return { campaign };
}

interface AuditResult {
  feedbackWorkspace: string;
  files: Record<string, { exists: boolean; size?: number }>;
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
}

function readFileSafe(path: string): string | null {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

function main(argv = process.argv.slice(2)): void {
  const { campaign } = parseArgs(argv);
  const rootDir = process.cwd();
  const appDir = join(rootDir, "apps", campaign);
  const appSrc = join(appDir, "src");
  const feedbackDir = join(appDir, ".feedback");
  const sectionsDir = join(appSrc, "designer", "sections");
  const sectionsFeedbackDir = join(feedbackDir, "sections");

  const result: AuditResult = {
    feedbackWorkspace: feedbackDir,
    files: {},
    sections: { created: [], registered: [], verified: [] },
    playground: { registeredSections: [], scenarios: [] },
    runtime: { containers: [], appRenders: [] },
    diffs: {
      sectionsCreatedButNotRegistered: [],
      sectionsRegisteredButNotVerified: [],
      feedbackMissingSectionCards: [],
    },
  };

  // 1. Scan feedback workspace files
  for (const f of ["demand.md", "structure.md", "design.md", "progress.md"]) {
    const path = join(feedbackDir, f);
    const exists = existsSync(path);
    result.files[f] = {
      exists,
      ...(exists ? { size: statSync(path).size } : {}),
    };
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
    const idMatches = registrySrc.matchAll(/id:\s*['"]([^'"]+)['"]/g);
    for (const m of idMatches) {
      result.playground.registeredSections.push(m[1]);
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

  // 7. Parse progress.md for verification status
  const progressContent = readFileSafe(join(feedbackDir, "progress.md"));
  if (progressContent) {
    for (const section of result.sections.created) {
      const validatedPattern = new RegExp(
        `${section}.*\\[x\\].*验证|${section}.*✅|${section}.*validated`,
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

  // Output as JSON
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

main();
