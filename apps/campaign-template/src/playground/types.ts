import type { ComponentType } from 'react';
import type { SectionStatus } from '../contracts/section';

export type PreviewMode = 'full' | 'single' | 'flow';

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
  /** 指定要渲染的 section id（对应 registry 中的 id） */
  sectionId?: string;
  /** 强制指定 section 的状态 */
  status?: SectionStatus;
  /** 传入 section 的 content props */
  content?: Record<string, unknown>;
  /** store 状态数据（用于信息展示） */
  store?: Record<string, unknown>;
}

export interface Scenario {
  id: string;
  label: string;
  description?: string;
  initialStore: Record<string, unknown>;
  steps: ScenarioStep[];
  /** 自动播放时每步停留毫秒数（默认 2000） */
  autoPlayDelay?: number;
}
