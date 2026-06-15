import type { ValidationReport, SectionValidationResult } from './types';

export function buildReport(
  target: 'all' | string,
  results: SectionValidationResult[],
): ValidationReport {
  let totalChecks = 0;
  let failedChecks = 0;
  let skippedChecks = 0;

  for (const r of results) {
    for (const c of r.checks) {
      totalChecks++;
      if (c.skipped) {
        skippedChecks++;
      } else if (!c.passed) {
        failedChecks++;
      }
    }
  }

  const passedSections = results.filter((r) => r.passed).length;
  const failedSections = results.filter((r) => !r.passed).length;

  return {
    target,
    results,
    summary: {
      totalSections: results.length,
      passedSections,
      failedSections,
      totalChecks,
      failedChecks,
      skippedChecks,
    },
  };
}

export function printReport(report: ValidationReport): string {
  return JSON.stringify(report, null, 2);
}
