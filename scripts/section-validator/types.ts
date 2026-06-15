export type UiStateKey = 'loading' | 'empty' | 'error';
export type RuntimeStatus = 'loading' | 'empty' | 'ready' | 'error';
export type SupportedStateType = 'ui' | 'business';

export interface CliOptions {
  all: boolean;
  sectionName?: string;
  rootDir: string;
}

export interface SectionNaming {
  sectionName: string;
  baseName: string;
  contentTypeName: string;
}

export interface SectionPaths {
  dir: string;
  typesFile: string;
  contentFile: string;
  indexFile: string;
  statesFile: string;
}

export interface SupportedStateDecl {
  key: string;
  type: SupportedStateType;
  required: boolean;
}

export interface ParsedContentModule {
  hasDefaultContent: boolean;
  supportedStates: SupportedStateDecl[] | null;
  stateDataKeys: string[] | null;
}

export interface ParsedStatesModule {
  exportedNames: string[];
}

export interface ParsedRegistryEntry {
  name?: string;
  stateViewKeys: string[];
}

export interface ParsedContainerModule {
  exists: boolean;
  switchCases: RuntimeStatus[];
}

export interface ParsedStoreModule {
  stateContentTypes: string[];
}

export interface CheckResult {
  name: string;
  passed: boolean;
  skipped: boolean;
  errors: string[];
}

export interface SectionValidationResult {
  section: string;
  passed: boolean;
  checks: CheckResult[];
}

export interface ValidationReport {
  target: 'all' | string;
  results: SectionValidationResult[];
  summary: {
    totalSections: number;
    passedSections: number;
    failedSections: number;
    totalChecks: number;
    failedChecks: number;
    skippedChecks: number;
  };
}
