import type { ComponentType, ReactNode } from 'react';

/** 组件状态 */
export type SectionStatus = 'loading' | 'empty' | 'ready' | 'error';

/** 组件状态数据模型 */
export interface SectionState<TContent = unknown> {
  status: SectionStatus;
  content?: TContent;
  error?: string;
}

/** Section 元数据 */
export interface SectionMeta {
  id: string;
  name: string;
  description?: string;
}

/** Section Props 接口 */
export interface SectionProps<TContent, TActions = Record<string, unknown>> {
  content: TContent;
  actions?: TActions;
  children?: ReactNode;
}

/** Section 状态视图映射 */
export type StateViews = Partial<
  Record<SectionStatus, ComponentType<{ message?: string }>>
>;

/** Section 完整描述（用于 Playground 自动发现） */
export interface SectionDescriptor<TContent = unknown> {
  meta: SectionMeta;
  component: ComponentType<SectionProps<TContent>>;
  defaultContent: TContent;
  stateViews?: StateViews;
}
