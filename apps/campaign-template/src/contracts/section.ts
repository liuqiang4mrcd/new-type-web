import type { ComponentType, ReactNode } from 'react';

/** 组件状态 */
export type SectionStatus = 'loading' | 'empty' | 'ready' | 'error' | 'disabled' | 'spinning';

/** 状态类型：ui=独立视觉组件（states.tsx），business=业务数据（stateData），interaction=交互状态机 */
export type StateType = 'ui' | 'business' | 'interaction';

/** 单个状态声明 */
export interface StateDeclaration {
  key: string;
  type: StateType;
  required: boolean;
}

/** 触发类型 */
export type TriggerType = 'click' | 'timeout' | 'animationend' | 'load' | 'swipe' | 'scroll';

/** 状态转换触发条件 */
export interface StateTrigger {
  type: TriggerType;
  /** click/swipe/scroll 类型必须：actions.xxx 方法名 */
  handler?: string;
  /** timeout 类型必须：持续时间(ms) */
  duration?: number;
}

/** 动效声明 */
export interface TransitionAnimation {
  type: 'spin' | 'slide' | 'fade' | 'scale' | 'none';
  /** 持续时间(ms) */
  duration: number;
  easing?: string;
}

/** 状态转换声明：状态机的一步转换 */
export interface StateTransition {
  from: string;
  to: string;
  trigger: StateTrigger;
  animation?: TransitionAnimation;
  description?: string;
}

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
