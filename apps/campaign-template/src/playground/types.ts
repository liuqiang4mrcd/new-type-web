import type { ComponentType } from "react";
import type { SectionStatus } from "../contracts/section";

export type PreviewMode = "full" | "single" | "flow";

export interface PlaygroundSection {
  id: string;
  name: string;
  component: ComponentType<any>;
  defaultContent: Record<string, unknown>;
  defaultActions?: Record<string, unknown>;
  stateViews: Partial<
    Record<SectionStatus, ComponentType<{ message?: string }>>
  >;
}

export interface ScenarioStep {
  id: string;
  name: string;
  description?: string;
  /** 当前业务步骤要渲染的 Section 列表 */
  sections: Array<{
    /** 对应 section-registry 中的 id */
    sectionId: string;
    /** 覆盖 defaultContent 的部分字段 */
    content?: Record<string, unknown>;
    /** 强制指定 section 的状态 */
    status?: SectionStatus;
  }>;
}

export interface Scenario {
  id: string;
  label: string;
  description?: string;
  group: "fullpage" | "module";
  steps: ScenarioStep[];
  /** 自动播放时每步停留毫秒数（默认 2000） */
  autoPlayDelay?: number;
}
